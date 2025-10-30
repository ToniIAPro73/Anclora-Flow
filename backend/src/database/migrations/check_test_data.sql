-- Script de diagnóstico para verificar datos de prueba y configuración

\echo '========================================='
\echo 'DIAGNÓSTICO: Datos de prueba y Verifactu'
\echo '========================================='
\echo ''

-- 1. Verificar usuario demo
\echo '1. Usuario demo:'
SELECT
    id,
    email,
    name,
    created_at
FROM users
WHERE email = 'demo@anclora.test';

\echo ''
\echo '2. Configuración Verifactu:'
SELECT
    u.email,
    vc.enabled,
    vc.test_mode,
    vc.software_nif,
    vc.software_name
FROM verifactu_config vc
JOIN users u ON vc.user_id = u.id
WHERE u.email = 'demo@anclora.test';

\echo ''
\echo '3. Clientes de prueba (FAC-2025):'
SELECT
    c.id,
    c.name,
    c.country_code,
    c.client_type,
    c.nif_cif
FROM clients c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'demo@anclora.test'
  AND c.nif_cif IN ('B87654321', 'FR12345678901', 'DE987654321', 'US123456789', 'GB987654321', 'IT11223344556');

\echo ''
\echo '4. Facturas de prueba:'
SELECT
    i.invoice_number,
    c.name as cliente,
    i.operation_type,
    i.total,
    i.status,
    i.created_at
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.invoice_number LIKE 'FAC-2025-%'
ORDER BY i.invoice_number;

\echo ''
\echo '5. Estadísticas por tipo de operación:'
SELECT
    operation_type,
    COUNT(*) as num_facturas,
    SUM(total) as total
FROM invoices
WHERE invoice_number LIKE 'FAC-2025-%'
GROUP BY operation_type;

\echo ''
\echo '========================================='
\echo 'Fin del diagnóstico'
\echo '=========================================';
