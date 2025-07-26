// Supabase client configuration
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nfmjqnojvjjapszgwcfd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please check your .env.local file.')
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for our database (extended from Supabase)
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  credit_balance: number
  total_credits_purchased: number
  total_credits_used: number
  subscription_tier: 'free' | 'basic' | 'premium'
  subscription_expires_at?: string
  preferred_language: 'cs' | 'en' | 'sk'
  preferred_currency: 'CZK' | 'EUR' | 'USD'
  created_at: string
  updated_at: string
}

export interface UserMemory {
  id: string
  user_id: string
  memory_content: string
  memory_type: 'conversation' | 'preference' | 'context' | 'document_history' | 'system_note'
  title?: string
  tags: string[]
  metadata: Record<string, any>
  importance_score: number
  relevance_score: number
  is_active: boolean
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
  description: string
  category?: string
  document_id?: string
  session_id?: string
  processing_cost?: number
  model_used?: string
  tokens_used?: number
  payment_method?: string
  payment_reference?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  balance_before: number
  balance_after: number
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_path?: string
  file_size?: number
  file_type: string
  file_hash?: string
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
  processing_mode: 'accuracy_first' | 'speed_first' | 'cost_effective'
  pages: number
  language: string
  document_type?: string
  extracted_text?: string
  structured_data: Record<string, any>
  confidence_score?: number
  accuracy_percentage?: number
  ocr_provider?: string
  llm_model?: string
  processing_cost?: number
  processing_time?: number
  tokens_used?: number
  error_message?: string
  error_code?: string
  retry_count: number
  metadata: Record<string, any>
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
  processed_at?: string
  expires_at?: string
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
