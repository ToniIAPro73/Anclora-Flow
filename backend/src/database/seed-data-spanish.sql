-- ================================================
-- SCRIPT DE LIMPIEZA Y DATOS SINTÉTICOS EN ESPAÑOL
-- Dataset completo para autónomos en España
-- ================================================

-- ============================================
-- PASO 1: LIMPIEZA DE DATOS EXISTENTES
-- ============================================

-- Desactivar temporalmente las restricciones de claves foráneas
SET session_replication_role = 'replica';

-- Limpiar todas las tablas en el orden correcto
TRUNCATE TABLE customer_subscriptions CASCADE;
TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE bank_accounts CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE activity_log CASCADE;
-- NO limpiamos users para mantener la cuenta del usuario actual

-- Reactivar las restricciones
SET session_replication_role = 'origin';

-- ============================================
-- PASO 2: INSERTAR DATOS SINTÉTICOS
-- ============================================

-- ===== CLIENTES ESPAÑOLES =====
INSERT INTO clients (id, user_id, name, business_name, nif_cif, email, phone, address, city, postal_code, country, is_active, created_at, updated_at) VALUES
-- Usuario actual (obtenemos el primer user_id disponible)
((SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'María García López', 'García Consulting SL', 'B87654321', 'maria.garcia@garciaconsulting.es', '+34 915 234 567', 'Calle Serrano 45, 3º A', 'Madrid', '28001', 'España', true, NOW() - INTERVAL '180 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Carlos Rodríguez Martín', 'Rodríguez & Asociados', 'B12345678', 'carlos@rodriguezasociados.es', '+34 932 456 789', 'Passeig de Gràcia 88', 'Barcelona', '08008', 'España', true, NOW() - INTERVAL '150 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Ana Martínez Sánchez', 'Innovatech Solutions SL', 'B98765432', 'ana.martinez@innovatech.es', '+34 963 789 012', 'Calle Colón 23', 'Valencia', '46004', 'España', true, NOW() - INTERVAL '120 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Javier Fernández', 'Fernández Arquitectura SA', 'A56789123', 'javier@fernandezarq.com', '+34 944 567 890', 'Gran Vía 65', 'Bilbao', '48011', 'España', true, NOW() - INTERVAL '90 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Laura Pérez Gil', 'Digital Marketing PRO', 'B34567890', 'laura.perez@digitalmarketingpro.es', '+34 954 123 456', 'Avenida de la Constitución 12', 'Sevilla', '41001', 'España', true, NOW() - INTERVAL '60 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Miguel Ángel Torres', 'Torres Logística SL', 'B45678901', 'miguel@torreslogistica.es', '+34 952 345 678', 'Calle Larios 8', 'Málaga', '29015', 'España', true, NOW() - INTERVAL '45 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Isabel Moreno', 'Ecommerce Solutions España', 'B23456789', 'isabel@ecommerce-es.com', '+34 976 234 567', 'Paseo Independencia 34', 'Zaragoza', '50004', 'España', true, NOW() - INTERVAL '30 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Roberto Sánchez', 'Hostelería Premium SL', 'B67890123', 'roberto@hosteleriapremium.es', '+34 981 456 789', 'Rúa do Franco 15', 'Santiago de Compostela', '15705', 'España', true, NOW() - INTERVAL '20 days', NOW());

-- ===== PROYECTOS =====
INSERT INTO projects (id, user_id, client_id, name, description, status, start_date, end_date, budget, created_at, updated_at) VALUES
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'García Consulting SL'), 'Desarrollo Web Corporativa', 'Desarrollar sitio web corporativo con diseño responsive y panel de administración', 'completed', '2025-09-01', '2025-11-30', 8500.00, NOW() - INTERVAL '150 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Rodríguez & Asociados'), 'Sistema CRM Personalizado', 'Implementación de CRM adaptado a las necesidades del despacho jurídico', 'in_progress', '2025-11-15', '2026-02-28', 15000.00, NOW() - INTERVAL '90 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Innovatech Solutions SL'), 'App Móvil iOS/Android', 'Desarrollo de aplicación móvil nativa para gestión de inventario', 'in_progress', '2025-12-01', '2026-03-31', 22000.00, NOW() - INTERVAL '60 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Fernández Arquitectura SA'), 'Portal de Clientes', 'Diseño e implementación de portal para gestión de proyectos arquitectónicos', 'planning', '2026-02-01', '2026-04-30', 12000.00, NOW() - INTERVAL '30 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Digital Marketing PRO'), 'Automatización Marketing', 'Implementación de workflows automatizados con HubSpot', 'completed', '2025-10-01', '2025-12-15', 6500.00, NOW() - INTERVAL '120 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Torres Logística SL'), 'Sistema de Tracking', 'Plataforma web para seguimiento de envíos en tiempo real', 'in_progress', '2025-12-15', '2026-02-28', 18000.00, NOW() - INTERVAL '45 days', NOW());

