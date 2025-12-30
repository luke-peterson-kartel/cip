import { useEffect, useState } from 'react'
import { useParams, Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Button, Spinner, Card, CardContent, Badge } from '@/components/ui'
import { getWorkspace, getWorkspaceJobs, getWorkspaceUploads, getWorkspaceConversations, startConversation } from '@/api/endpoints/workspaces'
import type { Workspace, Job, Upload, Conversation } from '@/types'
import { cn } from '@/lib/cn'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function JobsTab({ workspaceId }: { workspaceId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await getWorkspaceJobs(workspaceId)
        setJobs(response.items)
      } catch (error) {
        console.error('Failed to load jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadJobs()
  }, [workspaceId])

  if (isLoading) return <div className="py-8 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Link key={job.id} to={`/jobs/${job.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.airtableUrl && <Badge variant="info">Airtable</Badge>}
                    {job.frameioUrl && <Badge variant="info">Frame.io</Badge>}
                    {job.figmaUrl && <Badge variant="info">Figma</Badge>}
                  </div>
                </div>
                <span className="ml-4 text-xs text-gray-400">{formatDate(job.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {jobs.length === 0 && (
        <div className="py-12 text-center text-gray-500">No jobs in this workspace yet.</div>
      )}
    </div>
  )
}

function UploadsTab({ workspaceId }: { workspaceId: string }) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUploads() {
      try {
        const response = await getWorkspaceUploads(workspaceId)
        setUploads(response.items)
      } catch (error) {
        console.error('Failed to load uploads:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUploads()
  }, [workspaceId])

  if (isLoading) return <div className="py-8 text-center"><Spinner /></div>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {uploads.map((upload) => (
        <Card key={upload.id} className="overflow-hidden">
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            {upload.mimeType.startsWith('image/') ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            ) : upload.mimeType.startsWith('video/') ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-800 text-white">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <CardContent className="py-3">
            <p className="truncate text-sm font-medium text-gray-900">{upload.filename}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>{upload.mimeType.split('/')[1].toUpperCase()}</span>
              {upload.metadata?.fileSize && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(upload.metadata.fileSize)}</span>
                </>
              )}
              {upload.metadata?.duration && (
                <>
                  <span>•</span>
                  <span>{Math.round(upload.metadata.duration)}s</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {uploads.length === 0 && (
        <div className="col-span-full py-12 text-center text-gray-500">No uploads in this workspace yet.</div>
      )}
    </div>
  )
}

function RequestAgentTab({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await getWorkspaceConversations(workspaceId)
        setConversations(response.items)
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [workspaceId])

  async function handleStartConversation() {
    setIsStarting(true)
    try {
      const conversation = await startConversation(workspaceId)
      navigate(`/workspaces/${workspaceId}/conversations/${conversation.id}`)
    } catch (error) {
      console.error('Failed to start conversation:', error)
    } finally {
      setIsStarting(false)
    }
  }

  if (isLoading) return <div className="py-8 text-center"><Spinner /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Request Agent</h3>
          <p className="text-sm text-gray-500">Start a conversation to create a new job</p>
        </div>
        <Button onClick={handleStartConversation} disabled={isStarting}>
          {isStarting ? 'Starting...' : 'New Conversation'}
        </Button>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/workspaces/${workspaceId}/conversations/${conversation.id}`}
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        conversation.status === 'ACTIVE'
                          ? 'info'
                          : conversation.status === 'COMPLETED'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {conversation.status}
                    </Badge>
                    <span className="text-sm text-gray-900">
                      {conversation.messages?.[0]?.content.slice(0, 50) || 'New conversation'}
                      {(conversation.messages?.[0]?.content.length || 0) > 50 ? '...' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(conversation.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {conversations.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No conversations yet. Start one to create a new job!
          </div>
        )}
      </div>
    </div>
  )
}

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const location = useLocation()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadWorkspace() {
      if (!workspaceId) return
      try {
        const data = await getWorkspace(workspaceId)
        setWorkspace(data)
      } catch (error) {
        console.error('Failed to load workspace:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadWorkspace()
  }, [workspaceId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!workspace) {
    return <div className="py-12 text-center text-gray-500">Workspace not found</div>
  }

  const basePath = `/workspaces/${workspaceId}`
  const currentPath = location.pathname

  const tabs = [
    { name: 'Jobs', path: basePath, exact: true },
    { name: 'Uploads', path: `${basePath}/uploads` },
    { name: 'Request Agent', path: `${basePath}/request-agent` },
  ]

  const activeTab = tabs.find((tab) =>
    tab.exact ? currentPath === tab.path : currentPath.startsWith(tab.path)
  ) || tabs[0]

  return (
    <div>
      <PageHeader title={workspace.name} description={workspace.requestAgentPrompt} />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = tab === activeTab
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={cn(
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route index element={<JobsTab workspaceId={workspaceId!} />} />
        <Route path="uploads" element={<UploadsTab workspaceId={workspaceId!} />} />
        <Route path="request-agent" element={<RequestAgentTab workspaceId={workspaceId!} />} />
      </Routes>
    </div>
  )
}
