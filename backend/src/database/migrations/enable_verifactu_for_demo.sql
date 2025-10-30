-- Script para habilitar Verifactu para el usuario demo
-- Ejecutar este script si aparece el error "Verifactu no está habilitado para este usuario"

DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Obtener el ID del usuario demo@anclora.test
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@anclora.test' LIMIT 1;

    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario demo no encontrado. Asegúrate de que el usuario demo@anclora.test existe.';
    END IF;

    -- Habilitar Verifactu para el usuario demo
    INSERT INTO verifactu_config (user_id, enabled, test_mode, software_nif, software_name, software_version)
    VALUES (demo_user_id, true, true, 'B12345678', 'Anclora Flow', '1.0.0')
    ON CONFLICT (user_id) DO UPDATE SET
        enabled = true,
        test_mode = true,
        software_nif = 'B12345678',
        software_name = 'Anclora Flow',
        software_version = '1.0.0',
        updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE '✓ Verifactu habilitado correctamente para el usuario demo@anclora.test';
    RAISE NOTICE '  - Modo: Pruebas (test_mode = true)';
    RAISE NOTICE '  - Software NIF: B12345678';
END $$;

-- Verificar la configuración
SELECT
    u.email as usuario,
    vc.enabled as habilitado,
    vc.test_mode as modo_pruebas,
    vc.software_nif,
    vc.software_name,
    vc.software_version
FROM verifactu_config vc
JOIN users u ON vc.user_id = u.id
WHERE u.email = 'demo@anclora.test';
