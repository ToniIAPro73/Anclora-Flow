# Script PowerShell para revertir la migración de Verifactu
# ADVERTENCIA: Esto eliminará todas las columnas y datos de Verifactu
# Ejecutar como: .\rollback_verifactu.ps1

# Configuración de colores
$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host "${Red}=== ROLLBACK Migración Verifactu ===${Reset}`n"
Write-Host "${Red}ADVERTENCIA: Este script eliminará:${Reset}"
Write-Host "  - Todas las columnas verifactu_* de la tabla invoices"
Write-Host "  - La tabla verifactu_logs (con todos sus datos)"
Write-Host "  - La tabla verifactu_config (con todas las configuraciones)"
Write-Host ""

$Confirm = Read-Host "¿Estás seguro que deseas continuar? (escribe 'SI' para confirmar)"

if ($Confirm -ne "SI") {
    Write-Host "`n${Yellow}Rollback cancelado${Reset}"
    exit 0
}

# Cargar variables de entorno
$EnvFile = "backend\.env"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "anclora_flow"
$DbUser = "postgres"
$DbPassword = ""

if (Test-Path $EnvFile) {
    Write-Host "`n${Green}✓${Reset} Cargando variables de entorno"
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^POSTGRES_HOST=(.+)$") { $DbHost = $matches[1] }
        if ($_ -match "^POSTGRES_PORT=(.+)$") { $DbPort = $matches[1] }
        if ($_ -match "^POSTGRES_DB=(.+)$") { $DbName = $matches[1] }
        if ($_ -match "^POSTGRES_USER=(.+)$") { $DbUser = $matches[1] }
        if ($_ -match "^POSTGRES_PASSWORD=(.+)$") { $DbPassword = $matches[1] }
    }
}

Write-Host "`n${Yellow}Ejecutando rollback...${Reset}"

# Configurar variable de entorno para password
$env:PGPASSWORD = $DbPassword

# Crear SQL de rollback
$RollbackSql = @"
-- Rollback de la migración Verifactu

-- Eliminar tablas
DROP TABLE IF EXISTS verifactu_logs CASCADE;
DROP TABLE IF EXISTS verifactu_config CASCADE;

-- Eliminar índices de la tabla invoices
DROP INDEX IF EXISTS idx_invoices_verifactu_status;
DROP INDEX IF EXISTS idx_invoices_verifactu_id;
DROP INDEX IF EXISTS idx_invoices_verifactu_chain_index;

-- Eliminar columnas de la tabla invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_enabled;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_status;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_csv;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_qr_code;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_signature;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_hash;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_previous_hash;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_chain_index;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_registered_at;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_error_message;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_url;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_nif;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_name;
ALTER TABLE invoices DROP COLUMN IF EXISTS verifactu_software_version;
"@

# Guardar SQL temporal
$TempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
$RollbackSql | Out-File -FilePath $TempSqlFile -Encoding UTF8

# Ejecutar rollback
try {
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $TempSqlFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n${Green}✓${Reset} Rollback ejecutado exitosamente"
        Write-Host "${Green}✓${Reset} Todas las columnas y tablas de Verifactu han sido eliminadas"
    } else {
        throw "Error en psql"
    }
} catch {
    Write-Host "`n${Red}✗${Reset} Error al ejecutar el rollback"
    exit 1
} finally {
    # Limpiar archivos temporales
    Remove-Item $TempSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`n${Green}Rollback completado${Reset}"
