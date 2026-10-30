param(
    [Parameter(Mandatory=$true)][ValidateSet('a','b','c')][string]$Stack,
    [Parameter(Mandatory=$true)][string]$LogPath
)
$ErrorActionPreference='Stop'
$root=[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$project="thirasara-phase4-$Stack"
$workdir=Join-Path $root "docs/evidence/phase4-local/stack-$Stack"
$config=Get-Content -LiteralPath (Join-Path $workdir 'supabase/config.toml') -Raw
if ($config -notmatch ('(?m)^project_id = "' + [regex]::Escape($project) + '"')) { throw 'Isolated CLI workdir project mismatch.' }
if (Test-Path -LiteralPath (Join-Path $workdir 'supabase/.temp/project-ref')) { throw 'Remote-linked project refused.' }
& node (Join-Path $PSScriptRoot 'verify-migrations.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Migration checksum verification failed.' }
$preflightLog=Join-Path $root "docs/evidence/phase4-local/stack-$Stack-cli-preflight.log"
& (Join-Path $root 'docs/database/phase4-baseline/Invoke-IsolatedSql.ps1') -Stack $Stack -SqlPath (Join-Path $root 'docs/database/phase4-baseline/environment-snapshot.sql') -LogPath $preflightLog
$containerId=& docker inspect --format '{{.Id}}' "supabase_db_$project"
if ($LASTEXITCODE -ne 0 -or $containerId -notmatch '^[a-f0-9]{64}$') { throw 'Verified isolated container missing.' }
$label=& docker inspect --format '{{index .Config.Labels "com.supabase.cli.project"}}' $containerId
$bindings=(& docker inspect --format '{{json .NetworkSettings.Ports}}' $containerId) | ConvertFrom-Json
$dbBindings=@($bindings.'5432/tcp')
$expectedPort=@{a='56322';b='57322';c='58322'}[$Stack]
if ($label -cne $project -or $dbBindings.Count -ne 1 -or $dbBindings[0].HostIp -cne '127.0.0.1' -or $dbBindings[0].HostPort -cne $expectedPort) { throw 'Explicit local endpoint identity mismatch.' }
$cli=Join-Path $PSScriptRoot 'node_modules/.bin/supabase.cmd'
if (!(Test-Path -LiteralPath $cli)) { $cli=Join-Path $root 'docs/evidence/phase4-local/tooling/node_modules/.bin/supabase.cmd' }
if (!(Test-Path -LiteralPath $cli)) { throw 'Install the pinned CLI in tools/database first.' }
$version=(& $cli --version).Trim()
if ($LASTEXITCODE -ne 0 -or $version -cne '2.122.0') { throw 'Supabase CLI version mismatch.' }
$targetDirectory=Join-Path $workdir 'supabase/migrations'
if (!(Test-Path -LiteralPath $targetDirectory)) { New-Item -ItemType Directory -Path $targetDirectory | Out-Null }
$expected=@(Get-ChildItem -LiteralPath (Join-Path $root 'supabase/migrations') -File -Filter '*.sql')
$extra=@(Get-ChildItem -LiteralPath $targetDirectory -File -Filter '*.sql' | Where-Object Name -notin $expected.Name)
if ($extra.Count) { throw 'Unexpected SQL in isolated migration directory.' }
foreach ($file in $expected) {
    $target=Join-Path $targetDirectory $file.Name
    if (Test-Path -LiteralPath $target) {
        if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -cne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw 'Existing isolated migration differs; do not rewrite applied history.' }
    } else { Copy-Item -LiteralPath $file.FullName -Destination $target }
}
$environment=(& docker inspect --format '{{json .Config.Env}}' $containerId) | ConvertFrom-Json
$entry=@($environment | Where-Object { $_.StartsWith('POSTGRES_PASSWORD=') })
if ($entry.Count -ne 1) { throw 'Generated local container credential unavailable.' }
# Never accept a URL from the caller, print credentials, or use .env/live config.
# This loopback-only test server has SSL off; this is not a production TLS option.
$localUrl='postgresql://postgres:'+ [uri]::EscapeDataString($entry[0].Substring('POSTGRES_PASSWORD='.Length)) + "@127.0.0.1:$expectedPort/postgres?sslmode=disable"
& $cli migration up --db-url $localUrl --workdir $workdir *> $LogPath
if ($LASTEXITCODE -ne 0) { throw 'Verified local migration command failed; inspect the private log.' }
Write-Output "Verified local stack $Stack migration command completed; credentials were not printed."
