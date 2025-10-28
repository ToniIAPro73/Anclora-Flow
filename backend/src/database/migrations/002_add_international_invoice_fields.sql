-- Migración para agregar soporte de facturas internacionales (UE y exportación)
-- Cumplimiento con normativa Verifactu para operaciones transfronterizas

-- ========================================
-- TABLA CLIENTS: Campos internacionales
-- ========================================

-- Tipo de cliente según ubicación fiscal
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'national';
-- Valores: 'national' (España), 'eu' (Unión Europea), 'international' (fuera UE)

-- Tipo de identificación fiscal
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id_type VARCHAR(50) DEFAULT 'nif';
-- Valores: 'nif' (España), 'vat_id' (NIF-IVA UE), 'tax_number' (otros países)

-- Código de país ISO (ISO 3166-1 alpha-2)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
-- Ej: 'ES' (España), 'DE' (Alemania), 'US' (Estados Unidos)

-- Validación de NIF intracomunitario
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_validated BOOLEAN DEFAULT false;
-- Indica si el NIF-IVA ha sido validado con VIES

-- Fecha de validación del NIF-IVA
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_validated_at TIMESTAMP WITH TIME ZONE;

-- ========================================
-- TABLA INVOICES: Campos de operaciones internacionales
-- ========================================

-- Tipo de operación fiscal
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50) DEFAULT 'national';
-- Valores: 'national', 'intra_eu', 'export', 'import'

-- Motivo de exención de IVA (si aplica)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_exemption_reason VARCHAR(255);
-- Ej: 'Art. 25 Ley 37/1992 - Operación intracomunitaria'
-- Ej: 'Art. 21 Ley 37/1992 - Exportación'

-- Código de operación para Verifactu
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS verifactu_operation_code VARCHAR(10);
-- Códigos AEAT: '01' = Nacional, '02' = Intracomunitaria, '03' = Exportación

-- Indicador de inversión del sujeto pasivo
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false;
-- true para operaciones intracomunitarias (el cliente paga el IVA en su país)

-- NIF-IVA del cliente (para operaciones UE)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_vat_number VARCHAR(50);
-- Formato: prefijo país + número (ej: DE123456789)

-- País de destino/origen (código ISO)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS destination_country_code VARCHAR(2);

-- Tipo de bien o servicio
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS goods_or_services VARCHAR(20) DEFAULT 'services';
-- Valores: 'goods' (bienes), 'services' (servicios)

-- Lugar de prestación/entrega (para reglas de IVA)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(255);

-- Documento de exportación (si aplica)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS export_document_number VARCHAR(100);
-- Ej: DUA, MRN (Movement Reference Number)

-- Fecha de exportación
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS export_date DATE;

-- ========================================
-- TABLA INVOICE_ITEMS: Soporte de exenciones por línea
-- ========================================

-- Motivo de exención por línea de factura (si difiere del global)
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS vat_exemption_reason VARCHAR(255);

-- Código de bien/servicio para Verifactu
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_code VARCHAR(50);

-- ========================================
-- ÍNDICES para mejorar rendimiento
-- ========================================

CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_country_code ON clients(country_code);
CREATE INDEX IF NOT EXISTS idx_invoices_operation_type ON invoices(operation_type);
CREATE INDEX IF NOT EXISTS idx_invoices_destination_country ON invoices(destination_country_code);
CREATE INDEX IF NOT EXISTS idx_invoices_reverse_charge ON invoices(reverse_charge);

-- ========================================
-- COMENTARIOS DESCRIPTIVOS
-- ========================================

COMMENT ON COLUMN clients.client_type IS 'Tipo de cliente: national (España), eu (UE), international (fuera UE)';
COMMENT ON COLUMN clients.tax_id_type IS 'Tipo de identificación fiscal: nif, vat_id (NIF-IVA), tax_number';
COMMENT ON COLUMN clients.country_code IS 'Código de país ISO 3166-1 alpha-2 (ej: ES, DE, US)';
COMMENT ON COLUMN clients.vat_validated IS 'Si el NIF-IVA ha sido validado con sistema VIES de la UE';

COMMENT ON COLUMN invoices.operation_type IS 'Tipo de operación: national, intra_eu, export, import';
COMMENT ON COLUMN invoices.vat_exemption_reason IS 'Base legal de la exención de IVA (Art. 21, Art. 25 Ley 37/1992)';
COMMENT ON COLUMN invoices.verifactu_operation_code IS 'Código AEAT: 01=Nacional, 02=Intracomunitaria, 03=Exportación';
COMMENT ON COLUMN invoices.reverse_charge IS 'Inversión del sujeto pasivo (el cliente paga IVA en su país)';
COMMENT ON COLUMN invoices.client_vat_number IS 'NIF-IVA intracomunitario del cliente (ej: DE123456789)';
COMMENT ON COLUMN invoices.goods_or_services IS 'Tipo de operación: goods (bienes) o services (servicios)';
COMMENT ON COLUMN invoices.export_document_number IS 'Número de documento de exportación (DUA, MRN)';

-- ========================================
-- FUNCIÓN DE VALIDACIÓN: Actualizar operation_type automáticamente
-- ========================================

