import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, Badge } from '@/components/ui'
import { FileUploadZone } from '@/components/uploads/FileUploadZone'
import { EditableField } from '@/components/forms/EditableField'
import {
  formatFileSize,
  getFileTypeIcon,
  isImage,
  isVideo,
  isPDF
} from '@/lib/file-utils'
import type { Project, Upload } from '@/types'
import { cn } from '@/lib/cn'

export interface UploadsPanelProps {
  project: Project
  uploads: Upload[]
  onUpload: (files: File[]) => Promise<void>
  onDelete: (uploadId: string) => Promise<void>
  onUpdateUpload?: (uploadId: string, data: Partial<Upload>) => Promise<void>
  onLinkToAsset?: (uploadId: string, assetRequestId: string) => Promise<void>
}

type FileFilter = 'all' | 'images' | 'videos' | 'documents' | 'other'
type SortOption = 'newest' | 'oldest' | 'name' | 'size'

export function UploadsPanel({
  project,
  uploads,
  onUpload,
  onDelete,
  onUpdateUpload,
  onLinkToAsset
}: UploadsPanelProps) {
  const [filter, setFilter] = useState<FileFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null)

  const handleUploadComplete = async (newUploads: Upload[]) => {
    // This is handled by the parent component through the onUpload callback
    console.log('Uploads complete:', newUploads)
  }

  const filteredAndSortedUploads = useMemo(() => {
    let filtered = uploads

    // Apply filter
    switch (filter) {
      case 'images':
        filtered = uploads.filter(u => isImage(u.mimeType))
        break
      case 'videos':
        filtered = uploads.filter(u => isVideo(u.mimeType))
        break
      case 'documents':
        filtered = uploads.filter(u => isPDF(u.mimeType) || u.mimeType.includes('document'))
        break
      case 'other':
        filtered = uploads.filter(u =>
          !isImage(u.mimeType) && !isVideo(u.mimeType) && !isPDF(u.mimeType) && !u.mimeType.includes('document')
        )
        break
    }

    // Apply sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name':
        sorted.sort((a, b) => a.filename.localeCompare(b.filename))
        break
      case 'size':
        sorted.sort((a, b) => b.size - a.size)
        break
    }

    return sorted
  }, [uploads, filter, sortBy])

  const getFileIcon = (mimeType: string) => {
    const iconType = getFileTypeIcon(mimeType)

    switch (iconType) {
      case 'image':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )
      case 'video':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'archive':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Uploads</h3>
          <Badge variant="default">{uploads.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Upload Zone */}
        <FileUploadZone
          projectId={project.id}
          onUploadComplete={handleUploadComplete}
        />

        {/* Filters and Sort */}
        {uploads.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Filter:</span>
              {(['all', 'images', 'videos', 'documents', 'other'] as FileFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    filter === f
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-md border-gray-300 text-xs focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>
        )}

        {/* Files Grid */}
        {filteredAndSortedUploads.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedUploads.map((upload) => (
              <div
                key={upload.id}
                className={cn(
                  'group flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  selectedUpload?.id === upload.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {/* Thumbnail or Icon */}
                <div className="flex-shrink-0">
                  {upload.metadata?.thumbnail && (isImage(upload.mimeType) || isVideo(upload.mimeType)) ? (
                    <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                      <img
                        src={upload.metadata.thumbnail}
                        alt={upload.filename}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                      {getFileIcon(upload.mimeType)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {upload.filename}
                  </p>
                  {onUpdateUpload ? (
                    <EditableField
                      label=""
                      value={upload.label || ''}
                      type="text"
                      onSave={(val) => onUpdateUpload(upload.id, { label: val })}
                      placeholder="Add a label..."
                      className="[&_span]:text-xs [&_span]:text-gray-500 [&_input]:text-xs [&>div]:min-h-0 [&>div]:py-0.5 [&>div]:px-0"
                    />
                  ) : (
                    upload.label && (
                      <p className="text-xs text-gray-500">{upload.label}</p>
                    )
                  )}
                  <p className="text-xs text-gray-400">
                    {formatFileSize(upload.size)}
                  </p>
                  {upload.assetRequestId && (
                    <Badge variant="info" className="mt-1 text-xs">
                      Linked to asset
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => window.open(upload.uri, '_blank')}
                    className="rounded p-1.5 hover:bg-gray-200"
                    title="View file"
                  >
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await onDelete(upload.id)
                      } catch (error) {
                        console.error('Failed to delete upload:', error)
                      }
                    }}
                    className="rounded p-1.5 hover:bg-red-100"
                    title="Delete file"
                  >
                    <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
