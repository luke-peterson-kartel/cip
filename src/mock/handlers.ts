import organizationsData from './data/organizations.json'
import usersData from './data/users.json'
import workspacesData from './data/workspaces.json'
import projectsData from './data/projects.json'
import uploadsData from './data/uploads.json'
import conversationsData from './data/conversations.json'
import auditEventsData from './data/audit-events.json'

import type {
  Organization,
  User,
  Workspace,
  Project,
  Upload,
  Conversation,
  AuditEvent,
  AssetRequest,
  PaginatedResponse,
  ConversationMessage,
} from '@/types'

// Helper to parse path parameters
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = path.split('?')[0].split('/')

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

// Mock agent responses
const agentResponses = [
  "I'd be happy to help with that! Could you tell me more about the specific requirements for this project?",
  "That sounds like an interesting project. Let me ask a few clarifying questions:\n\n1. What's the target audience?\n2. What's the timeline for this project?\n3. Are there any specific brand guidelines to follow?",
  "Great input! Based on what you've shared, I can help create a brief for this. Would you like me to focus on any particular aspect?",
  "Thank you for the details. I'm preparing a comprehensive brief based on our conversation. Is there anything else you'd like to add?",
  "Perfect! I've gathered enough information to create asset requests for this project. You can track progress on the project page.",
]