-- ===== CUENTAS BANCARIAS =====
INSERT INTO bank_accounts (id, user_id, bank_name, account_holder, iban, bic, account_type, currency, is_default, is_active, notes, created_at, updated_at) VALUES
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'BBVA', 'Tu Nombre Autónomo', 'ES91 0182 1234 5678 9012 3456', 'BBVAESMM', 'business', 'EUR', true, true, 'Cuenta principal para cobros', NOW() - INTERVAL '365 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Santander', 'Tu Nombre Autónomo', 'ES76 0049 9876 5432 1098 7654', 'BSCHESMM', 'business', 'EUR', false, true, 'Cuenta secundaria', NOW() - INTERVAL '200 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'CaixaBank', 'Tu Nombre Autónomo', 'ES12 2100 5678 1234 5678 9012', 'CAIXESBB', 'business', 'EUR', false, true, 'Cuenta para gastos', NOW() - INTERVAL '150 days', NOW());

-- ===== FACTURAS =====
-- Guardamos los IDs de clientes para usarlos en las facturas
DO $$
DECLARE
    v_user_id UUID;
    v_client_garcia UUID;
    v_client_rodriguez UUID;
    v_client_innovatech UUID;
    v_client_fernandez UUID;
    v_client_digital UUID;
    v_client_torres UUID;
    v_client_ecommerce UUID;
    v_client_hosteleria UUID;
    v_project_web UUID;
    v_project_crm UUID;
    v_project_app UUID;
    v_invoice_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO v_user_id FROM users WHERE email = 'pmi140979@gmail.com';
    SELECT id INTO v_client_garcia FROM clients WHERE business_name = 'García Consulting SL';
    SELECT id INTO v_client_rodriguez FROM clients WHERE business_name = 'Rodríguez & Asociados';
    SELECT id INTO v_client_innovatech FROM clients WHERE business_name = 'Innovatech Solutions SL';
    SELECT id INTO v_client_fernandez FROM clients WHERE business_name = 'Fernández Arquitectura SA';
    SELECT id INTO v_client_digital FROM clients WHERE business_name = 'Digital Marketing PRO';
    SELECT id INTO v_client_torres FROM clients WHERE business_name = 'Torres Logística SL';
   SELECT id INTO v_client_ecommerce FROM clients WHERE business_name = 'Ecommerce Solutions España';
    SELECT id INTO v_client_hosteleria FROM clients WHERE business_name = 'Hostelería Premium SL';
    
    SELECT id INTO v_project_web FROM projects WHERE name = 'Desarrollo Web Corporativa';
    SELECT id INTO v_project_crm FROM projects WHERE name = 'Sistema CRM Personalizado';
    SELECT id INTO v_project_app FROM projects WHERE name = 'App Móvil iOS/Android';

    -- Factura 1: Pagada completamente
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_garcia, v_project_web, '2025-001', '2025-09-15', '2025-10-15', 'paid', 8500.00, 21.00, 1785.00, 15.00, 1275.00, 9010.00, 'EUR', 9010.00, NOW() - INTERVAL '120 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Diseño UI/UX personalizado', 40, 'horas', 65.00, 21.00, 2600.00, NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), v_invoice_id, 'Desarrollo Frontend (React)', 60, 'horas', 60.00, 21.00, 3600.00, NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), v_invoice_id, 'Desarrollo Backend (Node.js)', 35, 'horas', 70.00, 21.00, 2450.00, NOW() - INTERVAL '120 days');

    -- Factura 2: Enviada, pendiente de pago
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_rodriguez, v_project_crm, '2025-002', '2025-11-20', '2025-12-20', 'sent', 6000.00, 21.00, 1260.00, 15.00, 900.00, 6360.00, 'EUR', 0.00, NOW() - INTERVAL '60 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Análisis de requisitos y diseño', 30, 'horas', 70.00, 21.00, 2100.00, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_invoice_id, 'Desarrollo módulo gestión clientes', 50, 'horas', 65.00, 21.00, 3250.00, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_invoice_id, 'Integración con sistemas existentes', 10, 'horas', 65.00, 21.00, 650.00, NOW() - INTERVAL '60 days');

    -- Factura 3: Pagada parcialmente
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_innovatech, v_project_app, '2025-003', '2025-12-10', '2026-01-10', 'sent', 10000.00, 21.00, 2100.00, 15.00, 1500.00, 10600.00, 'EUR', 5300.00, NOW() - INTERVAL '40 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Desarrollo app iOS nativa', 80, 'horas', 75.00, 21.00, 6000.00, NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), v_invoice_id, 'Desarrollo app Android nativa', 50, 'horas', 70.00, 21.00, 3500.00, NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), v_invoice_id, 'Testing y optimización', 10, 'horas', 50.00, 21.00, 500.00, NOW() - INTERVAL '40 days');

    -- Factura 4: Pendiente
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_digital, '2025-004', '2025-12-05', '2026-01-05', 'sent', 3200.00, 21.00, 672.00, 15.00, 480.00, 3392.00, 'EUR', 0.00, NOW() - INTERVAL '45 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Consultoría estratégica digital', 20, 'horas', 80.00, 21.00, 1600.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_invoice_id, 'Configuración HubSpot', 16, 'horas', 60.00, 21.00, 960.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_invoice_id, 'Capacitación equipo', 8, 'horas', 70.00, 21.00, 560.00, NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_invoice_id, 'Seguimiento y ajuste', 2, 'horas', 60.00, 21.00, 120.00, NOW() - INTERVAL '45 days');

    -- Factura 5: Vencida
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_torres, '2025-005', '2025-10-20', '2025-11-20', 'overdue', 7500.00, 21.00, 1575.00, 15.00, 1125.00, 7950.00, 'EUR', 0.00, NOW() - INTERVAL '90 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Desarrollo sistema de tracking', 60, 'horas', 70.00, 21.00, 4200.00, NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), v_invoice_id, 'Integración API transportistas', 30, 'horas', 75.00, 21.00, 2250.00, NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), v_invoice_id, 'Panel de administración', 15, 'horas', 70.00, 21.00, 1050.00, NOW() - INTERVAL '90 days');

    -- Factura 6: Borrador
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_fernandez, '2026-001', '2026-01-15', '2026-02-15', 'draft', 5400.00, 21.00, 1134.00, 15.00, 810.00, 5724.00, 'EUR', 0.00, NOW() - INTERVAL '5 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Análisis portal de clientes', 24, 'horas', 75.00, 21.00, 1800.00, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_invoice_id, 'Diseño arquitectura técnica', 30, 'horas', 80.00, 21.00, 2400.00, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_invoice_id, 'Prototipo funcional', 20, 'horas', 60.00, 21.00, 1200.00, NOW() - INTERVAL '5 days');

    -- Facturas adicionales
    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_ecommerce, '2025-006', '2025-11-30', '2025-12-30', 'sent', 4500.00, 21.00, 945.00, 15.00, 675.00, 4770.00, 'EUR', 0.00, NOW() - INTERVAL '50 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Optimización SEO tienda online', 30, 'horas', 65.00, 21.00, 1950.00, NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), v_invoice_id, 'Mejoras conversión checkout', 25, 'horas', 70.00, 21.00, 1750.00, NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), v_invoice_id, 'Integración pasarela de pago', 16, 'horas', 50.00, 21.00, 800.00, NOW() - INTERVAL '50 days');

    v_invoice_id := gen_random_uuid();
    INSERT INTO invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount, total, currency, paid_amount, created_at, updated_at)
    VALUES (v_invoice_id, v_user_id, v_client_hosteleria, '2025-007', '2025-12-15', '2026-01-15', 'paid', 2800.00, 21.00, 588.00, 15.00, 420.00, 2968.00, 'EUR', 2968.00, NOW() - INTERVAL '35 days', NOW());
    
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount, created_at)
    VALUES 
    (gen_random_uuid(), v_invoice_id, 'Sistema reservas online', 35, 'horas', 60.00, 21.00, 2100.00, NOW() - INTERVAL '35 days'),
    (gen_random_uuid(), v_invoice_id, 'Integración calendario disponibilidad', 10, 'horas', 70.00, 21.00, 700.00, NOW() - INTERVAL '35 days');

