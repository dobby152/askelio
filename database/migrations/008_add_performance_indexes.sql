-- Performance Optimization: Composite Indexes for Askelio Database
-- Created: 2025-01-30
-- Purpose: Add composite indexes for frequently queried columns to improve performance

-- ===== DOCUMENTS TABLE INDEXES =====

-- Index for user document queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_documents_user_status_created 
ON public.documents (user_id, status, created_at DESC);

-- Index for document type and status filtering
CREATE INDEX IF NOT EXISTS idx_documents_type_status_user 
ON public.documents (document_type, status, user_id);

-- Index for processing performance queries
CREATE INDEX IF NOT EXISTS idx_documents_processing_performance 
ON public.documents (status, processing_time, created_at DESC) 
WHERE processing_time IS NOT NULL;

-- Index for confidence score analysis
CREATE INDEX IF NOT EXISTS idx_documents_confidence_user 
ON public.documents (user_id, confidence_score DESC, created_at DESC) 
WHERE confidence_score IS NOT NULL;

-- Index for file hash lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_documents_file_hash 
ON public.documents (file_hash) 
WHERE file_hash IS NOT NULL;

-- ===== USERS TABLE INDEXES =====

-- Index for credit balance queries
CREATE INDEX IF NOT EXISTS idx_users_credit_balance 
ON public.users (credit_balance DESC, subscription_tier);

-- Index for subscription management
CREATE INDEX IF NOT EXISTS idx_users_subscription 
ON public.users (subscription_tier, subscription_expires_at) 
WHERE subscription_expires_at IS NOT NULL;

-- ===== CREDIT TRANSACTIONS INDEXES =====

-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date 
ON public.credit_transactions (user_id, created_at DESC);

-- Index for transaction type analysis
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type_amount 
ON public.credit_transactions (transaction_type, amount, created_at DESC);

-- ===== USER MEMORIES INDEXES =====

-- Index for active memories by user
CREATE INDEX IF NOT EXISTS idx_user_memories_active 
ON public.user_memories (user_id, is_active, importance_score DESC) 
WHERE is_active = true;

-- Index for memory expiration cleanup
CREATE INDEX IF NOT EXISTS idx_user_memories_expiration 
ON public.user_memories (expires_at) 
WHERE expires_at IS NOT NULL AND is_active = true;

-- ===== COMPANY SYSTEM INDEXES =====

-- Index for company user relationships
CREATE INDEX IF NOT EXISTS idx_company_users_company_role 
ON public.company_users (company_id, role, is_active) 
WHERE is_active = true;

-- Index for user company access
CREATE INDEX IF NOT EXISTS idx_company_users_user_active 
ON public.company_users (user_id, is_active, role) 
WHERE is_active = true;

-- Index for company document access
CREATE INDEX IF NOT EXISTS idx_documents_company_status 
ON public.documents (company_id, status, created_at DESC) 
WHERE company_id IS NOT NULL;

-- ===== SESSION MANAGEMENT INDEXES =====

-- Index for active session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_active 
ON public.user_sessions (session_token, is_active) 
WHERE is_active = true;

-- Index for session cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiration 
ON public.user_sessions (expires_at) 
WHERE is_active = true;

-- ===== ANALYTICS AND REPORTING INDEXES =====

-- Index for monthly document processing analytics
CREATE INDEX IF NOT EXISTS idx_documents_monthly_analytics 
ON public.documents (
    user_id, 
    date_trunc('month', created_at), 
    status, 
    document_type
) WHERE status = 'completed';

-- Index for cost analysis
CREATE INDEX IF NOT EXISTS idx_documents_cost_analysis 
ON public.documents (
    user_id, 
    processing_cost, 
    created_at DESC
) WHERE processing_cost > 0;

-- Index for processing time performance analysis
CREATE INDEX IF NOT EXISTS idx_documents_performance_analysis 
ON public.documents (
    document_type, 
    processing_time, 
    confidence_score, 
    created_at DESC
) WHERE status = 'completed' AND processing_time IS NOT NULL;

-- ===== FULL-TEXT SEARCH INDEXES =====

-- Full-text search index for document content
CREATE INDEX IF NOT EXISTS idx_documents_fulltext_search 
ON public.documents USING gin(to_tsvector('english', 
    COALESCE(extracted_text, '') || ' ' || 
    COALESCE(filename, '') || ' ' || 
    COALESCE(notes, '')
));

-- Full-text search for structured data (JSONB)
CREATE INDEX IF NOT EXISTS idx_documents_structured_data_gin 
ON public.documents USING gin(structured_data);

-- ===== PARTIAL INDEXES FOR SPECIFIC USE CASES =====

-- Index for failed documents that need reprocessing
CREATE INDEX IF NOT EXISTS idx_documents_failed_recent 
ON public.documents (user_id, created_at DESC) 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days';

-- Index for high-value documents (premium features)
CREATE INDEX IF NOT EXISTS idx_documents_premium 
ON public.documents (user_id, confidence_score DESC, processing_cost DESC) 
WHERE confidence_score > 0.9 AND processing_cost > 0;

-- ===== MAINTENANCE NOTES =====

-- These indexes should be monitored for usage and performance impact
-- Use EXPLAIN ANALYZE to verify query performance improvements
-- Consider dropping unused indexes during maintenance windows
-- Monitor index size and fragmentation regularly

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- To check index sizes:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes 
-- ORDER BY pg_relation_size(indexrelid) DESC;
