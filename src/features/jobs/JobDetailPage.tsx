import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, Badge, Spinner, Button } from '@/components/ui'
import { getJob } from '@/api/endpoints/jobs'
import type { Job } from '@/types'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return
      try {
        const data = await getJob(jobId)
        setJob(data)
      } catch (error) {
        console.error('Failed to load job:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadJob()
  }, [jobId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return <div className="py-12 text-center text-gray-500">Job not found</div>
  }

  const externalLinks = [
    { name: 'Airtable', url: job.airtableUrl, icon: '📊' },
    { name: 'Frame.io', url: job.frameioUrl, icon: '🎬' },
    { name: 'Figma', url: job.figmaUrl, icon: '🎨' },
  ].filter((link) => link.url)

  return (
    <div>
      <PageHeader
        title={job.title}
        description={`Created ${formatDate(job.createdAt)}`}
        actions={
          <Link to={`/workspaces/${job.workspaceId}`}>
            <Button variant="secondary">Back to Workspace</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">
                {job.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* External Links */}
          {externalLinks.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">External Links</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {externalLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                    >
                      <span className="text-2xl">{link.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{link.name}</p>
                        <p className="truncate text-sm text-gray-500">{link.url}</p>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Details</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant="success">Active</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.updatedAt)}</dd>
                </div>
                {job.bubbleProjectId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bubble Project ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{job.bubbleProjectId}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
