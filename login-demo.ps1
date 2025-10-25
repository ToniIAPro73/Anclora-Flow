# Script para hacer login automático con el usuario demo
# Esto es útil para desarrollo y pruebas

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔐 Login Automático - Usuario Demo" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Credenciales del usuario demo
$email = "demo@ancloraflow.com"
$password = "demo123"

Write-Host "📧 Email: $email" -ForegroundColor Yellow
Write-Host "🔑 Contraseña: $password" -ForegroundColor Yellow
Write-Host ""

# Verificar que el backend esté corriendo
Write-Host "🔍 Verificando backend..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8020/api/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend no está corriendo en http://localhost:8020" -ForegroundColor Red
    Write-Host "   Por favor, inicia el backend primero:" -ForegroundColor Yellow
    Write-Host "   cd backend; .\start.ps1" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔐 Iniciando sesión..." -ForegroundColor Cyan

# Hacer login
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8020/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $token = $response.token
    $user = $response.user

    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "👤 Usuario:" -ForegroundColor Cyan
    Write-Host "   Nombre: $($user.name)" -ForegroundColor White
    Write-Host "   Email:  $($user.email)" -ForegroundColor White
    if ($user.nif) {
        Write-Host "   NIF:    $($user.nif)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "🔑 Token JWT generado:" -ForegroundColor Cyan
    Write-Host "   $token" -ForegroundColor Gray
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ Token guardado en el portapapeles" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Abre el navegador en http://localhost:5173" -ForegroundColor White
    Write-Host "   2. Abre DevTools (F12) > Console" -ForegroundColor White
    Write-Host "   3. Pega este comando:" -ForegroundColor White
    Write-Host ""
    Write-Host "   localStorage.setItem('auth_token', '$token');" -ForegroundColor Cyan
    Write-Host "   localStorage.setItem('user_data', JSON.stringify(" + ($user | ConvertTo-Json -Compress) + "));" -ForegroundColor Cyan
    Write-Host "   location.reload();" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   O simplemente recarga la página y ya estarás logueado." -ForegroundColor White
    Write-Host ""

    # Copiar token al portapapeles
    $token | Set-Clipboard
    Write-Host "✅ Token copiado al portapapeles" -ForegroundColor Green

} catch {
    Write-Host "❌ Error al hacer login:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "   Credenciales incorrectas" -ForegroundColor Yellow
            Write-Host "   Verifica que el usuario demo esté en la base de datos" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "   Endpoint no encontrado. Verifica la URL del backend" -ForegroundColor Yellow
        } else {
            Write-Host "   Código de error: $statusCode" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "🔧 Solución:" -ForegroundColor Cyan
    Write-Host "   1. Verifica que el backend esté corriendo" -ForegroundColor White
    Write-Host "   2. Reinicializa la base de datos:" -ForegroundColor White
    Write-Host "      docker cp backend/src/database/init.sql anclora-postgres:/tmp/init.sql" -ForegroundColor Gray
    Write-Host "      docker exec anclora-postgres psql -U postgres -d anclora_flow -f /tmp/init.sql" -ForegroundColor Gray
    exit 1
}
