-- Migration: Create user_sessions table for session management and API access

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session information
  session_token TEXT UNIQUE NOT NULL,
  session_type TEXT CHECK (session_type IN ('web', 'api', 'mobile')) DEFAULT 'web',
  
  -- Session metadata
  user_agent TEXT,
  ip_address INET,
  device_info JSONB DEFAULT '{}',
  location_info JSONB DEFAULT '{}', -- Country, city, etc.
  
  -- Session status
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- API usage tracking (for API sessions)
  api_calls_count INTEGER DEFAULT 0,
  api_calls_limit INTEGER, -- NULL for unlimited
  rate_limit_reset TIMESTAMP WITH TIME ZONE,
  
  -- Security
  refresh_token TEXT,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions table
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- Create function to create new session
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_session_type TEXT DEFAULT 'web',
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}',
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
  
  INSERT INTO public.user_sessions (
    user_id, session_token, session_type, user_agent, ip_address,
    device_info, expires_at
  ) VALUES (
    p_user_id, p_session_token, p_session_type, p_user_agent, p_ip_address,
    p_device_info, expires_at
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate and update session
CREATE OR REPLACE FUNCTION public.validate_session(
  p_session_token TEXT,
  p_update_activity BOOLEAN DEFAULT true
)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  is_valid BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    (s.is_active AND s.expires_at > NOW()) as is_valid,
    s.expires_at
  FROM public.user_sessions s
  WHERE s.session_token = p_session_token;
  
  -- Update last activity if requested and session is valid
  IF p_update_activity THEN
    UPDATE public.user_sessions
    SET 
      last_activity = NOW(),
      updated_at = NOW()
    WHERE session_token = p_session_token
      AND is_active = true
      AND expires_at > NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke user session
CREATE OR REPLACE FUNCTION public.revoke_session(
  p_session_token TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  session_found BOOLEAN := false;
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE session_token = p_session_token
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  GET DIAGNOSTICS session_found = FOUND;
  RETURN session_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get active user sessions
CREATE OR REPLACE FUNCTION public.get_user_active_sessions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  session_type TEXT,
  user_agent TEXT,
  ip_address INET,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.session_type,
    s.user_agent,
    s.ip_address,
    s.last_activity,
    s.created_at,
    s.expires_at
  FROM public.user_sessions s
  WHERE s.user_id = p_user_id
    AND s.is_active = true
    AND s.expires_at > NOW()
  ORDER BY s.last_activity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
