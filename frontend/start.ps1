# Script para iniciar el frontend de Anclora Flow
# Mata automáticamente cualquier proceso en los puertos 3020 y 5173 antes de iniciar

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎨 Iniciando Anclora Flow Frontend" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Matar proceso en puerto 3020 si existe
& "$PSScriptRoot\kill-port.ps1" -Port 3020

# Matar proceso en puerto 5173 (Vite dev server) si existe
& "$PSScriptRoot\kill-port.ps1" -Port 5173

Write-Host ""
Write-Host "📦 Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host ""

# Iniciar el servidor
npm run dev
