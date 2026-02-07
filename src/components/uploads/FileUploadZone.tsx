import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui'
import {
  validateFileType,
  validateFileSize,
  formatFileSize,
  getFileTypeIcon,
  generateThumbnail,
  generateVideoThumbnail,
  isImage,
  isVideo
} from '@/lib/file-utils'
import type { Upload } from '@/types'

export interface FileUploadZoneProps {
  projectId: string
  onUploadComplete: (uploads: Upload[]) => void
  acceptedTypes?: string[]
  maxSizeInMB?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
}

interface UploadingFile {
  file: File
  id: string
  progress: number
  error?: string
  thumbnail?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'video/*',
  '.zip',
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
  '.csv'
]

export function FileUploadZone({
  projectId,
  onUploadComplete,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeInMB = 500,
  maxFiles = 20,
  disabled = false,
  className
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [showDisclosure, setShowDisclosure] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only set dragging to false if we're leaving the drop zone itself
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = []
    const valid: File[] = []

    if (files.length > maxFiles) {
      errors.push(`You can only upload up to ${maxFiles} files at once`)
      return { valid, errors }
    }

    for (const file of files) {
      // Validate file type
      if (!validateFileType(file, acceptedTypes)) {
        errors.push(`${file.name}: File type not accepted`)
        continue
      }

      // Validate file size
      if (!validateFileSize(file, maxSizeInMB)) {
        errors.push(`${file.name}: File size exceeds ${maxSizeInMB}MB limit`)
        continue
      }

      valid.push(file)
    }

    return { valid, errors }
  }, [acceptedTypes, maxSizeInMB, maxFiles])

  const generateFileThumbnail = async (file: File): Promise<string | undefined> => {
    try {
      if (isImage(file.type)) {
        return await generateThumbnail(file)
      } else if (isVideo(file.type)) {
        return await generateVideoThumbnail(file)
      }
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
    }
    return undefined
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setError(errors.join('; '))
      setTimeout(() => setError(null), 5000)
    }

    if (valid.length === 0) return

    // Initialize uploading files with thumbnails
    const uploadingFilesData: UploadingFile[] = valid.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0
    }))

    setUploadingFiles(prev => [...prev, ...uploadingFilesData])

    // Generate thumbnails in parallel
    const thumbnailPromises = uploadingFilesData.map(async (uploadingFile) => {
      const thumbnail = await generateFileThumbnail(uploadingFile.file)
      return { id: uploadingFile.id, thumbnail }
    })

    const thumbnails = await Promise.all(thumbnailPromises)

    // Update with thumbnails
    setUploadingFiles(prev =>
      prev.map(uf => {
        const thumb = thumbnails.find(t => t.id === uf.id)
        return thumb?.thumbnail ? { ...uf, thumbnail: thumb.thumbnail } : uf
      })
    )

    // Simulate upload progress (in real implementation, this would be actual upload logic)
    const uploadPromises = uploadingFilesData.map(async (uploadingFile) => {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev =>
            prev.map(uf =>
              uf.id === uploadingFile.id && uf.progress < 90
                ? { ...uf, progress: uf.progress + 10 }
                : uf
            )
          )
        }, 200)

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        clearInterval(progressInterval)

        // Create mock upload record
        const mockUpload: Upload = {
          id: `upload-${Date.now()}-${Math.random()}`,
          filename: uploadingFile.file.name,
          mimeType: uploadingFile.file.type,
          size: uploadingFile.file.size,
          uri: `s3://cip-assets/${projectId}/${uploadingFile.file.name}`,
          projectId,
          organizationId: 'org-001', // This would come from context
          uploadedBy: 'current-user', // This would come from auth context
          metadata: {
            fileSize: uploadingFile.file.size
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Mark as complete
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.id === uploadingFile.id
              ? { ...uf, progress: 100 }
              : uf
          )
        )

        return mockUpload
      } catch (error) {
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.id === uploadingFile.id
              ? { ...uf, error: 'Upload failed' }
              : uf
          )
        )
        throw error
      }
    })

    try {
      const uploads = await Promise.all(uploadPromises)

      // Remove completed uploads after a short delay
      setTimeout(() => {
        setUploadingFiles(prev =>
          prev.filter(uf => !uploadingFilesData.find(u => u.id === uf.id))
        )
      }, 1000)

      onUploadComplete(uploads)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }, [validateFiles, projectId, onUploadComplete])

  const promptDisclosure = useCallback((files: File[]) => {
    setPendingFiles(files)
    setShowDisclosure(true)
  }, [])

  const handleDisclosureConfirm = useCallback(() => {
    setShowDisclosure(false)
    if (pendingFiles) {
      uploadFiles(pendingFiles)
      setPendingFiles(null)
    }
  }, [pendingFiles, uploadFiles])

  const handleDisclosureCancel = useCallback(() => {
    setShowDisclosure(false)
    setPendingFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    promptDisclosure(files)
  }, [disabled, promptDisclosure])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      promptDisclosure(files)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [promptDisclosure])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const handleCancelUpload = useCallback((id: string) => {
    setUploadingFiles(prev => prev.filter(uf => uf.id !== id))
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging && !disabled && 'border-primary-500 bg-primary-50',
          !isDragging && !disabled && 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={cn(
            'rounded-full p-3',
            isDragging ? 'bg-primary-100' : 'bg-gray-100'
          )}>
            <svg
              className={cn(
                'h-8 w-8',
                isDragging ? 'text-primary-600' : 'text-gray-400'
              )}
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
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Images, videos, PDFs, documents (max {maxSizeInMB}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Security Disclosure Modal */}
      <Modal
        isOpen={showDisclosure}
        onClose={handleDisclosureCancel}
        title="Data Security Disclosure"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  Please ensure that the files you are uploading do not contain any highly sensitive or confidential data such as passwords, API keys, financial records, or personally identifiable information (PII).
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            If you need to share secure data, please request your secure S3 bucket by contacting{' '}
            <a href="mailto:security@kartel.ai" className="font-medium text-primary-600 hover:text-primary-700 underline">
              security@kartel.ai
            </a>
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleDisclosureCancel}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDisclosureConfirm}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              I understand, proceed with upload
            </button>
          </div>
        </div>
      </Modal>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              {/* Thumbnail or Icon */}
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                {uploadingFile.thumbnail ? (
                  <img
                    src={uploadingFile.thumbnail}
                    alt={uploadingFile.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadingFile.file.size)}
                </p>

                {/* Progress Bar */}
                {!uploadingFile.error && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}

                {/* Error */}
                {uploadingFile.error && (
                  <p className="mt-1 text-xs text-red-600">{uploadingFile.error}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                {uploadingFile.progress === 100 && !uploadingFile.error ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : uploadingFile.error ? (
                  <button
                    onClick={() => handleCancelUpload(uploadingFile.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelUpload(uploadingFile.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    title="Cancel upload"
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
