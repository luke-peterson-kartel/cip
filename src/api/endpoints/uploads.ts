import { apiClient } from '../client'
import type { Upload, UploadCreate, UploadResponse, PaginatedResponse } from '@/types'

/**
 * Get uploads for a project
 */
export async function getProjectUploads(projectId: string): Promise<PaginatedResponse<Upload>> {
  const response = await apiClient.get<PaginatedResponse<Upload>>(`/projects/${projectId}/uploads`)
  return response.data
}

/**
 * Get uploads for a job
 */
export async function getJobUploads(jobId: string): Promise<PaginatedResponse<Upload>> {
  const response = await apiClient.get<PaginatedResponse<Upload>>(`/jobs/${jobId}/uploads`)
  return response.data
}

/**
 * Get uploads for an asset request
 */
export async function getAssetRequestUploads(assetRequestId: string): Promise<PaginatedResponse<Upload>> {
  const response = await apiClient.get<PaginatedResponse<Upload>>(`/asset-requests/${assetRequestId}/uploads`)
  return response.data
}

/**
 * Get a single upload by ID
 */
export async function getUpload(uploadId: string): Promise<Upload> {
  const response = await apiClient.get<Upload>(`/uploads/${uploadId}`)
  return response.data
}

/**
 * Create a new upload (gets presigned URL for upload)
 */
export async function createUpload(
  projectId: string,
  data: UploadCreate
): Promise<UploadResponse> {
  const response = await apiClient.post<UploadResponse>(`/projects/${projectId}/uploads`, data)
  return response.data
}

/**
 * Create upload for a job
 */
export async function createJobUpload(
  jobId: string,
  data: UploadCreate
): Promise<UploadResponse> {
  const response = await apiClient.post<UploadResponse>(`/jobs/${jobId}/uploads`, data)
  return response.data
}

/**
 * Delete an upload
 */
export async function deleteUpload(uploadId: string): Promise<void> {
  await apiClient.delete(`/uploads/${uploadId}`)
}

/**
 * Link an upload to an asset request
 */
export async function linkUploadToAsset(
  uploadId: string,
  assetRequestId: string
): Promise<Upload> {
  const response = await apiClient.patch<Upload>(`/uploads/${uploadId}`, {
    assetRequestId
  })
  return response.data
}

/**
 * Unlink an upload from an asset request
 */
export async function unlinkUploadFromAsset(uploadId: string): Promise<Upload> {
  const response = await apiClient.patch<Upload>(`/uploads/${uploadId}`, {
    assetRequestId: null
  })
  return response.data
}

/**
 * Upload a file directly (for testing/mock purposes)
 * In production, this would upload to the presigned URL
 */
export async function uploadFile(file: File, presignedUrl: string): Promise<void> {
  // In production, this would be a direct upload to S3 using the presigned URL
  // For now, this is a placeholder for the upload logic
  const formData = new FormData()
  formData.append('file', file)

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
