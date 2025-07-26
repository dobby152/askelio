-- Migration: Create credit_transactions table for tracking credit usage and purchases

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  amount DECIMAL(10,2) NOT NULL, -- Positive for purchases, negative for usage
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'adjustment')) NOT NULL,
  
  -- Transaction description and context
  description TEXT NOT NULL,
  category TEXT, -- e.g., 'document_processing', 'api_call', 'subscription'
  
  -- Related entities
  document_id UUID, -- Reference to processed document (if applicable)
  session_id TEXT, -- Reference to processing session
  
  -- Transaction metadata
  metadata JSONB DEFAULT '{}', -- Additional structured data
  
  -- Cost breakdown (for usage transactions)
  processing_cost DECIMAL(10,4), -- Actual processing cost in credits
  model_used TEXT, -- AI model used (Claude, GPT-4o, etc.)
  tokens_used INTEGER, -- Number of tokens consumed
  
  -- Payment information (for purchase transactions)
  payment_method TEXT, -- 'stripe', 'paypal', 'bank_transfer', etc.
  payment_reference TEXT, -- External payment ID
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
  
  -- Balance tracking
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_transactions table
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_document_id ON public.credit_transactions(document_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_status ON public.credit_transactions(payment_status);

-- Create function to add credit transaction and update user balance
CREATE OR REPLACE FUNCTION public.add_credit_transaction(
  p_user_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT,
  p_category TEXT DEFAULT NULL,
  p_document_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_processing_cost DECIMAL DEFAULT NULL,
  p_model_used TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT 'completed'
)
RETURNS UUID AS $$
DECLARE
  current_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
  transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT credit_balance INTO current_balance
  FROM public.users
  WHERE id = p_user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + p_amount;
  
  -- Prevent negative balance for usage transactions
  IF p_transaction_type = 'usage' AND new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', current_balance, ABS(p_amount);
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.credit_transactions (
    user_id, amount, transaction_type, description, category,
    document_id, session_id, metadata, processing_cost, model_used,
    tokens_used, payment_method, payment_reference, payment_status,
    balance_before, balance_after
  ) VALUES (
    p_user_id, p_amount, p_transaction_type, p_description, p_category,
    p_document_id, p_session_id, p_metadata, p_processing_cost, p_model_used,
    p_tokens_used, p_payment_method, p_payment_reference, p_payment_status,
    current_balance, new_balance
  ) RETURNING id INTO transaction_id;
  
  -- Update user balance and statistics
  UPDATE public.users
  SET 
    credit_balance = new_balance,
    total_credits_purchased = CASE 
      WHEN p_transaction_type IN ('purchase', 'bonus') THEN total_credits_purchased + p_amount
      ELSE total_credits_purchased
    END,
    total_credits_used = CASE 
      WHEN p_transaction_type = 'usage' THEN total_credits_used + ABS(p_amount)
      ELSE total_credits_used
    END,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user transaction history
CREATE OR REPLACE FUNCTION public.get_user_transactions(
  p_user_id UUID,
  p_transaction_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  amount DECIMAL,
  transaction_type TEXT,
  description TEXT,
  category TEXT,
  balance_after DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.amount,
    t.transaction_type,
    t.description,
    t.category,
    t.balance_after,
    t.created_at
  FROM public.credit_transactions t
  WHERE t.user_id = p_user_id
    AND (p_transaction_type IS NULL OR t.transaction_type = p_transaction_type)
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
