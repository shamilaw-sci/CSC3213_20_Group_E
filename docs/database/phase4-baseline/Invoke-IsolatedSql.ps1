param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('a','b','c')][string]$Stack,
    [Parameter(Mandatory=$true)][string]$SqlPath,
    [Parameter(Mandatory=$true)][string]$LogPath,
    [switch]$ExpectFailure,
    [string]$ExpectedErrorToken
)
$ErrorActionPreference = 'Stop'
if ($ExpectFailure -and [string]::IsNullOrWhiteSpace($ExpectedErrorToken)) { throw 'Expected SQL error token is required for negative tests.' }
$project = "thirasara-phase4-$Stack"
$containerName = "supabase_db_$project"
$containerId = (& docker inspect --format '{{.Id}}' $containerName 2>$null)
if ($LASTEXITCODE -ne 0 -or $containerId -notmatch '^[a-f0-9]{64}$') { throw 'Expected isolated container not found.' }
$image = & docker inspect --format '{{.Config.Image}}' $containerId
if ($LASTEXITCODE -ne 0 -or $image -notmatch '^(public\.ecr\.aws|docker\.io|ghcr\.io)/supabase/postgres:') { throw 'Unexpected database image.' }
$labels = (& docker inspect --format '{{json .Config.Labels}}' $containerId) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $labels.'com.supabase.cli.project' -cne $project) { throw 'Isolated project label does not match.' }
$networks = (& docker inspect --format '{{json .NetworkSettings.Networks}}' $containerId) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $networks.PSObject.Properties.Name -notcontains 'thirasara-phase4-local') { throw 'Expected isolated Docker network missing.' }
$ports = (& docker inspect --format '{{json .NetworkSettings.Ports}}' $containerId) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect port bindings.' }
foreach ($port in $ports.PSObject.Properties) {
    foreach ($binding in @($port.Value)) {
        if ($null -ne $binding -and $binding.HostIp -notin @('127.0.0.1','::1')) { throw 'Database is not bound exclusively to loopback.' }
    }
}
$identity = & docker exec $containerId psql -X -U postgres -d postgres -A -t -c "SELECT current_database() || '|' || current_user || '|' || current_setting('server_version_num')::integer / 10000;"
if ($LASTEXITCODE -ne 0 -or $identity.Trim() -cne 'postgres|postgres|17') { throw 'Unexpected isolated database identity.' }
$sql = Get-Content -LiteralPath $SqlPath -Raw
if ($sql -match '(?m)^\s*\\') { throw 'psql meta commands are not allowed in test input.' }
if ($sql -match '(?i)postgres(?:ql)?://') { throw 'Connection URLs are not allowed in test input.' }
$verifiedInput = "SET thirasara.phase4_isolated = 'approved-empty-test';`n" + $sql
$verifiedInput | & docker exec -i $containerId psql -X -A -t -q -U postgres -d postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose *> $LogPath
$resultCode = $LASTEXITCODE
if ($ExpectFailure) {
    if ($resultCode -ne 3) { throw 'Negative SQL test did not return psql ON_ERROR_STOP SQL-error status 3.' }
    $failureLog = Get-Content -LiteralPath $LogPath -Raw
    if (!$failureLog.Contains($ExpectedErrorToken) -or $failureLog -notmatch 'P0001') { throw 'Negative test failed for an unexpected reason.' }
    Write-Output "Verified expected guard rejection for isolated stack $Stack."
} else {
    if ($resultCode -ne 0) { throw "Isolated SQL failed (exit $resultCode); inspect private log." }
    Write-Output "Isolated stack $Stack SQL completed successfully; output saved privately."
}
