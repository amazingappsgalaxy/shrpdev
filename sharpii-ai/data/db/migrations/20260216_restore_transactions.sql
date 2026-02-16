-- Recreate credit_transactions table required by legacy code
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    reason TEXT,
    description TEXT,
    full_response JSONB,
    metadata JSONB,
    balance_before INTEGER,
    balance_after INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
