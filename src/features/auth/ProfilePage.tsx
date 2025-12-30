import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, Button, Input, Avatar, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
    setIsEditing(false)
  }

  if (!user) {
    return <div className="py-12 text-center text-gray-500">Not logged in</div>
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your account settings and preferences."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Profile Information</h2>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    Email address cannot be changed. Contact an administrator if you need to update it.
                  </p>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          name: user.name,
                          email: user.email,
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-6">
                  <Avatar name={user.name} size="lg" />
                  <dl className="flex-1 space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-gray-900">{user.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                      <dd className="mt-1 text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="mt-1">
                        <Badge
                          variant={
                            user.role === 'ADMIN'
                              ? 'error'
                              : user.role === 'STAFF'
                              ? 'warning'
                              : user.role === 'EDITOR'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {user.role}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Account Details</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1">
                    <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900">
                      {user.id}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Security</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                You're signed in with Google SSO. Password management is handled through your Google account.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Manage Google Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
