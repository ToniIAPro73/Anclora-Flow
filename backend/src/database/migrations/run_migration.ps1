# Script PowerShell para ejecutar la migración Verifactu con PostgreSQL local
# Ejecutar como: .\run_migration.ps1

# Configuración de colores
$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host "${Yellow}=== Migración Verifactu para Anclora Flow ===${Reset}`n"

# Cargar variables de entorno
$EnvFile = "backend\.env"
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
    Write-Host "${Red}✗${Reset} No se encontró el archivo $EnvFile"
    Write-Host "${Yellow}ℹ${Reset} Usando valores por defecto"
}

Write-Host "`n${Yellow}Configuración de conexión:${Reset}"
Write-Host "  Host: $DbHost"
Write-Host "  Puerto: $DbPort"
Write-Host "  Base de datos: $DbName"
Write-Host "  Usuario: $DbUser"
Write-Host ""

# Verificar que psql esté instalado
Write-Host "${Yellow}Verificando PostgreSQL...${Reset}" -NoNewline
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ${Green}✓${Reset} PostgreSQL está instalado"
    } else {
        throw "psql no encontrado"
    }
} catch {
    Write-Host " ${Red}✗${Reset} PostgreSQL (psql) no está instalado"
    Write-Host "${Yellow}ℹ${Reset} Instala PostgreSQL desde:"
    Write-Host "  https://www.postgresql.org/download/windows/"
    Write-Host ""
    Write-Host "O usa el script de Docker:"
    Write-Host "  .\run_migration_docker.ps1"
    exit 1
}

# Configurar variable de entorno para password
$env:PGPASSWORD = $DbPassword

# Verificar conexión a la base de datos
Write-Host "`n${Yellow}Verificando conexión a la base de datos...${Reset}"
try {
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "\q" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "${Green}✓${Reset} Conexión exitosa a la base de datos"
    } else {
        throw "No se pudo conectar"
    }
} catch {
    Write-Host "${Red}✗${Reset} No se pudo conectar a la base de datos"
    Write-Host "${Yellow}ℹ${Reset} Verifica que:"
    Write-Host "  1. PostgreSQL esté corriendo"
    Write-Host "  2. La base de datos '$DbName' exista"
    Write-Host "  3. Las credenciales sean correctas"
    Write-Host "  4. El archivo $EnvFile tenga la configuración correcta"
    exit 1
}

# Verificar que la tabla invoices exista
Write-Host "`n${Yellow}Verificando que la tabla 'invoices' exista...${Reset}"
$TableExists = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices');" 2>$null

if ($TableExists -eq "t") {
    Write-Host "${Green}✓${Reset} La tabla 'invoices' existe"
} else {
    Write-Host "${Red}✗${Reset} La tabla 'invoices' no existe"
    Write-Host "${Yellow}ℹ${Reset} Ejecuta primero el script de inicialización:"
    Write-Host "  psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f backend\src\database\init.sql"
    exit 1
}

# Ejecutar la migración
Write-Host "`n${Yellow}Ejecutando migración de Verifactu...${Reset}"
$MigrationFile = "backend\src\database\migrations\001_add_verifactu_fields.sql"

if (-Not (Test-Path $MigrationFile)) {
    Write-Host "${Red}✗${Reset} No se encontró el archivo de migración: $MigrationFile"
    exit 1
}

psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $MigrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n${Green}✓${Reset} Migración ejecutada exitosamente"
} else {
    Write-Host "`n${Red}✗${Reset} Error al ejecutar la migración"
    exit 1
}

# Verificar que las columnas se hayan agregado
Write-Host "`n${Yellow}Verificando que las columnas se hayan agregado...${Reset}"
$Columns = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name LIKE 'verifactu%';"

$ExpectedColumns = @(
    "verifactu_enabled",
    "verifactu_status",
    "verifactu_id",
    "verifactu_csv",
    "verifactu_qr_code",
    "verifactu_signature",
    "verifactu_hash",
    "verifactu_previous_hash",
    "verifactu_chain_index",
    "verifactu_registered_at",
    "verifactu_error_message",
    "verifactu_url",
    "verifactu_software_nif",
    "verifactu_software_name",
    "verifactu_software_version"
)

$ColumnsFound = 0
foreach ($col in $ExpectedColumns) {
    if ($Columns -match $col) {
        Write-Host "${Green}  ✓${Reset} $col"
        $ColumnsFound++
    } else {
        Write-Host "${Red}  ✗${Reset} $col (no encontrada)"
    }
}

if ($ColumnsFound -eq $ExpectedColumns.Count) {
    Write-Host "`n${Green}✓${Reset} Todas las columnas se agregaron correctamente ($ColumnsFound/$($ExpectedColumns.Count))"
} else {
    Write-Host "`n${Yellow}⚠${Reset} Solo se encontraron $ColumnsFound de $($ExpectedColumns.Count) columnas"
}

# Verificar que las tablas nuevas se hayan creado
Write-Host "`n${Yellow}Verificando que las tablas nuevas se hayan creado...${Reset}"
$LogsExists = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_logs');"
$ConfigExists = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_config');"

if ($LogsExists -eq "t") {
    Write-Host "${Green}  ✓${Reset} verifactu_logs"
} else {
    Write-Host "${Red}  ✗${Reset} verifactu_logs"
}

if ($ConfigExists -eq "t") {
    Write-Host "${Green}  ✓${Reset} verifactu_config"
} else {
    Write-Host "${Red}  ✗${Reset} verifactu_config"
}

# Verificar índices
Write-Host "`n${Yellow}Verificando índices...${Reset}"
$Indexes = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT indexname FROM pg_indexes WHERE tablename IN ('invoices', 'verifactu_logs', 'verifactu_config') AND indexname LIKE '%verifactu%';"

if ($Indexes) {
    Write-Host "${Green}✓${Reset} Índices creados:"
    $Indexes -split "`n" | Where-Object { $_ } | ForEach-Object {
        Write-Host "  - $_"
    }
} else {
    Write-Host "${Yellow}⚠${Reset} No se encontraron índices Verifactu"
}

# Contar usuarios existentes que ahora tienen configuración Verifactu
$UserCount = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT COUNT(*) FROM verifactu_config;"
Write-Host "`n${Green}✓${Reset} Configuración Verifactu creada para $UserCount usuario(s)"

# Limpiar variable de entorno
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

# Resumen final
Write-Host "`n${Green}═══════════════════════════════════════════${Reset}"
Write-Host "${Green}  Migración completada exitosamente${Reset}"
Write-Host "${Green}═══════════════════════════════════════════${Reset}"

Write-Host "`n${Yellow}Próximos pasos:${Reset}"
Write-Host "  1. Configura las variables de entorno para Verifactu en backend\.env:"
Write-Host "     VERIFACTU_TEST_MODE=true"
Write-Host "     VERIFACTU_NIF=tu_nif"
Write-Host ""
Write-Host "  2. Reinicia el servidor backend:"
Write-Host "     cd backend"
Write-Host "     npm start"
Write-Host ""
Write-Host "  3. El sistema Verifactu estará disponible en:"
Write-Host "     http://localhost:8020/api/verifactu"
Write-Host ""
Write-Host "${Yellow}ℹ${Reset} Por defecto, Verifactu está en modo TEST para todos los usuarios"
Write-Host "${Yellow}ℹ${Reset} Los usuarios pueden habilitarlo desde la configuración"
Write-Host ""
