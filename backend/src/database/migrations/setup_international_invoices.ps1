# Script para configurar facturas internacionales con datos de prueba
# 1. Ejecuta la migración de campos internacionales
# 2. Crea clientes y facturas de prueba con diferentes casuísticas

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SETUP: Facturas Internacionales + Verifactu" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot
$migrationFile = "002_add_international_invoice_fields.sql"
$testDataFile = "create_test_invoices.sql"

# ========================================
# PASO 1: Ejecutar migración de campos internacionales
# ========================================

Write-Host "PASO 1: Migración de campos internacionales" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

$migrationPath = Join-Path $scriptDir $migrationFile

if (!(Test-Path $migrationPath)) {
    Write-Host "✗ Error: No se encuentra $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verificando Docker..." -ForegroundColor White
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker no está corriendo. Inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker OK`n" -ForegroundColor Green

Write-Host "🚀 Ejecutando migración..." -ForegroundColor Cyan
$migration = Get-Content $migrationPath -Raw
$migration | docker exec -i anclora-postgres psql -U postgres -d anclora_flow

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n✗ Error en la migración" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Migración completada`n" -ForegroundColor Green

# ========================================
# PASO 2: Crear datos de prueba
# ========================================

Write-Host "PASO 2: Creación de datos de prueba" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

$testDataPath = Join-Path $scriptDir $testDataFile

if (!(Test-Path $testDataPath)) {
    Write-Host "✗ Error: No se encuentra $testDataFile" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Creando clientes y facturas de prueba..." -ForegroundColor Cyan
$testData = Get-Content $testDataPath -Raw
$testData | docker exec -i anclora-postgres psql -U postgres -d anclora_flow

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Datos de prueba creados`n" -ForegroundColor Green
} else {
    Write-Host "✗ Error al crear datos de prueba" -ForegroundColor Red
    exit 1
}

# ========================================
# PASO 3: Verificar datos creados
# ========================================

Write-Host "PASO 3: Verificación de datos" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

Write-Host "📊 Clientes creados:" -ForegroundColor Cyan
$clients = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
    SELECT
        name,
        country,
        client_type,
        CASE
            WHEN client_type = 'national' THEN '🇪🇸'
            WHEN client_type = 'eu' THEN '🇪🇺'
            WHEN client_type = 'international' THEN '🌍'
        END as flag
    FROM clients
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
    ORDER BY client_type, name;
"
Write-Host $clients

Write-Host "`n📋 Facturas creadas:" -ForegroundColor Cyan
$invoices = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
    SELECT
        i.invoice_number,
        c.name as cliente,
        i.operation_type,
        i.total,
        i.vat_amount as iva,
        i.status
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.invoice_number LIKE 'FAC-2025-%'
    ORDER BY i.issue_date;
"
Write-Host $invoices

Write-Host "`n📈 Estadísticas por tipo:" -ForegroundColor Cyan
$stats = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
    SELECT
        operation_type as tipo,
        COUNT(*) as facturas,
        TO_CHAR(SUM(total), '999,999.99') as total_facturado,
        TO_CHAR(SUM(vat_amount), '999,999.99') as total_iva,
        CASE
            WHEN operation_type = 'national' THEN '🇪🇸 Nacional'
            WHEN operation_type = 'intra_eu' THEN '🇪🇺 Intracom.'
            WHEN operation_type = 'export' THEN '🌍 Exportación'
        END as descripcion
    FROM invoices
    WHERE invoice_number LIKE 'FAC-2025-%'
    GROUP BY operation_type
    ORDER BY operation_type;
"
Write-Host $stats

# ========================================
# RESUMEN FINAL
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📝 Datos creados:" -ForegroundColor White
Write-Host "   • 6 clientes de prueba" -ForegroundColor Gray
Write-Host "     - 1 cliente nacional (España)" -ForegroundColor Gray
Write-Host "     - 3 clientes UE (Francia, Alemania, Italia)" -ForegroundColor Gray
Write-Host "     - 2 clientes internacionales (USA, UK)" -ForegroundColor Gray
Write-Host ""
Write-Host "   • 7 facturas de prueba" -ForegroundColor Gray
Write-Host "     - 2 facturas nacionales (con IVA 21%)" -ForegroundColor Gray
Write-Host "     - 3 facturas intracomunitarias (sin IVA)" -ForegroundColor Gray
Write-Host "     - 2 facturas exportación (sin IVA)" -ForegroundColor Gray
Write-Host ""
Write-Host "   • 2 proyectos de ejemplo`n" -ForegroundColor Gray

Write-Host "🎯 Casuísticas cubiertas:" -ForegroundColor White
Write-Host "   ✅ Nacional con IVA 21%" -ForegroundColor Green
Write-Host "   ✅ Nacional con IVA + IRPF 15%" -ForegroundColor Green
Write-Host "   ✅ Intracomunitaria servicios (inversión sujeto pasivo)" -ForegroundColor Green
Write-Host "   ✅ Intracomunitaria bienes (inversión sujeto pasivo)" -ForegroundColor Green
Write-Host "   ✅ Exportación servicios (exenta)" -ForegroundColor Green
Write-Host "   ✅ Exportación bienes con DUA (exenta)" -ForegroundColor Green
Write-Host "   ✅ Facturas en EUR, USD, GBP`n" -ForegroundColor Green

Write-Host "ℹ️  Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Accede a http://localhost:5173" -ForegroundColor White
Write-Host "   2. Login: demo@ancloraflow.com / demo123" -ForegroundColor White
Write-Host "   3. Ve a Ingresos & Facturas" -ForegroundColor White
Write-Host "   4. Verás 7 facturas con diferentes casuísticas" -ForegroundColor White
Write-Host "   5. Prueba registrar cada una en Verifactu`n" -ForegroundColor White

Write-Host "📚 Documentación Verifactu:" -ForegroundColor Cyan
Write-Host "   • Nacional (código 01): IVA español aplicable" -ForegroundColor Gray
Write-Host "   • Intracomunitaria (código 02): Inversión sujeto pasivo" -ForegroundColor Gray
Write-Host "   • Exportación (código 03): Exenta de IVA`n" -ForegroundColor Gray

Write-Host "✨ Todas las facturas están listas para Verifactu`n" -ForegroundColor Green
