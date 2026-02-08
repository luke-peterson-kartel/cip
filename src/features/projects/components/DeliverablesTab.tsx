import { useState, useMemo, useRef, useCallback, type SyntheticEvent } from 'react'
import { isImage, isVideo } from '@/lib/file-utils'
import { AssetRequestDetailModal } from './AssetRequestDetailModal'
import type { AssetRequest, Upload, DeliverableReviewStatus } from '@/types'
import { cn } from '@/lib/cn'

interface DeliverablesTabProps {
  projectId: string
  projectName?: string
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

export function DeliverablesTab({
  projectId,
  projectName,
  assetRequests,
  uploads,
  loadingUploads,
  onAssetRequestUpdate,
}: DeliverablesTabProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DeliverableReviewStatus>('ALL')
  const [selectedAsset, setSelectedAsset] = useState<AssetRequest | null>(null)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  // Fast lookup for asset requests by ID
  const arMap = useMemo(() => {
    const map = new Map<string, AssetRequest>()
    for (const ar of assetRequests) map.set(ar.id, ar)
    return map
  }, [assetRequests])

  // All deliverables = uploads linked to an asset request
  const allDeliverables = useMemo(
    () => uploads.filter(u => u.assetRequestId),
    [uploads]
  )

  // Filtered deliverables
  const filteredDeliverables = useMemo(() => {
    if (statusFilter === 'ALL') return allDeliverables
    return allDeliverables.filter(u => {
      const status = u.reviewStatus || 'PENDING_REVIEW'
      return status === statusFilter
    })
  }, [allDeliverables, statusFilter])

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

  const totalDelivered = allDeliverables.length
  const totalTarget = assetRequests.reduce((sum, ar) => sum + (ar.targetCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Delivered count */}
      <div className="text-sm font-medium text-gray-700">
        {totalDelivered} / {totalTarget} delivered
      </div>

      {/* Filter Bar */}
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

      {/* Thumbnail Grid */}
      {filteredDeliverables.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {filteredDeliverables.map(upload => {
            const reviewColor = REVIEW_COLORS[upload.reviewStatus || 'PENDING_REVIEW']

            return (
              <div
                key={upload.id}
                onClick={() => {
                  const ar = arMap.get(upload.assetRequestId!)
                  if (ar) setSelectedAsset(ar)
                }}
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
                  <div className="mt-1">
                    <span className={cn(
                      'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      reviewColor.bg, reviewColor.text
                    )}>
                      {reviewColor.label}
                    </span>
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

      {/* Asset Request Detail Modal */}
      {selectedAsset && (
        <AssetRequestDetailModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          assetRequest={selectedAsset}
          onUpdate={(field, value) => onAssetRequestUpdate(selectedAsset.id, field, value)}
          projectName={projectName}
        />
      )}
    </div>
  )
}
