import { useState, useRef, useCallback, type SyntheticEvent } from 'react'
import { FileUploadZone } from '@/components/uploads/FileUploadZone'
import { formatFileSize, isImage, isVideo } from '@/lib/file-utils'
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

export function DeliverablesSection({
  projectId,
  assetRequestId,
  uploads,
  loadingUploads,
  onUploadComplete,
  onReviewUpdate,
  onDelete,
}: DeliverablesSectionProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedUpload = uploads.find(u => u.id === selectedId)

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

  const hasUploads = uploads.length > 0
  const showReviewPanel = selectedUpload || !hasUploads

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deliverables</h4>
          {hasUploads && <span className="text-xs text-gray-400">{uploads.length} files</span>}
        </div>
        {hasUploads && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              showUpload
                ? 'bg-gray-200 text-gray-700'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            )}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showUpload ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
            </svg>
            {showUpload ? 'Cancel' : 'Upload'}
          </button>
        )}
      </div>

      {/* Review Panel / Empty Upload Panel — always at the top */}
      {showReviewPanel && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
          <div className="flex gap-4">
            {/* Preview / Upload area */}
            <div className="flex-shrink-0 w-48 h-48 rounded-lg overflow-hidden bg-gray-200">
              {selectedUpload ? (
                // Show selected file preview
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
                // No uploads — show upload button in preview area
                <button
                  onClick={() => setShowUpload(true)}
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
                // Empty state — no uploads, prompt to upload
                <div className="flex flex-col justify-center h-full">
                  <p className="text-sm font-medium text-gray-700">No deliverables uploaded</p>
                  <p className="text-xs text-gray-500 mt-1">Upload images or videos to begin the review process.</p>
                  <button
                    onClick={() => setShowUpload(true)}
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

      {/* Upload Zone */}
      {showUpload && (
        <FileUploadZone
          projectId={projectId}
          onUploadComplete={(newUploads) => {
            onUploadComplete(newUploads)
            setShowUpload(false)
          }}
          acceptedTypes={['image/*', 'video/*']}
          maxSizeInMB={500}
          maxFiles={10}
        />
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
    </div>
  )
}
