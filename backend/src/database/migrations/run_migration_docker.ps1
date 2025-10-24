# Script PowerShell para ejecutar la migración Verifactu usando Docker
# Ejecutar como: .\run_migration_docker.ps1

# Configuración de colores
$ESC = [char]27
$Green = "$ESC[32m"
$Yellow = "$ESC[33m"
$Red = "$ESC[31m"
$Reset = "$ESC[0m"

Write-Host "${Yellow}=== Migración Verifactu (Docker) ===${Reset}`n"

# Verificar que Docker esté instalado
Write-Host "Verificando Docker..." -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ${Green}✓${Reset} Docker está instalado"
    } else {
        throw "Docker no encontrado"
    }
} catch {
    Write-Host " ${Red}✗${Reset} Docker no está instalado"
    Write-Host "${Yellow}ℹ${Reset} Instala Docker Desktop desde: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Verificar que Docker esté corriendo
Write-Host "Verificando que Docker esté corriendo..." -NoNewline
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ${Green}✓${Reset} Docker está corriendo"
    } else {
        throw "Docker no está corriendo"
    }
} catch {
    Write-Host " ${Red}✗${Reset} Docker no está corriendo"
    Write-Host "${Yellow}ℹ${Reset} Inicia Docker Desktop y vuelve a ejecutar este script"
    exit 1
}

# Verificar si existe un contenedor PostgreSQL corriendo
$ContainerName = "anclora-postgres"
Write-Host "`nBuscando contenedor PostgreSQL..." -NoNewline

$Running = docker ps --filter "name=$ContainerName" --format "{{.Names}}" 2>$null

if ([string]::IsNullOrEmpty($Running)) {
    Write-Host " ${Yellow}ℹ${Reset} No hay contenedor PostgreSQL corriendo"

    $Response = Read-Host "`n${Yellow}¿Deseas iniciar uno?${Reset} (S/N)"

    if ($Response -match "^[Ss]$") {
        Write-Host "`n${Yellow}Iniciando contenedor PostgreSQL...${Reset}"

        # Cargar variables de entorno si existen
        $EnvFile = "backend\.env"
        $DbPassword = "anclora_password"
        $DbName = "anclora_flow"
        $DbUser = "postgres"
        $DbPort = "5432"

        if (Test-Path $EnvFile) {
            Write-Host "${Green}✓${Reset} Cargando configuración desde $EnvFile"
            Get-Content $EnvFile | ForEach-Object {
                if ($_ -match "^POSTGRES_PASSWORD=(.+)$") {
                    $DbPassword = $matches[1]
                }
                if ($_ -match "^POSTGRES_DB=(.+)$") {
                    $DbName = $matches[1]
                }
                if ($_ -match "^POSTGRES_USER=(.+)$") {
                    $DbUser = $matches[1]
                }
                if ($_ -match "^POSTGRES_PORT=(.+)$") {
                    $DbPort = $matches[1]
                }
            }
        }

        # Iniciar contenedor PostgreSQL
        docker run -d `
            --name $ContainerName `
            -e POSTGRES_PASSWORD=$DbPassword `
            -e POSTGRES_DB=$DbName `
            -e POSTGRES_USER=$DbUser `
            -p "${DbPort}:5432" `
            -v anclora-postgres-data:/var/lib/postgresql/data `
            postgres:15-alpine

        if ($LASTEXITCODE -eq 0) {
            Write-Host "${Green}✓${Reset} Contenedor PostgreSQL iniciado"
            Write-Host "${Yellow}ℹ${Reset} Esperando que PostgreSQL esté listo..."
            Start-Sleep -Seconds 5
        } else {
            Write-Host "${Red}✗${Reset} Error al iniciar el contenedor"
            exit 1
        }
    } else {
        Write-Host "${Yellow}Operación cancelada${Reset}"
        exit 0
    }
} else {
    Write-Host " ${Green}✓${Reset} Contenedor PostgreSQL encontrado: $Running"
}

# Verificar que PostgreSQL esté listo
Write-Host "`n${Yellow}Verificando que PostgreSQL esté listo...${Reset}"
$MaxRetries = 30
$Retry = 0

while ($Retry -lt $MaxRetries) {
    docker exec $ContainerName pg_isready -U postgres > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "${Green}✓${Reset} PostgreSQL está listo"
        break
    }
    $Retry++
    Write-Host "  Intento $Retry/$MaxRetries" -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}

if ($Retry -eq $MaxRetries) {
    Write-Host "`n${Red}✗${Reset} PostgreSQL no respondió a tiempo"
    exit 1
}

# Verificar que la base de datos exista
Write-Host "`n${Yellow}Verificando base de datos...${Reset}"
$DbExists = docker exec $ContainerName psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='anclora_flow'" 2>$null

if ($DbExists -ne "1") {
    Write-Host "${Yellow}ℹ${Reset} Base de datos 'anclora_flow' no existe, creándola..."
    docker exec $ContainerName psql -U postgres -c "CREATE DATABASE anclora_flow;" 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "${Green}✓${Reset} Base de datos creada"

        Write-Host "`n${Yellow}ℹ${Reset} Ejecutando script de inicialización..."
        Get-Content "backend\src\database\init.sql" | docker exec -i $ContainerName psql -U postgres -d anclora_flow

        if ($LASTEXITCODE -eq 0) {
            Write-Host "${Green}✓${Reset} Base de datos inicializada"
        } else {
            Write-Host "${Red}✗${Reset} Error al inicializar la base de datos"
            exit 1
        }
    } else {
        Write-Host "${Red}✗${Reset} Error al crear la base de datos"
        exit 1
    }
} else {
    Write-Host "${Green}✓${Reset} Base de datos 'anclora_flow' existe"
}

