// Enums
export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN' | 'STAFF'
export type ConversationStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
export type JobStatus = 'DRAFT' | 'PENDING' | 'IN_PRODUCTION' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
export type ProjectType = 'INTERNAL_BUILD' | 'CREATIVE_BRIEF' | 'CREATIVE_EXPLORATION'
export type AssetRequestStatus = 'PENDING' | 'APPROVE' | 'DENY' | 'IMPROVE' | 'ITERATE' | 'COMPLETED'
export type AssetWorkflowStage = 'QC_LIBRARY' | 'GEN_REFINE' | 'QC_EDIT' | 'CLIENT_REVIEW' | 'QC_DISTRO'
export type AssetProductionStage = 'ANIMATIC' | 'ROUGH_CUT' | 'FINE_CUT' | 'LAST_LOOKS' | 'FINAL'
export type AssetPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type DeliverableReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'NEEDS_CHANGES'
export type SetupPhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

// Core Entities
export interface Organization {
  id: string
  name: string
  brand?: string
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

// Asset Specification for Assets Generation projects
export interface AssetSpec {
  platform?: string // Meta, TikTok, Pinterest, etc.
  title?: string
  creativeType?: string // Static, Carousel, Video, etc.
  numberOfAssets?: number
  timeline?: string
  format?: string
  size?: string // 1x1, 9x16, 4x5, etc.
  duration?: number
  outputChannels?: string[] // DEPRECATED - use platform instead
}

// Chat message for asset request feedback
export interface ChatMessage {
  id: string
  senderEmail: string
  senderName: string
  message: string
  timestamp: string
}

// Asset Request - comprehensive tracking for individual assets
export interface AssetRequest {
  id: string
  projectId: string

  // Title and description
  title?: string

  // From submission form / CSV - PRIMARY FIELDS
  platform: string // CRITICAL: Meta, TikTok, Pinterest, YouTube, OLV/OTT, CTV, TV/Long Form
  creativeType: string // Static, Carousel, Video, Video--UGC, Video--Branded, Static Pin, Idea Pin, Video Pin, GIF
  description: string
  targetCount: number
  dimensions?: string // e.g., "1x1", "9x16", "4x5"
  duration?: number // in seconds for video
  format: string // Static Image, GIF, Video, Long-Form Video

  // Workflow tracking
  status: AssetRequestStatus
  workflowStage: AssetWorkflowStage
  productionStage?: AssetProductionStage // for video assets

  // Dates
  requestedDate: string
  firstV1ReviewDate?: string
  finalDeliveryDate?: string
  completedDate?: string

  // Assignment
  clientAssignedEmail?: string
  kartelAssignedEmail?: string

  // Additional tracking
  priority: AssetPriority
  version: number // iteration count
  messages?: ChatMessage[]

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Platform options based on actual client CSV
export const PLATFORM_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'TikTok', value: 'TikTok' },
  { label: 'Pinterest', value: 'Pinterest' },
  { label: 'YouTube', value: 'YouTube' },
  { label: 'OLV/YouTube/OTT', value: 'OLV/YouTube/OTT' },
  { label: 'Animated GIF', value: 'Animated GIF' },
  { label: 'CTV (Connected TV)', value: 'CTV' },
  { label: 'TV/Long Form Video', value: 'TV/Long Form' },
] as const

// Project Setup Phase - tracks initial 21-day setup
export interface ProjectSetupPhase {
  dataCapture: { status: SetupPhaseStatus; days: number; completedDate?: string }
  parsing: { status: SetupPhaseStatus; days: number; completedDate?: string }
  captioning: { status: SetupPhaseStatus; days: number; completedDate?: string }
  loraTraining: { status: SetupPhaseStatus; days: number; completedDate?: string }
  workflowBuild: { status: SetupPhaseStatus; days: number; completedDate?: string }
  generation: { status: SetupPhaseStatus; days: number; completedDate?: string }
}

// Project (replaces Workspace with type-specific fields)
export interface Project {
  id: string
  name: string
  projectType: ProjectType
  organizationId: string

