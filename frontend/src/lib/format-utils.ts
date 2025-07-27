/**
 * Utility functions for formatting data in the Askelio application
 */

/**
 * Format amount for display, handling various input formats
 * @param amount - The amount to format (can be number, string, or object)
 * @param currency - The currency code (default: 'CZK')
 * @returns Formatted amount string
 */
export function formatAmount(amount: any, currency: string = 'CZK'): string {
  if (amount === null || amount === undefined) return 'N/A'

  // Handle different amount formats
  if (typeof amount === 'object') {
    // If amount is an object, try to extract the numeric value
    if (amount.value !== undefined) return formatNumber(amount.value, currency)
    if (amount.amount !== undefined) return formatNumber(amount.amount, currency)
    if (amount.total !== undefined) return formatNumber(amount.total, currency)
    if (amount.vat_amount !== undefined) return formatNumber(amount.vat_amount, currency)
    if (amount.subtotal !== undefined) return formatNumber(amount.subtotal, currency)
    if (amount.tax_amount !== undefined) return formatNumber(amount.tax_amount, currency)
    // If it's an object but no recognizable fields, return N/A
    return 'N/A'
  }

  return formatNumber(amount, currency)
}

/**
 * Extract multiple amount fields from an object
 * @param amount - The amount object to extract from
 * @param currency - The currency code (default: 'CZK')
 * @returns Array of {label, value} objects
 */
export function extractAmountFields(amount: any, currency: string = 'CZK'): Array<{label: string, value: string}> {
  if (amount === null || amount === undefined || typeof amount !== 'object') {
    return []
  }

  const fields: Array<{label: string, value: string}> = []

  // Define field mappings with Czech labels
  const fieldMappings = [
    { key: 'total', label: 'Celkem' },
    { key: 'subtotal', label: 'Mezisoučet' },
    { key: 'vat_amount', label: 'DPH' },
    { key: 'tax_amount', label: 'Daň' },
    { key: 'amount', label: 'Částka' },
    { key: 'value', label: 'Hodnota' }
  ]

  fieldMappings.forEach(mapping => {
    if (amount[mapping.key] !== undefined && amount[mapping.key] !== null) {
      fields.push({
        label: mapping.label,
        value: formatNumber(amount[mapping.key], currency)
      })
    }
  })

  return fields
}

/**
 * Extract items from an object or array
 * @param items - The items to extract (can be array or object)
 * @returns Array of {label, value} objects
 */
export function extractItemFields(items: any): Array<{label: string, value: string}> {
  if (items === null || items === undefined) {
    return []
  }

  const fields: Array<{label: string, value: string}> = []

  // Handle array of items
  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      if (typeof item === 'object') {
        // Format item object
        const itemParts = []
        if (item.description || item.name) itemParts.push(item.description || item.name)
        if (item.quantity) itemParts.push(`${item.quantity}x`)
        if (item.unit_price) itemParts.push(formatNumber(item.unit_price))
        if (item.total_price) itemParts.push(`= ${formatNumber(item.total_price)}`)

        fields.push({
          label: `Položka ${index + 1}`,
          value: itemParts.join(' ')
        })
      } else {
        fields.push({
          label: `Položka ${index + 1}`,
          value: String(item)
        })
      }
    })
  } else if (typeof items === 'object') {
    // Handle single item object
    const itemParts = []
    if (items.description || items.name) itemParts.push(items.description || items.name)
    if (items.quantity) itemParts.push(`${items.quantity}x`)
    if (items.unit_price) itemParts.push(formatNumber(items.unit_price))
    if (items.total_price) itemParts.push(`= ${formatNumber(items.total_price)}`)

    fields.push({
      label: 'Položka',
      value: itemParts.join(' ')
    })
  }

  return fields
}

/**
 * Format a numeric value as currency
 * @param value - The numeric value to format
 * @param currency - The currency code (default: 'CZK')
 * @returns Formatted currency string
 */
export function formatNumber(value: any, currency: string = 'CZK'): string {
  const num = parseFloat(value)
  if (isNaN(num)) return 'N/A'
  
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)
}

/**
 * Format a simple number without currency symbol
 * @param value - The numeric value to format
 * @returns Formatted number string
 */
export function formatSimpleNumber(value: any): string {
  const num = parseFloat(value)
  if (isNaN(num)) return 'N/A'
  
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num)
}

/**
 * Format date for display
 * @param date - The date to format (string or Date object)
 * @returns Formatted date string
 */
export function formatDate(date: any): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'N/A'
    
    return new Intl.DateTimeFormat('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj)
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format confidence score as percentage
 * @param confidence - The confidence score (0-1)
 * @returns Formatted percentage string
 */
export function formatConfidence(confidence: any): string {
  const num = parseFloat(confidence)
  if (isNaN(num)) return 'N/A'
  
  return new Intl.NumberFormat('cs-CZ', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(num)
}
