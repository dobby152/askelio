-- Script pro vytvoření premium testovacího účtu
-- Spusť tento script v Supabase SQL Editor

-- 1. Nejdřív si vytvoř účet přes Supabase Auth UI nebo registraci na webu
-- Email: premium@askelio.cz
-- Heslo: PremiumTest123!

-- 2. Pak spusť tento script pro upgrade na premium
-- (nahraď USER_ID_HERE skutečným UUID z auth.users tabulky)

-- Najdi své user ID (spusť po registraci)
SELECT id, email FROM auth.users WHERE email = 'premium@askelio.cz';

-- Upgrade na premium (nahraď 'YOUR_USER_ID_HERE' skutečným UUID)
UPDATE public.users 
SET 
    subscription_tier = 'premium',
    subscription_expires_at = NOW() + INTERVAL '1 year',
    credit_balance = 500.00,
    total_credits_purchased = 500.00,
    total_credits_used = 25.50,
    updated_at = NOW()
WHERE email = 'premium@askelio.cz';

-- Přidej premium purchase transakci
INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    category,
    metadata,
    payment_method,
    payment_reference,
    payment_status,
    balance_before,
    balance_after
) 
SELECT 
    id,
    500.00,
    'purchase',
    'Premium subscription purchase - 500 credits',
    'subscription',
    '{"package": "premium_yearly", "payment_id": "test_payment_123"}',
    'stripe',
    'pi_test_premium_123',
    'completed',
    0.00,
    500.00
FROM public.users WHERE email = 'premium@askelio.cz';

-- Přidej testovací usage transakce
INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    category,
    session_id,
    metadata,
    processing_cost,
    model_used,
    tokens_used,
    balance_before,
    balance_after
) 
SELECT 
    id,
    -0.15,
    'usage',
    'Document processing - invoice_test.pdf',
    'document_processing',
    'session_test_1',
    '{"file_size": "2.3MB", "pages": 3}',
    0.15,
    'claude-3.5-sonnet',
    1250,
    500.00,
    499.85
FROM public.users WHERE email = 'premium@askelio.cz';

INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    category,
    session_id,
    metadata,
    processing_cost,
    model_used,
    tokens_used,
    balance_before,
    balance_after
) 
SELECT 
    id,
    -0.08,
    'usage',
    'Document processing - receipt_test.jpg',
    'document_processing',
    'session_test_2',
    '{"file_size": "1.1MB", "pages": 1}',
    0.08,
    'gpt-4o',
    850,
    499.85,
    499.77
FROM public.users WHERE email = 'premium@askelio.cz';

INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    category,
    session_id,
    metadata,
    processing_cost,
    model_used,
    tokens_used,
    balance_before,
    balance_after
) 
SELECT 
    id,
    -0.25,
    'usage',
    'Document processing - contract_test.pdf',
    'document_processing',
    'session_test_3',
    '{"file_size": "4.1MB", "pages": 8}',
    0.25,
    'claude-3.5-sonnet',
    2100,
    499.77,
    499.52
FROM public.users WHERE email = 'premium@askelio.cz';

-- Přidej bonus kredity
INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    category,
    metadata,
    balance_before,
    balance_after
) 
SELECT 
    id,
    50.00,
    'bonus',
    'Premium welcome bonus - 50 extra credits',
    'bonus',
    '{"bonus_type": "premium_welcome", "campaign": "2025_launch"}',
    499.52,
    549.52
FROM public.users WHERE email = 'premium@askelio.cz';

-- Aktualizuj finální zůstatek
UPDATE public.users 
SET 
    credit_balance = 549.52,
    total_credits_purchased = 550.00,
    total_credits_used = 0.48,
    updated_at = NOW()
WHERE email = 'premium@askelio.cz';

-- Ověř výsledek
SELECT 
    id,
    email,
    full_name,
    credit_balance,
    total_credits_purchased,
    total_credits_used,
    subscription_tier,
    subscription_expires_at,
    created_at
FROM public.users 
WHERE email = 'premium@askelio.cz';

-- Zobraz transakce
SELECT 
    amount,
    transaction_type,
    description,
    balance_after,
    created_at
FROM public.credit_transactions 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'premium@askelio.cz')
ORDER BY created_at DESC;
