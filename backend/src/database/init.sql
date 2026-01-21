-- Anclora Flow Database Schema
-- PostgreSQL Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    nif VARCHAR(20),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'github'
    auth_provider_id VARCHAR(255),
    language VARCHAR(10) DEFAULT 'es',
    theme VARCHAR(20) DEFAULT 'light',
    email_verified_at TIMESTAMP WITH TIME ZONE,
    verification_token UUID,
    verification_sent_at TIMESTAMP WITH TIME ZONE,
    password_reset_token UUID,
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Ensure new user columns exist when updating existing databases
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS company VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS verification_token UUID,
    ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS password_reset_token UUID,
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    nif_cif VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'España',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add business_name column if it doesn't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'business_name') THEN
        ALTER TABLE clients ADD COLUMN business_name VARCHAR(255);
    END IF;
END $$;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'on-hold'
    budget DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    color VARCHAR(7), -- Hex color for UI
    category VARCHAR(50) DEFAULT 'general', -- 'desarrollo', 'marketing', 'consultoria', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure category column exists in projects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE projects ADD COLUMN category VARCHAR(50) DEFAULT 'general';
    END IF;
END $$;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,
    vat_amount DECIMAL(12, 2) DEFAULT 0,
    irpf_percentage DECIMAL(5, 2) DEFAULT 15.00,
    irpf_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    notes TEXT,
    payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'cash', 'paypal', 'other'
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_type VARCHAR(50) DEFAULT 'hours', -- 'hours', 'units', 'days', 'fixed'
    unit_price DECIMAL(12, 2) NOT NULL,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL, -- 'office', 'software', 'hardware', 'marketing', 'travel', 'meals', 'professional_services', 'other'
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    vat_amount DECIMAL(12, 2) DEFAULT 0,
    vat_percentage DECIMAL(5, 2) DEFAULT 21.00,
    is_deductible BOOLEAN DEFAULT true,
    deductible_percentage DECIMAL(5, 2) DEFAULT 100.00,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'cash', 'other'
    vendor VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table (Recurring billing - what I pay)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255),
    service_name VARCHAR(255),
    provider VARCHAR(255),
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    billing_cycle VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
    billing_frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    next_billing_date DATE,
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled'
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

-- Customer Subscriptions Table (Recurring revenue - what I get paid)
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_code VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'trial', 'cancelled'
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
    plan_change_type VARCHAR(50), -- 'upgrade', 'downgrade', 'switch'
    discount_percentage DECIMAL(5, 2),
    discount_end_date DATE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    cancellation_effective_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table (Track partial or multiple payments for invoices)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'cash', 'paypal', 'stripe', 'other'
    transaction_id VARCHAR(255),
    bank_account_id UUID,
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'reconciled', 'disputed', 'refunded'
    reconciliation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tax Calendar Events Table
CREATE TABLE IF NOT EXISTS tax_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'modelo_303', 'modelo_130', 'modelo_111', 'renta', 'other'
    due_date DATE NOT NULL,
    amount DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'filed'
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    budget_number VARCHAR(50),
    title VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    month DATE,
    planned_amount DECIMAL(12, 2) NOT NULL,
    actual_amount DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2),
    total DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month)
);

-- Activity Log Table (for dashboard recent activity)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- 'invoice_created', 'payment_received', 'expense_added', etc.
    entity_type VARCHAR(50), -- 'invoice', 'expense', 'client', 'project'
    entity_id UUID,
    description TEXT,
    metadata JSONB, -- Additional flexible data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Audit Log (for detailed history of changes)
CREATE TABLE IF NOT EXISTS invoice_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'payment_received'
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expense Audit Log (for detailed history of changes)
CREATE TABLE IF NOT EXISTS expense_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL UNIQUE,
    bic VARCHAR(11),
    account_type VARCHAR(50) DEFAULT 'business', -- 'personal', 'business', 'savings'
    currency VARCHAR(10) DEFAULT 'EUR',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Receipts Table (Digital receipts/invoices storage)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INT,
    file_type VARCHAR(50), -- 'pdf', 'image', 'document', 'other'
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add audit columns to expenses if they don't exist
ALTER TABLE expenses 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add CHECK constraints for data integrity
ALTER TABLE expenses
    DROP CONSTRAINT IF EXISTS check_expense_amount_positive,
    ADD CONSTRAINT check_expense_amount_positive CHECK (amount >= 0),
    DROP CONSTRAINT IF EXISTS check_expense_vat_percentage_range,
    ADD CONSTRAINT check_expense_vat_percentage_range CHECK (vat_percentage >= 0 AND vat_percentage <= 100);

