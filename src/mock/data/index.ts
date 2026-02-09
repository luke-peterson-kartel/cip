// Static imports for all clients — Vite resolves these at build time
import newellOrganizations from './clients/newell/organizations.json'
import newellUsers from './clients/newell/users.json'
import newellProjects from './clients/newell/projects.json'
import newellUploads from './clients/newell/uploads.json'
import newellConversations from './clients/newell/conversations.json'
import newellAssetRequests from './clients/newell/asset-requests.json'
import newellAuditEvents from './clients/newell/audit-events.json'

import earninOrganizations from './clients/earnin/organizations.json'
import earninUsers from './clients/earnin/users.json'
import earninProjects from './clients/earnin/projects.json'
import earninUploads from './clients/earnin/uploads.json'
import earninConversations from './clients/earnin/conversations.json'
import earninAssetRequests from './clients/earnin/asset-requests.json'
import earninAuditEvents from './clients/earnin/audit-events.json'

export type ClientId = 'newell' | 'earnin'

export interface ClientDataSet {
  organizations: typeof newellOrganizations
  users: typeof newellUsers
  projects: typeof newellProjects
  uploads: typeof newellUploads
  conversations: typeof newellConversations
  assetRequests: typeof newellAssetRequests
  auditEvents: typeof newellAuditEvents
}

const clientDataSets: Record<ClientId, ClientDataSet> = {
  newell: {
    organizations: newellOrganizations,
    users: newellUsers,
    projects: newellProjects,
    uploads: newellUploads,
    conversations: newellConversations,
    assetRequests: newellAssetRequests,
    auditEvents: newellAuditEvents,
  },
  earnin: {
    organizations: earninOrganizations,
    users: earninUsers,
    projects: earninProjects,
    uploads: earninUploads,
    conversations: earninConversations,
    assetRequests: earninAssetRequests,
    auditEvents: earninAuditEvents,
  },
}

export const DEFAULT_CLIENT: ClientId = 'newell'

export function getClientData(clientId: ClientId): ClientDataSet {
  return clientDataSets[clientId] || clientDataSets[DEFAULT_CLIENT]
}

export function isValidClientId(value: string): value is ClientId {
  return value in clientDataSets
}