END $$;

-- ===== PAGOS =====
DO $$
DECLARE
    v_user_id UUID;
    v_invoice_pagada_1 UUID;
    v_invoice_parcial UUID;
    v_invoice_pagada_2 UUID;
    v_bank_bbva UUID;
    v_bank_santander UUID;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'pmi140979@gmail.com';
    SELECT id INTO v_invoice_pagada_1 FROM invoices WHERE invoice_number = '2025-001';
    SELECT id INTO v_invoice_parcial FROM invoices WHERE invoice_number = '2025-003';
    SELECT id INTO v_invoice_pagada_2 FROM invoices WHERE invoice_number = '2025-007';
    SELECT id INTO v_bank_bbva FROM bank_accounts WHERE bank_name = 'BBVA';
    SELECT id INTO v_bank_santander FROM bank_accounts WHERE bank_name = 'Santander';

    -- Pago completo factura 1
    INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_id, bank_account_id, status, reconciliation_date, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, v_invoice_pagada_1, 9010.00, '2025-10-10', 'bank_transfer', 'TRF-2025-001234', v_bank_bbva, 'reconciled', '2025-10-11', 'Pago recibido completo según factura', NOW() - INTERVAL '100 days', NOW());

    -- Pago parcial factura 3 (50% inicial)
    INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_id, bank_account_id, status, reconciliation_date, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, v_invoice_parcial, 5300.00, '2025-12-15', 'bank_transfer', 'TRF-2025-005678', v_bank_bbva, 'registered', NULL, 'Anticipo 50% - Pendiente resto al finalizar proyecto', NOW() - INTERVAL '35 days', NOW());

    -- Pago completo factura 7
    INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, transaction_id, bank_account_id, status, reconciliation_date, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, v_invoice_pagada_2, 2968.00, '2026-01-10', 'bank_transfer', 'TRF-2026-000123', v_bank_santander, 'reconciled', '2026-01-11', 'Pago recibido puntualmente', NOW() - INTERVAL '8 days', NOW());

    -- Pagos adicionales históricos
    INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, bank_account_id, status, reconciliation_date, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), v_user_id, v_invoice_pagada_1, 4500.00, '2025-09-20', 'bank_transfer', v_bank_bbva, 'reconciled', '2025-09-21', NOW() - INTERVAL '115 days', NOW()),
    (gen_random_uuid(), v_user_id, v_invoice_pagada_1, 4510.00, '2025-10-05', 'bank_transfer', v_bank_bbva, 'reconciled', '2025-10-06', NOW() - INTERVAL '105 days', NOW());