# Copiar archivo de migración al contenedor
Write-Host "`n${Yellow}Copiando archivo de migración...${Reset}"
docker cp "backend\src\database\migrations\001_add_verifactu_fields.sql" "${ContainerName}:/tmp/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "${Green}✓${Reset} Archivo copiado"
} else {
    Write-Host "${Red}✗${Reset} Error al copiar archivo"
    exit 1
}

# Ejecutar migración
Write-Host "`n${Yellow}Ejecutando migración Verifactu...${Reset}"
docker exec $ContainerName psql -U postgres -d anclora_flow -f /tmp/001_add_verifactu_fields.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n${Green}✓${Reset} Migración ejecutada exitosamente"
} else {
    Write-Host "`n${Red}✗${Reset} Error al ejecutar la migración"
    exit 1
}

# Limpiar archivo temporal
docker exec $ContainerName rm /tmp/001_add_verifactu_fields.sql

# Verificar que las columnas se hayan agregado
Write-Host "`n${Yellow}Verificando migración...${Reset}"
$Columns = docker exec $ContainerName psql -U postgres -d anclora_flow -tAc "SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name LIKE 'verifactu%';"

$ColumnCount = ($Columns -split "`n" | Where-Object { $_ -match "verifactu" }).Count
Write-Host "${Green}✓${Reset} $ColumnCount columnas Verifactu agregadas"

# Verificar tablas nuevas
$LogsExists = docker exec $ContainerName psql -U postgres -d anclora_flow -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_logs');"
$ConfigExists = docker exec $ContainerName psql -U postgres -d anclora_flow -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifactu_config');"

if ($LogsExists -eq "t") {
    Write-Host "${Green}✓${Reset} Tabla verifactu_logs creada"
} else {
    Write-Host "${Red}✗${Reset} Tabla verifactu_logs no encontrada"
}

if ($ConfigExists -eq "t") {
    Write-Host "${Green}✓${Reset} Tabla verifactu_config creada"
} else {
    Write-Host "${Red}✗${Reset} Tabla verifactu_config no encontrada"
}

# Contar configuraciones de usuario
$UserCount = docker exec $ContainerName psql -U postgres -d anclora_flow -tAc "SELECT COUNT(*) FROM verifactu_config;"
Write-Host "${Green}✓${Reset} Configuración Verifactu creada para $UserCount usuario(s)"

# Mostrar información de conexión
Write-Host "`n${Green}═══════════════════════════════════════════${Reset}"
Write-Host "${Green}  Migración completada exitosamente${Reset}"
Write-Host "${Green}═══════════════════════════════════════════${Reset}"

Write-Host "`n${Yellow}Información de conexión:${Reset}"
Write-Host "  Host: localhost"
Write-Host "  Puerto: 5432"
Write-Host "  Base de datos: anclora_flow"
Write-Host "  Usuario: postgres"

Write-Host "`n${Yellow}Comandos útiles de PowerShell:${Reset}"
Write-Host "  # Conectar a la base de datos:"
Write-Host "  docker exec -it $ContainerName psql -U postgres -d anclora_flow"
Write-Host ""
Write-Host "  # Ver logs del contenedor:"
Write-Host "  docker logs $ContainerName"
Write-Host ""
Write-Host "  # Detener el contenedor:"
Write-Host "  docker stop $ContainerName"
Write-Host ""
Write-Host "  # Iniciar el contenedor:"
Write-Host "  docker start $ContainerName"
Write-Host ""
Write-Host "  # Ver contenedores corriendo:"
Write-Host "  docker ps"
Write-Host ""

Write-Host "${Yellow}Próximos pasos:${Reset}"
Write-Host "  1. Configura las variables de entorno en backend\.env:"
Write-Host "     POSTGRES_HOST=localhost"
Write-Host "     POSTGRES_PORT=5432"
Write-Host "     POSTGRES_DB=anclora_flow"
Write-Host "     POSTGRES_USER=postgres"
Write-Host "     POSTGRES_PASSWORD=anclora_password"
Write-Host "     VERIFACTU_TEST_MODE=true"
Write-Host ""
Write-Host "  2. Inicia el servidor backend:"
Write-Host "     cd backend"
Write-Host "     npm start"
Write-Host ""
Write-Host "  3. El sistema Verifactu estará disponible en:"
Write-Host "     http://localhost:8020/api/verifactu"
Write-Host ""

Write-Host "${Green}¡Listo para desarrollar!${Reset}`n"
