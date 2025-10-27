# Script maestro para iniciar toda la aplicación Anclora Flow
# Inicia PostgreSQL, Backend, Frontend y AI Services automáticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Anclora Flow - Inicio Completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. Verificar Docker
# ========================================
Write-Host "Paso 1: Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "Docker y Docker Compose estan instalados" -ForegroundColor Green
} catch {
    Write-Host "Docker o Docker Compose no estan instalados o no estan en el PATH" -ForegroundColor Red
    Write-Host "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# ========================================
# 2. Verificar archivos .env
# ========================================
Write-Host ""
Write-Host "Paso 2: Verificando archivos de configuracion..." -ForegroundColor Yellow

# Verificar .env para backend
if (-not (Test-Path "$PSScriptRoot\backend\.env")) {
    if (Test-Path "$PSScriptRoot\backend\.env.example") {
        Write-Host "Creando .env para backend..." -ForegroundColor Cyan
        Copy-Item "$PSScriptRoot\backend\.env.example" "$PSScriptRoot\backend\.env"
    }
}

# Verificar .env para frontend
if (-not (Test-Path "$PSScriptRoot\frontend\.env")) {
    if (Test-Path "$PSScriptRoot\frontend\.env.example") {
        Write-Host "Creando .env para frontend..." -ForegroundColor Cyan
        Copy-Item "$PSScriptRoot\frontend\.env.example" "$PSScriptRoot\frontend\.env"
    }
}

Write-Host "Archivos de configuracion verificados" -ForegroundColor Green

# ========================================
# 3. Iniciar servicios con Docker Compose
# ========================================
Write-Host ""
Write-Host "Paso 3: Iniciando servicios con Docker Compose..." -ForegroundColor Yellow

try {
    # Detener servicios existentes si los hay
    Write-Host "Deteniendo servicios existentes..." -ForegroundColor Cyan
    docker-compose down 2>$null
    
    # Iniciar servicios en modo detached
    Write-Host "Iniciando servicios (PostgreSQL, Frontend, Backend, AI Services)..." -ForegroundColor Cyan
    docker-compose up --build -d
    
    Write-Host "Servicios Docker iniciados" -ForegroundColor Green
} catch {
    Write-Host "Error al iniciar servicios con Docker Compose: $_" -ForegroundColor Red
    exit 1
}

# ========================================
# 4. Esperar a que PostgreSQL esté listo
# ========================================
Write-Host ""
Write-Host "Paso 4: Esperando que PostgreSQL este listo..." -ForegroundColor Yellow

$maxRetries = 30
$retries = 0
$pgReady = $false

while ($retries -lt $maxRetries -and -not $pgReady) {
    try {
        $result = docker exec anclora-flow-postgres-1 pg_isready -U postgres 2>$null
        if ($result -like "*accepting connections*") {
            $pgReady = $true
            Write-Host "PostgreSQL esta listo" -ForegroundColor Green
        } else {
            $retries++
            Start-Sleep -Seconds 2
        }
    } catch {
        $retries++
        Start-Sleep -Seconds 2
    }
}

if (-not $pgReady) {
    Write-Host "PostgreSQL no respondio a tiempo" -ForegroundColor Red
    Write-Host "Verificando estado de los contenedores..." -ForegroundColor Yellow
    docker-compose ps
    exit 1
}

# ========================================
# 5. Verificar Base de Datos
# ========================================
Write-Host ""
Write-Host "Paso 5: Verificando base de datos..." -ForegroundColor Yellow

try {
    $dbExists = docker exec anclora-flow-postgres-1 psql -U postgres -lqt 2>$null | Select-String "anclora_flow"

    if (-not $dbExists) {
        Write-Host "Creando base de datos anclora_flow..." -ForegroundColor Cyan
        docker exec anclora-flow-postgres-1 psql -U postgres -c "CREATE DATABASE anclora_flow;" 2>$null

        Write-Host "Inicializando tablas..." -ForegroundColor Cyan
        docker cp backend/src/database/init.sql anclora-flow-postgres-1:/tmp/init.sql
        docker exec anclora-flow-postgres-1 psql -U postgres -d anclora_flow -f /tmp/init.sql | Out-Null

        Write-Host "Base de datos inicializada" -ForegroundColor Green
    } else {
        Write-Host "Base de datos ya existe" -ForegroundColor Green
    }
} catch {
    Write-Host "Error al verificar base de datos: $_" -ForegroundColor Yellow
    Write-Host "Continuando con el inicio de servicios..." -ForegroundColor Cyan
}

# ========================================
# 6. Verificar estado de los servicios
# ========================================
Write-Host ""
Write-Host "Paso 6: Verificando estado de los servicios..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Verificar que los servicios estén corriendo
$services = docker-compose ps
Write-Host $services

# ========================================
# 7. Mostrar información de acceso
# ========================================
Write-Host ""
Write-Host "Paso 7: Servicios iniciados exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Informacion de acceso:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3020" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8020" -ForegroundColor White
Write-Host "   AI Services: http://localhost:8001" -ForegroundColor White
Write-Host "   PostgreSQL: localhost:5432 (dentro del contenedor)" -ForegroundColor White
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "   Ver logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "   Detener: docker-compose down" -ForegroundColor Gray
Write-Host "   Reiniciar: docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Yellow
Read-Host