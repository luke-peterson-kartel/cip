import { useState, useMemo, useRef, useCallback, type SyntheticEvent } from 'react'
import { formatFileSize, isImage, isVideo } from '@/lib/file-utils'
import { AssetRequestDetailModal } from './AssetRequestDetailModal'
import type { AssetRequest, Upload, DeliverableReviewStatus } from '@/types'
import { cn } from '@/lib/cn'

interface DeliverablesTabProps {
  projectId: string
  assetRequests: AssetRequest[]
  uploads: Upload[]
  loadingUploads: boolean
  onAssetRequestUpdate: (id: string, field: string, value: any) => Promise<void>
}

const REVIEW_COLORS: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  PENDING_REVIEW: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending Review', dot: 'bg-gray-400' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved', dot: 'bg-green-500' },
  NEEDS_CHANGES: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Needs Changes', dot: 'bg-amber-500' },
}

const STATUS_FILTERS: Array<{ value: 'ALL' | DeliverableReviewStatus; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_REVIEW', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'NEEDS_CHANGES', label: 'Needs Changes' },
]

const MEDIA_FILTERS: Array<{ value: 'all' | 'images' | 'videos'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'images', label: 'Images' },
  { value: 'videos', label: 'Videos' },
]

export function DeliverablesTab({
  projectId,
  assetRequests,
  uploads,
  loadingUploads,
  onAssetRequestUpdate,
}: DeliverablesTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DeliverableReviewStatus>('ALL')
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [selectedAsset, setSelectedAsset] = useState<AssetRequest | null>(null)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  // All deliverables = uploads linked to an asset request
  const allDeliverables = useMemo(
    () => uploads.filter(u => u.assetRequestId),
    [uploads]
  )

  // Summary stats
  const stats = useMemo(() => {
    const approved = allDeliverables.filter(u => u.reviewStatus === 'APPROVED').length
    const pending = allDeliverables.filter(u => !u.reviewStatus || u.reviewStatus === 'PENDING_REVIEW').length
    const needsChanges = allDeliverables.filter(u => u.reviewStatus === 'NEEDS_CHANGES').length
    return { total: allDeliverables.length, approved, pending, needsChanges }
  }, [allDeliverables])

  // Filtered deliverables
  const filteredDeliverables = useMemo(() => {
    let filtered = allDeliverables

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(u => {
        const status = u.reviewStatus || 'PENDING_REVIEW'
        return status === statusFilter
      })
    }

    if (mediaFilter === 'images') {
      filtered = filtered.filter(u => isImage(u.mimeType))
    } else if (mediaFilter === 'videos') {
      filtered = filtered.filter(u => isVideo(u.mimeType))
    }

    return filtered
  }, [allDeliverables, statusFilter, mediaFilter])

  // Group by asset request
  const groupedByAssetRequest = useMemo(() => {
    const map = new Map<string, Upload[]>()
    for (const upload of filteredDeliverables) {
      const key = upload.assetRequestId!
      const existing = map.get(key) || []
      existing.push(upload)
      map.set(key, existing)
    }
    return map
  }, [filteredDeliverables])

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

  if (loadingUploads) {
    return <div className="py-12 text-center text-sm text-gray-400">Loading deliverables...</div>
  }

  if (allDeliverables.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No deliverables uploaded yet. Upload files from individual asset request detail views.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 text-sm">
        <span className="text-gray-700 font-medium">{stats.total} deliverables</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600">{stats.approved} Approved</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-gray-600">{stats.pending} Pending</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-gray-600">{stats.needsChanges} Needs Changes</span>
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Type:</span>
          {MEDIA_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setMediaFilter(f.value)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                mediaFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Gallery */}
      {assetRequests.map(ar => {
        const groupUploads = groupedByAssetRequest.get(ar.id) || []
        // Count total deliverables for this AR (unfiltered)
        const totalForAR = allDeliverables.filter(u => u.assetRequestId === ar.id).length

        // Hide empty groups when filtering
        if (groupUploads.length === 0 && statusFilter !== 'ALL') return null
        // Hide asset requests with no deliverables at all
        if (totalForAR === 0) return null

        return (
          <div key={ar.id} className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {ar.title || ar.creativeType}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    {ar.platform}
                  </span>
                  <span className="text-xs text-gray-500">{ar.creativeType}</span>
                  {ar.dimensions && <span className="text-xs text-gray-400">{ar.dimensions}</span>}
                  {ar.duration && <span className="text-xs text-gray-400">{ar.duration}s</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {totalForAR} / {ar.targetCount} delivered
                </span>
                <button
                  onClick={() => setSelectedAsset(ar)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Thumbnail Grid */}
            {groupUploads.length > 0 ? (
              <div className="grid grid-cols-5 gap-3">
                {groupUploads.map(upload => {
                  const reviewColor = REVIEW_COLORS[upload.reviewStatus || 'PENDING_REVIEW']

                  return (
                    <div
                      key={upload.id}
                      onClick={() => setSelectedAsset(ar)}
                      className="group relative rounded-lg border border-gray-200 overflow-hidden cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm"
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
                            {upload.metadata?.thumbnail && (
                              <img
                                src={upload.metadata.thumbnail}
                                alt={upload.filename}
                                className={cn(
                                  'w-full h-full object-cover transition-opacity',
                                  hoveredVideoId === upload.id ? 'opacity-0' : 'opacity-80'
                                )}
                                onError={handleImgError}
                              />
                            )}
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
            ) : (
              <div className="py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No deliverables match current filters
              </div>
            )}
          </div>
        )
      })}

      {/* Asset Request Detail Modal */}
      {selectedAsset && (
        <AssetRequestDetailModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          assetRequest={selectedAsset}
          onUpdate={(field, value) => onAssetRequestUpdate(selectedAsset.id, field, value)}
        />
      )}
    </div>
  )
}
