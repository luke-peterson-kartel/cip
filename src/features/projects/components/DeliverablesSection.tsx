import { useState, useRef, useCallback, type SyntheticEvent } from 'react'
import { Modal } from '@/components/ui'
import {
  validateFileType,
  validateFileSize,
  formatFileSize,
  generateThumbnail,
  generateVideoThumbnail,
  isImage,
  isVideo,
} from '@/lib/file-utils'
import type { Upload, DeliverableReviewStatus } from '@/types'
import { cn } from '@/lib/cn'

interface DeliverablesSectionProps {
  projectId: string
  assetRequestId: string
  uploads: Upload[]
  loadingUploads: boolean
  onUploadComplete: (uploads: Upload[]) => void
  onReviewUpdate: (uploadId: string, status: DeliverableReviewStatus, notes?: string) => Promise<void>
  onDelete: (uploadId: string) => Promise<void>
}

const REVIEW_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_REVIEW: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending Review' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  NEEDS_CHANGES: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Needs Changes' },
}

const ACCEPTED_TYPES = ['image/*', 'video/*']
const MAX_SIZE_MB = 500
const MAX_FILES = 10

interface UploadingFile {
  file: File
  id: string
  progress: number
  error?: string
  thumbnail?: string
}

export function DeliverablesSection({
  projectId,
  assetRequestId,
  uploads,
  loadingUploads,
  onUploadComplete,
  onReviewUpdate,
  onDelete,
}: DeliverablesSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag-overlay state
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  // Upload state (inline, no FileUploadZone)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [showDisclosure, setShowDisclosure] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const selectedUpload = uploads.find(u => u.id === selectedId)

  // ── Video hover preview ──

  const handleVideoHover = useCallback((uploadId: string) => {
    setHoveredVideoId(uploadId)
    const video = videoRefs.current[uploadId]
    if (video) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }, [])

  const handleVideoLeave = useCallback((uploadId: string) => {
    setHoveredVideoId(null)
    const video = videoRefs.current[uploadId]
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }, [])

  const handleImgError = (e: SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    el.style.display = 'none'
    const parent = el.parentElement
    if (parent && !parent.querySelector('[data-fallback]')) {
      const fallback = document.createElement('div')
      fallback.setAttribute('data-fallback', 'true')
      fallback.className = 'w-full h-full flex items-center justify-center'
      fallback.innerHTML = '<svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
      parent.appendChild(fallback)
    }
  }

  // ── Review ──

  const handleReview = async (status: DeliverableReviewStatus) => {
    if (!selectedId) return
    setIsSaving(true)
    try {
      await onReviewUpdate(selectedId, status, reviewNotes || undefined)
      setReviewNotes('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (uploadId: string) => {
    if (selectedId === uploadId) setSelectedId(null)
    await onDelete(uploadId)
  }

  // ── Drag handlers ──

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setPendingFiles(files)
      setShowDisclosure(true)
    }
  }, [])

  // ── Upload logic (inline) ──

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = []
    const valid: File[] = []

    if (files.length > MAX_FILES) {
      errors.push(`You can only upload up to ${MAX_FILES} files at once`)
      return { valid, errors }
    }

    for (const file of files) {
      if (!validateFileType(file, ACCEPTED_TYPES)) {
        errors.push(`${file.name}: Only images and videos are accepted`)
        continue
      }
      if (!validateFileSize(file, MAX_SIZE_MB)) {
        errors.push(`${file.name}: File size exceeds ${MAX_SIZE_MB}MB limit`)
        continue
      }
      valid.push(file)
    }

    return { valid, errors }
  }, [])

  const generateFileThumbnail = async (file: File): Promise<string | undefined> => {
    try {
      if (isImage(file.type)) return await generateThumbnail(file)
      if (isVideo(file.type)) return await generateVideoThumbnail(file)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
    }
    return undefined
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setUploadError(errors.join('; '))
      setTimeout(() => setUploadError(null), 5000)
    }

    if (valid.length === 0) return

    const uploadingFilesData: UploadingFile[] = valid.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
    }))

    setUploadingFiles(prev => [...prev, ...uploadingFilesData])

    // Generate thumbnails in parallel
    const thumbnails = await Promise.all(
      uploadingFilesData.map(async (uf) => ({
        id: uf.id,
        thumbnail: await generateFileThumbnail(uf.file),
      }))
    )

    setUploadingFiles(prev =>
      prev.map(uf => {
        const thumb = thumbnails.find(t => t.id === uf.id)
        return thumb?.thumbnail ? { ...uf, thumbnail: thumb.thumbnail } : uf
      })
    )

    // Simulate upload progress
    const uploadPromises = uploadingFilesData.map(async (uploadingFile) => {
      try {
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev =>
            prev.map(uf =>
              uf.id === uploadingFile.id && uf.progress < 90
                ? { ...uf, progress: uf.progress + 10 }
                : uf
            )
          )
        }, 200)

        await new Promise(resolve => setTimeout(resolve, 2000))
        clearInterval(progressInterval)

        const mockUpload: Upload = {
          id: `upload-${Date.now()}-${Math.random()}`,
          filename: uploadingFile.file.name,
          mimeType: uploadingFile.file.type,
          size: uploadingFile.file.size,
          uri: `s3://cip-assets/${projectId}/${uploadingFile.file.name}`,
          projectId,
          organizationId: 'org-001',
          uploadedBy: 'current-user',
          metadata: { fileSize: uploadingFile.file.size },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.id === uploadingFile.id ? { ...uf, progress: 100 } : uf
          )
        )

        return mockUpload
      } catch (error) {
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.id === uploadingFile.id ? { ...uf, error: 'Upload failed' } : uf
          )
        )
        throw error
      }
    })

    try {
      const newUploads = await Promise.all(uploadPromises)
      setTimeout(() => {
        setUploadingFiles(prev =>
          prev.filter(uf => !uploadingFilesData.find(u => u.id === uf.id))
        )
      }, 1000)
      onUploadComplete(newUploads)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }, [validateFiles, projectId, onUploadComplete])

  // ── Security disclosure ──

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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Click-to-upload ──

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      promptDisclosure(Array.from(e.target.files))
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [promptDisclosure])

  const hasUploads = uploads.length > 0
  const showReviewPanel = selectedUpload || !hasUploads

  return (
    <div
      className="relative space-y-3"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/90 backdrop-blur-sm">
          <svg className="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-blue-700">Drop files to upload</p>
          <p className="text-xs text-blue-500">Images and videos, up to {MAX_SIZE_MB}MB each</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deliverables</h4>
          {hasUploads && <span className="text-xs text-gray-400">{uploads.length} files</span>}
        </div>
        {hasUploads && (
          <button
            onClick={handleClickUpload}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        )}
      </div>

      {/* Review Panel / Empty Upload Panel */}
      {showReviewPanel && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
          <div className="flex gap-4">
            {/* Preview / Upload area */}
            <div className="flex-shrink-0 w-48 h-48 rounded-lg overflow-hidden bg-gray-200">
              {selectedUpload ? (
                isImage(selectedUpload.mimeType) ? (
                  <img
                    src={selectedUpload.uri}
                    alt={selectedUpload.filename}
                    className="w-full h-full object-cover"
                    onError={handleImgError}
                  />
                ) : isVideo(selectedUpload.mimeType) ? (
                  <video
                    src={selectedUpload.uri}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    poster={selectedUpload.metadata?.thumbnail}
                    className="w-full h-full object-cover bg-gray-800"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )
              ) : (
                <button
                  onClick={handleClickUpload}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-300/50 transition-colors cursor-pointer"
                >
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500">Upload</span>
                </button>
              )}
            </div>

            {/* Details + Actions */}
            <div className="flex-1 min-w-0 space-y-3">
              {selectedUpload ? (
                <>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 truncate">{selectedUpload.filename}</h5>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>{formatFileSize(selectedUpload.size)}</span>
                      {selectedUpload.metadata?.width && selectedUpload.metadata?.height && (
                        <span>{selectedUpload.metadata.width} x {selectedUpload.metadata.height}</span>
                      )}
                      {selectedUpload.metadata?.duration && (
                        <span>{selectedUpload.metadata.duration}s</span>
                      )}
                      {selectedUpload.uploadedBy && (
                        <span>by {selectedUpload.uploadedBy}</span>
                      )}
                      <span>{new Date(selectedUpload.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Current review status */}
                  {selectedUpload.reviewStatus && selectedUpload.reviewStatus !== 'PENDING_REVIEW' && (
                    <div className={cn(
                      'rounded-md px-3 py-2 text-xs',
                      selectedUpload.reviewStatus === 'APPROVED' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                    )}>
                      <div className="flex items-center gap-1.5">
                        {selectedUpload.reviewStatus === 'APPROVED' ? (
                          <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="font-medium">
                          {selectedUpload.reviewStatus === 'APPROVED' ? 'Approved' : 'Changes Requested'}
                        </span>
                        {selectedUpload.reviewedBy && (
                          <span className="text-gray-500">by {selectedUpload.reviewedBy}</span>
                        )}
                        {selectedUpload.reviewedAt && (
                          <span className="text-gray-400">{new Date(selectedUpload.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {selectedUpload.reviewNotes && (
                        <p className="mt-1 text-gray-600">{selectedUpload.reviewNotes}</p>
                      )}
                    </div>
                  )}

                  {/* Review Notes Input */}
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    rows={2}
                    disabled={isSaving}
                    className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReview('APPROVED')}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview('NEEDS_CHANGES')}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Request Changes
                    </button>
                    <a
                      href={selectedUpload.uri}
                      download={selectedUpload.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center h-full">
                  <p className="text-sm font-medium text-gray-700">No deliverables uploaded</p>
                  <p className="text-xs text-gray-500 mt-1">Drag files here or click to upload images and videos.</p>
                  <button
                    onClick={handleClickUpload}
                    className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Files
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-2 text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingUploads && (
        <div className="text-center py-6 text-xs text-gray-400">Loading deliverables...</div>
      )}

      {/* Thumbnail Grid */}
      {!loadingUploads && hasUploads && (
        <div className="grid grid-cols-4 gap-3">
          {uploads.map(upload => {
            const reviewColor = REVIEW_COLORS[upload.reviewStatus || 'PENDING_REVIEW']
            const isSelected = selectedId === upload.id

            return (
              <div
                key={upload.id}
                onClick={() => setSelectedId(isSelected ? null : upload.id)}
                className={cn(
                  'group relative rounded-lg border overflow-hidden cursor-pointer transition-all',
                  isSelected
                    ? 'border-blue-400 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 relative">
                  {isImage(upload.mimeType) ? (
                    <img
                      src={upload.metadata?.thumbnail || upload.uri}
                      alt={upload.filename}
                      className="w-full h-full object-cover"
                      onError={handleImgError}
                    />
                  ) : isVideo(upload.mimeType) ? (
                    <div
                      className="w-full h-full bg-gray-800 relative"
                      onMouseEnter={() => handleVideoHover(upload.id)}
                      onMouseLeave={() => handleVideoLeave(upload.id)}
                    >
                      <video
                        ref={(el) => { videoRefs.current[upload.id] = el }}
                        src={upload.uri}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className={cn(
                          'absolute inset-0 w-full h-full object-cover transition-opacity',
                          hoveredVideoId === upload.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {upload.metadata?.thumbnail ? (
                        <img
                          src={upload.metadata.thumbnail}
                          alt={upload.filename}
                          className={cn(
                            'w-full h-full object-cover transition-opacity',
                            hoveredVideoId === upload.id ? 'opacity-0' : 'opacity-80'
                          )}
                          onError={handleImgError}
                        />
                      ) : null}
                      <div className={cn(
                        'absolute inset-0 flex items-center justify-center transition-opacity',
                        hoveredVideoId === upload.id ? 'opacity-0' : 'opacity-100'
                      )}>
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <a
                      href={upload.uri}
                      download={upload.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      title="Download"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(upload.id) }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-gray-700 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{upload.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn(
                      'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      reviewColor.bg, reviewColor.text
                    )}>
                      {reviewColor.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatFileSize(upload.size)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Progress (inline) */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                {uploadingFile.thumbnail ? (
                  <img src={uploadingFile.thumbnail} alt={uploadingFile.file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{uploadingFile.file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(uploadingFile.file.size)}</p>
                {!uploadingFile.error && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
                {uploadingFile.error && (
                  <p className="mt-1 text-xs text-red-600">{uploadingFile.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {uploadingFile.progress === 100 && !uploadingFile.error ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <button
                    onClick={() => setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadingFile.id))}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                    title="Cancel"
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
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
    </div>
  )
}
