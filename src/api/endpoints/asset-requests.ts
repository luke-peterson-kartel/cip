import { apiClient } from '../client'
import type { AssetRequest, PaginatedResponse } from '@/types'

export async function getAssetRequests(projectId: string): Promise<PaginatedResponse<AssetRequest>> {
  return apiClient(`/projects/${projectId}/asset-requests`)
}

export async function getAssetRequest(assetRequestId: string): Promise<AssetRequest> {
  return apiClient(`/asset-requests/${assetRequestId}`)
}

export async function createAssetRequest(
  projectId: string,
  data: Partial<AssetRequest>
): Promise<AssetRequest> {
  return apiClient(`/projects/${projectId}/asset-requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAssetRequest(
  assetRequestId: string,
  data: Partial<AssetRequest>
): Promise<AssetRequest> {
  return apiClient(`/asset-requests/${assetRequestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteAssetRequest(assetRequestId: string): Promise<void> {
  return apiClient(`/asset-requests/${assetRequestId}`, {
    method: 'DELETE',
  })
}
