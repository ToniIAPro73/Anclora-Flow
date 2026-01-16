-- Dataset sintético para Anclora Flow - VERSIÓN FINAL CORREGIDA
DO $$
DECLARE
    demo_user_id UUID;
    client1 UUID; client2 UUID; client3 UUID; client4 UUID; client5 UUID;
    proj1 UUID; proj2 UUID; proj3 UUID; proj4 UUID; proj5 UUID;
    inv1 UUID; inv2 UUID; inv3 UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@anclora.test' LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario demo no encontrado';
    END IF;

    -- Limpiar datos
    DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = demo_user_id);
    DELETE FROM invoices WHERE user_id = demo_user_id;
    DELETE FROM expenses WHERE user_id = demo_user_id;
    DELETE FROM budgets WHERE user_id = demo_user_id;
    DELETE FROM subscriptions WHERE user_id = demo_user_id;
    DELETE FROM projects WHERE user_id = demo_user_id;
    DELETE FROM clients WHERE user_id = demo_user_id;
    
    -- Clientes
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'TechCorp Solutions S.L.', 'contacto@techcorp.es', 'B12345678', NOW(), NOW()) RETURNING id INTO client1;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Innovate Digital Agency', 'info@innovatedigital.com', 'B23456789', NOW(), NOW()) RETURNING id INTO client2;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Green Energy Consulting', 'admin@greenenergy.es', 'B34567890', NOW(), NOW()) RETURNING id INTO client3;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'DataFlow Analytics', 'contact@dataflow.io', 'B45678901', NOW(), NOW()) RETURNING id INTO client4;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'CloudFirst Technologies', 'hello@cloudfirst.tech', 'B56789012', NOW(), NOW()) RETURNING id INTO client5;

    -- Proyectos
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, 'Plataforma E-commerce', 'in_progress', 45000.00, NOW(), NOW()) RETURNING id INTO proj1;
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client2, 'Campaña Digital Q1 2026', 'completed', 28000.00, NOW(), NOW()) RETURNING id INTO proj2;
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client3, 'Auditoría Energética', 'in_progress', 15000.00, NOW(), NOW()) RETURNING id INTO proj3;
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client4, 'Dashboard Analytics', 'planning', 32000.00, NOW(), NOW()) RETURNING id INTO proj4;
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client5, 'Migración Cloud AWS', 'in_progress', 55000.00, NOW(), NOW()) RETURNING id INTO proj5;

    -- Facturas
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, proj1, 'FAC-2026-0001', NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', 'paid', 8000.00, 21.00, 1680.00, 9680.00, NOW(), NOW()) RETURNING id INTO inv1;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client2, proj2, 'FAC-2026-0002', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 'sent', 9500.00, 21.00, 1995.00, 11495.00, NOW(), NOW()) RETURNING id INTO inv2;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client3, proj3, 'FAC-2026-0003', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'draft', 5000.00, 21.00, 1050.00, 6050.00, NOW(), NOW()) RETURNING id INTO inv3;

    -- Items de factura
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, vat_percentage, amount, created_at) VALUES
    (gen_random_uuid(), inv1, 'Desarrollo Frontend - React + TypeScript', 40, 85.00, 21.00, 3400.00, NOW()),
    (gen_random_uuid(), inv1, 'Desarrollo Backend - Node.js + PostgreSQL', 35, 90.00, 21.00, 3150.00, NOW()),
    (gen_random_uuid(), inv1, 'Consultoría y Análisis', 15, 120.00, 21.00, 1800.00, NOW()),
    (gen_random_uuid(), inv2, 'Gestión de campaña en redes sociales', 50, 75.00, 21.00, 3750.00, NOW()),
    (gen_random_uuid(), inv2, 'Creación de contenido multimedia', 30, 95.00, 21.00, 2850.00, NOW()),
    (gen_random_uuid(), inv2, 'Análisis y reporting', 20, 110.00, 21.00, 2200.00, NOW()),
    (gen_random_uuid(), inv3, 'Análisis de instalaciones', 25, 100.00, 21.00, 2500.00, NOW()),
    (gen_random_uuid(), inv3, 'Informe de optimización', 20, 125.00, 21.00, 2500.00, NOW());

    -- Gastos
    INSERT INTO expenses (id, user_id, description, amount, category, expense_date, vendor, is_deductible, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Suscripción GitHub Teams', 89.00, 'software', NOW() - INTERVAL '25 days', 'GitHub Inc.', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'AWS Cloud Services', 234.50, 'infrastructure', NOW() - INTERVAL '20 days', 'Amazon Web Services', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Licencias JetBrains', 149.00, 'software', NOW() - INTERVAL '18 days', 'JetBrains s.r.o.', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Material de oficina', 67.80, 'office_supplies', NOW() - INTERVAL '15 days', 'Office Depot', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Comida con cliente', 125.00, 'meals', NOW() - INTERVAL '12 days', 'Restaurante La Terraza', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Dominio y SSL', 45.00, 'infrastructure', NOW() - INTERVAL '10 days', 'Namecheap', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Formación React Advanced', 299.00, 'training', NOW() - INTERVAL '8 days', 'Udemy', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Transporte taxi', 28.50, 'transport', NOW() - INTERVAL '5 days', 'Cabify', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Suscripción Figma', 45.00, 'software', NOW() - INTERVAL '3 days', 'Figma Inc.', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Café oficina', 42.30, 'office_supplies', NOW() - INTERVAL '1 day', 'Mercadona', false, NOW(), NOW());

    -- Suscripciones
    INSERT INTO subscriptions (id, user_id, client_id, project_id, name, amount, billing_cycle, status, start_date, next_billing_date, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, proj1, 'Mantenimiento E-commerce', 1200.00, 'monthly', 'active', NOW() - INTERVAL '3 months', NOW() + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, client3, proj3, 'Monitorización Energética', 500.00, 'monthly', 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, client5, proj5, 'Soporte Cloud AWS', 1500.00, 'monthly', 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', NOW(), NOW());

    -- Presupuestos (usando month como DATE y actual_amount)
    INSERT INTO budgets (id, user_id, category, month, planned_amount, actual_amount, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'software', '2026-01-01', 500.00, 283.00, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'infrastructure', '2026-01-01', 300.00, 279.50, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'office_supplies', '2026-01-01', 150.00, 110.10, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'meals', '2026-01-01', 200.00, 125.00, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'transport', '2026-01-01', 100.00, 28.50, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'training', '2026-01-01', 400.00, 299.00, NOW(), NOW());

    RAISE NOTICE '✅ Dataset cargado exitosamente para demo@anclora.test';
    RAISE NOTICE '   - 5 clientes';
    RAISE NOTICE '   - 5 proyectos';
    RAISE NOTICE '   - 3 facturas con 8 items';
    RAISE NOTICE '   - 10 gastos';
    RAISE NOTICE '   - 3 suscripciones activas';
    RAISE NOTICE '   - 6 presupuestos para enero 2026';
    -- Nuevos Clientes (Ampliación)
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Global Logistics SA', 'facturacion@global-logistics.com', 'A09876543', NOW(), NOW()) RETURNING id INTO client1;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Farmacia Central', 'pedidos@farmaciacentral.net', 'E11223344', NOW(), NOW()) RETURNING id INTO client2;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Consultora Jurídica Pérez', 'info@consultorajuridica.com', 'B99887766', NOW(), NOW()) RETURNING id INTO client3;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Startup Incubator Lab', 'hello@incubatorlab.io', 'B55443322', NOW(), NOW()) RETURNING id INTO client4;
    INSERT INTO clients (id, user_id, name, email, nif_cif, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Restaurantes Unidos SL', 'admin@restaurantesunidos.es', 'B66778899', NOW(), NOW()) RETURNING id INTO client5;

    -- Nuevos Proyectos y Facturas asociadas
    -- Proyecto 1 (Global Logistics)
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, 'Sistema de Tracking GPS', 'in_progress', 65000.00, NOW(), NOW()) RETURNING id INTO proj1;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, proj1, 'FAC-2026-0004', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'sent', 12000.00, 21.00, 2520.00, 14520.00, NOW(), NOW());

    -- Proyecto 2 (Farmacia Central)
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client2, 'E-commerce Farmacéutico', 'completed', 18500.00, NOW(), NOW()) RETURNING id INTO proj2;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client2, proj2, 'FAC-2026-0005', NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'paid', 18500.00, 21.00, 3885.00, 22385.00, NOW(), NOW());

    -- Proyecto 3 (Consultora Jurídica Pérez)
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client3, 'Digitalización Documental', 'planning', 9500.00, NOW(), NOW()) RETURNING id INTO proj3;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client3, proj3, 'FAC-2026-0006', NOW(), NOW() + INTERVAL '30 days', 'draft', 3000.00, 21.00, 630.00, 3630.00, NOW(), NOW());

    -- Proyecto 4 (Startup Incubator)
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client4, 'Mentoring Tecnológico', 'on_hold', 12000.00, NOW(), NOW()) RETURNING id INTO proj4;

    -- Proyecto 5 (Restaurantes Unidos)
    INSERT INTO projects (id, user_id, client_id, name, status, budget, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client5, 'App de Pedidos Móvil', 'in_progress', 24000.00, NOW(), NOW()) RETURNING id INTO proj5;
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, total, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client5, proj5, 'FAC-2026-0007', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 'pending', 8000.00, 21.00, 1680.00, 9680.00, NOW(), NOW());

    -- Más Gastos Variados
    INSERT INTO expenses (id, user_id, description, amount, category, expense_date, vendor, is_deductible, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'Billete AVE Madrid-Barcelona', 145.50, 'transport', NOW() - INTERVAL '4 days', 'Renfe', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Cena equipo cierre Q4', 350.00, 'meals', NOW() - INTERVAL '1 week', 'Restaurante El Bulli', false, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Publicidad LinkedIn Ads', 500.00, 'advertising', NOW() - INTERVAL '15 days', 'LinkedIn Ireland', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Limpieza oficina', 120.00, 'office_supplies', NOW() - INTERVAL '2 days', 'Limpiezas Express', true, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'Seguro Responsabilidad Civil', 250.00, 'insurance', NOW() - INTERVAL '25 days', 'Mapfre', true, NOW(), NOW());

    -- Nuevas Suscripciones
    INSERT INTO subscriptions (id, user_id, client_id, project_id, name, amount, billing_cycle, status, start_date, next_billing_date, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, client1, proj1, 'Soporte GPS 24/7', 2500.00, 'monthly', 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, null, null, 'Adobe Creative Cloud', 65.00, 'monthly', 'active', NOW() - INTERVAL '6 months', NOW() + INTERVAL '5 days', NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, null, null, 'Slack Pro', 35.00, 'monthly', 'active', NOW() - INTERVAL '1 year', NOW() + INTERVAL '2 weeks', NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, client5, proj5, 'Mantenimiento App', 850.00, 'monthly', 'paused', NOW() - INTERVAL '2 months', NOW() + INTERVAL '1 month', NOW(), NOW());

    -- Presupuestos para el mes siguiente (Comparativa)
    INSERT INTO budgets (id, user_id, category, month, planned_amount, actual_amount, created_at, updated_at) VALUES
    (gen_random_uuid(), demo_user_id, 'training', '2026-02-01', 300.00, 0.00, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'software', '2026-02-01', 550.00, 0.00, NOW(), NOW()),
    (gen_random_uuid(), demo_user_id, 'advertising', '2026-02-01', 1000.00, 0.00, NOW(), NOW());

    RAISE NOTICE '✅ Dataset AMPLÍADO cargado exitosamente para demo@anclora.test';
END $$;
