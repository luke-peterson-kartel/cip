import { useState, useRef } from 'react'
import { parseAssetRequestCSV, validateCSVContent, type AssetRequest } from '@/lib/csv-parser'
import { Button } from '@/components/ui'

interface CSVUploadFieldProps {
  onDataParsed: (data: AssetRequest[]) => void
  currentData?: AssetRequest[]
}

export function CSVUploadField({ onDataParsed, currentData }: CSVUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file')
        setIsProcessing(false)
        return
      }

      // Read file content
      const content = await file.text()

      // Validate CSV content
      const validation = validateCSVContent(content)
      if (!validation.valid) {
        setError(validation.error || 'Invalid CSV format')
        setIsProcessing(false)
        return
      }

      // Parse CSV
      const parsedData = parseAssetRequestCSV(content)

      if (parsedData.length === 0) {
        setError('No valid data found in CSV')
        setIsProcessing(false)
        return
      }

      // Success!
      onDataParsed(parsedData)
    } catch (err) {
      setError(`Failed to process file: ${err}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleClear = () => {
    onDataParsed([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        CSV Upload (Optional - for bulk asset requests)
      </label>

      {!currentData || currentData.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />

          {isProcessing ? (
            <div>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Processing CSV...</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your CSV file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                CSV should include columns: platform, creative type, size, duration, count
              </p>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {currentData.length} asset request{currentData.length !== 1 ? 's' : ''} loaded
              </p>
              <p className="text-xs text-gray-500">CSV data parsed successfully</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto p-4">
            <div className="space-y-2">
              {currentData.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-md border border-gray-200 p-2 text-xs"
                >
                  {item.platform && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">
                      {item.platform}
                    </span>
                  )}
                  {item.creativeType && (
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700">
                      {item.creativeType}
                    </span>
                  )}
                  {item.size && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                      {item.size}
                    </span>
                  )}
                  {item.count && (
                    <span className="rounded bg-orange-100 px-2 py-0.5 text-orange-700">
                      {item.count}x
                    </span>
                  )}
                </div>
              ))}
              {currentData.length > 5 && (
                <p className="text-center text-xs text-gray-500">
                  ... and {currentData.length - 5} more
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