END $$;

-- ===== GASTOS (EXPENSES) =====
INSERT INTO expenses (id, user_id, category, description, amount, expense_date, payment_method, vendor, is_deductible, notes, created_at, updated_at) VALUES
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'software', 'Suscripción anual Adobe Creative Cloud', 654.11, '2025-11-15', 'card', 'Adobe Systems', true, 'Licencia completa para diseño', NOW() - INTERVAL '65 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'software', 'GitHub Team - Mes diciembre', 44.00, '2025-12-01', 'card', 'GitHub Inc.', true, 'Repositorios privados equipo', NOW() - INTERVAL '50 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'office', 'Dominio ancloraflow.es renovación anual', 12.99, '2025-10-20', 'card', 'GoDaddy', true, 'Dominio web portafolio', NOW() - INTERVAL '90 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'equipment', 'Monitor Dell UltraSharp 27"', 389.99, '2025-09-05', 'card', 'PC Componentes', true, 'Monitor adicional oficina', NOW() - INTERVAL '135 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'internet', 'Fibra óptica Movistar 600Mb - Diciembre', 45.90, '2025-12-01', 'bank_transfer', 'Movistar', true, 'Internet oficina - cuota mensual', NOW() - INTERVAL '50 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'supplies', 'Material oficina (papel, bolígrafos, carpetas)', 78.45, '2025-11-10', 'cash', 'Papelería Central', true, 'Compra trimestral', NOW() - INTERVAL '70 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'training', 'Curso Avanzado React y Next.js - Udemy', 94.99, '2025-10-15', 'card', 'Udemy', true, 'Formación continua', NOW() - INTERVAL '95 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'travel', 'Billete AVE Madrid-Barcelona ida/vuelta', 156.80, '2025-11-25', 'card', 'Renfe', true, 'Reunión cliente Rodríguez & Asociados', NOW() - INTERVAL '55 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'software', 'Hosting VPS Digital Ocean - Diciembre', 24.00, '2025-12-01', 'card', 'DigitalOcean', true, 'Servidor proyectos clientes', NOW() - INTERVAL '50 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'professional_services', 'Gestoría trimestral IVA y modelo 130', 150.00, '2025-12-20', 'bank_transfer', 'Gestoría López y Asociados', true, 'Asesoramiento fiscal trimestral', NOW() - INTERVAL '30 days', NOW());

