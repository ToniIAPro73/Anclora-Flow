-- ==============================================================================
-- MIGRATION: 006_create_subscriptions_module
-- DESCRIPCIÓN: Migración segura para el módulo de Suscripciones (Gastos e Ingresos)
-- REFERENCIA: EF-SUSCRIPCIONES-001 (Secciones 3.2 y 4.2)
-- ==============================================================================

BEGIN;

-- Extensiones necesarias para UUIDs (seguras si ya existen)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Asegurar que la función de timestamp automático existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Verificar dependencias mínimas del esquema base
DO $$
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Missing table "users". Run init.sql/base migrations first.';
    END IF;
    IF to_regclass('public.clients') IS NULL THEN
        RAISE EXCEPTION 'Missing table "clients". Run init.sql/base migrations first.';
    END IF;
    IF to_regclass('public.projects') IS NULL THEN
        RAISE EXCEPTION 'Missing table "projects". Run init.sql/base migrations first.';
    END IF;
END $$;

-- ==============================================================================
-- 1. TABLA: subscriptions (Mis Gastos)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255),
    service_name VARCHAR(255),
    provider VARCHAR(255),
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    billing_cycle VARCHAR(50),
    billing_frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    next_billing_date DATE,
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    has_trial BOOLEAN DEFAULT false,
    trial_days INT,
    trial_start_date DATE,
    trial_end_date DATE,
    trial_requires_card BOOLEAN DEFAULT false,
    trial_converted BOOLEAN DEFAULT false,
    trial_conversion_date TIMESTAMP WITH TIME ZONE,
    auto_invoice BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(50),
    card_last_four VARCHAR(4),
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Columnas adicionales del módulo (solo si faltan)
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS cancellation_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS login_url VARCHAR(500);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);

-- Trigger para updated_at en subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 2. TABLA: customer_subscriptions (Mis Ingresos)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_code VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    has_trial BOOLEAN DEFAULT false,
    trial_days INT,
    trial_start_date DATE,
    trial_end_date DATE,
    trial_converted BOOLEAN DEFAULT false,
    trial_conversion_date TIMESTAMP WITH TIME ZONE,
    auto_invoice BOOLEAN DEFAULT true,
    auto_send_invoice BOOLEAN DEFAULT false,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    previous_plan_code VARCHAR(100),
    plan_changed_at TIMESTAMP WITH TIME ZONE,
    plan_change_type VARCHAR(50),
    discount_percentage DECIMAL(5, 2),
    discount_end_date DATE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    cancellation_effective_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Columnas adicionales del módulo (solo si faltan)
ALTER TABLE customer_subscriptions
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR',
    ADD COLUMN IF NOT EXISTS invoice_day INTEGER,
    ADD COLUMN IF NOT EXISTS failed_payments_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_invoice_id UUID;

-- Índices para customer_subscriptions
CREATE INDEX IF NOT EXISTS idx_customer_subs_user_id ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_client_id ON customer_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_customer_subs_next_billing ON customer_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_customer_subs_plan ON customer_subscriptions(plan_code);
CREATE INDEX IF NOT EXISTS idx_customer_subs_trial_end ON customer_subscriptions(trial_end_date) 
    WHERE status = 'trial';

-- Trigger para updated_at en customer_subscriptions
DROP TRIGGER IF EXISTS update_customer_subscriptions_updated_at ON customer_subscriptions;
CREATE TRIGGER update_customer_subscriptions_updated_at 
    BEFORE UPDATE ON customer_subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
