import { apiClient } from '../client'
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  Upload,
  Conversation,
  ChatMessage,
  AuditEvent,
  PaginatedResponse,
} from '@/types'

export async function getProjects(organizationId: string): Promise<PaginatedResponse<Project>> {
  return apiClient(`/organizations/${organizationId}/projects`)
}

export async function getProject(projectId: string): Promise<Project> {
  return apiClient(`/projects/${projectId}`)
}

export async function createProject(organizationId: string, data: ProjectCreate): Promise<Project> {
  return apiClient(`/organizations/${organizationId}/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(projectId: string, data: ProjectUpdate): Promise<Project> {
  return apiClient(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiClient(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function getProjectUploads(projectId: string): Promise<PaginatedResponse<Upload>> {
  return apiClient(`/projects/${projectId}/uploads`)
}

export async function getProjectConversations(projectId: string): Promise<PaginatedResponse<Conversation>> {
  return apiClient(`/projects/${projectId}/request-agent/conversations`)
}

export async function startProjectConversation(projectId: string): Promise<Conversation> {
  return apiClient(`/projects/${projectId}/request-agent/conversations`, {
    method: 'POST',
  })
}

export async function getProjectChatMessages(projectId: string): Promise<PaginatedResponse<ChatMessage>> {
  return apiClient(`/projects/${projectId}/chat-messages`)
}

export async function sendProjectChatMessage(
  projectId: string,
  data: { senderEmail: string; senderName: string; message: string }
): Promise<ChatMessage> {
  return apiClient(`/projects/${projectId}/chat-messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getProjectAuditEvents(projectId: string): Promise<PaginatedResponse<AuditEvent>> {
  return apiClient(`/projects/${projectId}/audit-events`)
}
