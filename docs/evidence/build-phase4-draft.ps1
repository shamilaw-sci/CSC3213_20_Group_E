$ErrorActionPreference = 'Stop'
$repoRoot = (Get-Location).Path
$outputRoot = Join-Path $repoRoot 'docs/database/phase4-baseline'
if (Test-Path -LiteralPath $outputRoot) { throw 'Draft directory exists; inspect before regeneration.' }

function Read-Sections([string]$filename) {
    $result = @{}
    foreach ($row in (Import-Csv -LiteralPath (Join-Path $repoRoot "docs/evidence/$filename"))) {
        $result[$row.section] = @($row.metadata | ConvertFrom-Json)
    }
    return $result
}
function Quote-Identifier([string]$value) { return '"' + $value.Replace('"','""') + '"' }
function Quote-Literal([string]$value) { return "'" + $value.Replace("'","''") + "'" }

$summary = Read-Sections 'phase4-summary-2026-10-29.csv'
$detail = Read-Sections 'phase4-details-2026-10-29.csv'
$definitions = Read-Sections 'phase4-definitions-2026-10-29.csv'
$defaults = @{}
foreach ($item in $definitions.defaults) { $defaults["$($item.table_name).$($item.column_name)"] = $item.expression }
$tables = @($summary.tables | Sort-Object name)
if ($tables.Count -ne 19 -or $detail.columns.Count -ne 182 -or $detail.constraints.Count -ne 65) { throw 'Unexpected evidence shape.' }
if (@($detail.columns | Where-Object { $_.attidentity -or $_.attgenerated }).Count) { throw 'Identity/generated column needs explicit handling.' }
$sensitivePattern = '(?i)(postgres(?:ql)?://|eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9]+|-----BEGIN .*PRIVATE KEY)'
$reviewText = @($definitions.function_definitions | ForEach-Object definition) + @($definitions.defaults | ForEach-Object expression)
if (($reviewText -join "`n") -match $sensitivePattern) { throw 'Sensitive pattern found; no draft written.' }

$sql = [System.Collections.Generic.List[string]]::new()
$sql.Add(@'
-- REVIEW DRAFT ONLY. Outside supabase/migrations; never run on an existing installation.
-- No current/live database changes are authorized. See README.md for unresolved decisions.
-- Require an independently verified, separate empty Supabase test database.
-- The explicit session marker is an accidental-run guard, not proof of isolation.
BEGIN;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog, public, extensions;
DO $phase4_guard$
BEGIN
    IF current_setting('thirasara.phase4_isolated', true) IS DISTINCT FROM 'approved-empty-test' THEN
        RAISE EXCEPTION 'Phase 4 isolated-test approval marker is missing';
    END IF;
    IF current_setting('server_version_num')::integer / 10000 <> 17 THEN
        RAISE EXCEPTION 'This draft requires reviewed PostgreSQL major 17';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','S','f')
    ) THEN
        RAISE EXCEPTION 'Public application relations already exist; baseline replay refused';
    END IF;
    IF current_user <> 'postgres' THEN
        RAISE EXCEPTION 'This draft requires the reviewed postgres owner role';
    END IF;
    IF EXISTS (
        SELECT 1 FROM (VALUES ('anon'),('authenticated'),('service_role')) required(role_name)
        WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname = required.role_name)
    ) OR pg_catalog.to_regprocedure('auth.uid()') IS NULL
      OR pg_catalog.to_regprocedure('auth.role()') IS NULL
      OR pg_catalog.to_regclass('storage.buckets') IS NULL
      OR pg_catalog.to_regclass('storage.objects') IS NULL THEN
        RAISE EXCEPTION 'Supabase-managed roles/auth/storage prerequisites are missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_extension e
        JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'postgis' AND n.nspname = 'extensions' AND e.extversion = '3.3.7'
    ) OR pg_catalog.to_regprocedure('extensions.uuid_generate_v4()') IS NULL THEN
        RAISE EXCEPTION 'Reviewed PostGIS 3.3.7 and uuid-ossp prerequisites in extensions are missing';
    END IF;
END;
$phase4_guard$;

-- 1. Observed enum labels in their actual sort order.
'@)

