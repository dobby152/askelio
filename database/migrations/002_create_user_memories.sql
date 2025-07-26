-- Migration: Create user_memories table for storing user-specific memories and context

CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Memory content and classification
  memory_content TEXT NOT NULL,
  memory_type TEXT CHECK (memory_type IN ('conversation', 'preference', 'context', 'document_history', 'system_note')) DEFAULT 'conversation',
  
  -- Memory metadata
  title TEXT, -- Optional title for the memory
  tags TEXT[], -- Array of tags for categorization
  metadata JSONB DEFAULT '{}', -- Additional structured data
  
  -- Memory importance and relevance
  importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  relevance_score DECIMAL(3,2) DEFAULT 1.00 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  
  -- Memory lifecycle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Create policies for user_memories table
CREATE POLICY "Users can manage own memories" ON public.user_memories
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_memories_updated_at
  BEFORE UPDATE ON public.user_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON public.user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_active ON public.user_memories(is_active);
CREATE INDEX IF NOT EXISTS idx_user_memories_created_at ON public.user_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON public.user_memories(importance_score);
CREATE INDEX IF NOT EXISTS idx_user_memories_tags ON public.user_memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_memories_metadata ON public.user_memories USING GIN(metadata);

-- Create function to clean up expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_memories 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user memories with filtering
CREATE OR REPLACE FUNCTION public.get_user_memories(
  p_user_id UUID,
  p_memory_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  memory_content TEXT,
  memory_type TEXT,
  title TEXT,
  tags TEXT[],
  metadata JSONB,
  importance_score INTEGER,
  relevance_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.memory_content,
    m.memory_type,
    m.title,
    m.tags,
    m.metadata,
    m.importance_score,
    m.relevance_score,
    m.created_at
  FROM public.user_memories m
  WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.importance_score DESC, m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
