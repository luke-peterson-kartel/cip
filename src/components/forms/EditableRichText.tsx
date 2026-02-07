import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'
import { cn } from '@/lib/cn'

export interface EditableRichTextProps {
  label: string
  value: string
  onSave: (html: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function EditableRichText({
  label,
  value,
  onSave,
  placeholder,
  disabled = false,
}: EditableRichTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = () => {
    if (!disabled) {
      setEditValue(value)
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
    if (editValue === value) {
      setIsEditing(false)
      return
    }

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

  const isEmpty = !value || value === '<p></p>'

  return (
    <div className="group">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
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
            isEmpty && !disabled && 'italic text-gray-400'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEmpty ? (
                <span>{placeholder || 'Add content...'}</span>
              ) : (
                <div
                  className="rich-text-display"
                  dangerouslySetInnerHTML={{ __html: value }}
                />
              )}
            </div>
            {!disabled && (
              <svg
                className="ml-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
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
        <div className="space-y-1.5">
          <RichTextEditor
            value={editValue}
            onChange={setEditValue}
            placeholder={placeholder}
            disabled={isSaving}
          />

          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