-- ===== SUSCRIPCIONES DE CLIENTES (CUSTOMER_SUBSCRIPTIONS) - Ingresos Recurrentes =====
DO $$
DECLARE
    v_user_id UUID;
    v_client_garcia UUID;
    v_client_rodriguez UUID;
    v_client_innovatech UUID;
    v_client_digital UUID;
    v_client_torres UUID;
    v_client_ecommerce UUID;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = 'pmi140979@gmail.com';
    SELECT id INTO v_client_garcia FROM clients WHERE business_name = 'García Consulting SL';
    SELECT id INTO v_client_rodriguez FROM clients WHERE business_name = 'Rodríguez & Asociados';
    SELECT id INTO v_client_innovatech FROM clients WHERE business_name = 'Innovatech Solutions SL';
    SELECT id INTO v_client_digital FROM clients WHERE business_name = 'Digital Marketing PRO';
    SELECT id INTO v_client_torres FROM clients WHERE business_name = 'Torres Logística SL';
    SELECT id INTO v_client_ecommerce FROM clients WHERE business_name = 'Ecommerce Solutions España';

    -- Cliente 1: Plan Pro mensual - Trial convertido hace 6 meses
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, trial_days, trial_start_date, trial_end_date, trial_converted, trial_conversion_date,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, auto_send_invoice, total_revenue, invoices_count,
        payment_method, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_garcia, 'Pro', 'anclora-pro', 'Plan profesional con análisis avanzados',
        79.00, 'monthly',
        true, 30, NOW() - INTERVAL '210 days', NOW() - INTERVAL '180 days', true, NOW() - INTERVAL '180 days',
        NOW() - INTERVAL '210 days', NOW() - INTERVAL '30 days', NOW(), NOW() + INTERVAL '1 day',
        'active', true, true, 474.00, 6,
        'card', NOW() - INTERVAL '210 days', NOW()
    );

    -- Cliente 2: Plan Business anual - Activo desde hace 1 año (upgrade desde Pro)
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, auto_send_invoice, total_revenue, invoices_count,
        previous_plan_code, plan_changed_at, plan_change_type, discount_percentage, discount_end_date,
        payment_method, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_rodriguez, 'Business', 'anclora-business', 'Plan empresarial con soporte prioritario',
        890.00, 'yearly',
        false, NOW() - INTERVAL '365 days', NOW() - INTERVAL '365 days', NOW(), NOW() + INTERVAL '1 day',
        'active', true, true, 890.00, 1,
        'anclora-pro', NOW() - INTERVAL '300 days', 'upgrade', 10.00, NOW() + INTERVAL '30 days',
        'bank_transfer', NOW() - INTERVAL '365 days', NOW()
    );

    -- Cliente 3: Trial activo de 30 días - Empezó hace 20 días
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, trial_days, trial_start_date, trial_end_date, trial_converted,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, auto_send_invoice, total_revenue, invoices_count,
        notes, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_innovatech, 'Pro', 'anclora-pro', 'Plan profesional - En período de prueba',
        79.00, 'monthly',
        true, 30, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', false,
        NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days',
        'trial', true, false, 0, 0,
        'Cliente interesado en funciones de análisis fiscal', NOW() - INTERVAL '20 days', NOW()
    );

    -- Cliente 4: Plan Basic mensual - Trial crítico (expira en 2 días)
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, trial_days, trial_start_date, trial_end_date, trial_converted,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, total_revenue, invoices_count,
        notes, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_digital, 'Basic', 'anclora-basic', 'Plan básico - Funcionalidades core',
        39.00, 'monthly',
        true, 14, NOW() - INTERVAL '12 days', NOW() + INTERVAL '2 days', false,
        NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days',
        'trial', true, 0, 0,
        '⚠️ Trial expira pronto - contactar para conversión', NOW() - INTERVAL '12 days', NOW()
    );

    -- Cliente 5: Plan Pro trimestral - Activo, próxima factura en 5 días
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, trial_days, trial_start_date, trial_end_date, trial_converted, trial_conversion_date,
        start_date, current_period_start, current_period_end, next_billing_date,
        status, auto_invoice, auto_send_invoice, total_revenue, invoices_count,
        payment_method, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_torres, 'Pro', 'anclora-pro', 'Plan profesional - Pago trimestral',
        210.00, 'quarterly',
        true, 30, NOW() - INTERVAL '125 days', NOW() - INTERVAL '95 days', true, NOW() - INTERVAL '95 days',
        NOW() - INTERVAL '125 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days', NOW() + INTERVAL '5 days',
        'active', true, true, 210.00, 1,
        'card', NOW() - INTERVAL '125 days', NOW()
    );

    -- Cliente 6: Plan cancelado (churn) - Downgrade a Basic luego canceló
    INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, billing_frequency,
        has_trial, start_date, current_period_start, current_period_end,
        cancellation_date, cancellation_effective_date,
        status, total_revenue, invoices_count,
        previous_plan_code, plan_changed_at, plan_change_type,
        notes, created_at, updated_at
    ) VALUES (
        v_user_id, v_client_ecommerce, 'Basic', 'anclora-basic', 'Plan básico (cancelado)',
        39.00, 'monthly',
        false, NOW() - INTERVAL '180 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days',
        'cancelled', 273.00, 7,
        'anclora-pro', NOW() - INTERVAL '60 days', 'downgrade',
        'Cliente hizo downgrade y luego canceló - seguimiento para reactivación', NOW() - INTERVAL '180 days', NOW()
    );

