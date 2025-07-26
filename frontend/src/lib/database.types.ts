// TypeScript types for Supabase database
// Generated from Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          credit_balance: number
          total_credits_purchased: number
          total_credits_used: number
          subscription_tier: 'free' | 'basic' | 'premium'
          subscription_expires_at: string | null
          preferred_language: 'cs' | 'en' | 'sk'
          preferred_currency: 'CZK' | 'EUR' | 'USD'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          credit_balance?: number
          total_credits_purchased?: number
          total_credits_used?: number
          subscription_tier?: 'free' | 'basic' | 'premium'
          subscription_expires_at?: string | null
          preferred_language?: 'cs' | 'en' | 'sk'
          preferred_currency?: 'CZK' | 'EUR' | 'USD'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          credit_balance?: number
          total_credits_purchased?: number
          total_credits_used?: number
          subscription_tier?: 'free' | 'basic' | 'premium'
          subscription_expires_at?: string | null
          preferred_language?: 'cs' | 'en' | 'sk'
          preferred_currency?: 'CZK' | 'EUR' | 'USD'
          created_at?: string
          updated_at?: string
        }
      }
      user_memories: {
        Row: {
          id: string
          user_id: string
          memory_content: string
          memory_type: 'conversation' | 'preference' | 'context' | 'document_history' | 'system_note'
          title: string | null
          tags: string[]
          metadata: Record<string, any>
          importance_score: number
          relevance_score: number
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memory_content: string
          memory_type?: 'conversation' | 'preference' | 'context' | 'document_history' | 'system_note'
          title?: string | null
          tags?: string[]
          metadata?: Record<string, any>
          importance_score?: number
          relevance_score?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memory_content?: string
          memory_type?: 'conversation' | 'preference' | 'context' | 'document_history' | 'system_note'
          title?: string | null
          tags?: string[]
          metadata?: Record<string, any>
          importance_score?: number
          relevance_score?: number
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
          description: string
          category: string | null
          document_id: string | null
          session_id: string | null
          metadata: Record<string, any>
          processing_cost: number | null
          model_used: string | null
          tokens_used: number | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          balance_before: number
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
          description: string
          category?: string | null
          document_id?: string | null
          session_id?: string | null
          metadata?: Record<string, any>
          processing_cost?: number | null
          model_used?: string | null
          tokens_used?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          balance_before: number
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
          description?: string
          category?: string | null
          document_id?: string | null
          session_id?: string | null
          metadata?: Record<string, any>
          processing_cost?: number | null
          model_used?: string | null
          tokens_used?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          balance_before?: number
          balance_after?: number
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_filename: string
          file_path: string | null
          file_size: number | null
          file_type: string
          file_hash: string | null
          status: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processing_mode: 'accuracy_first' | 'speed_first' | 'cost_effective'
          pages: number
          language: string
          document_type: string | null
          extracted_text: string | null
          structured_data: Record<string, any>
          confidence_score: number | null
          accuracy_percentage: number | null
          ocr_provider: string | null
          llm_model: string | null
          processing_cost: number | null
          processing_time: number | null
          tokens_used: number | null
          error_message: string | null
          error_code: string | null
          retry_count: number
          metadata: Record<string, any>
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
          processed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          original_filename: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          file_hash?: string | null
          status?: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processing_mode?: 'accuracy_first' | 'speed_first' | 'cost_effective'
          pages?: number
          language?: string
          document_type?: string | null
          extracted_text?: string | null
          structured_data?: Record<string, any>
          confidence_score?: number | null
          accuracy_percentage?: number | null
          ocr_provider?: string | null
          llm_model?: string | null
          processing_cost?: number | null
          processing_time?: number | null
          tokens_used?: number | null
          error_message?: string | null
          error_code?: string | null
          retry_count?: number
          metadata?: Record<string, any>
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          original_filename?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          file_hash?: string | null
          status?: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
          processing_mode?: 'accuracy_first' | 'speed_first' | 'cost_effective'
          pages?: number
          language?: string
          document_type?: string | null
          extracted_text?: string | null
          structured_data?: Record<string, any>
          confidence_score?: number | null
          accuracy_percentage?: number | null
          ocr_provider?: string | null
          llm_model?: string | null
          processing_cost?: number | null
          processing_time?: number | null
          tokens_used?: number | null
          error_message?: string | null
          error_code?: string | null
          retry_count?: number
          metadata?: Record<string, any>
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
          expires_at?: string | null
        }
      }
      extracted_fields: {
        Row: {
          id: string
          document_id: string
          user_id: string
          field_name: string
          field_value: string | null
          field_type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone'
          confidence: number | null
          extraction_method: string | null
          source_location: Record<string, any> | null
          is_validated: boolean
          validation_status: 'pending' | 'valid' | 'invalid' | 'needs_review'
          validation_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          field_name: string
          field_value?: string | null
          field_type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone'
          confidence?: number | null
          extraction_method?: string | null
          source_location?: Record<string, any> | null
          is_validated?: boolean
          validation_status?: 'pending' | 'valid' | 'invalid' | 'needs_review'
          validation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          field_name?: string
          field_value?: string | null
          field_type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone'
          confidence?: number | null
          extraction_method?: string | null
          source_location?: Record<string, any> | null
          is_validated?: boolean
          validation_status?: 'pending' | 'valid' | 'invalid' | 'needs_review'
          validation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          session_type: 'web' | 'api' | 'mobile'
          user_agent: string | null
          ip_address: string | null
          device_info: Record<string, any>
          location_info: Record<string, any>
          is_active: boolean
          last_activity: string
          api_calls_count: number
          api_calls_limit: number | null
          rate_limit_reset: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          created_at: string
          expires_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          session_type?: 'web' | 'api' | 'mobile'
          user_agent?: string | null
          ip_address?: string | null
          device_info?: Record<string, any>
          location_info?: Record<string, any>
          is_active?: boolean
          last_activity?: string
          api_calls_count?: number
          api_calls_limit?: number | null
          rate_limit_reset?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          created_at?: string
          expires_at: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          session_type?: 'web' | 'api' | 'mobile'
          user_agent?: string | null
          ip_address?: string | null
          device_info?: Record<string, any>
          location_info?: Record<string, any>
          is_active?: boolean
          last_activity?: string
          api_calls_count?: number
          api_calls_limit?: number | null
          rate_limit_reset?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          created_at?: string
          expires_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credit_transaction: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description: string
          p_category?: string
          p_document_id?: string
          p_session_id?: string
          p_metadata?: Record<string, any>
          p_processing_cost?: number
          p_model_used?: string
          p_tokens_used?: number
          p_payment_method?: string
          p_payment_reference?: string
          p_payment_status?: string
        }
        Returns: string
      }
      get_user_memories: {
        Args: {
          p_user_id: string
          p_memory_type?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          memory_content: string
          memory_type: string
          title: string
          tags: string[]
          metadata: Record<string, any>
          importance_score: number
          relevance_score: number
          created_at: string
        }[]
      }
      get_user_transactions: {
        Args: {
          p_user_id: string
          p_transaction_type?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          amount: number
          transaction_type: string
          description: string
          category: string
          balance_after: number
          created_at: string
        }[]
      }
      get_user_documents: {
        Args: {
          p_user_id: string
          p_status?: string
          p_document_type?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          filename: string
          file_type: string
          status: string
          document_type: string
          processing_cost: number
          confidence_score: number
          created_at: string
          processed_at: string
        }[]
      }
      cleanup_expired_memories: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
