import organizationsData from './data/organizations.json'
import usersData from './data/users.json'
import workspacesData from './data/workspaces.json'
import jobsData from './data/jobs.json'
import uploadsData from './data/uploads.json'
import conversationsData from './data/conversations.json'
import auditEventsData from './data/audit-events.json'

import type {
  Organization,
  User,
  Workspace,
  Job,
  Upload,
  Conversation,
  AuditEvent,
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
  "Thank you for the details. I'm preparing a comprehensive job brief based on our conversation. Is there anything else you'd like to add?",
  "Perfect! I've gathered enough information to create a job for this project. The job has been created and you can track its progress in the Jobs section.",
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

  // GET /workspaces/:id/jobs
  params = matchPath('/workspaces/:workspaceId/jobs', path)
  if (method === 'GET' && params) {
    const jobs = (jobsData as PaginatedResponse<Job>).items.filter(
      j => j.workspaceId === params!.workspaceId
    )
    return { items: jobs, pagination: { nextToken: null } } as T
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
    // For workspace audit events, filter by resources in that workspace
    const workspaceJobs = (jobsData as PaginatedResponse<Job>).items
      .filter(j => j.workspaceId === params!.workspaceId)
      .map(j => j.id)
    const workspaceUploads = (uploadsData as PaginatedResponse<Upload>).items
      .filter(u => u.workspaceId === params!.workspaceId)
      .map(u => u.id)
    const events = (auditEventsData as PaginatedResponse<AuditEvent>).items.filter(
      e => e.resourceId === params!.workspaceId ||
           workspaceJobs.includes(e.resourceId) ||
           workspaceUploads.includes(e.resourceId)
    )
    return { items: events, pagination: { nextToken: null } } as T
  }

  // GET /jobs/:id
  params = matchPath('/jobs/:jobId', path)
  if (method === 'GET' && params) {
    const job = (jobsData as PaginatedResponse<Job>).items.find(
      j => j.id === params!.jobId
    )
    return job as T
  }

  // PATCH /jobs/:id
  if (method === 'PATCH' && params) {
    const job = (jobsData as PaginatedResponse<Job>).items.find(
      j => j.id === params!.jobId
    )
    if (job && options.body) {
      const updates = JSON.parse(options.body as string)
      return { ...job, ...updates, updatedAt: new Date().toISOString() } as T
    }
  }

  // GET /uploads/:id
  params = matchPath('/uploads/:uploadId', path)
  if (method === 'GET' && params) {
    const upload = (uploadsData as PaginatedResponse<Upload>).items.find(
      u => u.id === params!.uploadId
    )
    return upload as T
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

  // GET /admin/jobs
  if (method === 'GET' && path === '/admin/jobs') {
    return jobsData as T
  }

  // GET /admin/audit-events
  if (method === 'GET' && path === '/admin/audit-events') {
    return auditEventsData as T
  }

  // Default fallback
  console.warn(`Unhandled mock request: ${method} ${endpoint}`)
  return { items: [], pagination: { nextToken: null } } as T
}
