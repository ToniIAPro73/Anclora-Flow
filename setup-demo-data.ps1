# Script para crear datos de prueba en la base de datos
# Crea clientes, proyectos y facturas de ejemplo

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 Configuración de Datos de Prueba" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que PostgreSQL esté corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Cyan
$pgRunning = docker ps --filter "name=anclora-postgres" --filter "status=running" --format "{{.Names}}"
if (-not $pgRunning) {
    Write-Host "❌ El contenedor de PostgreSQL no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta: .\start-all.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
Write-Host ""

# SQL para crear datos de prueba
$sql = @"
-- Usuario demo ID
DO \$\$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    client1_id UUID := uuid_generate_v4();
    client2_id UUID := uuid_generate_v4();
    client3_id UUID := uuid_generate_v4();
    project1_id UUID := uuid_generate_v4();
    project2_id UUID := uuid_generate_v4();
    invoice1_id UUID := uuid_generate_v4();
    invoice2_id UUID := uuid_generate_v4();
    invoice3_id UUID := uuid_generate_v4();
BEGIN
    -- Insertar clientes de prueba
    INSERT INTO clients (id, user_id, name, email, phone, nif_cif, address, city, postal_code, country, is_active)
    VALUES
        (client1_id, demo_user_id, 'Acme Corporation', 'contacto@acme.es', '+34 912 345 678', 'B12345678', 'Calle Mayor 123', 'Madrid', '28001', 'España', true),
        (client2_id, demo_user_id, 'Tech Solutions SL', 'info@techsolutions.es', '+34 933 456 789', 'B87654321', 'Avenida Diagonal 456', 'Barcelona', '08008', 'España', true),
        (client3_id, demo_user_id, 'Innovate Labs', 'hola@innovatelabs.es', '+34 955 123 456', 'B11223344', 'Calle Sierpes 789', 'Sevilla', '41001', 'España', true)
    ON CONFLICT DO NOTHING;

    -- Insertar proyectos de prueba
    INSERT INTO projects (id, user_id, client_id, name, description, status, budget, start_date, color)
    VALUES
        (project1_id, demo_user_id, client1_id, 'Desarrollo Web Corporativo', 'Sitio web con CMS personalizado', 'active', 15000.00, CURRENT_DATE - INTERVAL '30 days', '#3B82F6'),
        (project2_id, demo_user_id, client2_id, 'App Móvil iOS/Android', 'Aplicación nativa multiplataforma', 'active', 25000.00, CURRENT_DATE - INTERVAL '60 days', '#10B981')
    ON CONFLICT DO NOTHING;

    -- Insertar facturas de prueba
    -- Factura 1: Pagada
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, payment_method, payment_date)
    VALUES
        (invoice1_id, demo_user_id, client1_id, project1_id,
         'FAC-2025-001',
         CURRENT_DATE - INTERVAL '45 days',
         CURRENT_DATE - INTERVAL '15 days',
         'paid',
         5000.00, 21.00, 1050.00, 15.00, 750.00, 5300.00,
         'bank_transfer',
         CURRENT_DATE - INTERVAL '10 days')
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Líneas de factura 1
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
    VALUES
        (invoice1_id, 'Desarrollo Frontend React', 40, 'hours', 75.00, 21.00, 3000.00),
        (invoice1_id, 'Diseño UI/UX', 20, 'hours', 60.00, 21.00, 1200.00),
        (invoice1_id, 'Configuración servidor', 8, 'hours', 100.00, 21.00, 800.00)
    ON CONFLICT DO NOTHING;

    -- Factura 2: Pendiente
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total)
    VALUES
        (invoice2_id, demo_user_id, client2_id, project2_id,
         'FAC-2025-002',
         CURRENT_DATE - INTERVAL '15 days',
         CURRENT_DATE + INTERVAL '15 days',
         'sent',
         8500.00, 21.00, 1785.00, 15.00, 1275.00, 9010.00)
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Líneas de factura 2
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
    VALUES
        (invoice2_id, 'Desarrollo Backend API REST', 60, 'hours', 85.00, 21.00, 5100.00),
        (invoice2_id, 'Integración servicios externos', 25, 'hours', 90.00, 21.00, 2250.00),
        (invoice2_id, 'Testing y QA', 15, 'hours', 50.00, 21.00, 750.00),
        (invoice2_id, 'Documentación técnica', 8, 'hours', 50.00, 21.00, 400.00)
    ON CONFLICT DO NOTHING;

    -- Factura 3: Borrador
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total)
    VALUES
        (invoice3_id, demo_user_id, client3_id, NULL,
         'FAC-2025-003',
         CURRENT_DATE,
         CURRENT_DATE + INTERVAL '30 days',
         'draft',
         3200.00, 21.00, 672.00, 15.00, 480.00, 3392.00)
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Líneas de factura 3
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
    VALUES
        (invoice3_id, 'Consultoría técnica', 16, 'hours', 120.00, 21.00, 1920.00),
        (invoice3_id, 'Auditoría de seguridad', 8, 'hours', 160.00, 21.00, 1280.00)
    ON CONFLICT DO NOTHING;

END \$\$;
"@

# Guardar SQL en archivo temporal
$sqlFile = [System.IO.Path]::GetTempFileName()
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📝 Insertando datos de prueba..." -ForegroundColor Cyan

# Copiar archivo SQL al contenedor
docker cp $sqlFile anclora-postgres:/tmp/demo-data.sql | Out-Null

# Ejecutar SQL
$result = docker exec anclora-postgres psql -U postgres -d anclora_flow -f /tmp/demo-data.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Datos de prueba creados exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Datos creados:" -ForegroundColor Cyan
    Write-Host "   • 3 Clientes de prueba" -ForegroundColor White
    Write-Host "   • 2 Proyectos activos" -ForegroundColor White
    Write-Host "   • 3 Facturas (1 pagada, 1 enviada, 1 borrador)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Ahora puedes ver las facturas en el módulo de Facturas/Ingresos" -ForegroundColor Green
} else {
    Write-Host "❌ Error al insertar datos:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Yellow
    exit 1
}

# Limpiar archivo temporal
Remove-Item $sqlFile

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Configuración completada" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
