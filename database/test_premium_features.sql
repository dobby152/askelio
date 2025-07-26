-- Test script pro premium funkce
-- Spusť po vytvoření premium účtu

-- 1. Test credit systému
SELECT 
    'Credit Balance Test' as test_name,
    credit_balance,
    subscription_tier,
    CASE 
        WHEN subscription_tier = 'premium' AND credit_balance > 100 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.users 
WHERE email = 'premium@askelio.cz';

-- 2. Test transakční historie
SELECT 
    'Transaction History Test' as test_name,
    COUNT(*) as transaction_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.credit_transactions 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'premium@askelio.cz');

-- 3. Test premium subscription
SELECT 
    'Premium Subscription Test' as test_name,
    subscription_tier,
    subscription_expires_at > NOW() as is_active,
    CASE 
        WHEN subscription_tier = 'premium' AND subscription_expires_at > NOW() THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.users 
WHERE email = 'premium@askelio.cz';

-- 4. Test rate limiting (premium má vyšší limity)
SELECT 
    'Rate Limit Test' as test_name,
    subscription_tier,
    CASE subscription_tier
        WHEN 'free' THEN '100 req/hour'
        WHEN 'basic' THEN '1000 req/hour'
        WHEN 'premium' THEN '10000 req/hour'
    END as rate_limit,
    CASE 
        WHEN subscription_tier = 'premium' THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM public.users 
WHERE email = 'premium@askelio.cz';

-- 5. Simulace zpracování dokumentu (test credit usage)
DO $$
DECLARE
    user_uuid UUID;
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Získej user ID
    SELECT id, credit_balance INTO user_uuid, current_balance
    FROM public.users 
    WHERE email = 'premium@askelio.cz';
    
    -- Simuluj zpracování dokumentu za 0.30 kreditů
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
    ) VALUES (
        user_uuid,
        -0.30,
        'usage',
        'TEST: Premium document processing simulation',
        'document_processing',
        'test_session_premium',
        '{"test": true, "file_size": "5.2MB", "pages": 12}',
        0.30,
        'claude-3.5-sonnet',
        3500,
        current_balance,
        current_balance - 0.30
    );
    
    -- Aktualizuj user balance
    UPDATE public.users 
    SET 
        credit_balance = current_balance - 0.30,
        total_credits_used = total_credits_used + 0.30,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RAISE NOTICE 'Document processing simulation completed. New balance: %', current_balance - 0.30;
END $$;

-- 6. Zobraz finální stav účtu
SELECT 
    'Final Account State' as info,
    email,
    full_name,
    subscription_tier,
    credit_balance,
    total_credits_purchased,
    total_credits_used,
    subscription_expires_at,
    CASE 
        WHEN subscription_tier = 'premium' 
        AND credit_balance > 0 
        AND subscription_expires_at > NOW() 
        THEN '✅ PREMIUM ACCOUNT READY'
        ELSE '❌ SETUP INCOMPLETE'
    END as status
FROM public.users 
WHERE email = 'premium@askelio.cz';

-- 7. Zobraz posledních 5 transakcí
SELECT 
    'Recent Transactions' as info,
    transaction_type,
    amount,
    description,
    balance_after,
    created_at
FROM public.credit_transactions 
WHERE user_id = (SELECT id FROM public.users WHERE email = 'premium@askelio.cz')
ORDER BY created_at DESC
LIMIT 5;
