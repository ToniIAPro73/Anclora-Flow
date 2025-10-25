# Script para configurar el usuario demo
# Agrega la columna nif si no existe y crea/actualiza el usuario demo

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔧 Configurando Usuario Demo" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que PostgreSQL esté corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Cyan
$postgresRunning = docker ps --filter "name=anclora-postgres" --format "{{.Names}}" 2>$null

if ($postgresRunning -ne "anclora-postgres") {
    Write-Host "❌ PostgreSQL no está corriendo" -ForegroundColor Red
    Write-Host "   Inicia PostgreSQL primero:" -ForegroundColor Yellow
    Write-Host "   docker start anclora-postgres" -ForegroundColor White
    exit 1
}

Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
Write-Host ""

# Paso 1: Agregar columna nif si no existe
Write-Host "📝 Paso 1: Agregando columna 'nif' a tabla users..." -ForegroundColor Cyan
docker exec anclora-postgres psql -U postgres -d anclora_flow -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS nif VARCHAR(20);" 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Columna 'nif' agregada (o ya existía)" -ForegroundColor Green
} else {
    Write-Host "❌ Error al agregar columna 'nif'" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Insertar/actualizar usuario demo
Write-Host "👤 Paso 2: Creando/actualizando usuario demo..." -ForegroundColor Cyan
$sqlCommand = @"
INSERT INTO users (id, email, name, password_hash, nif, auth_provider, language, theme)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@ancloraflow.com',
    'Usuario Demo',
    '\$2b\$10\$f84.n1jsCMZnFHRBU8uXXueQxu0TNT1Sm9HN8EyerXUQ2XQWY58ii',
    '12345678A',
    'local',
    'es',
    'light'
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    nif = EXCLUDED.nif;
"@

$result = docker exec anclora-postgres psql -U postgres -d anclora_flow -c $sqlCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Usuario demo creado/actualizado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear usuario demo:" -ForegroundColor Red
    Write-Host "   $result" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Paso 3: Verificar que el usuario existe
Write-Host "🔍 Paso 3: Verificando usuario demo..." -ForegroundColor Cyan
$verification = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "SELECT email, name, nif FROM users WHERE email='demo@ancloraflow.com';" 2>&1

if ($verification -match "demo@ancloraflow.com") {
    Write-Host "✅ Usuario demo verificado correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host $verification
} else {
    Write-Host "❌ No se pudo verificar el usuario demo" -ForegroundColor Red
    Write-Host "   $verification" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Usuario Demo Configurado" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📧 Email:      demo@ancloraflow.com" -ForegroundColor Cyan
Write-Host "🔑 Contraseña: demo123" -ForegroundColor Cyan
Write-Host "🆔 NIF:        12345678A" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximo paso:" -ForegroundColor Yellow
Write-Host "   Ejecuta: .\login-demo.ps1" -ForegroundColor White
Write-Host ""
