import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, Button, Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function OrganizationSettingsPage() {
  const { organization } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    hubspotId: organization?.hubspotId || '',
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

  if (!organization) {
    return <div className="py-12 text-center text-gray-500">No organization found</div>
  }

  return (
    <div>
      <PageHeader
        title="Organization Settings"
        description="Manage your organization's settings and preferences."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Organization Details</h2>
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
                  label="Organization Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Hubspot ID (optional)"
                  value={formData.hubspotId}
                  onChange={(e) => setFormData({ ...formData, hubspotId: e.target.value })}
                  placeholder="hs-12345"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: organization.name,
                        hubspotId: organization.hubspotId || '',
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
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-gray-900">{organization.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Slug</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{organization.slug}</dd>
                </div>
                {organization.hubspotId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Hubspot ID</dt>
                    <dd className="mt-1 font-mono text-sm text-gray-900">{organization.hubspotId}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900">{formatDate(organization.createdAt)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">API Information</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900">
                    {organization.id}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(organization.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">API Endpoint</dt>
                <dd className="mt-1">
                  <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900">
                    https://cip-api.kartel.ai/v1
                  </code>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