foreach ($group in ($summary.enums | Group-Object type | Sort-Object Name)) {
    $labels = @($group.Group | Sort-Object order | ForEach-Object { Quote-Literal $_.label }) -join ', '
    $sql.Add("CREATE TYPE public.$(Quote-Identifier $group.Name) AS ENUM ($labels);")
}
$sql.Add("`n-- 2. All tables first; foreign keys follow after their dependencies exist.")
foreach ($table in $tables) {
    $columnLines = foreach ($column in ($detail.columns | Where-Object table_name -eq $table.name | Sort-Object attnum)) {
        $line = '    ' + (Quote-Identifier $column.column_name) + ' ' + $column.type
        $key = "$($table.name).$($column.column_name)"
        if ($defaults.ContainsKey($key)) { $line += ' DEFAULT ' + $defaults[$key] }
        if ($column.attnotnull) { $line += ' NOT NULL' }
        $line
    }
    $sql.Add("CREATE TABLE public.$(Quote-Identifier $table.name) (`n$($columnLines -join ",`n")`n);")
    $sql.Add("ALTER TABLE public.$(Quote-Identifier $table.name) ENABLE ROW LEVEL SECURITY;")
}
$sql.Add("`n-- 3. Captured validated constraints. Non-FKs before FKs.")
foreach ($constraint in ($detail.constraints | Sort-Object @{Expression={ if ($_.contype -eq 'f') { 1 } else { 0 } }},table_name,conname)) {
    if (!$constraint.convalidated) { throw 'Unvalidated constraint needs explicit handling.' }
    if ($constraint.table_name -notin $tables.name) { throw 'Unexpected constraint target.' }
    $sql.Add("ALTER TABLE public.$(Quote-Identifier $constraint.table_name) ADD CONSTRAINT $(Quote-Identifier $constraint.conname) $($constraint.definition);")
}
$sql.Add("`n-- 4. Only standalone indexes; primary/unique constraints already create their indexes.")
$constraintIndexes = @($detail.constraints | Where-Object { $_.contype -in @('p','u','x') } | ForEach-Object { "$($_.table_name).$($_.conname)" })
foreach ($index in $detail.indexes) {
    if ("$($index.table_name).$($index.index_name)" -notin $constraintIndexes) {
        if (!$index.indisvalid -or !$index.indisready) { throw 'Invalid index cannot enter baseline.' }
        $sql.Add($index.definition.TrimEnd(';') + ';')
    }
}
$sql.Add("`n-- 5. Five application functions. rls_auto_enable/ensure_rls remain environment decisions.")
foreach ($function in $definitions.function_definitions) {
    if ($function.proname -ne 'rls_auto_enable') { $sql.Add($function.definition.Trim().TrimEnd(';') + ';') }
}

$sql.Add("`n-- 6. Explicit table ACLs. Revoke inherited creation defaults before restoring observed grants.")
$privileges = @('a:INSERT','r:SELECT','w:UPDATE','d:DELETE','D:TRUNCATE','x:REFERENCES','t:TRIGGER','m:MAINTAIN')
foreach ($tableAcl in $detail.table_acl) {
    $tableName = 'public.' + (Quote-Identifier $tableAcl.relname)
    $sql.Add("REVOKE ALL ON TABLE $tableName FROM PUBLIC, anon, authenticated, service_role;")
    foreach ($entry in ($tableAcl.acl.Trim('{}') -split ',')) {
        if ($entry -notmatch '^(?<role>[^=]+)=(?<privs>[^/]+)/postgres$') { throw 'Unrecognized table ACL.' }
        $roleName = $Matches.role
        $letters = $Matches.privs
        if ($roleName -eq 'postgres') { continue }
        if ($roleName -notin @('anon','authenticated','service_role') -or $letters.Contains('*')) { throw 'Unexpected role/grant option.' }
        $granted = foreach ($privilege in $privileges) { $parts = $privilege.Split(':'); if ($letters.Contains($parts[0])) { $parts[1] } }
        $sql.Add("GRANT $($granted -join ', ') ON TABLE $tableName TO $(Quote-Identifier $roleName);")
    }
}
$sql.Add("`n-- 7. Explicit function EXECUTE ACLs, including revocation of PUBLIC defaults.")
foreach ($function in $summary.app_functions) {
    if ($function.name -eq 'rls_auto_enable') { continue }
    $signature = 'public.' + (Quote-Identifier $function.name) + '(' + $function.arguments + ')'
    $sql.Add("REVOKE ALL ON FUNCTION $signature FROM PUBLIC, anon, authenticated, service_role;")
    foreach ($entry in ($function.acl.Trim('{}') -split ',')) {
        if ($entry -notmatch '^(?<role>[^=]*)=X/postgres$') { throw 'Unrecognized function ACL.' }
        $roleName = $Matches.role
        if ($roleName -eq 'postgres') { continue }
        $target = if ($roleName -eq '') { 'PUBLIC' } elseif ($roleName -in @('anon','authenticated','service_role')) { Quote-Identifier $roleName } else { throw 'Unexpected function role.' }
        $sql.Add("GRANT EXECUTE ON FUNCTION $signature TO $target;")
    }
}

