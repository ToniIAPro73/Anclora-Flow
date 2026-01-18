-- ================================================
-- TABLA: CUSTOMER_SUBSCRIPTIONS
-- Para gestionar suscripciones que TUS CLIENTES te pagan a TI
-- (Ingresos recurrentes - MRR/ARR)
-- ================================================

CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Información del plan
    plan_name VARCHAR(100) NOT NULL,                  -- 'Basic', 'Pro', 'Business', 'Enterprise'
    plan_code VARCHAR(50) NOT NULL,                   -- 'anclora-basic', 'anclora-pro', etc.
    description TEXT,
    
    -- Pricing
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'EUR',
    billing_frequency VARCHAR(50) NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly')),
    
    -- Período de prueba
    has_trial BOOLEAN DEFAULT false,
    trial_days INTEGER,                                -- 14, 30, 60 días, etc.
    trial_start_date DATE,
    trial_end_date DATE,
    trial_converted BOOLEAN DEFAULT false,
    trial_conversion_date DATE,
    
    -- Fechas clave
    start_date DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,  -- NULL cuando está cancelada
    cancellation_date DATE,                            -- Fecha en que se solicitó cancelación
    cancellation_effective_date DATE,                  -- Fecha efectiva de fin (fin del período pagado)
    
    -- Estado
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    
    -- Facturación automática
    auto_invoice BOOLEAN DEFAULT true,                 -- Generar factura automáticamente
    auto_send_invoice BOOLEAN DEFAULT false,           -- Enviar factura automáticamente
    invoice_day INTEGER DEFAULT 1 CHECK (invoice_day BETWEEN 1 AND 28), -- Día del mes para facturar
    
    -- Upgrades y Downgrades
    previous_plan_code VARCHAR(50),                    -- Plan anterior (si hubo cambio)
    plan_changed_at TIMESTAMP WITH TIME ZONE,          -- Fecha del último cambio de plan
    plan_change_type VARCHAR(20),                      -- 'upgrade', 'downgrade', NULL
    
    -- Métricas y seguimiento
    total_revenue DECIMAL(12, 2) DEFAULT 0,            -- Revenue total generado por esta suscripción
    invoices_count INTEGER DEFAULT 0,                  -- Número de facturas generadas
    failed_payments_count INTEGER DEFAULT 0,           -- Pagos fallidos consecutivos
    last_invoice_id UUID REFERENCES invoices(id),      -- Última factura generada
    
    -- Información adicional
    discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    discount_end_date DATE,                            -- Fin del descuento temporal
    payment_method VARCHAR(50),                        -- Método de pago preferido
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (start_date <= current_period_end),
    CONSTRAINT valid_trial CHECK (
        (has_trial = false) OR 
        (has_trial = true AND trial_days IS NOT NULL AND trial_start_date IS NOT NULL AND trial_end_date IS NOT NULL)
    )
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_customer_subs_user_id ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_client_id ON customer_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subs_next_billing ON customer_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_customer_subs_plan ON customer_subscriptions(plan_code);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_customer_subscriptions_updated_at 
    BEFORE UPDATE ON customer_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE customer_subscriptions IS 'Suscripciones de clientes a servicios del autónomo (ingresos recurrentes)';
COMMENT ON COLUMN customer_subscriptions.plan_name IS 'Nombre del plan (Basic, Pro, Business)';
COMMENT ON COLUMN customer_subscriptions.auto_invoice IS 'Si debe generarse factura automáticamente cada período';
COMMENT ON COLUMN customer_subscriptions.plan_change_type IS 'Tipo de último cambio: upgrade o downgrade';
COMMENT ON COLUMN customer_subscriptions.failed_payments_count IS 'Contador de fallos de pago consecutivos';

-- ================================================
-- VISTAS PARA MÉTRICAS DE NEGOCIO
-- ================================================

-- MRR (Monthly Recurring Revenue) actual
CREATE OR REPLACE VIEW mrr_summary AS
SELECT 
    user_id,
    plan_name,
    COUNT(*) as active_subscriptions,
    SUM(CASE 
        WHEN billing_frequency = 'monthly' THEN amount
        WHEN billing_frequency = 'quarterly' THEN amount / 3
        WHEN billing_frequency = 'yearly' THEN amount / 12
    END) as mrr,
    AVG(amount) as avg_subscription_value