-- Add paid_amount to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_amount') THEN
        ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- Add updated_at column to payments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to subscriptions if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'service_name') THEN
        ALTER TABLE subscriptions ADD COLUMN service_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'provider') THEN
        ALTER TABLE subscriptions ADD COLUMN provider VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'category') THEN
        ALTER TABLE subscriptions ADD COLUMN category VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_frequency') THEN
        ALTER TABLE subscriptions ADD COLUMN billing_frequency VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'has_trial') THEN
        ALTER TABLE subscriptions ADD COLUMN has_trial BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_days') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_days INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_start_date') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_end_date') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_requires_card') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_requires_card BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_converted') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_converted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_conversion_date') THEN
        ALTER TABLE subscriptions ADD COLUMN trial_conversion_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'payment_method') THEN
        ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'card_last_four') THEN
        ALTER TABLE subscriptions ADD COLUMN card_last_four VARCHAR(4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'auto_renew') THEN
        ALTER TABLE subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'url') THEN
        ALTER TABLE subscriptions ADD COLUMN url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'notes') THEN
        ALTER TABLE subscriptions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add missing columns to customer_subscriptions if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'description') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'has_trial') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN has_trial BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'trial_days') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN trial_days INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'trial_start_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN trial_start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'trial_end_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN trial_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'trial_converted') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN trial_converted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'trial_conversion_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN trial_conversion_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'auto_send_invoice') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN auto_send_invoice BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'payment_method') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN payment_method VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'previous_plan_code') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN previous_plan_code VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'plan_changed_at') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN plan_changed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'plan_change_type') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN plan_change_type VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'discount_percentage') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN discount_percentage DECIMAL(5, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'discount_end_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN discount_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'cancellation_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN cancellation_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'cancellation_effective_date') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN cancellation_effective_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_subscriptions' AND column_name = 'notes') THEN
        ALTER TABLE customer_subscriptions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add missing columns to payments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_account_id') THEN
        ALTER TABLE payments ADD COLUMN bank_account_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE payments ADD COLUMN status VARCHAR(50) DEFAULT 'registered';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reconciliation_date') THEN
        ALTER TABLE payments ADD COLUMN reconciliation_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add missing columns to budgets if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'client_id') THEN
        ALTER TABLE budgets ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'budget_number') THEN
        ALTER TABLE budgets ADD COLUMN budget_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'title') THEN
        ALTER TABLE budgets ADD COLUMN title VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'description') THEN
        ALTER TABLE budgets ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'subtotal') THEN
        ALTER TABLE budgets ADD COLUMN subtotal DECIMAL(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'total') THEN
        ALTER TABLE budgets ADD COLUMN total DECIMAL(12, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'status') THEN
        ALTER TABLE budgets ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'valid_until') THEN
        ALTER TABLE budgets ADD COLUMN valid_until DATE;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_amount ON invoices(paid_amount);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_user_id ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_client_id ON customer_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tax_events_user_id ON tax_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_events_due_date ON tax_events(due_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_invoice_id ON invoice_audit_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expense_audit_log_expense_id ON expense_audit_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_iban ON bank_accounts(iban);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_expense_id ON receipts(expense_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);

-- Trigger function to update invoice status and paid_amount on payment
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total DECIMAL(12, 2);
    v_paid DECIMAL(12, 2);
BEGIN
    -- Get invoice total
    SELECT total INTO v_total FROM invoices WHERE id = NEW.invoice_id;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM payments WHERE invoice_id = NEW.invoice_id;
    
    -- Update invoice
    UPDATE invoices 
    SET 
        paid_amount = v_paid,
        status = CASE 
            WHEN v_paid >= v_total THEN 'paid'
            WHEN v_paid > 0 THEN 'partial'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_invoice_on_payment ON payments;
CREATE TRIGGER trg_update_invoice_on_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_on_payment();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_customer_subscriptions_updated_at ON customer_subscriptions;
CREATE TRIGGER update_customer_subscriptions_updated_at BEFORE UPDATE ON customer_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tax_events_updated_at ON tax_events;
CREATE TRIGGER update_tax_events_updated_at BEFORE UPDATE ON tax_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- This can be removed in production

-- Usuario de prueba
-- Email: demo@ancloraflow.com
-- Contraseña: demo123
-- NIF: 12345678A
-- TEMPORALMENTE DESACTIVADO PARA DEBUG
-- INSERT INTO users (id, email, name, password_hash, nif, auth_provider, language, theme, email_verified_at)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'pmi140979@gmail.com',
--     'Usuario Demo',
--     '$2b$10$f84.n1jsCMZnFHRBU8uXXueQxu0TNT1Sm9HN8EyerXUQ2XQWY58ii',
--     '12345678A',
--     'local',
--     'es',
--     'light',
--     NOW()
-- )
-- ON CONFLICT (email) DO UPDATE SET
--     password_hash = EXCLUDED.password_hash,
--     nif = EXCLUDED.nif;