$sql.Add("`n-- 8. Public RLS policies. Explicit proposed saved-search deviation; see README.")
$desiredPolicies = [System.Collections.Generic.List[object]]::new()
foreach ($policy in ($detail.policies | Where-Object schemaname -eq 'public')) {
    if ($policy.tablename -eq 'saved_searches' -and $policy.cmd -eq 'ALL') { continue }
    $desiredPolicies.Add($policy)
}
$desiredPolicies.Add([pscustomobject]@{ schemaname='public'; tablename='saved_searches'; policyname='Users can insert their own saved searches'; permissive='PERMISSIVE'; cmd='INSERT'; roles=@('public'); qual=$null; with_check='(auth.uid() = user_id)' })
$desiredPolicies.Add([pscustomobject]@{ schemaname='public'; tablename='saved_searches'; policyname='Users can delete their own saved searches'; permissive='PERMISSIVE'; cmd='DELETE'; roles=@('public'); qual='(auth.uid() = user_id)'; with_check=$null })
function Format-Policy($policy) {
    $roles = @($policy.roles | ForEach-Object { if ($_ -eq 'public') { 'PUBLIC' } else { Quote-Identifier $_ } }) -join ', '
    $statement = "CREATE POLICY $(Quote-Identifier $policy.policyname) ON $(Quote-Identifier $policy.schemaname).$(Quote-Identifier $policy.tablename) AS $($policy.permissive) FOR $($policy.cmd) TO $roles"
    if ($null -ne $policy.qual) { $statement += ' USING (' + $policy.qual + ')' }
    if ($null -ne $policy.with_check) { $statement += ' WITH CHECK (' + $policy.with_check + ')' }
    return $statement + ';'
}
foreach ($policy in ($desiredPolicies | Sort-Object tablename,policyname)) { $sql.Add((Format-Policy $policy)) }

$sql.Add("`n-- 9. Application bucket configuration only, never object/user rows.")
foreach ($bucket in $detail.storage_config) {
    if ($null -ne $bucket.file_size_limit -or $null -ne $bucket.allowed_mime_types) { throw 'Bucket configuration needs explicit handling.' }
    $isPublic = if ($bucket.public) { 'true' } else { 'false' }
    $sql.Add("INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ($(Quote-Literal $bucket.id), $(Quote-Literal $bucket.name), $isPublic, NULL, NULL);")
}
foreach ($policy in ($detail.policies | Where-Object schemaname -eq 'storage')) { $sql.Add((Format-Policy $policy)) }
$sql.Add("`n-- No publication membership, environment event triggers, app rows or history writes.`nCOMMIT;")

foreach ($functionMetadata in $summary.app_functions) {
    $sourceDefinition = ($definitions.function_definitions | Where-Object proname -eq $functionMetadata.name).definition
    $canonicalDefinition = $sourceDefinition.Replace("`r`n","`n").Trim().TrimEnd(';') + "`n"
    $canonicalHasher = [System.Security.Cryptography.MD5]::Create()
    $canonicalHash = ([System.BitConverter]::ToString($canonicalHasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonicalDefinition)))).Replace('-','').ToLowerInvariant()
    $canonicalHasher.Dispose()
    $functionMetadata | Add-Member -NotePropertyName lfNormalizedFingerprint -NotePropertyValue $canonicalHash
}
$manifest = [ordered]@{
    status='unexecuted-review-draft'; capturedDate='2026-10-29'; sourceCheckpoint='df82469'
    sourceHashes=[ordered]@{}
    observed=[ordered]@{ tables=$tables; columns=$detail.columns; defaults=$definitions.defaults; enums=$summary.enums; constraints=$detail.constraints; indexes=$detail.indexes; policies=$detail.policies; tableAcl=$detail.table_acl; functions=$summary.app_functions; defaultAcl=$detail.default_acl; schemaAcl=$definitions.schema_acl; eventTriggers=$detail.event_triggers; publicationFlags=$definitions.publication_flags; publicationMembers=$detail.publications; storage=$detail.storage_config }
    desiredPublicPolicies=@($desiredPolicies)
    deliberateDifferences=@('Replace saved_searches unconditional ALL with owner-scoped INSERT and DELETE; retain owner SELECT. This is proposed, not live-applied.','Exclude environment rls_auto_enable and ensure_rls from application SQL pending ownership decision; explicit RLS remains on every table.','Do not recreate managed schemas, native roles, broad default ACLs or platform event triggers; require and verify environment prerequisites separately.')
    excludedFunctionDefinition=($definitions.function_definitions | Where-Object proname -eq 'rls_auto_enable').definition
}
foreach ($name in @('summary','details','definitions')) {
    $filename = "phase4-$name-2026-10-29.csv"
    $manifest.sourceHashes[$filename] = (Get-FileHash -LiteralPath (Join-Path $repoRoot "docs/evidence/$filename") -Algorithm SHA256).Hash
}
$sqlText = ($sql -join "`n`n") + "`n"
if ($sqlText -match $sensitivePattern) { throw 'Sensitive pattern in output; no draft written.' }
New-Item -ItemType Directory -Path $outputRoot | Out-Null
$utf8 = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText((Join-Path $outputRoot 'baseline.draft.sql'), $sqlText.Replace("`r`n","`n"), $utf8)
[System.IO.File]::WriteAllText((Join-Path $outputRoot 'manifest.json'), ($manifest | ConvertTo-Json -Depth 30) + "`n", $utf8)
Write-Output 'Generated unexecuted draft: 19 tables, 182 columns, 65 constraints, five app functions.'
