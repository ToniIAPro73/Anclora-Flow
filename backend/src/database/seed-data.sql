-- ================================================================
-- DATASET SINTÉTICO COMPLETO - ANCLORA FLOW
-- 5-10 registros por tabla con datos realistas en español
-- SIEMPRE usa el usuario: pmi140979@gmail.com
-- ================================================================

SET session_replication_role = 'replica';

-- Limpiar todas las tablas
TRUNCATE TABLE customer_subscriptions CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE clients CASCADE;

SET session_replication_role = 'origin';

-- ================================================================
-- INSERTAR DATOS COMPLETOS
-- ================================================================
DO $$
DECLARE
    v_user_id UUID;
    v_client_ids UUID[];
    v_project_ids UUID[];
    v_invoice_ids UUID[];
BEGIN
    -- Obtener user_id ESPECÍFICO
    SELECT id INTO v_user_id FROM users WHERE email = 'pmi140979@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario pmi140979@gmail.com no encontrado';
    END IF;
    
    -- ===== 8 CLIENTES =====
    v_client_ids := ARRAY[
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
    ];
    
    INSERT INTO clients (id, user_id, name, business_name, email, phone, nif_cif, city, country, is_active, created_at, updated_at) VALUES
    (v_client_ids[1], v_user_id, 'María García López', 'García Consulting SL', 'maria@garciaconsulting.es', '+34915234567', 'B87654321', 'Madrid', 'España', true, NOW() - INTERVAL '180 days', NOW()),
    (v_client_ids[2], v_user_id, 'Carlos Rodríguez', 'Innovatech Solutions SL', 'carlos@innovatech.es', '+34932456789', 'B12345678', 'Barcelona', 'España', true, NOW() - INTERVAL '150 days', NOW()),
    (v_client_ids[3], v_user_id, 'Ana Martínez', 'Digital Marketing PRO', 'ana@digitalmarketing.es', '+34963789012', 'B98765432', 'Valencia', 'España', true, NOW() - INTERVAL '120 days', NOW()),
    (v_client_ids[4], v_user_id, 'Javier Fernández', 'Fernández Arquitectura SA', 'javier@fernandezarq.com', '+34944567890', 'A56789123', 'Bilbao', 'España', true, NOW() - INTERVAL '90 days', NOW()),
    (v_client_ids[5], v_user_id, 'Laura Pérez', 'Torres Logística SL', 'laura@torreslog.es', '+34952345678', 'B45678901', 'Málaga', 'España', true, NOW() - INTERVAL '60 days', NOW()),
    (v_client_ids[6], v_user_id, 'Miguel Torres', 'Ecommerce Solutions ES', 'miguel@ecommerce-es.com', '+34976234567', 'B23456789', 'Zaragoza', 'España', true, NOW() - INTERVAL '45 days', NOW()),
    (v_client_ids[7], v_user_id, 'Isabel Moreno', 'Hostelería Premium SL', 'isabel@hosteleria.es', '+34981456789', 'B67890123', 'Santiago', 'España', true, NOW() - INTERVAL '30 days', NOW()),
    (v_client_ids[8], v_user_id, 'Roberto Sánchez', 'Tech Startup BCN', 'roberto@techstartup.es', '+34931234567', 'B34567890', 'Barcelona', 'España', true, NOW() - INTERVAL '20 days', NOW());
    
    -- ===== 6 PROYECTOS =====
    v_project_ids := ARRAY[
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
    ];
    
    INSERT INTO projects (id, user_id, client_id, name, description, status, budget, created_at, updated_at) VALUES
    (v_project_ids[1], v_user_id, v_client_ids[1], 'Web Corporativa', 'Desarrollo web responsive', 'completed', 8500.00, NOW() - INTERVAL '150 days', NOW()),
    (v_project_ids[2], v_user_id, v_client_ids[2], 'App Móvil iOS', 'Aplicación nativa iOS', 'in_progress', 15000.00, NOW() - INTERVAL '90 days', NOW()),
    (v_project_ids[3], v_user_id, v_client_ids[3], 'Campaña Marketing', 'Automatización marketing digital', 'completed', 6500.00, NOW() - INTERVAL '120 days', NOW()),
    (v_project_ids[4], v_user_id, v_client_ids[4], 'Portal Clientes', 'Portal gestión proyectos', 'planning', 12000.00, NOW() - INTERVAL '30 days', NOW()),
    (v_project_ids[5], v_user_id, v_client_ids[5], 'Sistema Tracking', 'Seguimiento envíos tiempo real', 'in_progress', 18000.00, NOW() - INTERVAL '45 days', NOW()),
    (v_project_ids[6], v_user_id, v_client_ids[6], 'Tienda Online', 'Ecommerce completo', 'active', 9500.00, NOW() - INTERVAL '50 days', NOW());
    
    -- ===== 8 FACTURAS CON ITEMS =====
    v_invoice_ids := ARRAY[
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
        gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
    ];
    
    -- Factura 1: PAGADA
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, created_at, updated_at)
    VALUES (v_invoice_ids[1], v_user_id, v_client_ids[1], v_project_ids[1], 'FAC-2025-001', '2025-09-15', '2025-10-15', 'paid', 8500.00, 21.00, 1785.00, 15.00, 1275.00, 9010.00, 'EUR', NOW() - INTERVAL '120 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_percentage, amount, created_at) VALUES
    (gen_random_uuid(), v_invoice_ids[1], 'Diseño UI/UX', 40, 65.00, 21.00, 2600.00, NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), v_invoice_ids[1], 'Desarrollo Frontend', 60, 60.00, 21.00, 3600.00, NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), v_invoice_ids[1], 'Desarrollo Backend', 35, 70.00, 21.00, 2450.00, NOW() - INTERVAL '120 days');
    
    -- Factura 2: ENVIADA
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, created_at, updated_at)
    VALUES (v_invoice_ids[2], v_user_id, v_client_ids[2], v_project_ids[2], 'FAC-2025-002', '2025-11-20', '2025-12-20', 'sent', 6000.00, 21.00, 1260.00, 15.00, 900.00, 6360.00, 'EUR', NOW() - INTERVAL '60 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_percentage, amount, created_at) VALUES
    (gen_random_uuid(), v_invoice_ids[2], 'Análisis requisitos', 30, 70.00, 21.00, 2100.00, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_invoice_ids[2], 'Desarrollo módulo', 50, 65.00, 21.00, 3250.00, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_invoice_ids[2], 'Integración API', 10, 65.00, 21.00, 650.00, NOW() - INTERVAL '60 days');
    
    -- Factura 3: PARCIALMENTE PAGADA
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, created_at, updated_at)
    VALUES (v_invoice_ids[3], v_user_id, v_client_ids[3], v_project_ids[3], 'FAC-2025-003', '2025-12-10', '2026-01-10', 'sent', 10000.00, 21.00, 2100.00, 15.00, 1500.00, 10600.00, 'EUR', NOW() - INTERVAL '40 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_percentage, amount, created_at) VALUES
    (gen_random_uuid(), v_invoice_ids[3], 'Desarrollo app iOS', 80, 75.00, 21.00, 6000.00, NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), v_invoice_ids[3], 'Desarrollo Android', 50, 70.00, 21.00, 3500.00, NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), v_invoice_ids[3], 'Testing', 10, 50.00, 21.00, 500.00, NOW() - INTERVAL '40 days');
    
    -- Factura 4-8 (más facturas)
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, created_at, updated_at)
    VALUES 
    (v_invoice_ids[4], v_user_id, v_client_ids[4], 'FAC-2025-004', '2025-12-05', '2026-01-05', 'sent', 3200.00, 21.00, 672.00, 15.00, 480.00, 3392.00, 'EUR', NOW() - INTERVAL '45 days', NOW()),
    (v_invoice_ids[5], v_user_id, v_client_ids[5], 'FAC-2025-005', '2025-10-20', '2025-11-20', 'overdue', 7500.00, 21.00, 1575.00, 15.00, 1125.00, 7950.00, 'EUR', NOW() - INTERVAL '90 days', NOW()),
    (v_invoice_ids[6], v_user_id, v_client_ids[6], 'FAC-2026-001', '2026-01-15', '2026-02-15', 'draft', 5400.00, 21.00, 1134.00, 15.00, 810.00, 5724.00, 'EUR', NOW() - INTERVAL '5 days', NOW()),
    (v_invoice_ids[7], v_user_id, v_client_ids[7], 'FAC-2025-006', '2025-11-30', '2025-12-30', 'sent', 4500.00, 21.00, 945.00, 15.00, 675.00, 4770.00, 'EUR', NOW() - INTERVAL '50 days', NOW()),
    (v_invoice_ids[8], v_user_id, v_client_ids[8], 'FAC-2025-007', '2025-12-15', '2026-01-15', 'paid', 2800.00, 21.00, 588.00, 15.00, 420.00, 2968.00, 'EUR', NOW() - INTERVAL '35 days', NOW());
    
    -- Items para facturas restantes
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_percentage, amount, created_at) VALUES
    (gen_random_uuid(), v_invoice_ids[4], 'Consultoría digital', 20, 80.00, 21.00, 1600.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_invoice_ids[4], 'Configuración HubSpot', 16, 60.00, 21.00, 960.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_invoice_ids[5], 'Desarrollo tracking', 60, 70.00, 21.00, 4200.00, NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), v_invoice_ids[6], 'Análisis portal', 24, 75.00, 21.00, 1800.00, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_invoice_ids[7], 'Optimización SEO', 30, 65.00, 21.00, 1950.00, NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), v_invoice_ids[8], 'Sistema reservas', 35, 60.00, 21.00, 2100.00, NOW() - INTERVAL '35 days');
    
    -- ===== 10 GASTOS =====
    INSERT INTO expenses (id, user_id, category, description, amount, expense_date, payment_method, vendor, is_deductible, created_at, updated_at) VALUES
    (gen_random_uuid(), v_user_id, 'software', 'Adobe Creative Cloud anual', 654.11, '2025-11-15', 'card', 'Adobe Systems', true, NOW() - INTERVAL '65 days', NOW()),
    (gen_random_uuid(), v_user_id, 'software', 'GitHub Team diciembre', 44.00, '2025-12-01', 'card', 'GitHub Inc.', true, NOW() - INTERVAL '50 days', NOW()),
    (gen_random_uuid(), v_user_id, 'office', 'Dominio .es renovación', 12.99, '2025-10-20', 'card', 'GoDaddy', true, NOW() - INTERVAL '90 days', NOW()),
    (gen_random_uuid(), v_user_id, 'equipment', 'Monitor Dell 27"', 389.99, '2025-09-05', 'card', 'PC Componentes', true, NOW() - INTERVAL '135 days', NOW()),
    (gen_random_uuid(), v_user_id, 'internet', 'Fibra óptica diciembre', 45.90, '2025-12-01', 'bank_transfer', 'Movistar', true, NOW() - INTERVAL '50 days', NOW()),
    (gen_random_uuid(), v_user_id, 'supplies', 'Material oficina', 78.45, '2025-11-10', 'cash', 'Papelería Central', true, NOW() - INTERVAL '70 days', NOW()),
    (gen_random_uuid(), v_user_id, 'training', 'Curso React Udemy', 94.99, '2025-10-15', 'card', 'Udemy', true, NOW() - INTERVAL '95 days', NOW()),
    (gen_random_uuid(), v_user_id, 'travel', 'AVE Madrid-Barcelona', 156.80, '2025-11-25', 'card', 'Renfe', true, NOW() - INTERVAL '55 days', NOW()),
    (gen_random_uuid(), v_user_id, 'software', 'DigitalOcean VPS', 24.00, '2025-12-01', 'card', 'DigitalOcean', true, NOW() - INTERVAL '50 days', NOW()),
    (gen_random_uuid(), v_user_id, 'professional_services', 'Gestoría trimestral', 150.00, '2025-12-20', 'bank_transfer', 'Gestoría López', true, NOW() - INTERVAL '30 days', NOW());
    
    -- ===== 5 PAGOS =====
    INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, notes, created_at, updated_at) VALUES
    (gen_random_uuid(), v_user_id, v_invoice_ids[1], 9010.00, '2025-10-10', 'bank_transfer', 'Pago completo', NOW() - INTERVAL '100 days', NOW()),
    (gen_random_uuid(), v_user_id, v_invoice_ids[3], 5300.00, '2025-12-15', 'bank_transfer', 'Anticipo 50%', NOW() - INTERVAL '35 days', NOW()),
    (gen_random_uuid(), v_user_id, v_invoice_ids[8], 2968.00, '2026-01-10', 'bank_transfer', 'Pago completo', NOW() - INTERVAL '8 days', NOW()),
    (gen_random_uuid(), v_user_id, v_invoice_ids[1], 4500.00, '2025-09-20', 'bank_transfer', 'Primer pago', NOW() - INTERVAL '115 days', NOW()),
    (gen_random_uuid(), v_user_id, v_invoice_ids[1], 4510.00, '2025-10-05', 'bank_transfer', 'Segundo pago', NOW() - INTERVAL '105 days', NOW());
    
    -- ===== 10 SUBSCRIPTIONS (Gastos - lo que YO pago) =====
    INSERT INTO subscriptions (id, user_id, service_name, provider, amount, billing_frequency, next_billing_date, status, category, created_at, updated_at) VALUES
    (gen_random_uuid(), v_user_id, 'GitHub Team', 'GitHub Inc.', 44.00, 'monthly', NOW() + INTERVAL '15 days', 'active', 'software', NOW() - INTERVAL '180 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Adobe Creative Cloud', 'Adobe', 54.51, 'monthly', NOW() + INTERVAL '20 days', 'active', 'software', NOW() - INTERVAL '365 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Notion Team', 'Notion Labs', 10.00, 'monthly', NOW() + INTERVAL '12 days', 'active', 'productivity', NOW() - INTERVAL '200 days', NOW()),
    (gen_random_uuid(), v_user_id, 'DigitalOcean VPS', 'DigitalOcean', 24.00, 'monthly', NOW() + INTERVAL '8 days', 'active', 'hosting', NOW() - INTERVAL '300 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Figma Professional', 'Figma Inc.', 12.00, 'monthly', NOW() + INTERVAL '18 days', 'active', 'software', NOW() - INTERVAL '150 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Vercel Pro', 'Vercel Inc.', 20.00, 'monthly', NOW() + INTERVAL '25 days', 'active', 'hosting', NOW() - INTERVAL '90 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Grammarly Premium', 'Grammarly Inc.', 144.00, 'yearly', NOW() + INTERVAL '300 days', 'active', 'productivity', NOW() - INTERVAL '60 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Linear Pro', 'Linear B.V.', 15.00, 'monthly', NOW() + INTERVAL '22 days', 'active', 'productivity', NOW() - INTERVAL '45 days', NOW()),
    (gen_random_uuid(), v_user_id, 'ChatGPT Plus', 'OpenAI', 20.00, 'monthly', NULL, 'paused', 'software', NOW() - INTERVAL '200 days', NOW()),
    (gen_random_uuid(), v_user_id, 'Spotify Premium', 'Spotify', 10.99, 'monthly', NOW() + INTERVAL '10 days', 'active', 'other', NOW() - INTERVAL '400 days', NOW());
    
    -- ===== 6 CUSTOMER_SUBSCRIPTIONS (Ingresos - lo que ME pagan) =====
    INSERT INTO customer_subscriptions (
        id, user_id, client_id, plan_name, plan_code, amount, billing_frequency,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, total_revenue, invoices_count, created_at, updated_at
    ) VALUES
    (gen_random_uuid(), v_user_id, v_client_ids[1], 'Pro', 'anclora-pro', 79.00, 'monthly',
        NOW() - INTERVAL '210 days', NOW() - INTERVAL '30 days', NOW(), NOW() + INTERVAL '1 day',
        'active', 474.00, 6, NOW() - INTERVAL '210 days', NOW()),
    (gen_random_uuid(), v_user_id, v_client_ids[2], 'Business', 'anclora-business', 890.00, 'yearly',
        NOW() - INTERVAL '365 days', NOW() - INTERVAL '365 days', NOW(), NOW() + INTERVAL '1 day',
        'active', 890.00, 1, NOW() - INTERVAL '365 days', NOW()),
    (gen_random_uuid(), v_user_id, v_client_ids[3], 'Pro', 'anclora-pro', 79.00, 'monthly',
        NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days',
        'trial', 0, 0, NOW() - INTERVAL '20 days', NOW()),
    (gen_random_uuid(), v_user_id, v_client_ids[4], 'Basic', 'anclora-basic', 39.00, 'monthly',
        NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days',
        'trial', 0, 0, NOW() - INTERVAL '12 days', NOW()),
    (gen_random_uuid(), v_user_id, v_client_ids[5], 'Pro', 'anclora-pro', 210.00, 'quarterly',
        NOW() - INTERVAL '125 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days', NOW() + INTERVAL '5 days',
        'active', 210.00, 1, NOW() - INTERVAL '125 days', NOW()),
    (gen_random_uuid(), v_user_id, v_client_ids[6], 'Basic', 'anclora-basic', 39.00, 'monthly',
        NOW() - INTERVAL '180 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', NULL,
        'cancelled', 273.00, 7, NOW() - INTERVAL '180 days', NOW());
    
    -- ===== 3 BUDGETS =====
    INSERT INTO budgets (id, user_id, category, month, planned_amount, actual_amount, created_at, updated_at) VALUES
    (gen_random_uuid(), v_user_id, 'Marketing', DATE_TRUNC('month', NOW()), 1500.00, 980.50, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, 'Software', DATE_TRUNC('month', NOW()), 500.00, 450.00, NOW(), NOW()),
    (gen_random_uuid(), v_user_id, 'Formación', DATE_TRUNC('month', NOW()), 300.00, 94.99, NOW(), NOW());
    
    RAISE NOTICE '✅ Dataset completo cargado:';
    RAISE NOTICE '   - 8 clientes';
    RAISE NOTICE '   - 6 proyectos';
    RAISE NOTICE '   - 8 facturas con items';
    RAISE NOTICE '   - 10 gastos';
    RAISE NOTICE '   - 5 pagos';
    RAISE NOTICE '   - 10 subscriptions (gastos)';
    RAISE NOTICE '   - 6 customer_subscriptions (ingresos)';
    RAISE NOTICE '   - 3 budgets';
END $$;
