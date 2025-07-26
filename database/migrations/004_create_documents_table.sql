-- Migration: Create documents table for user document processing history

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File information
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT, -- Size in bytes
  file_type TEXT NOT NULL, -- MIME type
  file_hash TEXT, -- SHA-256 hash for deduplication
  
  -- Processing information
  status TEXT CHECK (status IN ('uploading', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'uploading',
  processing_mode TEXT CHECK (processing_mode IN ('accuracy_first', 'speed_first', 'cost_effective')) DEFAULT 'accuracy_first',
  
  -- Document structure
  pages INTEGER DEFAULT 1,
  language TEXT DEFAULT 'cs',
  document_type TEXT, -- 'invoice', 'receipt', 'contract', etc.
  
  -- Processing results
  extracted_text TEXT,
  structured_data JSONB DEFAULT '{}', -- Extracted structured data
  confidence_score DECIMAL(4,3), -- Overall confidence (0.000-1.000)
  accuracy_percentage DECIMAL(5,2), -- Accuracy as percentage
  
  -- Processing details
  ocr_provider TEXT, -- 'google_vision', 'azure_cv', 'tesseract', etc.
  llm_model TEXT, -- 'claude-3.5-sonnet', 'gpt-4o', etc.
  processing_cost DECIMAL(10,4), -- Cost in credits
  processing_time DECIMAL(8,3), -- Processing time in seconds
  tokens_used INTEGER, -- Total tokens consumed
  
  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata and tags
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  notes TEXT, -- User notes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE -- Optional document expiration
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents table
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_processed_at ON public.documents(processed_at);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON public.documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(structured_data);

-- Create extracted_fields table for detailed field extraction
CREATE TABLE IF NOT EXISTS public.extracted_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Field information
  field_name TEXT NOT NULL, -- e.g., 'invoice_number', 'total_amount', 'due_date'
  field_value TEXT, -- Extracted value
  field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'currency', 'boolean', 'email', 'phone')) DEFAULT 'text',
  
  -- Extraction details
  confidence DECIMAL(4,3), -- Field-specific confidence
  extraction_method TEXT, -- 'ocr', 'llm', 'regex', 'manual'
  source_location JSONB, -- Coordinates or region where field was found
  
  -- Validation
  is_validated BOOLEAN DEFAULT false,
  validation_status TEXT CHECK (validation_status IN ('pending', 'valid', 'invalid', 'needs_review')) DEFAULT 'pending',
  validation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for extracted_fields
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own extracted fields" ON public.extracted_fields
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_extracted_fields_updated_at
  BEFORE UPDATE ON public.extracted_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for extracted_fields
CREATE INDEX IF NOT EXISTS idx_extracted_fields_document_id ON public.extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_user_id ON public.extracted_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_field_name ON public.extracted_fields(field_name);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_validation_status ON public.extracted_fields(validation_status);

-- Create function to get user documents with filtering
CREATE OR REPLACE FUNCTION public.get_user_documents(
  p_user_id UUID,
  p_status TEXT DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  file_type TEXT,
  status TEXT,
  document_type TEXT,
  processing_cost DECIMAL,
  confidence_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.filename,
    d.file_type,
    d.status,
    d.document_type,
    d.processing_cost,
    d.confidence_score,
    d.created_at,
    d.processed_at
  FROM public.documents d
  WHERE d.user_id = p_user_id
    AND (p_status IS NULL OR d.status = p_status)
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND (d.expires_at IS NULL OR d.expires_at > NOW())
  ORDER BY d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
