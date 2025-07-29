-- ===== MIGRATION 007: INVOICE DIRECTION SYSTEM =====
-- Adds support for automatic invoice direction detection (incoming/outgoing)
-- and company profile management for users

-- ===== EXTEND EXISTING COMPANIES TABLE =====
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- ===== INVOICE DIRECTION ENUM =====
DO $$ BEGIN
    CREATE TYPE invoice_direction AS ENUM ('incoming', 'outgoing', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===== ADD DIRECTION FIELDS TO DOCUMENTS =====
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS invoice_direction invoice_direction DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS direction_confidence DECIMAL(4,3) DEFAULT 0.000,
ADD COLUMN IF NOT EXISTS direction_method TEXT, -- 'automatic', 'manual', 'ai_assisted'
ADD COLUMN IF NOT EXISTS financial_category TEXT, -- 'revenue', 'expense', 'unknown'
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT false;

-- ===== INVOICE DIRECTION ANALYSIS =====
CREATE TABLE IF NOT EXISTS public.invoice_direction_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis results
  detected_direction invoice_direction NOT NULL,
  confidence_score DECIMAL(4,3) NOT NULL,
  analysis_method TEXT NOT NULL, -- 'company_match', 'ai_classification', 'manual'
  
  -- Matching details
  vendor_match_score DECIMAL(4,3) DEFAULT 0.000,
  customer_match_score DECIMAL(4,3) DEFAULT 0.000,
  matched_company_field TEXT, -- 'ico', 'name', 'address'
  
  -- Analysis metadata
  analysis_notes JSONB DEFAULT '{}',
  processing_time DECIMAL(8,3),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(document_id) -- One analysis per document
);

-- ===== FINANCIAL TRANSACTIONS =====
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  transaction_type TEXT CHECK (transaction_type IN ('revenue', 'expense', 'unknown')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'CZK',
  
  -- Invoice information
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  
  -- Parties involved
  vendor_name TEXT,
  vendor_ico TEXT,
  customer_name TEXT,
  customer_ico TEXT,
  
  -- Categorization
  category TEXT, -- 'office_supplies', 'services', 'products', etc.
  subcategory TEXT,
  
  -- VAT information
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(15,2),
  net_amount DECIMAL(15,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed', 'cancelled')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_documents_invoice_direction ON public.documents(invoice_direction);
CREATE INDEX IF NOT EXISTS idx_documents_financial_category ON public.documents(financial_category);
CREATE INDEX IF NOT EXISTS idx_invoice_direction_analysis_document_id ON public.invoice_direction_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(invoice_date);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE public.invoice_direction_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Invoice direction analysis policies
CREATE POLICY "Users can view own direction analysis" ON public.invoice_direction_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own direction analysis" ON public.invoice_direction_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Financial transactions policies
CREATE POLICY "Users can view own transactions" ON public.financial_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.financial_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.financial_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- ===== FUNCTIONS =====

-- Function to automatically update document direction
CREATE OR REPLACE FUNCTION update_document_direction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update financial category based on direction
  IF NEW.invoice_direction = 'outgoing' THEN
    NEW.financial_category = 'revenue';
  ELSIF NEW.invoice_direction = 'incoming' THEN
    NEW.financial_category = 'expense';
  ELSE
    NEW.financial_category = 'unknown';
  END IF;
  
  -- Set manual review flag for low confidence
  IF NEW.direction_confidence < 0.8 THEN
    NEW.requires_manual_review = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic direction updates
DROP TRIGGER IF EXISTS trigger_update_document_direction ON public.documents;
CREATE TRIGGER trigger_update_document_direction
  BEFORE UPDATE OF invoice_direction, direction_confidence ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_direction();

-- Function to get user's primary company profile
CREATE OR REPLACE FUNCTION get_user_primary_company(user_uuid UUID)
RETURNS TABLE (
  company_id UUID,
  company_name VARCHAR,
  registration_number VARCHAR,
  tax_number VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.registration_number,
    c.tax_number
  FROM public.companies c
  JOIN public.company_users cu ON c.id = cu.company_id
  WHERE cu.user_id = user_uuid
    AND cu.is_active = true
    AND c.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMMENTS =====
COMMENT ON TABLE public.invoice_direction_analysis IS 'Analysis results for automatic invoice direction detection';
COMMENT ON TABLE public.financial_transactions IS 'Financial transactions extracted from invoices with proper categorization';
COMMENT ON COLUMN public.documents.invoice_direction IS 'Direction of invoice: incoming (expense) or outgoing (revenue)';
COMMENT ON COLUMN public.documents.financial_category IS 'Financial category derived from invoice direction';
COMMENT ON COLUMN public.companies.vat_number IS 'EU VAT identification number';
