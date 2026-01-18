# Run migration for payments, receipts, and bank accounts 
# Date: 2026-01-18

Write-Host "Running migration: 003_add_payments_receipts_bank_accounts.sql" -ForegroundColor Cyan

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$dbHost = $env:DB_HOST
$dbPort = $env:DB_PORT
$dbName = $env:DB_NAME
$dbUser = $env:DB_USER
$dbPassword = $env:DB_PASSWORD

Write-Host "Database: $dbName" -ForegroundColor Gray
Write-Host "Host: ${dbHost}:${dbPort}" -ForegroundColor Gray

# Run migration
$migrationFile = "src/database/migrations/003_add_payments_receipts_bank_accounts.sql"

if (-Not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Executing migration..." -ForegroundColor Yellow

$env:PGPASSWORD = $dbPassword
& psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $migrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Verify tables were created
Write-Host "`nVerifying tables..." -ForegroundColor Cyan

$verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'receipts', 'bank_accounts')
ORDER BY table_name;
"@

$tables = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $verifyQuery

Write-Host "Tables created:" -ForegroundColor Gray
Write-Host $tables

Write-Host "`n✅ All done!" -ForegroundColor Green
