# Script para forzar regeneración completa del CSS
# Este script eliminará los archivos compilados y caché para forzar a Vite a reconstruir

Write-Host "=== Limpieza de CSS compilado y caché ===" -ForegroundColor Cyan

# Paso 1: Eliminar directorio dist
Write-Host "`n[1/3] Eliminando directorio dist compilado..." -ForegroundColor Yellow
$distPath = "frontend\src\dist"
if (Test-Path $distPath) {
    Remove-Item -Recurse -Force $distPath
    Write-Host "✓ Directorio dist eliminado" -ForegroundColor Green
} else {
    Write-Host "⚠ Directorio dist no existe (ya estaba limpio)" -ForegroundColor Gray
}

# Paso 2: Eliminar caché de Vite
Write-Host "`n[2/3] Eliminando caché de Vite..." -ForegroundColor Yellow
$viteCachePath = "frontend\node_modules\.vite"
if (Test-Path $viteCachePath) {
    Remove-Item -Recurse -Force $viteCachePath
    Write-Host "✓ Caché de Vite eliminado" -ForegroundColor Green
} else {
    Write-Host "⚠ Caché de Vite no existe (ya estaba limpio)" -ForegroundColor Gray
}

# Paso 3: Instrucciones finales
Write-Host "`n[3/3] Limpieza completada" -ForegroundColor Green
Write-Host "`nAhora sigue estos pasos:" -ForegroundColor Cyan
Write-Host "1. Reinicia el servidor con: cd frontend && npm run dev"
Write-Host "2. Limpia el caché del navegador (Ctrl+Shift+Delete)"
Write-Host "3. Recarga la página con Ctrl+F5 (recarga forzada)"
Write-Host "`nEl CSS se regenerará con los colores correctos ✨" -ForegroundColor Green
