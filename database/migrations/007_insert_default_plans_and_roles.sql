-- Migration: Insert default company plans and user roles
-- This populates the system with initial plans and roles

-- ===== INSERT DEFAULT COMPANY PLANS =====
INSERT INTO public.company_plans (
  name, display_name, description, 
  max_users, max_documents_per_month, max_storage_gb,
  has_approval_workflow, has_advanced_analytics, has_api_access, 
  has_custom_integrations, has_priority_support,
  monthly_price_czk, yearly_price_czk
) VALUES 
-- Free Plan
(
  'free', 'Zdarma', 'Základní plán pro malé firmy a testování',
  2, 50, 1,
  false, false, false, false, false,
  0.00, 0.00
),
-- Basic Plan  
(
  'basic', 'Základní', 'Pro malé firmy s pokročilými funkcemi',
  5, 200, 5,
  true, false, false, false, false,
  990.00, 9900.00
),
-- Premium Plan
(
  'premium', 'Premium', 'Pro střední firmy s pokročilými analýzami',
  20, 1000, 20,
  true, true, true, false, true,
  2990.00, 29900.00
),
-- Enterprise Plan
(
  'enterprise', 'Enterprise', 'Pro velké firmy s neomezenými možnostmi',
  -1, -1, -1, -- -1 means unlimited
  true, true, true, true, true,
  9990.00, 99900.00
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_users = EXCLUDED.max_users,
  max_documents_per_month = EXCLUDED.max_documents_per_month,
  max_storage_gb = EXCLUDED.max_storage_gb,
  has_approval_workflow = EXCLUDED.has_approval_workflow,
  has_advanced_analytics = EXCLUDED.has_advanced_analytics,
  has_api_access = EXCLUDED.has_api_access,
  has_custom_integrations = EXCLUDED.has_custom_integrations,
  has_priority_support = EXCLUDED.has_priority_support,
  monthly_price_czk = EXCLUDED.monthly_price_czk,
  yearly_price_czk = EXCLUDED.yearly_price_czk,
  updated_at = NOW();

-- ===== INSERT DEFAULT USER ROLES =====
INSERT INTO public.user_roles (
  name, display_name, description,
  permissions,
  can_manage_company, can_manage_users, can_upload_documents,
  can_approve_documents, can_view_analytics, can_export_data,
  is_system_role
) VALUES 
-- Owner Role
(
  'owner', 'Vlastník', 'Majitel firmy s plnými oprávněními',
  '{
    "company": ["read", "write", "delete"],
    "users": ["read", "write", "delete", "invite"],
    "documents": ["read", "write", "delete", "approve"],
    "analytics": ["read", "export"],
    "settings": ["read", "write"],
    "billing": ["read", "write"]
  }'::jsonb,
  true, true, true, true, true, true, true
),
-- Admin Role
(
  'admin', 'Administrátor', 'Správce s rozšířenými oprávněními',
  '{
    "company": ["read", "write"],
    "users": ["read", "write", "invite"],
    "documents": ["read", "write", "approve"],
    "analytics": ["read", "export"],
    "settings": ["read", "write"],
    "billing": ["read"]
  }'::jsonb,
  true, true, true, true, true, true, true
),
-- Manager Role
(
  'manager', 'Manažer', 'Vedoucí s oprávněním schvalovat dokumenty',
  '{
    "company": ["read"],
    "users": ["read"],
    "documents": ["read", "write", "approve"],
    "analytics": ["read"],
    "settings": ["read"],
    "billing": []
  }'::jsonb,
  false, false, true, true, true, false, true
),
-- User Role
(
  'user', 'Uživatel', 'Standardní uživatel s přístupem k dokumentům',
  '{
    "company": ["read"],
    "users": ["read"],
    "documents": ["read", "write"],
    "analytics": [],
    "settings": ["read"],
    "billing": []
  }'::jsonb,
  false, false, true, false, false, false, true
),
-- Viewer Role
(
  'viewer', 'Prohlížeč', 'Pouze pro čtení dokumentů a základních informací',
  '{
    "company": ["read"],
    "users": ["read"],
    "documents": ["read"],
    "analytics": [],
    "settings": ["read"],
    "billing": []
  }'::jsonb,
  false, false, false, false, false, false, true
),
-- Accountant Role
(
  'accountant', 'Účetní', 'Specializovaná role pro finanční dokumenty',
  '{
    "company": ["read"],
    "users": ["read"],
    "documents": ["read", "write", "approve"],
    "analytics": ["read", "export"],
    "settings": ["read"],
    "billing": ["read"]
  }'::jsonb,
  false, false, true, true, true, true, true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  can_manage_company = EXCLUDED.can_manage_company,
  can_manage_users = EXCLUDED.can_manage_users,
  can_upload_documents = EXCLUDED.can_upload_documents,
  can_approve_documents = EXCLUDED.can_approve_documents,
  can_view_analytics = EXCLUDED.can_view_analytics,
  can_export_data = EXCLUDED.can_export_data,
  updated_at = NOW();

