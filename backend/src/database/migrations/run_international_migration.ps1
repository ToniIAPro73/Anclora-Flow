# Script para ejecutar la migración de soporte internacional
# Añade campos necesarios para facturas UE y exportación en Verifactu

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migración: Soporte Facturas Internacionales" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$migrationFile = "002_add_international_invoice_fields.sql"
$migrationPath = Join-Path $PSScriptRoot $migrationFile

# Verificar que el archivo existe
if (!(Test-Path $migrationPath)) {
    Write-Host "✗ Error: No se encuentra el archivo $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo de migración: $migrationFile" -ForegroundColor White
Write-Host "📍 Ruta: $migrationPath`n" -ForegroundColor Gray

# Verificar que Docker está corriendo
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker no está corriendo. Inicia Docker Desktop primero." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker está corriendo`n" -ForegroundColor Green

# Verificar que el contenedor de PostgreSQL existe
Write-Host "🔍 Verificando contenedor PostgreSQL..." -ForegroundColor Yellow
$containerExists = docker ps -a --filter "name=anclora-postgres" --format "{{.Names}}"
if (!$containerExists) {
    Write-Host "✗ El contenedor 'anclora-postgres' no existe." -ForegroundColor Red
    Write-Host "   Ejecuta 'docker-compose up -d' primero." -ForegroundColor Yellow
    exit 1
}

# Verificar que el contenedor está corriendo
$containerRunning = docker ps --filter "name=anclora-postgres" --format "{{.Names}}"
if (!$containerRunning) {
    Write-Host "⚠ El contenedor existe pero no está corriendo. Iniciándolo..." -ForegroundColor Yellow
    docker start anclora-postgres
    Start-Sleep -Seconds 3
}
Write-Host "✓ Contenedor PostgreSQL listo`n" -ForegroundColor Green

# Ejecutar migración
Write-Host "🚀 Ejecutando migración..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

$migration = Get-Content $migrationPath -Raw
$result = docker exec -i anclora-postgres psql -U postgres -d anclora_flow <<EOF
$migration
EOF

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "✓ Migración ejecutada exitosamente`n" -ForegroundColor Green

    # Verificar columnas añadidas
    Write-Host "🔍 Verificando cambios en la base de datos..." -ForegroundColor Yellow

    # Verificar columnas en clients
    Write-Host "`n📋 Nuevas columnas en tabla 'clients':" -ForegroundColor Cyan
    $clientColumns = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name IN ('client_type', 'tax_id_type', 'country_code', 'vat_validated')
        ORDER BY column_name;
    "
    Write-Host $clientColumns

    # Verificar columnas en invoices
    Write-Host "`n📋 Nuevas columnas en tabla 'invoices':" -ForegroundColor Cyan
    $invoiceColumns = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'invoices'
        AND column_name IN ('operation_type', 'vat_exemption_reason', 'reverse_charge',
                            'client_vat_number', 'verifactu_operation_code')
        ORDER BY column_name;
    "
    Write-Host $invoiceColumns

    # Mostrar resumen de clientes por tipo
    Write-Host "`n📊 Resumen de clientes por tipo:" -ForegroundColor Cyan
    $clientSummary = docker exec anclora-postgres psql -U postgres -d anclora_flow -c "
        SELECT
            client_type,
            COUNT(*) as total,
            COUNT(CASE WHEN vat_validated THEN 1 END) as validated
        FROM clients
        GROUP BY client_type
        ORDER BY client_type;
    "
    Write-Host $clientSummary

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "✅ Migración completada con éxito" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan

    Write-Host "📝 Resumen de cambios:" -ForegroundColor White
    Write-Host "   • Tabla 'clients': 4 columnas nuevas (client_type, tax_id_type, country_code, vat_validated)" -ForegroundColor Gray
    Write-Host "   • Tabla 'invoices': 8 columnas nuevas para operaciones internacionales" -ForegroundColor Gray
    Write-Host "   • Tabla 'invoice_items': 2 columnas nuevas" -ForegroundColor Gray
    Write-Host "   • Trigger automático para actualizar operation_type" -ForegroundColor Gray
    Write-Host "   • Vista: v_invoices_by_operation_type" -ForegroundColor Gray
    Write-Host "   • Clientes existentes actualizados automáticamente`n" -ForegroundColor Gray

    Write-Host "ℹ️  Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Actualizar modelos de datos en el backend" -ForegroundColor White
    Write-Host "   2. Modificar servicio Verifactu para operaciones internacionales" -ForegroundColor White
    Write-Host "   3. Actualizar frontend para mostrar/editar nuevos campos" -ForegroundColor White
    Write-Host "   4. Validar NIF-IVA con sistema VIES (opcional)`n" -ForegroundColor White

} else {
    Write-Host "`n─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "✗ Error al ejecutar la migración" -ForegroundColor Red
    Write-Host "Código de error: $LASTEXITCODE`n" -ForegroundColor Red
    exit 1
}
