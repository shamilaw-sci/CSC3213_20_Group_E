param([string]$SqlPath = (Join-Path $PSScriptRoot 'baseline.draft.sql'))
$ErrorActionPreference = 'Stop'
$sql = (Get-Content -LiteralPath $SqlPath -Raw).Replace("`r`n","`n")
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'manifest.json') -Raw | ConvertFrom-Json
function Require([bool]$condition, [string]$message) {
    if (!$condition) { throw $message }
}
function Quote-Identifier([string]$value) { return '"' + $value.Replace('"','""') + '"' }
function Quote-Literal([string]$value) { return "'" + $value.Replace("'","''") + "'" }
function Md5([string]$value) {
    $hash = [System.Security.Cryptography.MD5]::Create()
    try { return ([System.BitConverter]::ToString($hash.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($value)))).Replace('-','').ToLowerInvariant() }
    finally { $hash.Dispose() }
}

Require ($sql.Contains("current_setting('thirasara.phase4_isolated', true) IS DISTINCT FROM 'approved-empty-test'")) 'Missing isolated marker guard.'
Require (!$sql.Contains("SET thirasara.phase4_isolated")) 'Draft must not self-authorize isolation.'
Require ($sql.Contains("current_user <> 'postgres'")) 'Missing owner role guard.'
Require ($sql.Contains("c.relkind IN ('r','p','v','m','S','f')")) 'Missing empty application relation guard.'
Require ($sql.TrimEnd().EndsWith('COMMIT;')) 'Missing transaction end.'
Require ([regex]::Matches($sql,'(?m)^BEGIN;').Count -eq 1) 'Expected one outer transaction.'
$ddlOnly = [regex]::Replace($sql,'(?s)\$(?<tag>[A-Za-z_][A-Za-z_0-9]*|)\$.*?\$\k<tag>\$','<quoted body>')
Require ($ddlOnly -notmatch '(?im)^\s*(DROP|TRUNCATE|DELETE|UPDATE|ALTER DEFAULT PRIVILEGES|CREATE EXTENSION|CREATE ROLE|CREATE EVENT TRIGGER)\b') 'Unexpected lifecycle/environment command outside function/guard bodies.'
Require ($ddlOnly -notmatch '(?im)^\s*(INSERT|UPDATE|DELETE)\s+(INTO\s+)?public\.') 'Unexpected application data write.'
Require ($ddlOnly -notmatch '(?im)^\s*(INSERT|UPDATE|DELETE)\s+(INTO\s+)?supabase_migrations\.') 'Unexpected migration history write.'
Require ($sql -notmatch '(?i)(postgres(?:ql)?://|eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9]+|-----BEGIN .*PRIVATE KEY)') 'Sensitive pattern found; contents withheld.'

$tableMatches = [regex]::Matches($sql,'(?ms)^CREATE TABLE public\."(?<name>[^"]+)" \(\n(?<columns>.*?)\n\);')
Require ($tableMatches.Count -eq 19) 'Expected 19 table definitions.'
$defaults = @{}
foreach ($entry in $manifest.observed.defaults) { $defaults["$($entry.table_name).$($entry.column_name)"] = $entry.expression }
$verifiedColumns = 0
foreach ($table in $manifest.observed.tables) {
    $tableMatch = @($tableMatches | Where-Object { $_.Groups['name'].Value -ceq $table.name })
    Require ($tableMatch.Count -eq 1) 'Missing/duplicate table definition.'
    $actualLines = @($tableMatch[0].Groups['columns'].Value -split "`n" | ForEach-Object { $_.Trim().TrimEnd(',') })
    $expectedColumns = @($manifest.observed.columns | Where-Object table_name -eq $table.name | Sort-Object attnum)
    Require ($actualLines.Count -eq $expectedColumns.Count) 'Column count differs from manifest.'
    for ($index = 0; $index -lt $expectedColumns.Count; $index++) {
        $column = $expectedColumns[$index]
        $expected = (Quote-Identifier $column.column_name) + ' ' + $column.type
        $key = "$($table.name).$($column.column_name)"
        if ($defaults.ContainsKey($key)) { $expected += ' DEFAULT ' + $defaults[$key] }
        if ($column.attnotnull) { $expected += ' NOT NULL' }
        Require ($actualLines[$index] -ceq $expected) 'Column type/default/nullability/order differs.'
        $verifiedColumns++
    }
    Require ($sql.Contains("ALTER TABLE public.$(Quote-Identifier $table.name) ENABLE ROW LEVEL SECURITY;")) 'Table RLS missing.'
    Require ($sql.Contains("REVOKE ALL ON TABLE public.$(Quote-Identifier $table.name) FROM PUBLIC, anon, authenticated, service_role;")) 'Table default-grant revocation missing.'
}
Require ($verifiedColumns -eq 182) 'Expected 182 verified columns.'
Require ([regex]::Matches($sql,'(?m)^CREATE TYPE ').Count -eq 5) 'Expected five enum definitions.'
foreach ($group in ($manifest.observed.enums | Group-Object type)) {
    $labels = @($group.Group | Sort-Object order | ForEach-Object { Quote-Literal $_.label }) -join ', '
    Require ($sql.Contains("CREATE TYPE public.$(Quote-Identifier $group.Name) AS ENUM ($labels);")) 'Enum labels/order differs.'
}
Require ([regex]::Matches($sql,'(?m)^ALTER TABLE .* ADD CONSTRAINT ').Count -eq 65) 'Expected 65 constraints.'
foreach ($constraint in $manifest.observed.constraints) {
    Require ($sql.Contains("ALTER TABLE public.$(Quote-Identifier $constraint.table_name) ADD CONSTRAINT $(Quote-Identifier $constraint.conname) $($constraint.definition);")) 'Constraint differs.'
}
$constraintIndexes = @($manifest.observed.constraints | Where-Object contype -in @('p','u','x') | ForEach-Object { "$($_.table_name).$($_.conname)" })
$standalone = @($manifest.observed.indexes | Where-Object { "$($_.table_name).$($_.index_name)" -notin $constraintIndexes })
Require ($standalone.Count -eq 16) 'Expected 16 standalone indexes.'
Require ([regex]::Matches($sql,'(?m)^CREATE (UNIQUE )?INDEX ').Count -eq 16) 'Missing/extra standalone index.'
foreach ($index in $standalone) { Require ($sql.Contains($index.definition.TrimEnd(';') + ';')) 'Standalone index differs.' }

