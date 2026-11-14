param([ValidateSet('a','b')][string]$Stack='a')
$ErrorActionPreference='Stop'
$project="thirasara-phase4-$Stack"
$ids=@(& docker ps -a --filter "label=com.supabase.cli.project=$project" --format '{{.ID}}')
$services=[ordered]@{}
$volumes=[ordered]@{}
$originals=[System.Collections.Generic.List[object]]::new()
foreach ($id in $ids) {
    $inspect=@((& docker inspect $id) | ConvertFrom-Json)[0]
    if ($LASTEXITCODE -ne 0 -or $inspect.State.Running) { throw 'All original isolated containers must be stopped.' }
    $name=$inspect.Name.TrimStart('/')
    if (!$name.EndsWith("_$project") -or $inspect.Config.Labels.'com.supabase.cli.project' -cne $project) { throw 'Unexpected isolated container identity.' }
    $serviceName=$name.Replace("_$project",'').Replace('supabase_','')
    $service=[ordered]@{ image=$inspect.Config.Image; container_name=$name; environment=@($inspect.Config.Env); labels=$inspect.Config.Labels; networks=@{ isolated=@{ aliases=@($name) } } }
    if ($inspect.Config.Entrypoint) { $service.entrypoint=@($inspect.Config.Entrypoint) }
    if ($inspect.Config.Cmd) { $service.command=@($inspect.Config.Cmd) }
    if ($inspect.Config.User) { $service.user=$inspect.Config.User }
    if ($inspect.Config.WorkingDir) { $service.working_dir=$inspect.Config.WorkingDir }
    if ($inspect.HostConfig.ShmSize) { $service.shm_size=$inspect.HostConfig.ShmSize }
    if ($inspect.HostConfig.CapAdd) { $service.cap_add=@($inspect.HostConfig.CapAdd) }
    if ($inspect.HostConfig.SecurityOpt) { $service.security_opt=@($inspect.HostConfig.SecurityOpt) }
    $mounts=@()
    foreach ($mount in @($inspect.Mounts)) {
        if ($mount.Type -eq 'volume') {
            $volumes[$mount.Name]=@{ external=$true; name=$mount.Name }
            $mounts+=@{ type='volume'; source=$mount.Name; target=$mount.Destination; read_only=(!$mount.RW) }
        } elseif ($mount.Type -eq 'bind') {
            $mounts+=@{ type='bind'; source=$mount.Source; target=$mount.Destination; read_only=(!$mount.RW) }
        } else { throw 'Unsupported mount type.' }
    }
    if ($mounts.Count) { $service.volumes=$mounts }
    $ports=@()
    foreach ($port in $inspect.HostConfig.PortBindings.PSObject.Properties) {
        foreach ($binding in @($port.Value)) {
            $parts=$port.Name.Split('/')
            $ports+=@{ target=[int]$parts[0]; published=$binding.HostPort; host_ip='127.0.0.1'; protocol=$parts[1] }
        }
    }
    if ($ports.Count) { $service.ports=$ports }
    $health=$inspect.Config.Healthcheck
    if ($null -ne $health) {
        $service.healthcheck=@{ test=@($health.Test) }
        foreach ($pair in @(@('Interval','interval'),@('Timeout','timeout'),@('StartPeriod','start_period'))) {
            $duration=$health.($pair[0]); if ($duration) { $service.healthcheck[$pair[1]]="${duration}ns" }
        }
        if ($health.Retries) { $service.healthcheck.retries=$health.Retries }
    }
    $services[$serviceName]=$service
    $originals.Add(@{ Id=$inspect.Id; Name=$name; Backup="$name-before-loopback" })
}
if ($services.Count -ne 6) { throw 'Expected six original isolated services.' }
$compose=[ordered]@{ name="phase4-loopback-$Stack"; services=$services; volumes=$volumes; networks=@{isolated=@{external=$true;name='thirasara-phase4-local'}} }
$output=Join-Path $PSScriptRoot "stack-$Stack-loopback.private.json"
if (Test-Path -LiteralPath $output) { throw 'Private override already exists; inspect before regenerating.' }
# Escape every dollar so Compose cannot interpolate host environment secrets.
$privateJson=($compose | ConvertTo-Json -Depth 35).Replace('$','$$')
[System.IO.File]::WriteAllText($output,$privateJson,[System.Text.UTF8Encoding]::new($false))
$emptyEnv=Join-Path $PSScriptRoot 'empty.env'
if (!(Test-Path -LiteralPath $emptyEnv)) { [System.IO.File]::WriteAllText($emptyEnv,'',[System.Text.UTF8Encoding]::new($false)) }
foreach ($original in $originals) {
    & docker rename $original.Id $original.Backup
    if ($LASTEXITCODE -ne 0) { throw 'Original container rename failed.' }
}
Write-Output "Private loopback configuration generated for $($services.Count) isolated services; originals retained stopped."