END $$;

-- ===== PRESUPUESTOS (BUDGETS) =====
INSERT INTO budgets (id, user_id, client_id, budget_number, title, description, subtotal, total, status, valid_until, created_at, updated_at) VALUES
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Fernández Arquitectura SA'), 'PPTO-2026-001', 'Portal de Clientes Arquitectura', 'Desarrollo de portal web para gestión de proyectos arquitectónicos con visualización de planos', 12000.00, 12720.00, 'sent', NOW() + INTERVAL '30 days', NOW() - INTERVAL '15 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Torres Logística SL'), 'PPTO-2026-002', 'App Móvil Tracking Avanzado', 'Aplicación móvil con geolocalización en tiempo real y notificaciones push', 18500.00, 19610.00, 'draft', NOW() + INTERVAL '45 days', NOW() - INTERVAL '5 days', NOW()),
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), (SELECT id FROM clients WHERE business_name = 'Ecommerce Solutions España'), 'PPTO-2025-003', 'Rediseño Completo Tienda Online', 'Renovación UI/UX completa con nueva arquitectura de información', 8900.00, 9434.00, 'accepted', NOW() + INTERVAL '60 days', NOW() - INTERVAL '20 days', NOW());

-- ===== SUSCRIPCIONES (SUBSCRIPTIONS) - Servicios que YO PAGO =====
INSERT INTO subscriptions (id, user_id, service_name, provider, description, amount, billing_frequency, next_billing_date, status, has_trial, trial_days, trial_start_date, trial_end_date, trial_requires_card, trial_converted, trial_conversion_date, category, payment_method, card_last_four, auto_renew, url, notes, created_at, updated_at) VALUES
-- Suscripción activa sin trial (pagando desde el inicio)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'GitHub Team', 'GitHub Inc.', 'Plan para repositorios privados ilimitados', 44.00, 'monthly', '2026-02-01', 'active', false, NULL, NULL, NULL, false, false, NULL, 'software', 'card', '4532', true, 'https://github.com/settings/billing', 'Plan para proyectos clientes', NOW() - INTERVAL '180 days', NOW()),