-- ===== CREATE HELPER FUNCTIONS =====

-- Function to get company plan limits
CREATE OR REPLACE FUNCTION get_company_plan_limits(company_uuid UUID)
RETURNS TABLE (
  max_users INTEGER,
  max_documents_per_month INTEGER,
  max_storage_gb INTEGER,
  has_approval_workflow BOOLEAN,
  has_advanced_analytics BOOLEAN,
  has_api_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.max_users,
    cp.max_documents_per_month,
    cp.max_storage_gb,
    cp.has_approval_workflow,
    cp.has_advanced_analytics,
    cp.has_api_access
  FROM public.companies c
  JOIN public.company_plans cp ON c.plan_id = cp.id
  WHERE c.id = company_uuid AND c.is_active = true AND cp.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION user_can_perform_action(
  user_uuid UUID,
  company_uuid UUID,
  action_type TEXT,
  resource_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  resource_permissions TEXT[];
BEGIN
  -- Get user permissions for the company
  SELECT ur.permissions->resource_type INTO user_permissions
  FROM public.company_users cu
  JOIN public.user_roles ur ON cu.role_id = ur.id
  WHERE cu.user_id = user_uuid 
    AND cu.company_id = company_uuid 
    AND cu.is_active = true
    AND ur.is_active = true;
  
  -- Check if user has the required permission
  IF user_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  -- Convert JSONB array to TEXT array
  SELECT ARRAY(SELECT jsonb_array_elements_text(user_permissions)) INTO resource_permissions;
  
  -- Check if action is allowed
  RETURN action_type = ANY(resource_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update company usage statistics
CREATE OR REPLACE FUNCTION update_company_usage(
  company_uuid UUID,
  increment_users INTEGER DEFAULT 0,
  increment_documents INTEGER DEFAULT 0,
  increment_storage_gb DECIMAL DEFAULT 0.0
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.companies 
  SET 
    current_users_count = GREATEST(0, current_users_count + increment_users),
    current_month_documents = GREATEST(0, current_month_documents + increment_documents),
    current_storage_gb = GREATEST(0.0, current_storage_gb + increment_storage_gb),
    updated_at = NOW()
  WHERE id = company_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check company limits
CREATE OR REPLACE FUNCTION check_company_limits(
  company_uuid UUID,
  check_type TEXT -- 'users', 'documents', 'storage'
)
RETURNS TABLE (
  current_usage DECIMAL,
  limit_value DECIMAL,
  is_over_limit BOOLEAN,
  usage_percentage DECIMAL
) AS $$
DECLARE
  company_record RECORD;
  plan_record RECORD;
BEGIN
  -- Get company and plan data
  SELECT c.*, cp.* INTO company_record, plan_record
  FROM public.companies c
  JOIN public.company_plans cp ON c.plan_id = cp.id
  WHERE c.id = company_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check specific limit type
  CASE check_type
    WHEN 'users' THEN
      RETURN QUERY SELECT 
        company_record.current_users_count::DECIMAL,
        CASE WHEN plan_record.max_users = -1 THEN 999999::DECIMAL ELSE plan_record.max_users::DECIMAL END,
        CASE WHEN plan_record.max_users = -1 THEN false ELSE company_record.current_users_count > plan_record.max_users END,
        CASE WHEN plan_record.max_users = -1 THEN 0::DECIMAL 
             ELSE (company_record.current_users_count::DECIMAL / plan_record.max_users::DECIMAL * 100) END;
    
    WHEN 'documents' THEN
      RETURN QUERY SELECT 
        company_record.current_month_documents::DECIMAL,
        CASE WHEN plan_record.max_documents_per_month = -1 THEN 999999::DECIMAL ELSE plan_record.max_documents_per_month::DECIMAL END,
        CASE WHEN plan_record.max_documents_per_month = -1 THEN false ELSE company_record.current_month_documents > plan_record.max_documents_per_month END,
        CASE WHEN plan_record.max_documents_per_month = -1 THEN 0::DECIMAL 
             ELSE (company_record.current_month_documents::DECIMAL / plan_record.max_documents_per_month::DECIMAL * 100) END;
    
    WHEN 'storage' THEN
      RETURN QUERY SELECT 
        company_record.current_storage_gb,
        CASE WHEN plan_record.max_storage_gb = -1 THEN 999999::DECIMAL ELSE plan_record.max_storage_gb::DECIMAL END,
        CASE WHEN plan_record.max_storage_gb = -1 THEN false ELSE company_record.current_storage_gb > plan_record.max_storage_gb END,
        CASE WHEN plan_record.max_storage_gb = -1 THEN 0::DECIMAL 
             ELSE (company_record.current_storage_gb / plan_record.max_storage_gb::DECIMAL * 100) END;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
