/**
 * Askelio SDK - JavaScript Client for Document Processing API v2.1.0
 * Simple, robust, and cost-effective document processing
 */

class AskelioSDK {
  constructor(baseUrl = 'http://localhost:8001', options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.options = {
      timeout: 30000, // 30 seconds default timeout
      retries: 3,
      retryDelay: 1000,
      ...options
    };
  }

  /**
   * Process a document with unified endpoint
   * @param {File} file - The file to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processDocument(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add processing options as query parameters
    const params = new URLSearchParams();
    if (options.mode) params.append('mode', options.mode);
    if (options.max_cost_czk) params.append('max_cost_czk', options.max_cost_czk);
    if (options.min_confidence) params.append('min_confidence', options.min_confidence);
    if (options.enable_fallbacks !== undefined) params.append('enable_fallbacks', options.enable_fallbacks);
    if (options.return_raw_text !== undefined) params.append('return_raw_text', options.return_raw_text);

    const url = `${this.baseUrl}/api/v1/documents/process?${params.toString()}`;
    
    return this._makeRequest(url, {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Get comprehensive system status
   * @returns {Promise<Object>} System status
   */
  async getSystemStatus() {
    return this._makeRequest(`${this.baseUrl}/api/v1/system/status`);
  }

  /**
   * Get cost statistics and usage metrics
   * @returns {Promise<Object>} Cost statistics
   */
  async getCostStatistics() {
    return this._makeRequest(`${this.baseUrl}/api/v1/system/costs`);
  }

  /**
   * Get health status of all components
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    return this._makeRequest(`${this.baseUrl}/api/v1/system/health`);
  }

  /**
   * Get list of processed documents (legacy endpoint)
   * @returns {Promise<Object>} Documents list
   */
  async getDocuments() {
    return this._makeRequest(`${this.baseUrl}/documents`);
  }

  /**
   * Get specific document details (legacy endpoint)
   * @param {number} id - Document ID
   * @returns {Promise<Object>} Document details
   */
  async getDocument(id) {
    return this._makeRequest(`${this.baseUrl}/documents/${id}`);
  }

  /**
   * Process document with progress tracking
   * @param {File} file - The file to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Processing result
   */
  async processDocumentWithProgress(file, options = {}, onProgress = null) {
    if (onProgress) {
      onProgress({ stage: 'uploading', message: 'Uploading file...', percentage: 0 });
    }

    try {
      const result = await this.processDocument(file, options);
      
      if (onProgress) {
        onProgress({ 
          stage: 'complete', 
          message: 'Processing complete', 
          percentage: 100,
          cost_estimate: result.meta?.cost_czk 
        });
      }

      return result;
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          stage: 'error', 
          message: `Error: ${error.message}`, 
          percentage: 0 
        });
      }
      throw error;
    }
  }

  /**
   * Batch process multiple documents
   * @param {File[]} files - Array of files to process
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} Array of processing results
   */
  async batchProcessDocuments(files, options = {}, onProgress = null) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress({
          stage: 'processing',
          message: `Processing ${file.name} (${i + 1}/${total})`,
          percentage: (i / total) * 100,
          current_file: file.name
        });
      }

      try {
        const result = await this.processDocument(file, options);
        results.push({ file: file.name, result, success: true });
      } catch (error) {
        results.push({ file: file.name, error: error.message, success: false });
      }
    }

    if (onProgress) {
      onProgress({
        stage: 'complete',
        message: `Batch processing complete (${results.filter(r => r.success).length}/${total} successful)`,
        percentage: 100
      });
    }

    return results;
  }

  /**
   * Estimate processing cost before actual processing
   * @param {File} file - The file to estimate
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Cost estimate
   */
  async estimateCost(file, options = {}) {
    // Simple estimation based on file size and mode
    const fileSizeMB = file.size / (1024 * 1024);
    const mode = options.mode || 'cost_optimized';
    
    let baseCost = 0.043; // Average cost in CZK
    
    switch (mode) {
      case 'accuracy_first':
        baseCost = 0.30; // Claude pricing
        break;
      case 'speed_first':
        baseCost = 0.014; // GPT-4o-mini pricing
        break;
      case 'budget_strict':
        baseCost = 0.007; // Gemini pricing
        break;
    }

    // Adjust for file size (larger files might need more tokens)
    const sizeMultiplier = Math.min(1 + (fileSizeMB / 10), 2);
    const estimatedCost = baseCost * sizeMultiplier;

    return {
      estimated_cost_czk: Math.round(estimatedCost * 1000) / 1000,
      mode: mode,
      file_size_mb: Math.round(fileSizeMB * 100) / 100,
      confidence: 'estimate'
    };
  }

  /**
   * Validate file before processing
   * @param {File} file - The file to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];

    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);

    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!supportedTypes.includes(file.type)) {
      validation.valid = false;
      validation.errors.push(`Unsupported file type: ${file.type}`);
    }

    if (fileSizeMB > maxSizeMB) {
      validation.valid = false;
      validation.errors.push(`File too large: ${fileSizeMB.toFixed(1)}MB (max: ${maxSizeMB}MB)`);
    }

    if (fileSizeMB > 5) {
      validation.warnings.push('Large file may take longer to process');
    }

    return validation;
  }

  /**
   * Internal method to make HTTP requests with retry logic
   * @private
   */
  async _makeRequest(url, options = {}) {
    const requestOptions = {
      headers: {
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    let lastError;
    
    for (let attempt = 0; attempt < this.options.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error;
        
        if (attempt < this.options.retries - 1) {
          await this._delay(this.options.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw new Error(`Request failed after ${this.options.retries} attempts: ${lastError.message}`);
  }

  /**
   * Utility method for delays
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AskelioSDK;
} else if (typeof window !== 'undefined') {
  window.AskelioSDK = AskelioSDK;
}

// Example usage:
/*
const sdk = new AskelioSDK('http://localhost:8001');

// Simple document processing
const result = await sdk.processDocument(file, {
  mode: 'cost_optimized',
  max_cost_czk: 0.5
});

// With progress tracking
await sdk.processDocumentWithProgress(file, options, (progress) => {
  console.log(`${progress.stage}: ${progress.percentage}%`);
});

// Batch processing
const results = await sdk.batchProcessDocuments(files, options, (progress) => {
  console.log(progress.message);
});

// System monitoring
const status = await sdk.getSystemStatus();
const costs = await sdk.getCostStatistics();
*/
