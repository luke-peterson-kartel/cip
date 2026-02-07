import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Button, Spinner, Modal, Input, Card } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getWorkspaces, createWorkspace } from '@/api/endpoints/workspaces'
import type { Workspace, WorkspaceCreate } from '@/types'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}


export function WorkspacesPage() {
  const { organization } = useAuthStore()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<WorkspaceCreate>({ name: '' })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    async function loadWorkspaces() {
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

    loadWorkspaces()
  }, [organization])

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!organization || !formData.name.trim()) return

    setIsCreating(true)
    try {
      const newWorkspace = await createWorkspace(organization.id, formData)
      setWorkspaces([...workspaces, newWorkspace])
      setIsModalOpen(false)
      setFormData({ name: '' })
    } catch (error) {
      console.error('Failed to create workspace:', error)
    } finally {
      setIsCreating(false)
    }
  }

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
        title="Workspaces"
        description="Manage your creative workspaces and projects."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workspace
          </Button>
        }
      />

      <div className="space-y-4">
        {workspaces.map((workspace) => (
            <Card key={workspace.id} className="overflow-hidden">
              <div className="flex items-start justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/workspaces/${workspace.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {workspace.name}
                  </Link>
                  {workspace.requestAgentPrompt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                      {workspace.requestAgentPrompt}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Created {formatDate(workspace.createdAt)}
                  </p>
                </div>
                <Link
                  to={`/workspaces/${workspace.id}`}
                  className="ml-4 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View workspace
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Card>
          ))}

        {workspaces.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No workspaces yet. Create your first workspace to get started.
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workspace"
      >
        <form onSubmit={handleCreateWorkspace}>
          <div className="space-y-4">
            <Input
              label="Workspace Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Campaign 2024"
              required
            />
            <Input
              label="Google Drive URL (optional)"
              value={formData.dataCoreUrl || ''}
              onChange={(e) => setFormData({ ...formData, dataCoreUrl: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Request Agent Prompt (optional)
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
                value={formData.requestAgentPrompt || ''}
                onChange={(e) => setFormData({ ...formData, requestAgentPrompt: e.target.value })}
                placeholder="Instructions for the Request Agent..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim()}>
              {isCreating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
