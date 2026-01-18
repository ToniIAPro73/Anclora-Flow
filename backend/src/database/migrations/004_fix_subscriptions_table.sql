-- ================================================
-- CORRECCIÓN: TABLA SUBSCRIPTIONS
-- Para rastrear suscripciones que YO PAGO a servicios externos
-- (GitHub, Adobe, ChatGPT, Notion, etc.)
-- ================================================

-- Eliminar tabla anterior incorrecta y recrear
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Crear nueva tabla correctamente enfocada
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del servicio
    service_name VARCHAR(255) NOT NULL,              -- Ej: "GitHub Team", "Adobe Creative Cloud"
    provider VARCHAR(255) NOT NULL,                   -- Ej: "GitHub Inc.", "Adobe Systems"
    description TEXT,                                 -- Descripción del plan o servicio
    
    -- Información financiera
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'EUR',
    billing_frequency VARCHAR(50) NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    
    -- Fechas y estado
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_billing_date DATE NOT NULL,
    end_date DATE,                                    -- NULL si es indefinida
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'paused', 'cancelled', 'expired')),
    
    -- Período de prueba gratuito
    has_trial BOOLEAN DEFAULT false,                  -- ¿Tiene período de prueba?
    trial_days INTEGER,                               -- Duración del trial (7, 14, 30, etc.)
    trial_start_date DATE,                            -- Fecha inicio del trial
    trial_end_date DATE,                              -- Fecha fin del trial
    trial_requires_card BOOLEAN DEFAULT false,        -- ¿Requiere tarjeta durante el trial?
    trial_converted BOOLEAN DEFAULT false,            -- ¿Se convirtió de trial a pago?
    trial_conversion_date DATE,                       -- Fecha de conversión
    
    -- Categorización para reportes
    category VARCHAR(100),                            -- 'software', 'hosting', 'productivity', 'marketing', 'infrastructure'
    
    -- Información de pago
    payment_method VARCHAR(50),                       -- Cómo se paga: 'card', 'paypal', 'bank_transfer'
    card_last_four VARCHAR(4),                        -- Últimos 4 dígitos de la tarjeta (si aplica)
    auto_renew BOOLEAN DEFAULT true,                  -- Renovación automática activada
    
    -- Información adicional
    url TEXT,                                         -- Link al panel/dashboard del servicio
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE subscriptions IS 'Suscripciones que el autónomo paga a servicios externos (GitHub, Adobe, ChatGPT, etc.)';
COMMENT ON COLUMN subscriptions.service_name IS 'Nombre del servicio/plan (ej: "GitHub Team", "Notion Pro")';
COMMENT ON COLUMN subscriptions.provider IS 'Empresa proveedora del servicio';
COMMENT ON COLUMN subscriptions.billing_frequency IS 'Frecuencia de cobro: monthly, quarterly, yearly, one-time';
COMMENT ON COLUMN subscriptions.category IS 'Categoría para reportes: software, hosting, productivity, marketing, infrastructure';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Fecha del próximo cobro programado';
COMMENT ON COLUMN subscriptions.has_trial IS 'Indica si la suscripción incluye período de prueba gratuito';
COMMENT ON COLUMN subscriptions.trial_days IS 'Duración del período de prueba en días (7, 14, 30, etc.)';
COMMENT ON COLUMN subscriptions.trial_requires_card IS 'Si el trial requiere introducir tarjeta bancaria (aunque sea gratis)';
COMMENT ON COLUMN subscriptions.trial_converted IS 'Si la suscripción se convirtió de trial a plan de pago';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Si la renovación automática está activada';
COMMENT ON COLUMN subscriptions.card_last_four IS 'Últimos 4 dígitos de la tarjeta asociada (para recordatorio)';

-- Vista para subscripciones activas próximas a renovar
CREATE OR REPLACE VIEW upcoming_subscriptions AS
SELECT 
    id,
    user_id,
    service_name,
    provider,
    amount,
    currency,
    next_billing_date,
    billing_frequency,
    category,
    CURRENT_DATE - next_billing_date AS days_until_renewal
FROM subscriptions
WHERE status = 'active'
  AND next_billing_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY next_billing_date ASC;

COMMENT ON VIEW upcoming_subscriptions IS 'Suscripciones activas que se renovarán en los próximos 30 días';

-- Vista para trials que están por expirar (para decidir si convertir o cancelar)
CREATE OR REPLACE VIEW expiring_trials AS
SELECT 
    id,
    user_id,
    service_name,
    provider,
    trial_days,
    trial_start_date,
    trial_end_date,
    trial_requires_card,
    amount AS price_after_trial,
    billing_frequency,
    CURRENT_DATE - trial_end_date AS days_until_trial_ends,
    CASE 
        WHEN trial_end_date < CURRENT_DATE THEN 'expired'
        WHEN trial_end_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
        WHEN trial_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
        ELSE 'active'
    END AS trial_status
FROM subscriptions
WHERE status = 'trial'
  AND has_trial = true
  AND trial_converted = false
  AND trial_end_date IS NOT NULL
ORDER BY trial_end_date ASC;

COMMENT ON VIEW expiring_trials IS 'Trials activos próximos a expirar (para recordar cancelar si no se desea continuar)';

-- Vista para suscripciones con renovación automática activada
CREATE OR REPLACE VIEW auto_renewing_subscriptions AS
SELECT 
    id,
    user_id,
    service_name,
    provider,
    amount,
    currency,
    billing_frequency,
    next_billing_date,
    card_last_four,
    CURRENT_DATE - next_billing_date AS days_until_charge
FROM subscriptions
WHERE status = 'active'
  AND auto_renew = true
  AND next_billing_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY next_billing_date ASC;

COMMENT ON VIEW auto_renewing_subscriptions IS 'Suscripciones con auto-renovación activa próximas a cobrarse (para revisar antes del cargo)';