  // Common fields
  submitDate?: string
  dueDate?: string
  submittedBy?: string
  description?: string
  googleDriveUrl?: string
  additionalLinks?: Array<{ label: string; url: string }>

  // Internal Build fields
  problem?: string
  solution?: string
  goal?: string
  why?: string
  technicalWorkflowScope?: string
  dataRequirements?: string

  // Creative Brief fields
  briefType?: string
  targetAudience?: string
  keyMessage?: string
  deliverables?: string

  // Assets Generation fields
  assetSpecs?: AssetSpec[] // Multiple asset specifications
  numberOfAssets?: number // Legacy - kept for backward compatibility
  timeline?: string // Legacy - kept for backward compatibility
  format?: string // Legacy - kept for backward compatibility
  duration?: number // Legacy - kept for backward compatibility
  outputChannels?: string[] // Legacy - kept for backward compatibility
  csvData?: any // Store parsed CSV data

  // Creative Exploration fields
  explorationFocus?: string
  collaborationType?: string
  creativeDirector?: string
  preditor?: string
  iterationCount?: number

  // Legacy fields (keep for backward compatibility)
  dataCoreUrl?: string
  trainingCoreUrls?: string[]
  requestAgentPrompt?: string

  // Asset tracking (NEW)
  assetRequests?: AssetRequest[]
  setupPhase?: ProjectSetupPhase

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
  duration?: number // for video/audio
  pageCount?: number
  fileSize?: number
  thumbnail?: string // thumbnail URL
  [key: string]: any
}

export interface Upload {
  id: string
  filename: string
  mimeType: string
  size: number // in bytes
  uri: string // presigned URL or path
  workspaceId?: string // legacy, kept for backward compatibility
  projectId?: string // new field for project association
  organizationId: string
  jobId?: string
  assetRequestId?: string // NEW: link to asset request
  uploadedBy?: string // user email or ID
  metadata?: UploadMetadata
  reviewStatus?: DeliverableReviewStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
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

// Audit Event Details Types
export interface FieldChangeDetails {
  field: string
  previousValue: any
  newValue: any
  changedBy: string
  timestamp: string
}

export interface AssetRequestChangeDetails {
  assetRequestId: string
  field: string
  previousValue: any
  newValue: any
}

export type AuditEventDetails =
  | FieldChangeDetails
  | AssetRequestChangeDetails
  | Record<string, unknown>

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

export interface ProjectCreate {
  name: string
  projectType: ProjectType

  // Common fields
  submitDate?: string
  dueDate?: string
  submittedBy?: string
  description?: string
  googleDriveUrl?: string
  additionalLinks?: Array<{ label: string; url: string }>

  // Type-specific fields
  problem?: string
  solution?: string
  goal?: string
  why?: string
  technicalWorkflowScope?: string
  dataRequirements?: string
  briefType?: string
  targetAudience?: string
  keyMessage?: string
  deliverables?: string
  numberOfAssets?: number
  timeline?: string
  format?: string
  duration?: number
  outputChannels?: string[]
  csvData?: any
  explorationFocus?: string
  collaborationType?: string
  creativeDirector?: string
  preditor?: string
  iterationCount?: number

  // Legacy fields
  dataCoreUrl?: string
  trainingCoreUrls?: string[]
  requestAgentPrompt?: string
}

export interface ProjectUpdate {
  name?: string
  projectType?: ProjectType
  submitDate?: string
  dueDate?: string
  submittedBy?: string
  description?: string
  googleDriveUrl?: string
  additionalLinks?: Array<{ label: string; url: string }>
  problem?: string
  solution?: string
  goal?: string
  why?: string
  technicalWorkflowScope?: string
  dataRequirements?: string
  briefType?: string
  targetAudience?: string
  keyMessage?: string
  deliverables?: string
  numberOfAssets?: number
  timeline?: string
  format?: string
  duration?: number
  outputChannels?: string[]
  csvData?: any
  explorationFocus?: string
  collaborationType?: string
  creativeDirector?: string
  preditor?: string
  iterationCount?: number
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
