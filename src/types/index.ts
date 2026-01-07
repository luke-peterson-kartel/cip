// Enums
export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'STAFF'
export type ConversationStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
export type JobStatus = 'DRAFT' | 'PENDING' | 'IN_PRODUCTION' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'

// Core Entities
export interface Organization {
  id: string
  name: string
  slug: string
  hubspotId?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  organizationId: string
  role: UserRole
  googleSubjectId?: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  organizationId: string
  dataCoreUrl?: string
  trainingCoreUrls?: string[]
  requestAgentPrompt?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  description?: string
  status: JobStatus
  statusChangedAt?: string
  workspaceId: string
  organizationId: string
  airtableUrl?: string
  bubbleProjectId?: string
  frameioUrl?: string
  figmaUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UploadMetadata {
  width?: number
  height?: number
  duration?: number
  pageCount?: number
  fileSize?: number
}

export interface Upload {
  id: string
  filename: string
  mimeType: string
  uri: string
  workspaceId: string
  organizationId: string
  jobId?: string
  metadata?: UploadMetadata
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  userId?: string
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  workspaceId: string
  status: ConversationStatus
  jobId?: string
  messages?: ConversationMessage[]
  createdAt: string
  updatedAt: string
}

export interface AuditEvent {
  id: string
  createdAt: string
  userId: string
  organizationId: string
  action: string
  resourceType: string
  resourceId: string
  details?: Record<string, unknown>
}

// API Response Types
export interface PaginationInfo {
  nextToken?: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

export interface ApiError {
  code: string
  message: string
}

// Create/Update DTOs
export interface OrganizationCreate {
  name: string
  slug: string
  hubspotId?: string
}

export interface OrganizationUpdate {
  name?: string
  hubspotId?: string
}

export interface UserInvite {
  email: string
  role: UserRole
  name?: string
}

export interface UserUpdate {
  name?: string
  role?: UserRole
}

export interface WorkspaceCreate {
  name: string
  dataCoreUrl?: string
  trainingCoreUrls?: string[]
  requestAgentPrompt?: string
}

export interface WorkspaceUpdate {
  name?: string
  dataCoreUrl?: string
  trainingCoreUrls?: string[]
  requestAgentPrompt?: string
}

export interface JobUpdate {
  title?: string
  description?: string
  airtableUrl?: string
  frameioUrl?: string
  figmaUrl?: string
}

export interface UploadCreate {
  filename: string
  mimeType: string
  jobId?: string
}

export interface UploadResponse {
  upload: Upload
  presignedUrl: string
}

export interface SendMessageRequest {
  content: string
}
