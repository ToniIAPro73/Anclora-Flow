-- Script para crear facturas de prueba con diferentes casuísticas
-- Incluye clientes nacionales, UE e internacionales con facturas correspondientes

-- ========================================
-- PASO 1: CREAR CLIENTES DE PRUEBA
-- ========================================

-- Cliente 1: ESPAÑA (Nacional)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Acme Technologies España SL',
    'info@acme.es',
    'B87654321',
    'Calle Gran Vía 123',
    'Madrid',
    '28013',
    'España',
    'ES',
    'national',
    'nif'
) ON CONFLICT (id) DO NOTHING;

-- Cliente 2: FRANCIA (UE - Inversión sujeto pasivo)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type, vat_validated)
VALUES (
    'c1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'TechCorp France SARL',
    'contact@techcorp.fr',
    'FR12345678901',
    '15 Avenue des Champs-Élysées',
    'Paris',
    '75008',
    'Francia',
    'FR',
    'eu',
    'vat_id',
    true
) ON CONFLICT (id) DO NOTHING;

-- Cliente 3: ALEMANIA (UE - Inversión sujeto pasivo)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type, vat_validated)
VALUES (
    'c1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Innovation GmbH',
    'info@innovation.de',
    'DE987654321',
    'Hauptstraße 45',
    'Berlin',
    '10115',
    'Alemania',
    'DE',
    'eu',
    'vat_id',
    true
) ON CONFLICT (id) DO NOTHING;

-- Cliente 4: ESTADOS UNIDOS (Exportación)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type)
VALUES (
    'c1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Silicon Valley Corp',
    'contact@svcorp.com',
    'US123456789',
    '1234 Tech Street',
    'San Francisco',
    'CA 94102',
    'Estados Unidos',
    'US',
    'international',
    'tax_number'
) ON CONFLICT (id) DO NOTHING;

-- Cliente 5: REINO UNIDO (Exportación - post-Brexit)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type)
VALUES (
    'c1000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'British Tech Ltd',
    'hello@britishtech.co.uk',
    'GB123456789',
    '10 Downing Street',
    'London',
    'SW1A 2AA',
    'Reino Unido',
    'GB',
    'international',
    'tax_number'
) ON CONFLICT (id) DO NOTHING;

