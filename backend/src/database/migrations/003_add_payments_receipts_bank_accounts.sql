-- Migration: Add Payments, Receipts, and Bank Accounts tables
-- Date: 2026-01-18
-- Description: Add payment tracking, receipt attachment, and bank account management

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  bank_name VARCHAR(255) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  iban VARCHAR(34) NOT NULL UNIQUE,
  bic VARCHAR(11),
  
  account_type VARCHAR(50) DEFAULT 'business',
  currency VARCHAR(10) DEFAULT 'EUR',
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_iban ON bank_accounts(iban);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'card', 'cash', 'cheque', 'paypal', 'stripe', 'other')),
  
  transaction_id VARCHAR(255) UNIQUE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  status VARCHAR(50) DEFAULT 'registered' NOT NULL CHECK (status IN ('registered', 'reconciled', 'rejected')),
  reconciliation_date DATE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_bank_account_id ON payments(bank_account_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  receipt_type VARCHAR(50) NOT NULL CHECK (receipt_type IN ('invoice', 'ticket', 'receipt', 'albaran', 'bank_statement', 'other')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('expense', 'payment', 'invoice', 'subscription')),
  entity_id UUID NOT NULL,
  
  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_type VARCHAR(50),
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  
  -- Document metadata
  document_date DATE,
  vendor_name VARCHAR(255),
  invoice_number VARCHAR(100),
  document_total DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'EUR',
  
  -- OCR/Classification
  is_verified BOOLEAN DEFAULT false,
  extraction_status VARCHAR(50) DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_entity ON receipts(entity_type, entity_id);
CREATE INDEX idx_receipts_extraction_status ON receipts(extraction_status);
CREATE INDEX idx_receipts_receipt_type ON receipts(receipt_type);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks payments received for invoices';
COMMENT ON TABLE receipts IS 'Stores receipt/justificante files attached to various entities';
COMMENT ON TABLE bank_accounts IS 'Bank account information for payment tracking';

COMMENT ON COLUMN payments.payment_method IS 'Payment method: bank_transfer, card, cash, cheque, paypal, stripe, other';
COMMENT ON COLUMN payments.status IS 'Payment status: registered, reconciled, rejected';
COMMENT ON COLUMN receipts.entity_type IS 'Type of entity this receipt is attached to';
COMMENT ON COLUMN receipts.extraction_status IS 'OCR extraction status: pending, processing, completed, failed';
COMMENT ON COLUMN receipts.extracted_data IS 'JSON data extracted by OCR (total, vendor, date, etc.)';
