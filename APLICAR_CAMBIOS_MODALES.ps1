# ============================================
# Script para aplicar cambios en modales
# Anclora Flow - Estandarización de modales
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  APLICAR CAMBIOS EN MODALES" -ForegroundColor Cyan
Write-Host "  Anclora Flow" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto del proyecto
if (-not (Test-Path "frontend/src/pages")) {
    Write-Host "ERROR: No se encontró el directorio frontend/src/pages" -ForegroundColor Red
    Write-Host "Por favor, ejecuta este script desde la raíz del proyecto Anclora Flow" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ejemplo:" -ForegroundColor White
    Write-Host "  cd C:\ruta\a\tu\proyecto\anclora-flow" -ForegroundColor Gray
    Write-Host "  .\APLICAR_CAMBIOS_MODALES.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "IMPORTANTE: Este script copia los archivos desde el directorio actual." -ForegroundColor Yellow
Write-Host "Asegúrate de que este script esté en la raíz de tu proyecto." -ForegroundColor Yellow
Write-Host ""

# Archivos a actualizar (relativo a la raíz del proyecto)
$archivos = @(
    @{
        ruta = "frontend/src/pages/expenses.js"
        descripcion = "Modales de gastos"
    },
    @{
        ruta = "frontend/src/pages/invoices-with-api.js"
        descripcion = "Modales de facturas"
    },
    @{
        ruta = "frontend/src/pages/subscriptions.js"
        descripcion = "Formularios de suscripciones"
    },
    @{
        ruta = "frontend/src/pages/budget.js"
        descripcion = "Formularios de presupuesto"
    },
    @{
        ruta = "frontend/src/styles/colors.css"
        descripcion = "Estilos globales"
    }
)

# Verificar que todos los archivos existen
Write-Host "Verificando archivos a modificar..." -ForegroundColor Yellow
$todosExisten = $true
foreach ($archivo in $archivos) {
    if (Test-Path $archivo.ruta) {
        Write-Host "  ✓ Encontrado: $($archivo.ruta)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No encontrado: $($archivo.ruta)" -ForegroundColor Red
        $todosExisten = $false
    }
}

if (-not $todosExisten) {
    Write-Host ""
    Write-Host "ERROR: Algunos archivos no se encontraron" -ForegroundColor Red
    Write-Host "Verifica que estés en el directorio correcto del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Todos los archivos encontrados correctamente" -ForegroundColor Green
Write-Host ""

# Crear backup
Write-Host "Creando backup de archivos actuales..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backup_modales_$timestamp"

try {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "  Directorio de backup creado: $backupDir" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: No se pudo crear el directorio de backup" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

foreach ($archivo in $archivos) {
    try {
        $nombreArchivo = Split-Path $archivo.ruta -Leaf
        Copy-Item $archivo.ruta "$backupDir\$nombreArchivo" -Force
        Write-Host "  ✓ Backup: $nombreArchivo" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error en backup de: $($archivo.ruta)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Los archivos modificados están en este mismo directorio." -ForegroundColor Cyan
Write-Host "Este script mostrará los cambios que se han realizado." -ForegroundColor Cyan
Write-Host ""

# Mostrar resumen de cambios
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE CAMBIOS APLICADOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. MODALES DE FACTURAS (invoices-with-api.js)" -ForegroundColor White
Write-Host "   • Modal ver: 900px, max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Modal editar/nueva: 950px, max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Botones siempre visibles en footer fijo" -ForegroundColor Gray
Write-Host "   • Sin scroll innecesario en sección de conceptos" -ForegroundColor Gray
Write-Host ""

Write-Host "2. MODALES DE GASTOS (expenses.js)" -ForegroundColor White
Write-Host "   • Modal crear/editar: 900px, max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Modal ver: 700px, max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Botones siempre visibles en footer fijo" -ForegroundColor Gray
Write-Host ""

Write-Host "3. FORMULARIOS DE SUSCRIPCIONES (subscriptions.js)" -ForegroundColor White
Write-Host "   • Formulario sidebar: max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Header y footer fijos, scroll solo en contenido" -ForegroundColor Gray
Write-Host ""

Write-Host "4. FORMULARIOS DE PRESUPUESTO (budget.js)" -ForegroundColor White
Write-Host "   • Formulario sidebar: max-height 95vh, estructura flex" -ForegroundColor Gray
Write-Host "   • Header y footer fijos, scroll solo en contenido" -ForegroundColor Gray
Write-Host ""

Write-Host "5. ESTILOS GLOBALES (colors.css)" -ForegroundColor White
Write-Host "   • Eliminados bordes en columna de acciones de tablas" -ForegroundColor Gray
Write-Host "   • Ajustes de espaciado para botones de acción" -ForegroundColor Gray
Write-Host ""

Write-Host "Backup guardado en: $backupDir" -ForegroundColor Yellow
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Los cambios YA están aplicados en tu proyecto" -ForegroundColor Green
Write-Host ""
Write-Host "2. Reinicia el servidor de desarrollo:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Abre la aplicación en el navegador y prueba:" -ForegroundColor White
Write-Host "   • Crear/editar facturas" -ForegroundColor Gray
Write-Host "   • Crear/editar gastos" -ForegroundColor Gray
Write-Host "   • Formularios de suscripciones" -ForegroundColor Gray
Write-Host "   • Formularios de presupuesto" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verifica que:" -ForegroundColor White
Write-Host "   ✓ Los modales son más grandes y cómodos" -ForegroundColor Gray
Write-Host "   ✓ Los botones están siempre visibles" -ForegroundColor Gray
Write-Host "   ✓ No hay scroll innecesario" -ForegroundColor Gray
Write-Host "   ✓ Las tablas tienen bordes limpios" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  REVERTIR CAMBIOS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si necesitas volver a la versión anterior:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Copy-Item '$backupDir\expenses.js' 'frontend\src\pages\' -Force" -ForegroundColor Gray
Write-Host "  Copy-Item '$backupDir\invoices-with-api.js' 'frontend\src\pages\' -Force" -ForegroundColor Gray
Write-Host "  Copy-Item '$backupDir\subscriptions.js' 'frontend\src\pages\' -Force" -ForegroundColor Gray
Write-Host "  Copy-Item '$backupDir\budget.js' 'frontend\src\pages\' -Force" -ForegroundColor Gray
Write-Host "  Copy-Item '$backupDir\colors.css' 'frontend\src\styles\' -Force" -ForegroundColor Gray
Write-Host ""

Write-Host "¡Listo! Los cambios en modales han sido aplicados exitosamente." -ForegroundColor Green
Write-Host ""
