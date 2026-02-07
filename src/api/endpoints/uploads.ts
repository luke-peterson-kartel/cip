import { apiClient } from '../client'
import type { Upload, UploadCreate, UploadResponse, PaginatedResponse } from '@/types'

/**
 * Get uploads for an asset request
 */
export async function getAssetRequestUploads(assetRequestId: string): Promise<PaginatedResponse<Upload>> {
  return apiClient(`/asset-requests/${assetRequestId}/uploads`)
}

/**
 * Get a single upload by ID
 */
export async function getUpload(uploadId: string): Promise<Upload> {
  return apiClient(`/uploads/${uploadId}`)
}

/**
 * Create a new upload (gets presigned URL for upload)
 */
export async function createUpload(
  projectId: string,
  data: UploadCreate
): Promise<UploadResponse> {
  return apiClient(`/projects/${projectId}/uploads`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an upload (label, metadata, etc.)
 */
export async function updateUpload(
  uploadId: string,
  data: Partial<Pick<Upload, 'label' | 'assetRequestId' | 'reviewStatus' | 'reviewNotes'>>
): Promise<Upload> {
  return apiClient(`/uploads/${uploadId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete an upload
 */
export async function deleteUpload(uploadId: string): Promise<void> {
  return apiClient(`/uploads/${uploadId}`, {
    method: 'DELETE',
  })
}

/**
 * Link an upload to an asset request
 */
export async function linkUploadToAsset(
  uploadId: string,
  assetRequestId: string
): Promise<Upload> {
  return apiClient(`/uploads/${uploadId}`, {
    method: 'PATCH',
    body: JSON.stringify({ assetRequestId }),
  })
}

/**
 * Unlink an upload from an asset request
 */
export async function unlinkUploadFromAsset(uploadId: string): Promise<Upload> {
  return apiClient(`/uploads/${uploadId}`, {
    method: 'PATCH',
    body: JSON.stringify({ assetRequestId: null }),
  })
}

/**
 * Upload a file directly (for testing/mock purposes)
 * In production, this would upload to the presigned URL
 */
export async function uploadFile(file: File, presignedUrl: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }
}
