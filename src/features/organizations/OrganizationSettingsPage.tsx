import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, Button, Input, Modal } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/api/client'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Canvas helper to extract the cropped region as a data URL
function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      )
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

const MAX_FILE_SIZE_MB = 5

function LogoUploadCard() {
  const { organization, updateOrganization } = useAuthStore()
  const [logo, setLogo] = useState<string | undefined>(organization?.logo)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File must be under ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleCropSave = async () => {
    if (!imageSrc || !croppedArea || !organization) return
    setIsSaving(true)
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedArea)
      await apiClient(`/organizations/${organization.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ logo: croppedDataUrl }),
      })
      setLogo(croppedDataUrl)
      updateOrganization({ logo: croppedDataUrl })
      setShowCropModal(false)
      setImageSrc(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!organization) return
    await apiClient(`/organizations/${organization.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ logo: '' }),
    })
    setLogo(undefined)
    updateOrganization({ logo: undefined })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Organization Logo</h2>
        </CardHeader>
        <CardContent>
          {logo ? (
            <div className="flex items-start gap-4">
              <div className="relative group">
                <img
                  src={logo}
                  alt="Organization logo"
                  className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  onClick={handleDelete}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md border border-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500">
                  Hover the logo and click the trash icon to remove, or upload a new one to replace.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="self-start text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Change logo
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                isDragging
                  ? 'border-accent-500 bg-accent-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Drop image here' : 'Drag & drop your logo'}
              </p>
              <p className="mt-1 text-xs text-gray-500">or click to browse (PNG, JPG — max {MAX_FILE_SIZE_MB}MB)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Crop Modal */}
      <Modal isOpen={showCropModal} onClose={() => { setShowCropModal(false); setImageSrc(null) }} title="Crop Logo" size="sm">
        <div className="space-y-4">
          <div className="relative h-64 w-full bg-gray-100 rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 shrink-0">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-gray-900"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowCropModal(false); setImageSrc(null) }}>
              Cancel
            </Button>
            <Button onClick={handleCropSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
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
        {/* Logo Upload */}
        <LogoUploadCard />

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
