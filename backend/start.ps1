# Script para iniciar el backend de Anclora Flow
# Mata automáticamente cualquier proceso en el puerto 8020 antes de iniciar

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Iniciando Anclora Flow Backend" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Matar proceso en puerto 8020 si existe
& "$PSScriptRoot\kill-port.ps1" -Port 8020

Write-Host ""
Write-Host "📦 Iniciando servidor en puerto 8020..." -ForegroundColor Green
Write-Host ""

# Iniciar el servidor
npm start
