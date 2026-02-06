import { useEffect, useState } from 'react'
import { useParams, Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Button, Spinner, Card, CardContent, Badge } from '@/components/ui'
import { getProject, getProjectJobs, getProjectUploads, getProjectConversations, startProjectConversation } from '@/api/endpoints/projects'
import { deleteUpload } from '@/api/endpoints/uploads'
import { UploadsPanel } from './components/UploadsPanel'
import { AssetRequestsTable } from './components/AssetRequestsTable'
import type { Project, Job, Upload, Conversation, JobStatus, ProjectType } from '@/types'
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

function getProjectTypeName(type: ProjectType): string {
  switch (type) {
    case 'INTERNAL_BUILD':
      return 'Internal Build'
    case 'CREATIVE_BRIEF':
      return 'Creative Brief & Asset Generation'
    case 'CREATIVE_EXPLORATION':
      return 'Creative Exploration'
    default:
      return type
  }
}

function ProjectOverview({ project }: { project: Project }) {
  return (
    <div className="mb-8 space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            <Badge variant="info">{getProjectTypeName(project.projectType)}</Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {project.submitDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Submit Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(project.submitDate)}</p>
                </div>
              )}

              {project.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Campaign Launch Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(project.dueDate)}</p>
                </div>
              )}

              {project.submittedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Submitted By</label>
                  <p className="mt-1 text-sm text-gray-900">{project.submittedBy}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {project.googleDriveUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Google Drive</label>
                  <a
                    href={project.googleDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    View Drive Folder
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {project.additionalLinks && project.additionalLinks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Additional Links</label>
                  <div className="mt-1 space-y-1">
                    {project.additionalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                      >
                        {link.label || link.url}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {project.description && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type-Specific Information */}
      {project.projectType === 'INTERNAL_BUILD' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Internal Build Details</h3>
            <div className="space-y-4">
              {project.problem && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Problem</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.problem}</p>
                </div>
              )}
              {project.solution && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Solution</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.solution}</p>
                </div>
              )}
              {project.goal && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Goal</label>
                  <p className="mt-1 text-sm text-gray-900">{project.goal}</p>
                </div>
              )}
              {project.why && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Why</label>
                  <p className="mt-1 text-sm text-gray-900">{project.why}</p>
                </div>
              )}
              {project.technicalWorkflowScope && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Technical Workflow Scope</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.technicalWorkflowScope}</p>
                </div>
              )}
              {project.dataRequirements && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data Requirements</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.dataRequirements}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {project.projectType === 'CREATIVE_BRIEF' && (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Creative Brief Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {project.briefType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Brief Type</label>
                    <p className="mt-1 text-sm text-gray-900">{project.briefType}</p>
                  </div>
                )}
                {project.targetAudience && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Target Audience</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.targetAudience}</p>
                  </div>
                )}
                {project.keyMessage && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Key Message</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.keyMessage}</p>
                  </div>
                )}
                {project.deliverables && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Deliverables</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.deliverables}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {project.assetSpecs && project.assetSpecs.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Asset Specifications</h3>
                <div className="space-y-4">
                  {project.assetSpecs.map((spec, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {spec.title || `Asset Spec #${index + 1}`}
                        </h4>
                        {spec.numberOfAssets && (
                          <Badge variant="default">{spec.numberOfAssets} assets</Badge>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {spec.timeline && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Timeline</label>
                            <p className="mt-1 text-sm text-gray-900">{spec.timeline}</p>
                          </div>
                        )}
                        {spec.format && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Format</label>
                            <p className="mt-1 text-sm text-gray-900">{spec.format}</p>
                          </div>
                        )}
                        {spec.duration && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Duration</label>
                            <p className="mt-1 text-sm text-gray-900">{spec.duration}s</p>
                          </div>
                        )}
                      </div>
                      {spec.outputChannels && spec.outputChannels.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-500">Output Channels</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {spec.outputChannels.map((channel) => (
                              <Badge key={channel} variant="info">{channel}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {project.projectType === 'CREATIVE_EXPLORATION' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Creative Exploration Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {project.explorationFocus && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Exploration Focus</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{project.explorationFocus}</p>
                </div>
              )}
              {project.collaborationType && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Collaboration Type</label>
                  <p className="mt-1 text-sm text-gray-900">{project.collaborationType}</p>
                </div>
              )}
              {project.iterationCount && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Iteration Count</label>
                  <p className="mt-1 text-sm text-gray-900">{project.iterationCount}</p>
                </div>
              )}
              {project.creativeDirector && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Creative Director</label>
                  <p className="mt-1 text-sm text-gray-900">{project.creativeDirector}</p>
                </div>
              )}
              {project.preditor && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">PREDITOR</label>
                  <p className="mt-1 text-sm text-gray-900">{project.preditor}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function JobsTab({ projectId }: { projectId: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await getProjectJobs(projectId)
        setJobs(response.items)
      } catch (error) {
        console.error('Failed to load jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadJobs()
  }, [projectId])

  if (isLoading) return <div className="py-8 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const statusConfig = getJobStatusConfig(job.status)
        return (
          <Link key={job.id} to={`/jobs/${job.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
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
        )
      })}
      {jobs.length === 0 && (
        <div className="py-12 text-center text-gray-500">No jobs in this project yet.</div>
      )}
    </div>
  )
}

function UploadsTab({ projectId }: { projectId: string }) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUploads() {
      try {
        const response = await getProjectUploads(projectId)
        setUploads(response.items)
      } catch (error) {
        console.error('Failed to load uploads:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUploads()
  }, [projectId])

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
        <div className="col-span-full py-12 text-center text-gray-500">No uploads in this project yet.</div>
      )}
    </div>
  )
}

function RequestAgentTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await getProjectConversations(projectId)
        setConversations(response.items)
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [projectId])

  async function handleStartConversation() {
    setIsStarting(true)
    try {
      const conversation = await startProjectConversation(projectId)
      navigate(`/projects/${projectId}/conversations/${conversation.id}`)
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
            to={`/projects/${projectId}/conversations/${conversation.id}`}
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

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const [project, setProject] = useState<Project | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUploads, setIsLoadingUploads] = useState(true)

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return
      try {
        const data = await getProject(projectId)
        setProject(data)
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProject()
  }, [projectId])

  useEffect(() => {
    async function loadUploads() {
      if (!projectId) return
      try {
        const response = await getProjectUploads(projectId)
        setUploads(response.items)
      } catch (error) {
        console.error('Failed to load uploads:', error)
      } finally {
        setIsLoadingUploads(false)
      }
    }
    loadUploads()
  }, [projectId])

  const handleUpload = async (files: File[]) => {
    // The FileUploadZone handles the upload and calls onUploadComplete
    // This is a placeholder for future integration with real upload API
    console.log('Handling upload:', files)
  }

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      await deleteUpload(uploadId)
      setUploads(uploads.filter(u => u.id !== uploadId))
    } catch (error) {
      console.error('Failed to delete upload:', error)
      throw error
    }
  }

  const handleLinkUpload = async (uploadId: string, assetRequestId: string) => {
    // TODO: Implement when asset requests are added
    console.log('Linking upload to asset:', uploadId, assetRequestId)
  }

  const handleAssetRequestUpdate = async (id: string, field: string, value: any) => {
    // TODO: Implement API call to update asset request
    console.log('Updating asset request:', id, field, value)
    // For now, just update local state
    if (project && project.assetRequests) {
      const updatedRequests = project.assetRequests.map(req =>
        req.id === id ? { ...req, [field]: value, updatedAt: new Date().toISOString() } : req
      )
      setProject({ ...project, assetRequests: updatedRequests })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return <div className="py-12 text-center text-gray-500">Project not found</div>
  }

  const basePath = `/projects/${projectId}`
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
    <div className="space-y-6">
      <PageHeader title={project.name} description={project.description} />

      {/* Asset Requests Table - Full Width */}
      {project.assetRequests && project.assetRequests.length > 0 && (
        <AssetRequestsTable
          projectId={project.id}
          assetRequests={project.assetRequests}
          onUpdate={handleAssetRequestUpdate}
        />
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* Project Overview */}
          <ProjectOverview project={project} />

          {/* Tabs */}
          <div className="border-b border-gray-200">
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
          <div className="mt-6">
            <Routes>
              <Route index element={<JobsTab projectId={projectId!} />} />
              <Route path="uploads" element={<UploadsTab projectId={projectId!} />} />
              <Route path="request-agent" element={<RequestAgentTab projectId={projectId!} />} />
            </Routes>
          </div>
        </div>

        {/* Right Column - Uploads */}
        <div className="lg:col-span-5">
          <div className="sticky top-4">
            {isLoadingUploads ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Spinner />
                </CardContent>
              </Card>
            ) : (
              <UploadsPanel
                project={project}
                uploads={uploads}
                onUpload={handleUpload}
                onDelete={handleDeleteUpload}
                onLinkToAsset={handleLinkUpload}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
