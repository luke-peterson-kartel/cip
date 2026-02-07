import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getWorkspaces } from '@/api/endpoints/workspaces'
import type { Workspace, AssetRequest, AssetRequestStatus, AuditEvent, Project } from '@/types'
import projectsData from '@/mock/data/projects.json'
import auditData from '@/mock/data/audit-events.json'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAssetRequestStatusConfig(status: AssetRequestStatus): { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', variant: 'warning' }
    case 'APPROVE':
      return { label: 'Approved', variant: 'success' }
    case 'DENY':
      return { label: 'Denied', variant: 'error' }
    case 'IMPROVE':
      return { label: 'Improve', variant: 'info' }
    case 'ITERATE':
      return { label: 'Iterate', variant: 'info' }
    case 'COMPLETED':
      return { label: 'Completed', variant: 'success' }
    default:
      return { label: status, variant: 'default' }
  }
}

export function DashboardPage() {
  const { organization } = useAuthStore()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Flatten asset requests from all projects
  const allAssetRequests: (AssetRequest & { projectName: string; projectId: string })[] =
    (projectsData.items as Project[]).flatMap(project =>
      (project.assetRequests || []).map(ar => ({
        ...(ar as AssetRequest),
        projectName: project.name,
        projectId: project.id,
      }))
    )
  const recentAssetRequests = allAssetRequests
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
  const recentActivity = (auditData.items as AuditEvent[]).slice(0, 5)

  useEffect(() => {
    async function loadData() {
      if (!organization) return

      try {
        const response = await getWorkspaces(organization.id)
        setWorkspaces(response.items)
      } catch (error) {
        console.error('Failed to load workspaces:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [organization])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalUploads = 6 // From mock data

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's what's happening with ${organization?.brand || organization?.name || 'your brand'}.`}
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-gray-500">Workspaces</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{workspaces.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-gray-500">Asset Requests</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{allAssetRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-gray-500">Uploads</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{totalUploads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-gray-500">Active Conversations</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">1</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Asset Requests */}
        <Card>
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Asset Requests</h2>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {recentAssetRequests.map((ar) => {
                const statusConfig = getAssetRequestStatusConfig(ar.status)
                return (
                  <li key={ar.id}>
                    <Link
                      to={`/projects/${ar.projectId}`}
                      className="block px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-gray-900">
                              {ar.title || ar.description}
                            </p>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          </div>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {ar.projectName} &middot; {ar.platform} &middot; {ar.creativeType}
                          </p>
                        </div>
                        <span className="ml-4 text-xs text-gray-400">
                          {formatDate(ar.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
              {recentAssetRequests.length === 0 && (
                <li className="px-6 py-8 text-center text-sm text-gray-500">
                  No asset requests yet.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/audit" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((event) => (
                <li key={event.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={
                        event.action === 'CREATE'
                          ? 'success'
                          : event.action === 'UPDATE'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {event.action}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="capitalize">{event.resourceType}</span>
                        {' was '}
                        {event.action.toLowerCase()}d
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