-- Suscripción activa que tuvo trial de 14 días con tarjeta (ya convertida)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Adobe Creative Cloud', 'Adobe Systems', 'Suite completa de diseño (Photoshop, Illustrator, XD)', 54.51, 'monthly', '2026-02-15', 'active', true, 14, NOW() - INTERVAL '379 days', NOW() - INTERVAL '365 days', true, true, NOW() - INTERVAL '365 days', 'software', 'card', '5123', true, 'https://account.adobe.com', 'Trial de 14 días convertido hace 1 año', NOW() - INTERVAL '379 days', NOW()),

-- Trial activo de 30 días SIN tarjeta requerida (expira pronto - decisión pendiente)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Notion Team', 'Notion Labs', 'Workspace colaborativo para documentación', 10.00, 'monthly', NOW() + INTERVAL '5 days', 'trial', true, 30, NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', false, false, NULL, 'productivity', NULL, NULL, false, 'https://notion.so/settings', 'Trial sin tarjeta - decidir antes del día ' || TO_CHAR(NOW() + INTERVAL '5 days', 'DD/MM'), NOW() - INTERVAL '25 days', NOW()),

-- Trial activo de 7 días CON tarjeta requerida (crítico - expira en 2 días)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Claude Pro', 'Anthropic', 'Asistente AI avanzado para desarrollo', 20.00, 'monthly', NOW() + INTERVAL '2 days', 'trial', true, 7, NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', true, false, NULL, 'software', 'card', '4111', true, 'https://console.anthropic.com', '⚠️ CRÍTICO: Cancelar antes de ' || TO_CHAR(NOW() + INTERVAL '2 days', 'DD/MM') || ' si no se quiere continuar', NOW() - INTERVAL '5 days', NOW()),

-- Suscripción activa mensual (sin trial original)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'DigitalOcean VPS', 'DigitalOcean', 'Servidor virtual para aplicaciones clientes', 24.00, 'monthly', '2026-02-01', 'active', false, NULL, NULL, NULL, false, false, NULL, 'hosting', 'card', '4242', true, 'https://cloud.digitalocean.com', 'Droplet 4GB RAM - Frankfurt', NOW() - INTERVAL '300 days', NOW()),

