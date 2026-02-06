import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getWorkspaces } from '@/api/endpoints/workspaces'
import type { Workspace, Job, AuditEvent, JobStatus } from '@/types'
import jobsData from '@/mock/data/jobs.json'
import auditData from '@/mock/data/audit-events.json'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getJobStatusConfig(status: JobStatus): { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', variant: 'default' }
    case 'PENDING':
      return { label: 'Pending', variant: 'warning' }
    case 'IN_PRODUCTION':
      return { label: 'In Production', variant: 'info' }
    case 'IN_REVIEW':
      return { label: 'In Review', variant: 'warning' }
    case 'COMPLETED':
      return { label: 'Completed', variant: 'success' }
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'error' }
    default:
      return { label: status, variant: 'default' }
  }
}

export function DashboardPage() {
  const { organization } = useAuthStore()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use mock data directly for jobs and audit events
  const recentJobs = (jobsData.items as Job[]).slice(0, 5)
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

  const totalJobs = jobsData.items.length
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
            <p className="text-sm font-medium text-gray-500">Total Jobs</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{totalJobs}</p>
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
        {/* Recent Jobs */}
        <Card>
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
              <Link to="/workspaces" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {recentJobs.map((job) => {
                const statusConfig = getJobStatusConfig(job.status)
                return (
                  <li key={job.id}>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="block px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-gray-900">{job.title}</p>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          </div>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {job.description}
                          </p>
                        </div>
                        <span className="ml-4 text-xs text-gray-400">
                          {formatDate(job.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
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
