# Script PowerShell para ejecutar la migración de Customer Subscriptions
# Ejecutar como: .\run_customer_subscriptions_migration.ps1

# Configuración de colores
$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host "${Yellow}=== Migración Customer Subscriptions para Anclora Flow ===${Reset}`n"

# Cargar variables de entorno desde backend\.env
$EnvFile = "..\..\..\backend\.env"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "anclora_flow"
$DbUser = "postgres"
$DbPassword = ""

if (Test-Path $EnvFile) {
    Write-Host "${Green}✓${Reset} Cargando variables de entorno desde $EnvFile"
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^POSTGRES_HOST=(.+)$") { $DbHost = $matches[1] }
        if ($_ -match "^POSTGRES_PORT=(.+)$") { $DbPort = $matches[1] }
        if ($_ -match "^POSTGRES_DB=(.+)$") { $DbName = $matches[1] }
        if ($_ -match "^POSTGRES_USER=(.+)$") { $DbUser = $matches[1] }
        if ($_ -match "^POSTGRES_PASSWORD=(.+)$") { $DbPassword = $matches[1] }
    }
} else {
    Write-Host "${Yellow}⚠${Reset} No se encontró el archivo $EnvFile, usando valores por defecto"
}

Write-Host "`n${Yellow}Configuración de conexión:${Reset}"
Write-Host "  Host: $DbHost"
Write-Host "  Puerto: $DbPort"
Write-Host "  Base de datos: $DbName"
Write-Host "  Usuario: $DbUser"
Write-Host ""

# Configurar variable de entorno para password
$env:PGPASSWORD = $DbPassword

# Determinar el comando psql según el sistema
$PsqlCommand = "psql"
if ($DbHost -eq "postgres") {
    # Si estamos usando Docker, necesitamos ejecutar dentro del contenedor
    Write-Host "${Yellow}Detectado host 'postgres', usando Docker...${Reset}"
    $PsqlCommand = "docker exec -i anclora-postgres psql"
}

# Ejecutar la migración
Write-Host "`n${Yellow}Ejecutando migración de Customer Subscriptions...${Reset}"
$MigrationFile = ".\005_create_customer_subscriptions.sql"

if (-Not (Test-Path $MigrationFile)) {
    Write-Host "${Red}✗${Reset} No se encontró el archivo de migración: $MigrationFile"
    exit 1
}

# Ejecutar migración
if ($DbHost -eq "postgres") {
    # Docker
    Get-Content $MigrationFile | docker exec -i anclora-postgres psql -U $DbUser -d $DbName
} else {
    # Local
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $MigrationFile
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n${Green}✓${Reset} Migración ejecutada exitosamente"
} else {
    Write-Host "`n${Red}✗${Reset} Error al ejecutar la migración"
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

# Verificar que la tabla se haya creado
Write-Host "`n${Yellow}Verificando que la tabla se haya creado...${Reset}"
if ($DbHost -eq "postgres") {
    $TableExists = docker exec -i anclora-postgres psql -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_subscriptions');"
} else {
    $TableExists = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_subscriptions');"
}

if ($TableExists -eq "t") {
    Write-Host "${Green}✓${Reset} La tabla 'customer_subscriptions' se creó correctamente"
} else {
    Write-Host "${Red}✗${Reset} La tabla 'customer_subscriptions' no existe"
}

# Verificar vistas creadas
Write-Host "`n${Yellow}Verificando vistas creadas...${Reset}"
$Views = @("mrr_summary", "arr_summary", "upcoming_invoicing", "expiring_customer_trials", "churn_metrics", "plan_changes", "at_risk_subscriptions")
foreach ($view in $Views) {
    if ($DbHost -eq "postgres") {
        $ViewExists = docker exec -i anclora-postgres psql -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = '$view');"
    } else {
        $ViewExists = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = '$view');"
    }
    
    if ($ViewExists -eq "t") {
        Write-Host "${Green}  ✓${Reset} Vista '$view' creada"
    } else {
        Write-Host "${Red}  ✗${Reset} Vista '$view' no encontrada"
    }
}

# Limpiar variable de entorno
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Resumen final
Write-Host "`n${Green}═══════════════════════════════════════════${Reset}"
Write-Host "${Green}  Migración Customer Subscriptions completada${Reset}"
Write-Host "${Green}═══════════════════════════════════════════${Reset}"
Write-Host "`n${Yellow}La tabla 'customer_subscriptions' está lista para usar${Reset}"
Write-Host ""
