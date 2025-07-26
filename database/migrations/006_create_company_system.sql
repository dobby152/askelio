-- Migration: Create company system with plans, roles, and approval workflow
-- This creates the foundation for multi-company document management

-- ===== COMPANY PLANS TABLE =====
CREATE TABLE IF NOT EXISTS public.company_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'free', 'basic', 'premium', 'enterprise'
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Limits and features
  max_users INTEGER NOT NULL DEFAULT 1,
  max_documents_per_month INTEGER NOT NULL DEFAULT 10,
  max_storage_gb INTEGER NOT NULL DEFAULT 1,
  
  -- Features
  has_approval_workflow BOOLEAN DEFAULT false,
  has_advanced_analytics BOOLEAN DEFAULT false,
  has_api_access BOOLEAN DEFAULT false,
  has_custom_integrations BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false,
  
  -- Pricing
  monthly_price_czk DECIMAL(10,2) DEFAULT 0.00,
  yearly_price_czk DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== COMPANIES TABLE =====
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic company info
  name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT, -- IČO
  tax_number TEXT, -- DIČ
  
  -- Contact info
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CZ',
  
  -- Plan and billing
  plan_id UUID REFERENCES public.company_plans(id) NOT NULL,
  billing_email TEXT,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  approval_workflow_enabled BOOLEAN DEFAULT false,
  
  -- Usage tracking
  current_users_count INTEGER DEFAULT 0,
  current_month_documents INTEGER DEFAULT 0,
  current_storage_gb DECIMAL(10,3) DEFAULT 0.000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== USER ROLES TABLE =====
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'owner', 'admin', 'manager', 'user', 'viewer'
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions
  permissions JSONB DEFAULT '{}', -- Detailed permissions object
  
  -- Quick permission flags
  can_manage_company BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_upload_documents BOOLEAN DEFAULT true,
  can_approve_documents BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  
  -- Status
  is_system_role BOOLEAN DEFAULT true, -- Cannot be deleted
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== COMPANY USERS TABLE =====
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.user_roles(id) NOT NULL,
  
  -- User status in company
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, company_id)
);

-- ===== DOCUMENT APPROVALS TABLE =====
CREATE TABLE IF NOT EXISTS public.document_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Approval workflow
  workflow_step INTEGER DEFAULT 1, -- Current step in approval process
  total_steps INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  
  -- Current approver
  current_approver_id UUID REFERENCES public.users(id),
  
  -- Approval history
  approval_history JSONB DEFAULT '[]', -- Array of approval steps
  
  -- Metadata
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- ===== COMPANY ANALYTICS TABLE =====
CREATE TABLE IF NOT EXISTS public.company_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Time period
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Document metrics
  documents_processed INTEGER DEFAULT 0,
  documents_approved INTEGER DEFAULT 0,
  documents_rejected INTEGER DEFAULT 0,
  average_processing_time DECIMAL(8,3), -- in seconds
  
  -- User metrics
  active_users INTEGER DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  
  -- Financial metrics
  total_amount_processed DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'CZK',
  
  -- Performance metrics
  accuracy_percentage DECIMAL(5,2),
  cost_savings_czk DECIMAL(10,2) DEFAULT 0.00,
  
  -- Raw data
  raw_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, period_type, period_start)
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_companies_plan_id ON public.companies(plan_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON public.document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_company_id ON public.document_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON public.document_approvals(status);
CREATE INDEX IF NOT EXISTS idx_company_analytics_company_period ON public.company_analytics(company_id, period_type, period_start);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE public.company_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_analytics ENABLE ROW LEVEL SECURITY;

-- Company plans are public (readable by all)
CREATE POLICY "Company plans are publicly readable" ON public.company_plans
  FOR SELECT USING (is_active = true);

-- Companies can be managed by their members
CREATE POLICY "Company members can view their company" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company admins can update their company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT cu.company_id FROM public.company_users cu
      JOIN public.user_roles ur ON cu.role_id = ur.id
      WHERE cu.user_id = auth.uid() AND cu.is_active = true 
      AND (ur.can_manage_company = true OR ur.name = 'owner')
    )
  );

-- User roles are readable by all authenticated users
CREATE POLICY "User roles are readable" ON public.user_roles
  FOR SELECT USING (is_active = true);

-- Company users policies
CREATE POLICY "Users can view company members" ON public.company_users
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company admins can manage users" ON public.company_users
  FOR ALL USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu
      JOIN public.user_roles ur ON cu.role_id = ur.id
      WHERE cu.user_id = auth.uid() AND cu.is_active = true 
      AND (ur.can_manage_users = true OR ur.name IN ('owner', 'admin'))
    )
  );

-- Document approvals policies
CREATE POLICY "Users can view company document approvals" ON public.document_approvals
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Approvers can update document approvals" ON public.document_approvals
  FOR UPDATE USING (
    current_approver_id = auth.uid() OR
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu
      JOIN public.user_roles ur ON cu.role_id = ur.id
      WHERE cu.user_id = auth.uid() AND cu.is_active = true 
      AND (ur.can_approve_documents = true OR ur.name IN ('owner', 'admin', 'manager'))
    )
  );

-- Company analytics policies
CREATE POLICY "Company members can view analytics" ON public.company_analytics
  FOR SELECT USING (
    company_id IN (
      SELECT cu.company_id FROM public.company_users cu
      JOIN public.user_roles ur ON cu.role_id = ur.id
      WHERE cu.user_id = auth.uid() AND cu.is_active = true 
      AND (ur.can_view_analytics = true OR ur.name IN ('owner', 'admin', 'manager'))
    )
  );

-- ===== TRIGGERS =====
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_approvals_updated_at
  BEFORE UPDATE ON public.document_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_analytics_updated_at
  BEFORE UPDATE ON public.company_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
