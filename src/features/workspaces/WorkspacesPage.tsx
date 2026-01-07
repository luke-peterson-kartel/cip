import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared'
import { Button, Spinner, Modal, Input, Badge } from '@/components/ui'
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Integrations
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {workspaces.map((workspace) => (
              <tr key={workspace.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <Link to={`/workspaces/${workspace.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                    {workspace.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-xs truncate text-sm text-gray-500">
                    {workspace.requestAgentPrompt || '—'}
                  </p>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex gap-2">
                    {workspace.dataCoreUrl && (
                      <Badge variant="info">Drive</Badge>
                    )}
                    {workspace.trainingCoreUrls && workspace.trainingCoreUrls.length > 0 && (
                      <Badge variant="default">Training</Badge>
                    )}
                    {!workspace.dataCoreUrl && (!workspace.trainingCoreUrls || workspace.trainingCoreUrls.length === 0) && (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(workspace.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link to={`/workspaces/${workspace.id}`} className="text-primary-600 hover:text-primary-900">
                    View
                    <span className="sr-only">, {workspace.name}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
