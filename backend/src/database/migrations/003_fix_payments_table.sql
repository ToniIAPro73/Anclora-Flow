-- Migration Fix: Update existing payments table with missing columns
-- Date: 2026-01-18
-- Description: Add missing columns to payments table that already existed

-- First, check and add missing columns to payments table
DO $$
BEGIN
    -- Add bank_account_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'bank_account_id') THEN
        ALTER TABLE payments ADD COLUMN bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_payments_bank_account_id ON payments(bank_account_id);
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE payments ADD COLUMN status VARCHAR(50) DEFAULT 'registered' NOT NULL 
            CHECK (status IN ('registered', 'reconciled', 'rejected'));
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    END IF;

    -- Add reconciliation_date column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'reconciliation_date') THEN
        ALTER TABLE payments ADD COLUMN reconciliation_date DATE;
    END IF;

    -- Add transaction_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'transaction_id') THEN
        ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(255) UNIQUE;
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'notes') THEN
        ALTER TABLE payments ADD COLUMN notes TEXT;
    END IF;

    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'created_at') THEN
        ALTER TABLE payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
    END IF;

    -- Ensure payment_date index exists
    CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at 
        BEFORE UPDATE ON payments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add payment_method constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.constraint_column_usage 
        WHERE table_name = 'payments' AND constraint_name LIKE '%payment_method%'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
            CHECK (payment_method IN ('bank_transfer', 'card', 'cash', 'cheque', 'paypal', 'stripe', 'other'));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Verify the structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
