-- Migración para agregar campos de Verifactu a la tabla invoices
-- Verifactu es el sistema de verificación de facturas de la Agencia Tributaria Española

-- Agregar columnas para Verifactu
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_enabled BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_status VARCHAR(50) DEFAULT 'not_registered';
-- Estados: not_registered, pending, registered, error, cancelled

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_id VARCHAR(100);
-- ID único asignado por la AEAT

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_csv VARCHAR(100);
-- Código Seguro de Verificación

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_qr_code TEXT;
-- Código QR en formato Base64 o URL

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_signature TEXT;
-- Firma electrónica de la factura

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_hash VARCHAR(255);
-- Hash SHA-256 de la factura

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_previous_hash VARCHAR(255);
-- Hash de la factura anterior (cadena de bloques)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_chain_index INTEGER;
-- Índice en la cadena de facturas del usuario

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_registered_at TIMESTAMP WITH TIME ZONE;
-- Fecha y hora de registro en Verifactu

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_error_message TEXT;
-- Mensaje de error si falla el registro

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_url TEXT;
-- URL de verificación en la web de la AEAT

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_software_nif VARCHAR(20) DEFAULT 'B12345678';
-- NIF del software de facturación

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_software_name VARCHAR(100) DEFAULT 'Anclora Flow';
-- Nombre del software de facturación

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_software_version VARCHAR(50) DEFAULT '1.0.0';
-- Versión del software de facturación

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_invoices_verifactu_status ON invoices(verifactu_status);
CREATE INDEX IF NOT EXISTS idx_invoices_verifactu_id ON invoices(verifactu_id);
CREATE INDEX IF NOT EXISTS idx_invoices_verifactu_chain_index ON invoices(user_id, verifactu_chain_index);

-- Crear tabla para logs de Verifactu
CREATE TABLE IF NOT EXISTS verifactu_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    -- Acciones: register_attempt, register_success, register_error, cancel_attempt, cancel_success, cancel_error
    status VARCHAR(50) NOT NULL,
    -- Estados: success, error, pending
    request_data JSONB,
    -- Datos enviados a la AEAT
    response_data JSONB,
    -- Respuesta de la AEAT
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para la tabla de logs
CREATE INDEX IF NOT EXISTS idx_verifactu_logs_invoice_id ON verifactu_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_verifactu_logs_user_id ON verifactu_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verifactu_logs_created_at ON verifactu_logs(created_at);

-- Crear tabla para configuración de Verifactu por usuario
CREATE TABLE IF NOT EXISTS verifactu_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    -- Habilitar/deshabilitar Verifactu para el usuario
    auto_register BOOLEAN DEFAULT true,
    -- Registrar automáticamente al crear factura
    certificate_path TEXT,
    -- Ruta al certificado digital
    certificate_password TEXT,
    -- Contraseña del certificado (encriptada)
    software_nif VARCHAR(20),
    -- NIF del software de facturación
    software_name VARCHAR(100) DEFAULT 'Anclora Flow',
    software_version VARCHAR(50) DEFAULT '1.0.0',
    software_license VARCHAR(100),
    -- Licencia del software
    test_mode BOOLEAN DEFAULT true,
    -- Modo de pruebas (sandbox de la AEAT)
    last_chain_index INTEGER DEFAULT 0,
    -- Último índice de la cadena de facturas
    last_chain_hash VARCHAR(255),
    -- Último hash de la cadena
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar updated_at en verifactu_config
CREATE TRIGGER update_verifactu_config_updated_at
    BEFORE UPDATE ON verifactu_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índice para la configuración
CREATE INDEX IF NOT EXISTS idx_verifactu_config_user_id ON verifactu_config(user_id);

-- Comentarios sobre las tablas
COMMENT ON TABLE verifactu_logs IS 'Registro de todas las interacciones con el sistema Verifactu de la AEAT';
COMMENT ON TABLE verifactu_config IS 'Configuración de Verifactu por usuario, incluyendo certificados y modo de operación';

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO verifactu_config (user_id, enabled, test_mode)
SELECT id, false, true
FROM users
ON CONFLICT (user_id) DO NOTHING;
