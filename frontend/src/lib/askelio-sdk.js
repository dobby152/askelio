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
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.refreshPromise = null;
    this.refreshTimer = null;
    this.onTokenRefresh = null; // Callback for token refresh events

    // Initialize tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      const expiresAt = localStorage.getItem('token_expires_at');
      this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;

      // Start token refresh timer if we have tokens
      if (this.authToken && this.refreshToken) {
        this.startTokenRefreshTimer();
      }
    }
  }

  /**
   * Set authentication tokens and start refresh timer
   * @param {Object} session - Session object with tokens
   */
  setAuthTokens(session) {
    this.authToken = session.access_token;
    this.refreshToken = session.refresh_token;
    this.tokenExpiresAt = session.expires_at;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', session.access_token);
      localStorage.setItem('refresh_token', session.refresh_token);
      localStorage.setItem('token_expires_at', session.expires_at.toString());
    }

    this.startTokenRefreshTimer();
  }

  /**
   * Set authentication token for API requests (legacy method)
   * @param {string} token - JWT token from Supabase
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Clear authentication tokens and stop refresh timer
   */
  clearAuthToken() {
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
    }
  }

  /**
   * Set callback for token refresh events
   * @param {Function} callback - Callback function
   */
  setTokenRefreshCallback(callback) {
    this.onTokenRefresh = callback;
  }

  /**
   * Check if token needs refresh (within 10 minutes of expiration)
   * @returns {boolean} True if token needs refresh
   */
  needsTokenRefresh() {
    if (!this.tokenExpiresAt) return false;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = this.tokenExpiresAt - now;

    // Refresh if token expires within 10 minutes (600 seconds)
    return timeUntilExpiry <= 600;
  }

  /**
   * Start automatic token refresh timer
   */
  startTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenExpiresAt) return;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilRefresh = Math.max(0, this.tokenExpiresAt - now - 600); // Refresh 10 minutes before expiry

    this.refreshTimer = setTimeout(() => {
      this.refreshTokenIfNeeded();
    }, timeUntilRefresh * 1000);
  }

  /**
   * Refresh token if needed
   * @returns {Promise<boolean>} True if refresh was successful
   */
  async refreshTokenIfNeeded() {
    if (!this.needsTokenRefresh() || !this.refreshToken) {
      return true;
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   * @private
   */
  async performTokenRefresh() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.session) {
        this.setAuthTokens(data.data.session);

        // Notify callback if set
        if (this.onTokenRefresh) {
          this.onTokenRefresh(data.data.session);
        }

        return true;
      } else {
        throw new Error('Token refresh failed: Invalid response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);

      // Clear tokens on refresh failure
      this.clearAuthToken();

      // Notify callback of failure
      if (this.onTokenRefresh) {
        this.onTokenRefresh(null, error);
      }

      return false;
    }
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
    if (options.enable_ares_enrichment !== undefined) params.append('enable_ares_enrichment', options.enable_ares_enrichment);

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

  // ===== USER MANAGEMENT =====

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile() {
    return this._makeRequest(`${this.baseUrl}/api/v1/user/profile`);
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(updates) {
    return this._makeRequest(`${this.baseUrl}/api/v1/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    return this._makeRequest(`${this.baseUrl}/api/v1/user/stats`);
  }

  /**
   * Get user activity summary
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Activity summary
   */
  async getUserActivity(days = 30) {
    return this._makeRequest(`${this.baseUrl}/api/v1/user/activity?days=${days}`);
  }

  // ===== CREDIT MANAGEMENT =====

  /**
   * Get user credit balance and recent transactions
   * @returns {Promise<Object>} Credit balance info
   */
  async getCreditBalance() {
    return this._makeRequest(`${this.baseUrl}/api/v1/credits/balance`);
  }

  /**
   * Get credit transaction history
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Transaction history
   */
  async getCreditHistory(options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);

    const url = `${this.baseUrl}/api/v1/credits/history?${params.toString()}`;
    return this._makeRequest(url);
  }

  /**
   * Purchase credits
   * @param {number} amount - Amount of credits to purchase
   * @param {string} paymentMethod - Payment method
   * @param {string} paymentReference - Payment reference
   * @returns {Promise<Object>} Purchase result
   */
  async purchaseCredits(amount, paymentMethod, paymentReference) {
    return this._makeRequest(`${this.baseUrl}/api/v1/credits/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference
      })
    });
  }

  /**
   * Get credit usage statistics
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Usage statistics
   */
  async getCreditUsageStats(days = 30) {
    return this._makeRequest(`${this.baseUrl}/api/v1/credits/usage-stats?days=${days}`);
  }

  /**
   * Estimate processing cost for a document
   * @param {string} documentType - Type of document
   * @param {number} pages - Number of pages
   * @param {string} processingMode - Processing mode
   * @returns {Promise<Object>} Cost estimate
   */
  async estimateProcessingCost(documentType, pages, processingMode = 'accuracy_first') {
    return this._makeRequest(`${this.baseUrl}/api/v1/credits/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_type: documentType,
        pages,
        processing_mode: processingMode
      })
    });
  }

  // ===== MEMORY MANAGEMENT =====

  /**
   * Create a new user memory
   * @param {Object} memoryData - Memory data
   * @returns {Promise<Object>} Created memory
   */
  async createMemory(memoryData) {
    return this._makeRequest(`${this.baseUrl}/api/v1/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryData)
    });
  }

  /**
   * Get user memories with filtering
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Memories list
   */
  async getMemories(options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.tags) params.append('tags', options.tags.join(','));
    if (options.search) params.append('search', options.search);
    if (options.importanceMin) params.append('importance_min', options.importanceMin);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    const url = `${this.baseUrl}/api/v1/memories?${params.toString()}`;
    return this._makeRequest(url);
  }

  /**
   * Get a specific memory by ID
   * @param {string} memoryId - Memory ID
   * @returns {Promise<Object>} Memory details
   */
  async getMemory(memoryId) {
    return this._makeRequest(`${this.baseUrl}/api/v1/memories/${memoryId}`);
  }

  /**
   * Update a memory
   * @param {string} memoryId - Memory ID
   * @param {Object} updates - Memory updates
   * @returns {Promise<Object>} Updated memory
   */
  async updateMemory(memoryId, updates) {
    return this._makeRequest(`${this.baseUrl}/api/v1/memories/${memoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete a memory
   * @param {string} memoryId - Memory ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMemory(memoryId) {
    return this._makeRequest(`${this.baseUrl}/api/v1/memories/${memoryId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Search memories by content
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchMemories(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit);

    const url = `${this.baseUrl}/api/v1/memories/search?${params.toString()}`;
    return this._makeRequest(url);
  }

  /**
   * Get memory statistics
   * @returns {Promise<Object>} Memory statistics
   */
  async getMemoryStats() {
    return this._makeRequest(`${this.baseUrl}/api/v1/memories/stats`);
  }

  /**
   * Get cost statistics and usage metrics
   * @returns {Promise<Object>} Cost statistics
   */
  async getCostStatistics() {
    return this._makeRequest(`${this.baseUrl}/api/v1/system/costs`);
  }

  // ===== COST-EFFECTIVE AI FEATURES =====

  /**
   * Get AI-powered financial insights (cost-optimized)
   * @returns {Promise<Object>} AI insights
   */
  async getAIInsights() {
    return this._makeRequest(`${this.baseUrl}/dashboard/ai-insights`);
  }

  /**
   * Chat with AI about financial data (cost-optimized)
   * @param {string} message - User message
   * @returns {Promise<Object>} AI response
   */
  async chatWithAI(message) {
    return this._makeRequest(`${this.baseUrl}/dashboard/ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  }

  // ===== COST-EFFECTIVE AI FEATURES =====

  /**
   * Generate simple AI insights (uses cheapest model)
   * @param {Object} financialData - Basic financial data
   * @returns {Promise<Object>} AI insights
   */
  async generateSimpleAIInsights(financialData) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/simple-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(financialData)
    });
  }

  /**
   * Basic AI chat for financial questions (cost-optimized)
   * @param {string} message - User message
   * @param {Object} basicStats - Basic financial stats only
   * @returns {Promise<Object>} AI response
   */
  async basicAIChat(message, basicStats = {}) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/basic-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.substring(0, 200), // Limit message length
        stats: basicStats
      })
    });
  }

  // ===== AI FEATURES =====

  /**
   * Generate AI insights based on user data
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} AI insights
   */
  async generateAIInsights(options = {}) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }

  /**
   * Chat with AI assistant about financial data
   * @param {string} message - User message
   * @param {Object} context - Context data (financial stats, documents, etc.)
   * @returns {Promise<Object>} AI response
   */
  async chatWithAI(message, context = {}) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Get AI-powered financial recommendations
   * @param {Object} financialData - User's financial data
   * @returns {Promise<Object>} Recommendations
   */
  async getAIRecommendations(financialData) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(financialData)
    });
  }

  /**
   * Analyze trends using AI
   * @param {Object} data - Historical data for analysis
   * @param {string} analysisType - Type of analysis (income, expenses, profit, etc.)
   * @returns {Promise<Object>} Trend analysis
   */
  async analyzeAITrends(data, analysisType = 'comprehensive') {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/trends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        analysis_type: analysisType,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Generate AI-powered dashboard customization suggestions
   * @param {Object} userPreferences - User preferences and usage patterns
   * @returns {Promise<Object>} Dashboard suggestions
   */
  async getAIDashboardSuggestions(userPreferences) {
    return this._makeRequest(`${this.baseUrl}/api/v1/ai/dashboard-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPreferences)
    });
  }

  /**
   * Get health status of all components
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    return this._makeRequest(`${this.baseUrl}/api/v1/system/health`);
  }

  /**
   * Get list of processed documents (user-specific)
   * @returns {Promise<Object>} Documents list
   */
  async getDocuments() {
    return this._makeRequest(`${this.baseUrl}/dashboard/documents`);
  }

  /**
   * Get specific document details (user-specific)
   * @param {number} id - Document ID
   * @returns {Promise<Object>} Document details
   */
  async getDocument(id) {
    return this._makeRequest(`${this.baseUrl}/dashboard/documents/${id}`);
  }

  /**
   * Delete a document (user-specific)
   * @param {number} id - Document ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDocument(id) {
    return this._makeRequest(`${this.baseUrl}/dashboard/documents/${id}`, {
      method: 'DELETE'
    });
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
   * Internal method to make HTTP requests with retry logic and automatic token refresh
   * @private
   */
  async _makeRequest(url, options = {}) {
    // Check if token needs refresh before making request
    await this.refreshTokenIfNeeded();

    const requestOptions = {
      headers: {
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add authentication header if token is available
    if (this.authToken) {
      requestOptions.headers['Authorization'] = `Bearer ${this.authToken}`;
    }

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

        // Handle 401 Unauthorized - try to refresh token and retry
        if (response.status === 401 && this.refreshToken && attempt === 0) {
          const refreshSuccess = await this.refreshTokenIfNeeded();
          if (refreshSuccess) {
            // Update authorization header with new token
            requestOptions.headers['Authorization'] = `Bearer ${this.authToken}`;
            continue; // Retry the request with new token
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          return text ? JSON.parse(text) : {};
        } else {
          return await response.text();
        }

      } catch (error) {
        lastError = error;

        // Don't retry on 401 errors after token refresh attempt
        if (error.message.includes('401') && attempt > 0) {
          break;
        }

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

export default AskelioSDK;