Require ([regex]::Matches($sql,'(?m)^CREATE OR REPLACE FUNCTION ').Count -eq 5) 'Expected five app functions.'
foreach ($function in ($manifest.observed.functions | Where-Object name -ne 'rls_auto_enable')) {
    $pattern = '(?ms)^CREATE OR REPLACE FUNCTION public\.' + [regex]::Escape($function.name) + '\(.*?AS \$function\$.*?\$function\$;'
    $matches = [regex]::Matches($sql,$pattern)
    Require ($matches.Count -eq 1) 'Missing/duplicate app function.'
    $reconstructedPgDefinition = $matches[0].Value.TrimEnd(';') + "`n"
    Require ((Md5 $reconstructedPgDefinition) -ceq $function.lfNormalizedFingerprint) 'Function definition differs from LF-normalized captured fingerprint.'
    $signature = 'public.' + (Quote-Identifier $function.name) + '(' + $function.arguments + ')'
    Require ($sql.Contains("REVOKE ALL ON FUNCTION $signature FROM PUBLIC, anon, authenticated, service_role;")) 'Function default-grant revocation missing.'
}
Require ($sql -notmatch '(?m)^CREATE OR REPLACE FUNCTION public\.rls_auto_enable') 'Environment helper was emitted.'
Require ([regex]::Matches($sql,'(?m)^CREATE POLICY ').Count -eq 25) 'Expected 19 public plus six storage policies.'
$savedPolicies = @([regex]::Matches($sql,'(?m)^CREATE POLICY .* ON "public"\."saved_searches".*;$') | ForEach-Object Value)
Require ($savedPolicies.Count -eq 3) 'Expected three scoped saved-search policies.'
Require (($savedPolicies -join "`n") -notmatch ' FOR ALL ') 'Unrestricted saved-search ALL policy present.'
Require (@($savedPolicies | Where-Object { $_ -match 'FOR INSERT.*WITH CHECK \(\(auth.uid\(\) = user_id\)\)' }).Count -eq 1) 'Saved-search INSERT ownership missing.'
Require (@($savedPolicies | Where-Object { $_ -match 'FOR DELETE.*USING \(\(auth.uid\(\) = user_id\)\)' }).Count -eq 1) 'Saved-search DELETE ownership missing.'
Require (@($savedPolicies | Where-Object { $_ -match 'FOR SELECT.*USING \(\(auth.uid\(\) = user_id\)\)' }).Count -eq 1) 'Saved-search SELECT ownership missing.'
Require ([regex]::Matches($sql,'(?m)^INSERT INTO storage\.buckets ').Count -eq 4) 'Expected four bucket configuration rows.'
foreach ($bucket in $manifest.observed.storage) {
    $publicFlag = if ($bucket.public) { 'true' } else { 'false' }
    Require ($sql.Contains("VALUES ($(Quote-Literal $bucket.id), $(Quote-Literal $bucket.name), $publicFlag, NULL, NULL);")) 'Bucket configuration differs.'
}
Write-Output 'PASS: offline draft checks — 19 tables, 182 columns, five enums, 65 constraints, 41 total indexes, five fingerprint-matched app functions, scoped saved-search policies and safety guards.'
Write-Output 'LIMIT: this offline verifier itself does not execute PostgreSQL or test runtime permissions; see the recorded isolated verification separately.'