CREATE OR REPLACE FUNCTION update_invoice_operation_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el cliente es de la UE, marcar como intracomunitaria
    IF EXISTS (
        SELECT 1 FROM clients
        WHERE id = NEW.client_id
        AND client_type = 'eu'
    ) THEN
        NEW.operation_type := 'intra_eu';
        NEW.reverse_charge := true;
        NEW.verifactu_operation_code := '02';

        -- Si no tiene motivo de exención, añadir el estándar
        IF NEW.vat_exemption_reason IS NULL THEN
            NEW.vat_exemption_reason := 'Art. 25 Ley 37/1992 - Operación intracomunitaria exenta';
        END IF;

    -- Si el cliente es internacional (fuera UE), marcar como exportación
    ELSIF EXISTS (
        SELECT 1 FROM clients
        WHERE id = NEW.client_id
        AND client_type = 'international'
    ) THEN
        NEW.operation_type := 'export';
        NEW.reverse_charge := false;
        NEW.verifactu_operation_code := '03';

        IF NEW.vat_exemption_reason IS NULL THEN
            NEW.vat_exemption_reason := 'Art. 21 Ley 37/1992 - Exportación exenta';
        END IF;

    -- Si el cliente es nacional
    ELSE
        IF NEW.operation_type IS NULL THEN
            NEW.operation_type := 'national';
            NEW.verifactu_operation_code := '01';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente operation_type
DROP TRIGGER IF EXISTS trg_update_invoice_operation_type ON invoices;
CREATE TRIGGER trg_update_invoice_operation_type
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_operation_type();

-- ========================================
-- DATOS INICIALES: Actualizar clientes existentes
-- ========================================

-- Marcar todos los clientes sin country_code como españoles (por defecto)
UPDATE clients
SET
    client_type = 'national',
    country_code = 'ES',
    tax_id_type = 'nif'
WHERE country_code IS NULL AND (country = 'España' OR country IS NULL);

-- Detectar clientes de la UE por el país
UPDATE clients
SET
    client_type = 'eu',
    tax_id_type = 'vat_id'
WHERE country IN (
    'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre', 'Croacia',
    'Dinamarca', 'Eslovaquia', 'Eslovenia', 'Estonia', 'Finlandia',
    'Francia', 'Grecia', 'Hungría', 'Irlanda', 'Italia', 'Letonia',
    'Lituania', 'Luxemburgo', 'Malta', 'Países Bajos', 'Polonia',
    'Portugal', 'República Checa', 'Rumanía', 'Suecia'
);

-- Asignar códigos de país UE
UPDATE clients SET country_code = 'DE' WHERE country = 'Alemania';
UPDATE clients SET country_code = 'AT' WHERE country = 'Austria';
UPDATE clients SET country_code = 'BE' WHERE country = 'Bélgica';
UPDATE clients SET country_code = 'BG' WHERE country = 'Bulgaria';
UPDATE clients SET country_code = 'CY' WHERE country = 'Chipre';
UPDATE clients SET country_code = 'HR' WHERE country = 'Croacia';
UPDATE clients SET country_code = 'DK' WHERE country = 'Dinamarca';
UPDATE clients SET country_code = 'SK' WHERE country = 'Eslovaquia';
UPDATE clients SET country_code = 'SI' WHERE country = 'Eslovenia';
UPDATE clients SET country_code = 'EE' WHERE country = 'Estonia';
UPDATE clients SET country_code = 'FI' WHERE country = 'Finlandia';
UPDATE clients SET country_code = 'FR' WHERE country = 'Francia';
UPDATE clients SET country_code = 'GR' WHERE country = 'Grecia';
UPDATE clients SET country_code = 'HU' WHERE country = 'Hungría';
UPDATE clients SET country_code = 'IE' WHERE country = 'Irlanda';
UPDATE clients SET country_code = 'IT' WHERE country = 'Italia';
UPDATE clients SET country_code = 'LV' WHERE country = 'Letonia';
UPDATE clients SET country_code = 'LT' WHERE country = 'Lituania';
UPDATE clients SET country_code = 'LU' WHERE country = 'Luxemburgo';
UPDATE clients SET country_code = 'MT' WHERE country = 'Malta';
UPDATE clients SET country_code = 'NL' WHERE country = 'Países Bajos';
UPDATE clients SET country_code = 'PL' WHERE country = 'Polonia';
UPDATE clients SET country_code = 'PT' WHERE country = 'Portugal';
UPDATE clients SET country_code = 'CZ' WHERE country = 'República Checa';
UPDATE clients SET country_code = 'RO' WHERE country = 'Rumanía';
UPDATE clients SET country_code = 'SE' WHERE country = 'Suecia';

-- Marcar clientes internacionales (fuera UE)
UPDATE clients
SET
    client_type = 'international',
    tax_id_type = 'tax_number'
WHERE country_code IS NULL
  AND client_type IS NULL
  AND country NOT IN ('España', 'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre',
                      'Croacia', 'Dinamarca', 'Eslovaquia', 'Eslovenia', 'Estonia',
                      'Finlandia', 'Francia', 'Grecia', 'Hungría', 'Irlanda', 'Italia',
                      'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Países Bajos',
                      'Polonia', 'Portugal', 'República Checa', 'Rumanía', 'Suecia');

-- ========================================
-- VISTA: Resumen de facturas por tipo de operación
-- ========================================

CREATE OR REPLACE VIEW v_invoices_by_operation_type AS
SELECT
    user_id,
    operation_type,
    COUNT(*) as invoice_count,
    SUM(total) as total_amount,
    SUM(CASE WHEN verifactu_status = 'registered' THEN 1 ELSE 0 END) as registered_count
FROM invoices
GROUP BY user_id, operation_type;

COMMENT ON VIEW v_invoices_by_operation_type IS 'Resumen de facturas por tipo de operación (nacional, UE, exportación)';