-- Suscripción activa con trial de 14 días que requería tarjeta (convertido)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Figma Professional', 'Figma Inc.', 'Diseño colaborativo de interfaces', 12.00, 'monthly', '2026-02-05', 'active', true, 14, NOW() - INTERVAL '164 days', NOW() - INTERVAL '150 days', true, true, NOW() - INTERVAL '150 days', 'software', 'card', '5555', true, 'https://figma.com/settings', 'Convertido tras trial satisfactorio', NOW() - INTERVAL '164 days', NOW()),

-- Trial de 30 días activo SIN tarjeta (acaba de empezar, aún tiene tiempo)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Vercel Pro', 'Vercel Inc.', 'Hosting y deployment para aplicaciones Next.js', 20.00, 'monthly', NOW() + INTERVAL '27 days', 'trial', true, 30, NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', false, false, NULL, 'hosting', NULL, NULL, false, 'https://vercel.com/account', 'Trial recién iniciado, evaluando para proyectos', NOW() - INTERVAL '3 days', NOW()),

-- Suscripción anual activa (sin trial, con descuento anual)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Grammarly Premium', 'Grammarly Inc.', 'Corrector ortográfico y gramatical avanzado', 144.00, 'yearly', '2026-11-15', 'active', false, NULL, NULL, NULL, false, false, NULL, 'productivity', 'card', '3782', true, 'https://account.grammarly.com', 'Pago anual (12€/mes con descuento)', NOW() - INTERVAL '60 days', NOW()),

-- Trial de 14 días CON tarjeta requerida - en fase de evaluación
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'Linear Pro', 'Linear B.V.', 'Gestión de proyectos y tareas para equipos', 15.00, 'monthly', NOW() + INTERVAL '9 days', 'trial', true, 14, NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', true, false, NULL, 'productivity', 'card', '6011', true, 'https://linear.app/settings', 'Probando como alternativa a Notion para proyectos', NOW() - INTERVAL '5 days', NOW()),

-- Suscripción pausada (había convertido de trial pero ahora pausada temporalmente)
((SELECT gen_random_uuid()), (SELECT id FROM users WHERE email = 'pmi140979@gmail.com'), 'ChatGPT Plus', 'OpenAI', 'Acceso prioritario a GPT-4 y GPT-4 Turbo', 20.00, 'monthly', NULL, 'paused', true, 7, NOW() - INTERVAL '200 days', NOW() - INTERVAL '193 days', true, true, NOW() - INTERVAL '193 days', 'software', 'card', '4916', false, 'https://platform.openai.com', 'Pausada temporalmente (usando Claude), reactivar si es necesario', NOW() - INTERVAL '200 days', NOW());

-- ================================================
-- RESUMEN DE DATOS INSERTADOS
-- ================================================
DO $$
DECLARE
    total_clients INT;
    total_projects INT;
    total_invoices INT;
    total_payments INT;
    total_expenses INT;
    total_budgets INT;
    total_subscriptions INT;
    total_bank_accounts INT;
BEGIN
    SELECT COUNT(*) INTO total_clients FROM clients;
    SELECT COUNT(*) INTO total_projects FROM projects;
    SELECT COUNT(*) INTO total_invoices FROM invoices;
    SELECT COUNT(*) INTO total_payments FROM payments;
    SELECT COUNT(*) INTO total_expenses FROM expenses;
    SELECT COUNT(*) INTO total_budgets FROM budgets;
    SELECT COUNT(*) INTO total_subscriptions FROM subscriptions;
    SELECT COUNT(*) INTO total_bank_accounts FROM bank_accounts;

    RAISE NOTICE '✅ Dataset sintético creado exitosamente';
    RAISE NOTICE '📊 Resumen:';
    RAISE NOTICE '   - Clientes: %', total_clients;
    RAISE NOTICE '   - Proyectos: %', total_projects;
    RAISE NOTICE '   - Facturas: %', total_invoices;
    RAISE NOTICE '   - Pagos: %', total_payments;
    RAISE NOTICE '   - Gastos: %', total_expenses;
    RAISE NOTICE '   - Presupuestos: %', total_budgets;
    RAISE NOTICE '   - Suscripciones: %', total_subscriptions;
    RAISE NOTICE '   - Cuentas bancarias: %', total_bank_accounts;
END $$;