FROM customer_subscriptions
WHERE status IN ('trial', 'active')
GROUP BY user_id, plan_name
ORDER BY mrr DESC;

COMMENT ON VIEW mrr_summary IS 'Monthly Recurring Revenue (MRR) actual por plan';

-- ARR (Annual Recurring Revenue)
CREATE OR REPLACE VIEW arr_summary AS
SELECT 
    user_id,
    SUM(CASE 
        WHEN billing_frequency = 'monthly' THEN amount * 12
        WHEN billing_frequency = 'quarterly' THEN amount * 4
        WHEN billing_frequency = 'yearly' THEN amount
    END) as arr,
    COUNT(*) as total_active_subscriptions
FROM customer_subscriptions
WHERE status IN ('trial', 'active')
GROUP BY user_id;

COMMENT ON VIEW arr_summary IS 'Annual Recurring Revenue (ARR) total';

-- Suscripciones que necesitan facturación próximamente
CREATE OR REPLACE VIEW upcoming_invoicing AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name as client_name,
    cs.plan_name,
    cs.amount,
    cs.next_billing_date,
    CURRENT_DATE - cs.next_billing_date AS days_until_billing,
    cs.auto_invoice,
    cs.auto_send_invoice
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.status = 'active'
  AND cs.next_billing_date <= CURRENT_DATE + INTERVAL '7 days'
  AND cs.next_billing_date >= CURRENT_DATE
ORDER BY cs.next_billing_date ASC;

COMMENT ON VIEW upcoming_invoicing IS 'Suscripciones que requieren facturación en los próximos 7 días';

-- Trials que están por expirar (oportunidad de conversión)
CREATE OR REPLACE VIEW expiring_customer_trials AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name as client_name,
    c.email as client_email,
    cs.plan_name,
    cs.trial_start_date,
    cs.trial_end_date,
    cs.trial_days,
    cs.amount as price_after_trial,
    CURRENT_DATE - cs.trial_end_date AS days_until_trial_ends,
    CASE 
        WHEN cs.trial_end_date < CURRENT_DATE THEN 'expired'
        WHEN cs.trial_end_date <= CURRENT_DATE + INTERVAL '2 days' THEN 'critical'
        WHEN cs.trial_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
        ELSE 'active'
    END AS urgency_level
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.status = 'trial'
  AND cs.has_trial = true
  AND cs.trial_converted = false
ORDER BY cs.trial_end_date ASC;

COMMENT ON VIEW expiring_customer_trials IS 'Trials de clientes próximos a expirar (seguimiento de conversión)';

-- Métricas de churn (cancelaciones)
CREATE OR REPLACE VIEW churn_metrics AS
SELECT 
    user_id,
    DATE_TRUNC('month', cancellation_date) as month,
    COUNT(*) as cancelled_subscriptions,
    SUM(amount) as lost_mrr
FROM customer_subscriptions
WHERE status = 'cancelled'
  AND cancellation_date IS NOT NULL
  AND cancellation_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY user_id, DATE_TRUNC('month', cancellation_date)
ORDER BY month DESC;

COMMENT ON VIEW churn_metrics IS 'Métricas de cancelaciones (churn) por mes';

-- Upgrades y Downgrades recientes
CREATE OR REPLACE VIEW plan_changes AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name as client_name,
    cs.previous_plan_code,
    cs.plan_code as current_plan_code,
    cs.plan_change_type,
    cs.plan_changed_at,
    cs.amount as current_amount
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.plan_changed_at IS NOT NULL
  AND cs.plan_changed_at >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY cs.plan_changed_at DESC;

COMMENT ON VIEW plan_changes IS 'Cambios de plan (upgrades/downgrades) en los últimos 90 días';

-- Suscripciones en riesgo (con pagos fallidos)
CREATE OR REPLACE VIEW at_risk_subscriptions AS
SELECT 
    cs.id,
    cs.user_id,
    cs.client_id,
    c.name as client_name,
    c.email as client_email,
    cs.plan_name,
    cs.amount,
    cs.failed_payments_count,
    cs.status,
    cs.next_billing_date
FROM customer_subscriptions cs
JOIN clients c ON cs.client_id = c.id
WHERE cs.failed_payments_count > 0
  OR cs.status = 'past_due'
ORDER BY cs.failed_payments_count DESC, cs.next_billing_date ASC;

COMMENT ON VIEW at_risk_subscriptions IS 'Suscripciones en riesgo por fallos de pago';
