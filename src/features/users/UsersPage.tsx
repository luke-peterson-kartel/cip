import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Card, Button, Badge, Avatar, Spinner, Modal, Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getOrganizationUsers, inviteUser } from '@/api/endpoints/users'
import type { User, UserInvite, UserRole } from '@/types'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRoleBadgeVariant(role: UserRole): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (role) {
    case 'ADMIN':
      return 'error'
    case 'STAFF':
      return 'warning'
    case 'EDITOR':
      return 'info'
    default:
      return 'default'
  }
}

export function UsersPage() {
  const { organization, user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<UserInvite>({ email: '', role: 'VIEWER' })
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    async function loadUsers() {
      if (!organization) return
      try {
        const response = await getOrganizationUsers(organization.id)
        setUsers(response.items)
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [organization])

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault()
    if (!organization || !formData.email.trim()) return

    setIsInviting(true)
    try {
      const newUser = await inviteUser(organization.id, formData)
      setUsers([...users, newUser])
      setIsModalOpen(false)
      setFormData({ email: '', role: 'VIEWER' })
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setIsInviting(false)
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
        title="Users"
        description="Manage users in your organization."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite User
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.name}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" disabled={user.id === currentUser?.id}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite User"
      >
        <form onSubmit={handleInviteUser}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Input
              label="Name (optional)"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting || !formData.email.trim()}>
              {isInviting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