export function mockHandler<T>(endpoint: string, options: RequestInit = {}): T {
  const method = options.method || 'GET'
  const path = endpoint.split('?')[0]

  // GET /users/me
  if (method === 'GET' && path === '/users/me') {
    return (usersData as { currentUser: User }).currentUser as T
  }

  // GET /organizations
  if (method === 'GET' && path === '/organizations') {
    return organizationsData as T
  }

  // GET /organizations/:id
  let params = matchPath('/organizations/:organizationId', path)
  if (method === 'GET' && params) {
    const org = (organizationsData as PaginatedResponse<Organization>).items.find(
      o => o.id === params!.organizationId
    )
    return org as T
  }

  // GET /organizations/:id/users
  params = matchPath('/organizations/:organizationId/users', path)
  if (method === 'GET' && params) {
    return usersData as T
  }

  // GET /organizations/:id/workspaces
  params = matchPath('/organizations/:organizationId/workspaces', path)
  if (method === 'GET' && params) {
    return workspacesData as T
  }

  // POST /organizations/:id/workspaces
  if (method === 'POST' && params) {
    const body = JSON.parse(options.body as string)
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      organizationId: params.organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }
    return newWorkspace as T
  }

  // GET /workspaces/:id
  params = matchPath('/workspaces/:workspaceId', path)
  if (method === 'GET' && params) {
    const workspace = (workspacesData as PaginatedResponse<Workspace>).items.find(
      w => w.id === params!.workspaceId
    )
    return workspace as T
  }

  // PATCH /workspaces/:id
  if (method === 'PATCH' && params) {
    const workspace = (workspacesData as PaginatedResponse<Workspace>).items.find(
      w => w.id === params!.workspaceId
    )
    if (workspace && options.body) {
      const updates = JSON.parse(options.body as string)
      return { ...workspace, ...updates, updatedAt: new Date().toISOString() } as T
    }
  }

  // GET /workspaces/:id/uploads
  params = matchPath('/workspaces/:workspaceId/uploads', path)
  if (method === 'GET' && params) {
    const uploads = (uploadsData as PaginatedResponse<Upload>).items.filter(
      u => u.workspaceId === params!.workspaceId
    )
    return { items: uploads, pagination: { nextToken: null } } as T
  }

  // GET /workspaces/:id/request-agent/conversations
  params = matchPath('/workspaces/:workspaceId/request-agent/conversations', path)
  if (method === 'GET' && params) {
    const conversations = (conversationsData as PaginatedResponse<Conversation>).items.filter(
      c => c.workspaceId === params!.workspaceId
    )
    return { items: conversations, pagination: { nextToken: null } } as T
  }

  // POST /workspaces/:id/request-agent/conversations
  if (method === 'POST' && params) {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      workspaceId: params.workspaceId,
      status: 'ACTIVE',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return newConversation as T
  }

  // GET /workspaces/:id/audit-events
  params = matchPath('/workspaces/:workspaceId/audit-events', path)
  if (method === 'GET' && params) {
    const workspaceUploads = (uploadsData as PaginatedResponse<Upload>).items
      .filter(u => u.workspaceId === params!.workspaceId)
      .map(u => u.id)
    const events = (auditEventsData as PaginatedResponse<AuditEvent>).items.filter(
      e => e.resourceId === params!.workspaceId ||
           workspaceUploads.includes(e.resourceId)
    )
    return { items: events, pagination: { nextToken: null } } as T
  }

  // ============ PROJECT ENDPOINTS ============

  // GET /organizations/:id/projects
  params = matchPath('/organizations/:organizationId/projects', path)
  if (method === 'GET' && params) {
    return projectsData as T
  }

  // POST /organizations/:id/projects
  if (method === 'POST' && params) {
    const body = JSON.parse(options.body as string)
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      organizationId: params.organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }
    return newProject as T
  }

  // GET /projects/:id
  params = matchPath('/projects/:projectId', path)
  if (method === 'GET' && params) {
    const project = (projectsData as PaginatedResponse<Project>).items.find(
      p => p.id === params!.projectId
    )
    return project as T
  }

  // PATCH /projects/:id
  if (method === 'PATCH' && params) {
    const project = (projectsData as PaginatedResponse<Project>).items.find(
      p => p.id === params!.projectId
    )
    if (project && options.body) {
      const updates = JSON.parse(options.body as string)
      return { ...project, ...updates, updatedAt: new Date().toISOString() } as T
    }
  }

  // GET /projects/:id/uploads
  params = matchPath('/projects/:projectId/uploads', path)
  if (method === 'GET' && params) {
    const uploads = (uploadsData as PaginatedResponse<Upload>).items.filter(
      u => u.workspaceId === params!.projectId || u.projectId === params!.projectId
    )
    return { items: uploads, pagination: { nextToken: null } } as T
  }

  // POST /projects/:id/uploads
  if (method === 'POST' && params) {
    const body = JSON.parse(options.body as string)
    const newUpload: Upload = {
      id: `upload-${Date.now()}`,
      projectId: params.projectId,
      organizationId: 'org-001',
      uploadedBy: 'current-user',
      size: 0,
      uri: `s3://cip-assets/${params.projectId}/${body.filename}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }
    // In a real implementation, we'd also return a presigned URL
    return {
      upload: newUpload,
      presignedUrl: `https://mock-presigned-url.s3.amazonaws.com/${body.filename}`
    } as T
  }

  // GET /projects/:id/request-agent/conversations
  params = matchPath('/projects/:projectId/request-agent/conversations', path)
  if (method === 'GET' && params) {
    const conversations = (conversationsData as PaginatedResponse<Conversation>).items.filter(
      c => c.workspaceId === params!.projectId
    )
    return { items: conversations, pagination: { nextToken: null } } as T
  }

  // POST /projects/:id/request-agent/conversations
  if (method === 'POST' && params) {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      workspaceId: params.projectId,
      status: 'ACTIVE',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return newConversation as T
  }

  // GET /projects/:id/audit-events
  params = matchPath('/projects/:projectId/audit-events', path)
  if (method === 'GET' && params) {
    const projectUploads = (uploadsData as PaginatedResponse<Upload>).items
      .filter(u => u.projectId === params!.projectId)
      .map(u => u.id)
    const events = (auditEventsData as PaginatedResponse<AuditEvent>).items.filter(
      e => e.resourceId === params!.projectId ||
           projectUploads.includes(e.resourceId)
    )
    return { items: events, pagination: { nextToken: null } } as T
  }

  // GET /projects/:id/chat-messages
  params = matchPath('/projects/:projectId/chat-messages', path)
  if (method === 'GET' && params) {
    const project = (projectsData as PaginatedResponse<Project>).items.find(
      p => p.id === params!.projectId
    )
    return { items: project?.chatMessages || [], pagination: { nextToken: null } } as T
  }

  // POST /projects/:id/chat-messages
  if (method === 'POST' && params) {
    const body = JSON.parse(options.body as string)
    const newMessage = {
      id: `pchat-${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString(),
    }
    return newMessage as T
  }

  // ============ END PROJECT ENDPOINTS ============

  // ============ ASSET REQUEST ENDPOINTS ============

  // GET /projects/:id/asset-requests
  params = matchPath('/projects/:projectId/asset-requests', path)
  if (method === 'GET' && params) {
    const project = (projectsData as PaginatedResponse<Project>).items.find(
      p => p.id === params!.projectId
    )
    const assetRequests = project?.assetRequests || []
    return { items: assetRequests, pagination: { nextToken: null } } as T
  }

  // POST /projects/:id/asset-requests
  if (method === 'POST' && params) {
    const body = JSON.parse(options.body as string)
    const newAssetRequest: AssetRequest = {
      id: `asset-${Date.now()}`,
      projectId: params.projectId,
      platform: '',
      creativeType: '',
      description: '',
      targetCount: 0,
      status: 'PENDING',
      workflowStage: 'QC_LIBRARY',
      priority: 'MEDIUM',
      version: 1,
      requestedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      ...body,
    }
    // Persist to mock data so PATCH/GET can find it later
    const project = (projectsData as PaginatedResponse<Project>).items.find(
      p => p.id === params!.projectId
    )
    if (project) {
      if (!project.assetRequests) project.assetRequests = []
      project.assetRequests.push(newAssetRequest)
    }
    return newAssetRequest as T
  }

  // GET /asset-requests/:id
  params = matchPath('/asset-requests/:assetRequestId', path)
  if (method === 'GET' && params) {
    for (const project of (projectsData as PaginatedResponse<Project>).items) {
      const found = project.assetRequests?.find(
        ar => ar.id === params!.assetRequestId
      )
      if (found) return found as T
    }
    return undefined as T
  }

  // PATCH /asset-requests/:id
  if (method === 'PATCH' && params) {
    for (const project of (projectsData as PaginatedResponse<Project>).items) {
      const idx = project.assetRequests?.findIndex(
        ar => ar.id === params!.assetRequestId
      ) ?? -1
      if (idx >= 0 && options.body) {
        const updates = JSON.parse(options.body as string)
        const updated = { ...project.assetRequests![idx], ...updates, updatedAt: new Date().toISOString() }
        project.assetRequests![idx] = updated
        return updated as T
      }
    }
    return undefined as T
  }

  // DELETE /asset-requests/:id
  if (method === 'DELETE' && params) {
    return {} as T
  }

  // ============ END ASSET REQUEST ENDPOINTS ============

  // GET /asset-requests/:id/uploads
  params = matchPath('/asset-requests/:assetRequestId/uploads', path)
  if (method === 'GET' && params) {
    const uploads = (uploadsData as PaginatedResponse<Upload>).items.filter(
      u => u.assetRequestId === params!.assetRequestId
    )
    return { items: uploads, pagination: { nextToken: null } } as T
  }

  // GET /uploads/:id
  params = matchPath('/uploads/:uploadId', path)
  if (method === 'GET' && params) {
    const upload = (uploadsData as PaginatedResponse<Upload>).items.find(
      u => u.id === params!.uploadId
    )
    return upload as T
  }

  // PATCH /uploads/:id
  if (method === 'PATCH' && params) {
    const upload = (uploadsData as PaginatedResponse<Upload>).items.find(
      u => u.id === params!.uploadId
    )
    if (upload && options.body) {
      const updates = JSON.parse(options.body as string)
      return { ...upload, ...updates, updatedAt: new Date().toISOString() } as T
    }
  }

  // DELETE /uploads/:id
  if (method === 'DELETE' && params) {
    // In a real implementation, this would delete from storage and database
    return {} as T
  }

  // GET /conversations/:id
  params = matchPath('/conversations/:conversationId', path)
  if (method === 'GET' && params) {
    const conversation = (conversationsData as PaginatedResponse<Conversation>).items.find(
      c => c.id === params!.conversationId
    )
    return conversation as T
  }

  // GET /conversations/:id/messages
  params = matchPath('/conversations/:conversationId/messages', path)
  if (method === 'GET' && params) {
    const conversation = (conversationsData as PaginatedResponse<Conversation>).items.find(
      c => c.id === params!.conversationId
    )
    return {
      items: conversation?.messages || [],
      pagination: { nextToken: null }
    } as T
  }

  // POST /conversations/:id/messages
  if (method === 'POST' && params) {
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)]
    const agentMessage: ConversationMessage = {
      content: randomResponse,
      createdAt: new Date().toISOString(),
    }
    return agentMessage as T
  }

  // GET /users/:id
  params = matchPath('/users/:userId', path)
  if (method === 'GET' && params) {
    const user = (usersData as { items: User[] }).items.find(
      u => u.id === params!.userId
    )
    return user as T
  }

  // Admin endpoints
  // GET /admin/users
  if (method === 'GET' && path === '/admin/users') {
    return usersData as T
  }

  // GET /admin/organizations
  if (method === 'GET' && path === '/admin/organizations') {
    return organizationsData as T
  }

  // GET /admin/audit-events
  if (method === 'GET' && path === '/admin/audit-events') {
    return auditEventsData as T
  }

  // Default fallback
  console.warn(`Unhandled mock request: ${method} ${endpoint}`)
  return { items: [], pagination: { nextToken: null } } as T
}
