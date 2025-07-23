/**
 * TypeScript Types for Askelio Backend API v2.1.0
 * Unified Document Processing with Cost-Effective LLM
 */

// ===== PROCESSING TYPES =====

export type ProcessingMode = 
  | "cost_optimized"    // Default: GPT-4o-mini primary (0.014 Kč/doc)
  | "accuracy_first"    // Claude 3.5 Sonnet primary (0.30 Kč/doc)
  | "speed_first"       // Fastest available
  | "budget_strict";    // Cheapest options only

export type DocumentType = 
  | "invoice" 
  | "receipt" 
  | "contract" 
  | "document" 
  | "unknown";

export interface ProcessingOptions {
  mode?: ProcessingMode;
  max_cost_czk?: number;        // Maximum cost per document in CZK
  min_confidence?: number;      // Minimum acceptable confidence (0-1)
  enable_fallbacks?: boolean;   // Enable fallback providers
  return_raw_text?: boolean;    // Include raw OCR text in response
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta: ResponseMeta;
  error: ApiError | null;
}

export interface ResponseMeta {
  processing_time?: number;
  cost_czk?: number;
  provider_used?: string;
  fallbacks_used?: string[];
  validation_notes?: string[];
  timestamp?: string;
  currency?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  supported_types?: string[];
  file_size_mb?: number;
}

// ===== DOCUMENT PROCESSING =====

export interface ProcessDocumentRequest {
  file: File;
  options?: ProcessingOptions;
}

export interface ProcessDocumentResponse {
  document_id: number;
  document_type: DocumentType;
  structured_data: StructuredData;
  confidence: number;
  raw_text?: string;
  raw_google_vision_text?: string; // 🔍 DEBUG: Raw Google Vision OCR text
}

export interface StructuredData {
  document_type: string;

  // Invoice/Receipt fields
  invoice_number?: string;
  receipt_number?: string;
  date?: string;
  due_date?: string;
  completion_date?: string;  // Datum uskutečnění plnění
  time?: string;

  // Vendor information
  vendor?: {
    name?: string;
    address?: string;
    ico?: string;      // Czech company ID
    dic?: string;      // Czech tax ID
    tax_id?: string;   // General tax ID
  };

  // Customer information
  customer?: {
    name?: string;
    address?: string;
    ico?: string;      // Customer Czech company ID
    dic?: string;      // Customer Czech tax ID
  };

  // Financial information
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    vat_rate?: number; // DPH sazba pro položku
  }>;

  totals?: {
    subtotal: number;
    vat_rate?: number;
    vat_amount?: number;
    tax_rate?: number;
    tax_amount?: number;
    total: number;
    advance_payment?: number;  // Záloha
    amount_due?: number;       // Částka k úhradě
  };

  // Payment information
  currency?: string;
  payment_method?: string;
  bank_account?: string;
  variable_symbol?: string;   // Variabilní symbol
  constant_symbol?: string;   // Konstantní symbol
  specific_symbol?: string;   // Specifický symbol

  // Metadata
  extracted_at?: string;
  validated_at?: string;
  extraction_method?: string;
  amount?: number;  // Simple amount for receipts
}

// ===== SYSTEM STATUS =====

export interface SystemStatus {
  system_ready: boolean;
  version: string;
  components: {
    ocr_manager: boolean;
    llm_engine: boolean;
    database: boolean;
  };
  capabilities: {
    supported_formats: string[];
    processing_modes: ProcessingMode[];
    document_types: DocumentType[];
  };
  llm_system: LLMSystemStatus;
  statistics: ProcessingStatistics;
}

export interface LLMSystemStatus {
  providers_available: {
    gpt_4o_mini: boolean;
    claude_35_sonnet: boolean;
  };
  strategy: string;
  primary_provider: string;
  fallback_provider: string;
  estimated_costs: {
    gpt_4o_mini_per_invoice: string;
    claude_per_invoice: string;
    average_hybrid: string;
  };
}

export interface ProcessingStatistics {
  processing_stats: {
    total_processed: number;
    successful: number;
    failed: number;
    success_rate_percent: number;
  };
  cost_stats: {
    total_cost_czk: number;
    average_cost_per_document: number;
    estimated_monthly_cost: number;
  };
  performance_stats: {
    average_processing_time: number;
    provider_usage: Record<string, number>;
    fallback_usage: number;
  };
}

// ===== COST STATISTICS =====

export interface CostStatistics {
  processing_costs: {
    total_cost_czk: number;
    average_cost_per_document: number;
    estimated_monthly_cost: number;
  };
  llm_costs: {
    total_usd: number;
    total_czk: number;
    avg_per_invoice_usd: number;
    avg_per_invoice_czk: number;
  };
  efficiency_metrics: {
    success_rate: number;
    average_processing_time: number;
    cost_per_success?: number;
  };
  provider_usage: {
    unified_processor: Record<string, number>;
    llm_engine: Record<string, number>;
  };
}

// ===== HEALTH CHECK =====

export interface HealthStatus {
  overall_health: boolean;
  status: "healthy" | "degraded";
  components: {
    api: boolean;
    database: boolean;
    ocr_engine: boolean;
    llm_engine: boolean;
    unified_processor: boolean;
  };
  issues: string[];
  version: string;
}

// ===== ERROR CODES =====

export const ERROR_CODES = {
  NO_FILE: "NO_FILE",
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  PROCESSING_FAILED: "PROCESSING_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  STATUS_ERROR: "STATUS_ERROR",
  STATS_ERROR: "STATS_ERROR",
  HEALTH_ISSUES: "HEALTH_ISSUES"
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ===== UTILITY TYPES =====

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ProcessingProgress {
  stage: "uploading" | "ocr" | "llm" | "validation" | "storage" | "complete" | "error";
  message: string;
  percentage: number;
  cost_estimate?: number;
  current_file?: string;
}

// ===== CONSTANTS =====

export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/bmp",
  "image/tiff"
] as const;

export const MAX_FILE_SIZE_MB = 10;

export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  mode: "cost_optimized",
  max_cost_czk: 5.0,  // 🚀 Increased for powerful models (Claude, GPT-4o)
  min_confidence: 0.8,
  enable_fallbacks: true,
  return_raw_text: false
};
