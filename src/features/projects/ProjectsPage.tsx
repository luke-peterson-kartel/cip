import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Button, Spinner, Modal, Input, Badge, Card } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getProjects, createProject } from '@/api/endpoints/projects'
import type { Project, ProjectCreate, ProjectType, Job, JobStatus } from '@/types'
import { ProjectTypeFields } from '@/components/forms/ProjectTypeFields'
import { CSVUploadField } from '@/components/forms/CSVUploadField'
import jobsData from '@/mock/data/jobs.json'

const projectTypes = [
  {
    value: 'INTERNAL_BUILD' as ProjectType,
    name: 'Internal Build',
    description: 'Build creative intelligence system and workflow for brand'
  },
  {
    value: 'CREATIVE_BRIEF' as ProjectType,
    name: 'Creative Brief & Asset Generation',
    description: 'Creative concepting and asset production with detailed specifications'
  },
  {
    value: 'CREATIVE_EXPLORATION' as ProjectType,
    name: 'Creative Exploration',
    description: 'Idea exploration and concept iteration'
  },
]

function getProjectTypeName(type: ProjectType | undefined): string {
  const found = projectTypes.find(t => t.value === type)
  return found?.name || 'Project'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

function getProjectJobs(projectId: string): Job[] {
  return (jobsData.items as Job[])
    .filter(job => job.projectId === projectId)
    .slice(0, 3)
}

export function ProjectsPage() {
  const { organization } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<Partial<ProjectCreate>>({
    name: '',
    projectType: undefined,
    submitDate: new Date().toISOString().split('T')[0], // Auto-fill with today's date
    dueDate: '',
    submittedBy: '',
    description: '',
    googleDriveUrl: '',
    additionalLinks: [],
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      if (!organization) return

      try {
        const response = await getProjects(organization.id)
        setProjects(response.items)
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [organization])

  // Handler functions
  const handleFieldChange = (field: keyof ProjectCreate, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Validate campaign launch date is at least 48 hours after submit date
      if (field === 'dueDate' || field === 'submitDate') {
        const submitDate = field === 'submitDate' ? value : prev.submitDate
        const dueDate = field === 'dueDate' ? value : prev.dueDate

        if (submitDate && dueDate) {
          const submitTime = new Date(submitDate).getTime()
          const dueTime = new Date(dueDate).getTime()
          const hoursDiff = (dueTime - submitTime) / (1000 * 60 * 60)

          if (hoursDiff < 48) {
            // Calculate minimum allowed date (48 hours after submit date)
            const minDate = new Date(submitTime + (48 * 60 * 60 * 1000))
            const minDateStr = minDate.toISOString().split('T')[0]

            // Auto-adjust to minimum date if it's less than 48 hours
            if (field === 'dueDate') {
              updated.dueDate = minDateStr
            }
          }
        }
      }

      return updated
    })
  }

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: [...(prev.additionalLinks || []), { label: '', url: '' }]
    }))
  }

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: (prev.additionalLinks || []).filter((_, i) => i !== index)
    }))
  }

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: (prev.additionalLinks || []).map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const handleCSVParsed = (data: any[]) => {
    setFormData(prev => ({ ...prev, csvData: data }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (step === 1 && formData.projectType) {
      setStep(2)
    } else if (step === 2 && formData.name?.trim()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setStep(1)
    setFormData({
      name: '',
      projectType: undefined,
      submitDate: new Date().toISOString().split('T')[0], // Reset to today's date
      dueDate: '',
      submittedBy: '',
      description: '',
      googleDriveUrl: '',
      additionalLinks: [],
    })
    setUploadedFiles([])
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!organization || !formData.name?.trim() || !formData.projectType) return

    setIsCreating(true)
    try {
      const newProject = await createProject(organization.id, formData as ProjectCreate)
      setProjects([...projects, newProject])
      handleModalClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Form validation
  const isStep1Valid = !!formData.projectType
  const isStep2Valid = !!formData.name && formData.name.trim().length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage your brand projects and creative initiatives."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        }
      />

      <div className="space-y-4">
        {projects.map((project) => {
          const projectJobs = getProjectJobs(project.id)

          return (
            <Card key={project.id} className="overflow-hidden">
              {/* Project Header */}
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {project.name}
                  </Link>
                  {project.requestAgentPrompt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                      {project.requestAgentPrompt}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Created {formatDate(project.createdAt)}
                  </p>
                </div>
                <Link
                  to={`/projects/${project.id}`}
                  className="ml-4 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View project
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Recent Jobs List */}
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Recent Jobs</h4>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    View all
                  </Link>
                </div>
                {projectJobs.length > 0 ? (
                  <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
                    {projectJobs.map((job) => {
                      const statusConfig = getJobStatusConfig(job.status)
                      return (
                        <li key={job.id}>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="truncate text-sm font-medium text-gray-900">
                                {job.title}
                              </span>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </div>
                            <span className="ml-4 text-xs text-gray-400 whitespace-nowrap">
                              {formatDate(job.updatedAt)}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 py-2">No jobs yet</p>
                )}
              </div>
            </Card>
          )
        })}

        {projects.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No projects yet. Create your first project to get started.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={
          step === 1
            ? "Select Project Type"
            : step === 2
            ? `New ${getProjectTypeName(formData.projectType)} Project`
            : "Upload Assets"
        }
        className="max-w-5xl"
      >
        <form onSubmit={handleCreateProject}>
          {step === 1 ? (
            /* Step 1: Project Type Selection */
            <div className="space-y-4">
              <div className="space-y-3">
                {projectTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                      formData.projectType === type.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="projectType"
                      value={type.value}
                      checked={formData.projectType === type.value}
                      onChange={(e) => handleFieldChange('projectType', e.target.value as ProjectType)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{type.name}</h4>
                      <p className="mt-1 text-sm text-gray-600">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleNext} disabled={!isStep1Valid}>
                  Next
                </Button>
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: Project Details */
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Basic Information</h3>
                <Input
                  label="Project Name"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., Summer Campaign 2024"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Description</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Provide a detailed description of this project..."
                  />
                </div>
                <Input
                  type="email"
                  label="Submitted By"
                  value={formData.submittedBy || ''}
                  onChange={(e) => handleFieldChange('submittedBy', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Timeline</h3>
                <Input
                  type="date"
                  label="Submit Date"
                  value={formData.submitDate || ''}
                  onChange={(e) => handleFieldChange('submitDate', e.target.value)}
                />
                <Input
                  type="date"
                  label="Campaign Launch Date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                />
              </div>

              {/* Assets & Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Assets & Links</h3>
                <Input
                  label="Google Drive Link"
                  value={formData.googleDriveUrl || ''}
                  onChange={(e) => handleFieldChange('googleDriveUrl', e.target.value)}
                  placeholder="https://drive.google.com/..."
                />

                {/* Additional Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Links</label>
                  <p className="mt-1 text-xs text-gray-500">Add links to Pinterest boards, Google Slides, etc.</p>
                  {(formData.additionalLinks || []).map((link, index) => (
                    <div key={index} className="mt-2 flex gap-2">
                      <Input
                        placeholder="Label (e.g., Pinterest)"
                        value={link.label}
                        onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        className="flex-[2]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveLink(index)}
                        className="px-3"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddLink}
                    className="mt-2"
                  >
                    + Add Link
                  </Button>
                </div>
              </div>

              {/* Type-Specific Fields */}
              {formData.projectType && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    {getProjectTypeName(formData.projectType)} Details
                  </h3>
                  <ProjectTypeFields
                    projectType={formData.projectType}
                    formData={formData}
                    onChange={handleFieldChange}
                  />
                </div>
              )}

              {/* CSV Upload for Creative Brief (includes asset generation) */}
              {formData.projectType === 'CREATIVE_BRIEF' && (
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Asset Specifications (CSV)
                  </h3>
                  <CSVUploadField
                    onDataParsed={handleCSVParsed}
                    currentData={formData.csvData}
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <Button type="button" variant="secondary" onClick={handleBack}>
                  ← Back
                </Button>
                <Button type="button" onClick={handleNext} disabled={!isStep2Valid}>
                  Next: Upload Assets →
                </Button>
              </div>
            </div>
          ) : (
            /* Step 3: Upload Assets */
            <div className="space-y-6">
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Choose Files
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload images and videos for this project
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF, MP4, MOV up to 100MB each
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-700">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                    {uploadedFiles.map((file, index) => {
                      const isImage = file.type.startsWith('image/')
                      const isVideo = file.type.startsWith('video/')
                      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)

                      return (
                        <li key={index} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                              {isImage ? (
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : isVideo ? (
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{sizeInMB} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveFile(index)}
                            className="ml-4"
                          >
                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <Button type="button" variant="secondary" onClick={handleBack}>
                  ← Back
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
