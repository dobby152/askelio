// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  email: string
  credit_balance: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  file_name: string
  storage_path: string
  status: 'processing' | 'completed' | 'failed' | 'needs_review' | 'exported'
  mime_type: string
  raw_tesseract_data?: any
  raw_ai_data?: any
  final_extracted_data?: any
  confidence_score?: number
  processing_cost?: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  document_id?: string
  amount: number
  type: 'top_up' | 'usage' | 'refund' | 'correction'
  stripe_charge_id?: string
  description?: string
  created_at: string
}
