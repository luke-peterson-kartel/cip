import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'

export interface EditableFieldProps {
  label: string
  value: any
  type: 'text' | 'textarea' | 'date' | 'select' | 'number' | 'multiselect' | 'email'
  options?: Array<{ label: string; value: string }>
  onSave: (newValue: any) => Promise<void>
  validate?: (value: any) => string | null
  placeholder?: string
  required?: boolean
  disabled?: boolean
  resourceType?: string
  resourceId?: string
  fieldName?: string
  rows?: number // for textarea
  className?: string
}

export function EditableField({
  label,
  value,
  type,
  options = [],
  onSave,
  validate,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  className
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value)
  }, [value])

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()

      // For text inputs, select all text
      if (type === 'text' || type === 'email') {
        (inputRef.current as HTMLInputElement).select()
      }
    }
  }, [isEditing, type])

  const handleEdit = () => {
    if (!disabled) {
      setIsEditing(true)
      setError(null)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    // Validation
    if (required && !editValue && editValue !== 0) {
      setError('This field is required')
      return
    }

    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Check if value actually changed
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    setError(null)

    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (type !== 'textarea') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    } else {
      // For textarea, only Escape cancels
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
  }

  const renderValue = () => {
    if (type === 'multiselect') {
      const selectedOptions = options.filter(opt =>
        Array.isArray(value) ? value.includes(opt.value) : false
      )
      return selectedOptions.map(opt => opt.label).join(', ') || placeholder || 'None selected'
    }

    if (type === 'select') {
      const selectedOption = options.find(opt => opt.value === value)
      return selectedOption?.label || placeholder || 'Not set'
    }

    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    return value || placeholder || 'Not set'
  }

  const renderInput = () => {
    const baseInputClass = cn(
      'block w-full rounded-md border-gray-300 shadow-sm',
      'focus:border-primary-500 focus:ring-primary-500',
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
    )

    switch (type) {
      case 'textarea':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            disabled={isSaving}
            className={baseInputClass}
          />
        )

      case 'select':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(editValue) && editValue.includes(opt.value)}
                  onChange={(e) => {
                    const current = Array.isArray(editValue) ? editValue : []
                    const updated = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v: string) => v !== opt.value)
                    setEditValue(updated)
                  }}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )

      case 'number':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value ? Number(e.target.value) : '')}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={baseInputClass}
          />
        )

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={baseInputClass}
          />
        )

      case 'email':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="email"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={baseInputClass}
          />
        )

      default: // text
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            className={baseInputClass}
          />
        )
    }
  }

  return (
    <div className={cn('group', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {!isEditing ? (
        <div
          onClick={handleEdit}
          className={cn(
            'min-h-[2.5rem] rounded-md px-3 py-2 text-sm transition-colors',
            disabled
              ? 'cursor-not-allowed bg-gray-50 text-gray-500'
              : 'cursor-pointer hover:bg-gray-50',
            !value && !disabled && 'text-gray-400 italic'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex-1 break-words whitespace-pre-wrap">{renderValue()}</span>
            {!disabled && (
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {renderInput()}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium',
                'bg-primary-600 text-white hover:bg-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium',
                'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>

            {type !== 'textarea' && (
              <span className="text-xs text-gray-500 ml-2">
                Press Enter to save, Esc to cancel
              </span>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