-- Cliente 6: ITALIA (UE - Inversión sujeto pasivo)
INSERT INTO clients (id, user_id, name, email, nif_cif, address, city, postal_code, country, country_code, client_type, tax_id_type, vat_validated)
VALUES (
    'c1000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Milano Digital SRL',
    'info@milanodigital.it',
    'IT11223344556',
    'Via Roma 88',
    'Milano',
    '20121',
    'Italia',
    'IT',
    'eu',
    'vat_id',
    true
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PASO 2: CREAR PROYECTOS ASOCIADOS
-- ========================================

-- Proyecto para cliente español
INSERT INTO projects (id, user_id, client_id, name, description, status, budget, start_date)
VALUES (
    'p1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Desarrollo Web Acme',
    'Desarrollo de aplicación web corporativa',
    'active',
    15000.00,
    '2025-01-01'
) ON CONFLICT (id) DO NOTHING;

-- Proyecto para cliente francés
INSERT INTO projects (id, user_id, client_id, name, description, status, budget, start_date)
VALUES (
    'p1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'Consulting TechCorp France',
    'Servicios de consultoría técnica',
    'active',
    25000.00,
    '2025-02-01'
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PASO 3: CREAR FACTURAS DE PRUEBA
-- ========================================

-- FACTURA 1: NACIONAL (España) - CON IVA 21%
INSERT INTO invoices (
    id, user_id, client_id, project_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total,
    operation_type, verifactu_operation_code, goods_or_services, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    'FAC-2025-001',
    '2025-10-01',
    '2025-11-01',
    'sent',
    5000.00,
    21.00,
    1050.00,
    6050.00,
    'national',
    '01',
    'services',
    'Servicios de desarrollo web - Q4 2025'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura nacional
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000001', 'Desarrollo frontend React', 80, 'hours', 50.00, 21.00, 4000.00),
    ('i1000000-0000-0000-0000-000000000001', 'Integración API REST', 20, 'hours', 50.00, 21.00, 1000.00)
ON CONFLICT DO NOTHING;

-- FACTURA 2: INTRACOMUNITARIA (Francia) - SIN IVA (Inversión sujeto pasivo)
INSERT INTO invoices (
    id, user_id, client_id, project_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total,
    operation_type, verifactu_operation_code, reverse_charge,
    client_vat_number, destination_country_code, goods_or_services,
    vat_exemption_reason, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'p1000000-0000-0000-0000-000000000002',
    'FAC-2025-002',
    '2025-10-05',
    '2025-11-05',
    'sent',
    8000.00,
    0.00,
    0.00,
    8000.00,
    'intra_eu',
    '02',
    true,
    'FR12345678901',
    'FR',
    'services',
    'Operación intracomunitaria exenta - Art. 25 Ley 37/1992',
    'Consultoría técnica - Inversión del sujeto pasivo'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura UE
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000002', 'Consultoría arquitectura software', 40, 'hours', 120.00, 0.00, 4800.00),
    ('i1000000-0000-0000-0000-000000000002', 'Auditoría de seguridad', 32, 'hours', 100.00, 0.00, 3200.00)
ON CONFLICT DO NOTHING;

-- FACTURA 3: INTRACOMUNITARIA (Alemania) - BIENES - SIN IVA
INSERT INTO invoices (
    id, user_id, client_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total,
    operation_type, verifactu_operation_code, reverse_charge,
    client_vat_number, destination_country_code, goods_or_services,
    vat_exemption_reason, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'FAC-2025-003',
    '2025-10-10',
    '2025-11-10',
    'paid',
    3500.00,
    0.00,
    0.00,
    3500.00,
    'intra_eu',
    '02',
    true,
    'DE987654321',
    'DE',
    'goods',
    'Entrega intracomunitaria exenta - Art. 25 Ley 37/1992',
    'Venta de equipamiento informático'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura Alemania
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000003', 'Servidor Dell PowerEdge R740', 2, 'units', 1500.00, 0.00, 3000.00),
    ('i1000000-0000-0000-0000-000000000003', 'Configuración e instalación', 1, 'fixed', 500.00, 0.00, 500.00)
ON CONFLICT DO NOTHING;

-- FACTURA 4: EXPORTACIÓN (Estados Unidos) - SIN IVA
INSERT INTO invoices (
    id, user_id, client_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total, currency,
    operation_type, verifactu_operation_code,
    destination_country_code, goods_or_services,
    vat_exemption_reason, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000004',
    'FAC-2025-004',
    '2025-10-15',
    '2025-11-15',
    'sent',
    12000.00,
    0.00,
    0.00,
    12000.00,
    'USD',
    'export',
    '03',
    'US',
    'services',
    'Exportación de servicios exenta - Art. 21 Ley 37/1992',
    'Desarrollo de software - Servicios digitales prestados en USA'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura USA
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000004', 'Custom software development', 100, 'hours', 100.00, 0.00, 10000.00),
    ('i1000000-0000-0000-0000-000000000004', 'Project management', 20, 'hours', 100.00, 0.00, 2000.00)
ON CONFLICT DO NOTHING;

-- FACTURA 5: EXPORTACIÓN (Reino Unido) - SIN IVA - BIENES
INSERT INTO invoices (
    id, user_id, client_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total, currency,
    operation_type, verifactu_operation_code,
    destination_country_code, goods_or_services,
    vat_exemption_reason, export_document_number, export_date, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000005',
    'FAC-2025-005',
    '2025-10-20',
    '2025-11-20',
    'paid',
    7500.00,
    0.00,
    0.00,
    7500.00,
    'GBP',
    'export',
    '03',
    'GB',
    'goods',
    'Exportación de bienes exenta - Art. 21 Ley 37/1992',
    'DUA-2025-123456',
    '2025-10-22',
    'Exportación de hardware - DUA adjunto'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura UK
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000005', 'MacBook Pro 16" M3 Max', 5, 'units', 1400.00, 0.00, 7000.00),
    ('i1000000-0000-0000-0000-000000000005', 'Envío internacional express', 1, 'fixed', 500.00, 0.00, 500.00)
ON CONFLICT DO NOTHING;

-- FACTURA 6: NACIONAL (España) - CON IRPF Y IVA
INSERT INTO invoices (
    id, user_id, client_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total,
    operation_type, verifactu_operation_code, goods_or_services, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'FAC-2025-006',
    '2025-10-25',
    '2025-11-25',
    'pending',
    4000.00,
    21.00,
    840.00,
    15.00,
    600.00,
    4240.00,
    'national',
    '01',
    'services',
    'Servicios profesionales con retención IRPF'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura con IRPF
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000006', 'Consultoría estratégica IT', 40, 'hours', 100.00, 21.00, 4000.00)
ON CONFLICT DO NOTHING;

-- FACTURA 7: INTRACOMUNITARIA (Italia) - MIXTA (Servicios digitales)
INSERT INTO invoices (
    id, user_id, client_id, invoice_number,
    issue_date, due_date, status,
    subtotal, vat_percentage, vat_amount, total,
    operation_type, verifactu_operation_code, reverse_charge,
    client_vat_number, destination_country_code, goods_or_services,
    vat_exemption_reason, notes
)
VALUES (
    'i1000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000006',
    'FAC-2025-007',
    '2025-10-28',
    '2025-11-28',
    'draft',
    15000.00,
    0.00,
    0.00,
    15000.00,
    'intra_eu',
    '02',
    true,
    'IT11223344556',
    'IT',
    'services',
    'Prestación de servicios UE exenta - Art. 25 Ley 37/1992',
    'Desarrollo de plataforma e-commerce - Cliente B2B italiano'
) ON CONFLICT (id) DO NOTHING;

-- Items de factura Italia
INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
VALUES
    ('i1000000-0000-0000-0000-000000000007', 'Backend API development', 80, 'hours', 120.00, 0.00, 9600.00),
    ('i1000000-0000-0000-0000-000000000007', 'Frontend React development', 60, 'hours', 90.00, 0.00, 5400.00)
ON CONFLICT DO NOTHING;

-- ========================================
-- RESUMEN DE FACTURAS CREADAS
-- ========================================

-- Vista de resumen
SELECT
    i.invoice_number,
    c.name as client_name,
    c.country,
    i.operation_type,
    i.total,
    i.vat_amount,
    i.status,
    CASE
        WHEN i.operation_type = 'national' THEN '🇪🇸 Nacional - Con IVA'
        WHEN i.operation_type = 'intra_eu' THEN '🇪🇺 Intracomunitaria - Sin IVA (Inversión)'
        WHEN i.operation_type = 'export' THEN '🌍 Exportación - Sin IVA'
        ELSE 'Otro'
    END as tipo_verifactu
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.invoice_number LIKE 'FAC-2025-%'
ORDER BY i.issue_date;

-- Estadísticas por tipo
SELECT
    operation_type,
    COUNT(*) as num_facturas,
    SUM(total) as total_facturado,
    SUM(vat_amount) as total_iva
FROM invoices
WHERE invoice_number LIKE 'FAC-2025-%'
GROUP BY operation_type
ORDER BY operation_type;
