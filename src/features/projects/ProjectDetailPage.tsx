import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button, Spinner, Card, CardContent, Badge } from '@/components/ui'
import { getProject, getProjectUploads, getProjectConversations, startProjectConversation, updateProject } from '@/api/endpoints/projects'
import { deleteUpload, updateUpload } from '@/api/endpoints/uploads'
import { updateAssetRequest } from '@/api/endpoints/asset-requests'
import { UploadsPanel } from './components/UploadsPanel'
import { AssetRequestsTable } from './components/AssetRequestsTable'
import { DeliverablesTab } from './components/DeliverablesTab'
import { EditableField } from '@/components/forms/EditableField'
import { EditableRichText } from '@/components/forms/EditableRichText'
import type { Project, Upload, Conversation, ProjectType } from '@/types'
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

function ProjectOverview({ project, onUpdate }: { project: Project; onUpdate: (field: string, value: any) => Promise<void> }) {
  return (
    <div className="mb-8 space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            <Badge variant="info">{getProjectTypeName(project.projectType)}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-2">
              <EditableField
                label="Submit Date"
                value={project.submitDate || ''}
                type="date"
                onSave={(val) => onUpdate('submitDate', val)}
                placeholder="Not set"
              />
              <EditableField
                label="Campaign Launch Date"
                value={project.dueDate || ''}
                type="date"
                onSave={(val) => onUpdate('dueDate', val)}
                placeholder="Not set"
              />
              <EditableField
                label="Submitted By"
                value={project.submittedBy || ''}
                type="text"
                onSave={(val) => onUpdate('submittedBy', val)}
                placeholder="Not set"
              />
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <EditableField
                label="Google Drive URL"
                value={project.googleDriveUrl || ''}
                type="text"
                onSave={(val) => onUpdate('googleDriveUrl', val)}
                placeholder="Paste Google Drive link"
              />
              <EditableField
                label="Collaboration Canvas"
                value={project.collaborationCanvasUrl || ''}
                type="text"
                onSave={(val) => onUpdate('collaborationCanvasUrl', val)}
                placeholder="Paste Collaboration Canvas link"
              />
              <EditableField
                label="Airtable URL"
                value={project.airtableUrl || ''}
                type="text"
                onSave={(val) => onUpdate('airtableUrl', val)}
                placeholder="Paste Airtable link"
              />
              <EditableField
                label="Frame.io URL"
                value={project.frameioUrl || ''}
                type="text"
                onSave={(val) => onUpdate('frameioUrl', val)}
                placeholder="Paste Frame.io link"
              />
              <EditableField
                label="Figma URL"
                value={project.figmaUrl || ''}
                type="text"
                onSave={(val) => onUpdate('figmaUrl', val)}
                placeholder="Paste Figma link"
              />

              {project.additionalLinks && project.additionalLinks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Links</label>
                  <div className="space-y-1 px-3 py-2">
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

          <div className="mt-4 border-t border-gray-200 pt-4">
            <EditableField
              label="Description"
              value={project.description || ''}
              type="textarea"
              onSave={(val) => onUpdate('description', val)}
              placeholder="Add a project description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Information */}
      {project.projectType === 'INTERNAL_BUILD' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Internal Build Details</h3>
            <div className="space-y-2">
              <EditableField
                label="Problem"
                value={project.problem || ''}
                type="textarea"
                onSave={(val) => onUpdate('problem', val)}
                placeholder="Describe the problem..."
                rows={3}
              />
              <EditableField
                label="Solution"
                value={project.solution || ''}
                type="textarea"
                onSave={(val) => onUpdate('solution', val)}
                placeholder="Describe the solution..."
                rows={3}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <EditableField
                  label="Goal"
                  value={project.goal || ''}
                  type="text"
                  onSave={(val) => onUpdate('goal', val)}
                  placeholder="Not set"
                />
                <EditableField
                  label="Why"
                  value={project.why || ''}
                  type="text"
                  onSave={(val) => onUpdate('why', val)}
                  placeholder="Not set"
                />
              </div>
              <EditableField
                label="Technical Workflow Scope"
                value={project.technicalWorkflowScope || ''}
                type="textarea"
                onSave={(val) => onUpdate('technicalWorkflowScope', val)}
                placeholder="Describe the technical workflow scope..."
                rows={3}
              />
              <EditableField
                label="Data Requirements"
                value={project.dataRequirements || ''}
                type="textarea"
                onSave={(val) => onUpdate('dataRequirements', val)}
                placeholder="Describe data requirements..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {project.projectType === 'CREATIVE_BRIEF' && (
        <>
          <Card>
            <CardContent className="p-6">
              <EditableRichText
                label="Creative Brief"
                value={project.briefContent || ''}
                onSave={(html) => onUpdate('briefContent', html)}
                placeholder="Add creative brief details..."
              />
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
                        {spec.platform && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Platform</label>
                            <p className="mt-1 text-sm text-gray-900">{spec.platform}</p>
                          </div>
                        )}
                        {spec.duration && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Duration</label>
                            <p className="mt-1 text-sm text-gray-900">{spec.duration}s</p>
                          </div>
                        )}
                      </div>
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
            <div className="space-y-2">
              <EditableField
                label="Exploration Focus"
                value={project.explorationFocus || ''}
                type="textarea"
                onSave={(val) => onUpdate('explorationFocus', val)}
                placeholder="Describe the exploration focus..."
                rows={3}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <EditableField
                  label="Collaboration Type"
                  value={project.collaborationType || ''}
                  type="text"
                  onSave={(val) => onUpdate('collaborationType', val)}
                  placeholder="Not set"
                />
                <EditableField
                  label="Iteration Count"
                  value={project.iterationCount || ''}
                  type="number"
                  onSave={(val) => onUpdate('iterationCount', val)}
                  placeholder="Not set"
                />
                <EditableField
                  label="Creative Director"
                  value={project.creativeDirector || ''}
                  type="text"
                  onSave={(val) => onUpdate('creativeDirector', val)}
                  placeholder="Not set"
                />
                <EditableField
                  label="PREDITOR"
                  value={project.preditor || ''}
                  type="text"
                  onSave={(val) => onUpdate('preditor', val)}
                  placeholder="Not set"
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
          <p className="text-sm text-gray-500">Start a conversation to create asset requests</p>
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
            No conversations yet. Start one to create asset requests!
          </div>
        )}
      </div>
    </div>
  )
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUploads, setIsLoadingUploads] = useState(true)
  const [rightTab, setRightTab] = useState<'uploads' | 'deliverables' | 'request-agent'>('uploads')

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

  const handleUpdateUpload = async (uploadId: string, data: Partial<Upload>) => {
    try {
      const updated = await updateUpload(uploadId, data)
      setUploads(uploads.map(u => u.id === uploadId ? updated : u))
    } catch (error) {
      console.error('Failed to update upload:', error)
      throw error
    }
  }

  const handleLinkUpload = async (uploadId: string, assetRequestId: string) => {
    // TODO: Implement when asset requests are added
    console.log('Linking upload to asset:', uploadId, assetRequestId)
  }

  const handleAssetRequestUpdate = async (id: string, field: string, value: any) => {
    if (!project?.assetRequests) return
    try {
      const updated = await updateAssetRequest(id, { [field]: value })
      const updatedRequests = project.assetRequests.map(req =>
        req.id === id ? updated : req
      )
      setProject({ ...project, assetRequests: updatedRequests })
    } catch (error) {
      console.error('Failed to update asset request:', error)
      throw error
    }
  }

  const handleProjectUpdate = async (field: string, value: any) => {
    if (!project || !projectId) return
    try {
      const updated = await updateProject(projectId, { [field]: value })
      setProject(updated)
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
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

  const hasAssetRequests = project.assetRequests && project.assetRequests.length > 0

  const rightTabs: Array<{ key: 'uploads' | 'deliverables' | 'request-agent'; label: string }> = [
    { key: 'uploads', label: 'Uploads' },
    ...(hasAssetRequests
      ? [{ key: 'deliverables' as const, label: 'Deliverables' }]
      : []),
    { key: 'request-agent', label: 'Request Agent' },
  ]

  return (
    <div className="space-y-6">
      {/* Editable Page Header */}
      <div className="mb-6">
        <EditableField
          label=""
          value={project.name}
          type="text"
          onSave={(val) => handleProjectUpdate('name', val)}
          required
          className="[&_span]:text-2xl [&_span]:font-semibold [&_span]:text-gray-900 [&_input]:text-2xl [&_input]:font-semibold"
        />
      </div>

      {/* Asset Requests Table - Full Width */}
      {hasAssetRequests && (
        <AssetRequestsTable
          projectId={project.id}
          assetRequests={project.assetRequests!}
          onUpdate={handleAssetRequestUpdate}
        />
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Project Overview */}
        <div className="lg:col-span-7 space-y-6">
          <ProjectOverview project={project} onUpdate={handleProjectUpdate} />
        </div>

        {/* Right Column - Tabbed Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 space-y-4">
            {/* Tab Bar */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6">
                {rightTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRightTab(tab.key)}
                    className={cn(
                      'whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors',
                      rightTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {rightTab === 'uploads' && (
              isLoadingUploads ? (
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
                  onUpdateUpload={handleUpdateUpload}
                  onLinkToAsset={handleLinkUpload}
                />
              )
            )}

            {rightTab === 'deliverables' && hasAssetRequests && (
              <DeliverablesTab
                projectId={projectId!}
                assetRequests={project.assetRequests || []}
                uploads={uploads}
                loadingUploads={isLoadingUploads}
                onAssetRequestUpdate={handleAssetRequestUpdate}
              />
            )}

            {rightTab === 'request-agent' && (
              <RequestAgentTab projectId={projectId!} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
