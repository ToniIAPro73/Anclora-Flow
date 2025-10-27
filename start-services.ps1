# Script maestro para iniciar toda la aplicación Anclora Flow
# Inicia PostgreSQL, Backend y Frontend automáticamente

Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 Anclora Flow - Inicio Completo    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. Verificar Docker
# ========================================
Write-Host "📦 Paso 1: Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker está instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# ========================================
# 2. Iniciar PostgreSQL
# ========================================
Write-Host ""
Write-Host "🗄️  Paso 2: Iniciando PostgreSQL..." -ForegroundColor Yellow

$postgresRunning = docker ps --filter "name=anclora-postgres" --format "{{.Names}}"

if ($postgresRunning -eq "anclora-postgres") {
    Write-Host "✅ PostgreSQL ya está corriendo" -ForegroundColor Green
} else {
    # Intentar iniciar el contenedor existente
    $postgresExists = docker ps -a --filter "name=anclora-postgres" --format "{{.Names}}"

    if ($postgresExists -eq "anclora-postgres") {
        Write-Host "⚙️  Iniciando contenedor PostgreSQL existente..." -ForegroundColor Cyan
        docker start anclora-postgres
        Start-Sleep -Seconds 3
    } else {
        Write-Host "⚙️  Creando nuevo contenedor PostgreSQL..." -ForegroundColor Cyan
        docker run -d `
            --name anclora-postgres `
            -e POSTGRES_USER=postgres `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=anclora_flow `
            -p 5452:5432 `
            -v anclora-postgres-data:/var/lib/postgresql/data `
            postgres:16-alpine
        Start-Sleep -Seconds 5
    }

    Write-Host "✅ PostgreSQL iniciado en puerto 5452" -ForegroundColor Green
}

# Verificar que PostgreSQL esté listo
Write-Host "⏳ Esperando que PostgreSQL esté listo..." -ForegroundColor Cyan
$maxRetries = 10
$retries = 0
while ($retries -lt $maxRetries) {
    $pgReady = docker exec anclora-postgres pg_isready 2>$null
    if ($pgReady -like "*accepting connections*") {
        Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green
        break
    }
    $retries++
    Start-Sleep -Seconds 1
}

if ($retries -eq $maxRetries) {
    Write-Host "❌ PostgreSQL no respondió a tiempo" -ForegroundColor Red
    exit 1
}

# ========================================
# 3. Verificar Base de Datos
# ========================================
Write-Host ""
Write-Host "🗃️  Paso 3: Verificando base de datos..." -ForegroundColor Yellow

$dbExists = docker exec anclora-postgres psql -U postgres -lqt 2>$null | Select-String "anclora_flow"

if (-not $dbExists) {
    Write-Host "⚙️  Creando base de datos anclora_flow..." -ForegroundColor Cyan
    docker exec anclora-postgres psql -U postgres -c "CREATE DATABASE anclora_flow;" 2>$null

    Write-Host "⚙️  Inicializando tablas..." -ForegroundColor Cyan
    docker cp backend/src/database/init.sql anclora-postgres:/tmp/init.sql
    docker exec anclora-postgres psql -U postgres -d anclora_flow -f /tmp/init.sql | Out-Null

    Write-Host "✅ Base de datos inicializada" -ForegroundColor Green
} else {
    Write-Host "✅ Base de datos ya existe" -ForegroundColor Green
}

# ========================================
# 4. Matar procesos en puertos
# ========================================
Write-Host ""
Write-Host "🔪 Paso 4: Liberando puertos..." -ForegroundColor Yellow

# Matar puerto 8020 (Backend)
& "$PSScriptRoot\backend\kill-port.ps1" -Port 8020

# Matar puerto 5173 (Vite)
& "$PSScriptRoot\frontend\kill-port.ps1" -Port 5173

# Matar puerto 3020 (Frontend build - por si acaso)
& "$PSScriptRoot\frontend\kill-port.ps1" -Port 3020

# ========================================
# 5. Iniciar Backend y Frontend
# ========================================
Write-Host ""
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Green

# Iniciar backend en una nueva ventana
Write-Host "📡 Iniciando Backend en http://localhost:8020..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -Command cd '$PSScriptRoot\backend'; npm start" -NoNewWindow $false

# Iniciar frontend en una nueva ventana
Write-Host "🌐 Iniciando Frontend en http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -Command cd '$PSScriptRoot\frontend'; npm run dev" -NoNewWindow $false

Write-Host ""
Write-Host "✅ Servicios iniciados exitosamente!" -ForegroundColor Green
Write-Host "   • Backend:  http://localhost:8020" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: localhost:5452" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Yellow
Read-Host