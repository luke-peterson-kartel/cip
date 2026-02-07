import { apiClient } from '../client'
import type {
  Workspace,
  WorkspaceCreate,
  WorkspaceUpdate,
  Upload,
  Conversation,
  AuditEvent,
  PaginatedResponse,
} from '@/types'

export async function getWorkspaces(organizationId: string): Promise<PaginatedResponse<Workspace>> {
  return apiClient(`/organizations/${organizationId}/workspaces`)
}

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  return apiClient(`/workspaces/${workspaceId}`)
}

export async function createWorkspace(organizationId: string, data: WorkspaceCreate): Promise<Workspace> {
  return apiClient(`/organizations/${organizationId}/workspaces`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWorkspace(workspaceId: string, data: WorkspaceUpdate): Promise<Workspace> {
  return apiClient(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  return apiClient(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  })
}

export async function getWorkspaceUploads(workspaceId: string): Promise<PaginatedResponse<Upload>> {
  return apiClient(`/workspaces/${workspaceId}/uploads`)
}

export async function getWorkspaceConversations(workspaceId: string): Promise<PaginatedResponse<Conversation>> {
  return apiClient(`/workspaces/${workspaceId}/request-agent/conversations`)
}

export async function startConversation(workspaceId: string): Promise<Conversation> {
  return apiClient(`/workspaces/${workspaceId}/request-agent/conversations`, {
    method: 'POST',
  })
}

export async function getWorkspaceAuditEvents(workspaceId: string): Promise<PaginatedResponse<AuditEvent>> {
  return apiClient(`/workspaces/${workspaceId}/audit-events`)
}
