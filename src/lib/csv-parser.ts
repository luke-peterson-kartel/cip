// Custom CSV parser for handling asset request uploads
// Based on pattern from Kartel Sales Production

export interface ParsedCSVData {
  headers: string[]
  rows: string[][]
  rawContent: string
}

export interface AssetRequest {
  platform?: string
  creativeType?: string
  size?: string
  duration?: number
  count?: number
  notes?: string
  [key: string]: any // Allow additional fields
}

/**
 * Parse a single CSV line, handling quoted fields properly
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator (only when not in quotes)
      fields.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
  }

  // Add the last field
  fields.push(currentField.trim())

  return fields
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string): ParsedCSVData {
  // Remove BOM if present
  let cleanContent = content
  if (cleanContent.charCodeAt(0) === 0xFEFF) {
    cleanContent = cleanContent.slice(1)
  }

  // Split into lines
  const lines = cleanContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      rawContent: content,
    }
  }

  // First line is headers
  const headers = parseCSVLine(lines[0])

  // Remaining lines are data rows
  const rows = lines.slice(1).map(line => parseCSVLine(line))

  return {
    headers,
    rows,
    rawContent: content,
  }
}

/**
 * Parse asset request CSV into structured objects
 * Attempts to map common column names to standard fields
 */
export function parseAssetRequestCSV(content: string): AssetRequest[] {
  const parsed = parseCSV(content)

  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return []
  }

  // Normalize header names for easier matching
  const headerMap = new Map<number, string>()
  parsed.headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim()

    // Map common variations to standard field names
    if (normalized.includes('platform') || normalized.includes('channel')) {
      headerMap.set(index, 'platform')
    } else if (normalized.includes('creative') && normalized.includes('type')) {
      headerMap.set(index, 'creativeType')
    } else if (normalized.includes('size') || normalized.includes('dimension') || normalized.includes('aspect')) {
      headerMap.set(index, 'size')
    } else if (normalized.includes('duration') || normalized.includes('length')) {
      headerMap.set(index, 'duration')
    } else if (normalized.includes('count') || normalized.includes('quantity') || normalized.includes('number')) {
      headerMap.set(index, 'count')
    } else if (normalized.includes('note') || normalized.includes('comment') || normalized.includes('description')) {
      headerMap.set(index, 'notes')
    } else {
      // Keep original header name for unmapped fields
      headerMap.set(index, header)
    }
  })

  // Convert rows to objects
  const assets: AssetRequest[] = parsed.rows.map(row => {
    const asset: AssetRequest = {}

    row.forEach((cell, index) => {
      const fieldName = headerMap.get(index)
      if (!fieldName) return

      let value: any = cell.trim()

      // Parse special fields
      if (fieldName === 'duration') {
        // Try to extract numeric duration
        const durationMatch = value.match(/(\d+)/)
        value = durationMatch ? parseInt(durationMatch[1]) : null
      } else if (fieldName === 'count') {
        // Parse as integer
        const countMatch = value.match(/(\d+)/)
        value = countMatch ? parseInt(countMatch[1]) : 0
      }

      asset[fieldName] = value
    })

    return asset
  })

  return assets
}

/**
 * Validate CSV content before parsing
 */
export function validateCSVContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'CSV content is empty' }
  }

  // Check if it looks like CSV (has commas or is a single line)
  if (!content.includes(',') && content.split(/\r?\n/).length === 1) {
    return { valid: false, error: 'Content does not appear to be CSV format' }
  }

  try {
    const parsed = parseCSV(content)
    if (parsed.headers.length === 0) {
      return { valid: false, error: 'No headers found in CSV' }
    }
    if (parsed.rows.length === 0) {
      return { valid: false, error: 'No data rows found in CSV' }
    }
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Failed to parse CSV: ${error}` }
  }
}

/**
 * Format parsed CSV data as a readable table string
 */
export function formatCSVAsTable(data: ParsedCSVData): string {
  if (data.headers.length === 0) return ''

  const columnWidths = data.headers.map((header, index) => {
    const maxDataWidth = Math.max(...data.rows.map(row => (row[index] || '').length))
    return Math.max(header.length, maxDataWidth)
  })

  // Header row
  let table = data.headers.map((header, i) => header.padEnd(columnWidths[i])).join(' | ') + '\n'

  // Separator row
  table += columnWidths.map(width => '-'.repeat(width)).join('-+-') + '\n'

  // Data rows
  data.rows.forEach(row => {
    table += row.map((cell, i) => (cell || '').padEnd(columnWidths[i])).join(' | ') + '\n'
  })

  return table
}
