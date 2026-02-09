import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui'
import { EditableField } from '@/components/forms/EditableField'
import { TimelineCalendarView } from '@/components/calendar/TimelineCalendarView'
import { ProductionProgressBar } from './ProductionProgressBar'
import { ChatSection } from './ChatSection'
import { DeliverablesSection } from './DeliverablesSection'
import type { AssetRequest, ProductionStep, ChatMessage, Upload, DeliverableReviewStatus } from '@/types'
import { PLATFORM_OPTIONS } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/api/client'
import { cn } from '@/lib/cn'

export interface AssetRequestDetailModalProps {
  isOpen: boolean
  onClose: () => void
  assetRequest: AssetRequest
  onUpdate: (field: string, value: any) => Promise<void>
  projectName?: string
  onNext?: () => void
  onPrev?: () => void
  currentIndex?: number
  totalCount?: number
}

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Denied', value: 'DENIED' },
  { label: 'Needs Improvement', value: 'NEEDS_IMPROVEMENT' },
  { label: 'Needs Iteration', value: 'NEEDS_ITERATION' },
  { label: 'Completed', value: 'COMPLETED' },
]

const priorityOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

const PRODUCTION_STEP_KEYS: ProductionStep[] = [
  'QC_LIBRARY', 'GEN_REFINE', 'QC_EDIT', 'CLIENT_REVIEW', 'QC_DISTRO',
]

const DEFAULT_STEP_LABELS = ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']

const creativeTypeOptions = [
  { label: 'Static', value: 'Static' },
  { label: 'Carousel', value: 'Carousel' },
  { label: 'Video', value: 'Video' },
  { label: 'Video--UGC', value: 'Video--UGC' },
  { label: 'Video--Branded', value: 'Video--Branded' },
  { label: 'Video--longform', value: 'Video--longform' },
  { label: 'Static Pin', value: 'Static Pin' },
  { label: 'Idea Pin', value: 'Idea Pin' },
  { label: 'Video Pin', value: 'Video Pin' },
  { label: 'GIF', value: 'GIF' },
]

const platformOptions = PLATFORM_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }))

const STANDARD_DIMENSIONS = [
  { label: '1x1 (Square)', value: '1x1' },
  { label: '9x16 (Vertical/Stories)', value: '9x16' },
  { label: '4x5 (Mobile)', value: '4x5' },
  { label: '16x9 (Landscape)', value: '16x9' },
  { label: '4x3 (Standard)', value: '4x3' },
  { label: '2x3 (Pinterest)', value: '2x3' },
]

const STANDARD_DURATIONS = [6, 9, 15, 30, 45, 60]

const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  PENDING:            { bg: 'bg-gray-100',   text: 'text-gray-700',   ring: 'ring-gray-300' },
  APPROVED:           { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
  DENIED:             { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-300' },
  NEEDS_IMPROVEMENT:  { bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-300' },
  NEEDS_ITERATION:    { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-300' },
  COMPLETED:          { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-300' },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  HIGH:   { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-300' },
  MEDIUM: { bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-300' },
  LOW:    { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-300' },
}

// --- Sub-components ---

function PillSelect({
  value,
  options,
  colors,
  onSave,
}: {
  value: string
  options: Array<{ label: string; value: string }>
  colors: Record<string, { bg: string; text: string; ring: string }>
  onSave: (value: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus()
    }
  }, [isEditing])

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(newValue)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const currentOption = options.find(o => o.value === value)
  const color = colors[value] || { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-300' }

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        className="rounded-full px-3 py-1 text-sm font-medium border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-all',
        color.bg, color.text,
        'hover:ring-1', color.ring,
        'cursor-pointer'
      )}
    >
      {currentOption?.label || value}
    </button>
  )
}

function ProductionStepsBar({
  currentStep,
  onStepChange,
  stepLabels,
  onLabelsChange,
}: {
  currentStep: ProductionStep
  onStepChange: (step: ProductionStep) => void
  stepLabels: string[]
  onLabelsChange: (labels: string[]) => void
}) {
  const currentIndex = PRODUCTION_STEP_KEYS.indexOf(currentStep)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingIndex])

  const commitEdit = () => {
    if (editingIndex === null) return
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== stepLabels[editingIndex]) {
      const updated = [...stepLabels]
      updated[editingIndex] = trimmed
      onLabelsChange(updated)
    }
    setEditingIndex(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Production Steps</span>
        <span>{currentIndex + 1} of {PRODUCTION_STEP_KEYS.length}</span>
      </div>
      <div className="flex gap-1">
        {PRODUCTION_STEP_KEYS.map((stageKey, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isFuture = index > currentIndex
          return (
            <button
              key={stageKey}
              onClick={() => onStepChange(stageKey)}
              className={cn(
                "flex-1 h-2 rounded-full transition-all hover:opacity-80",
                isCompleted && "bg-green-500",
                isActive && "bg-blue-500",
                isFuture && "bg-gray-200"
              )}
              title={stepLabels[index]}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs">
        {PRODUCTION_STEP_KEYS.map((stageKey, index) => (
          editingIndex === index ? (
            <input
              key={stageKey}
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditingIndex(null)
              }}
              className="flex-1 text-center text-xs px-1 py-0.5 border border-blue-300 rounded bg-blue-50 outline-none min-w-0"
            />
          ) : (
            <button
              key={stageKey}
              onClick={() => onStepChange(stageKey)}
              onDoubleClick={() => {
                setEditingIndex(index)
                setEditValue(stepLabels[index])
              }}
              className={cn(
                "flex-1 text-center transition-colors hover:text-blue-600 min-w-0 truncate",
                index === currentIndex ? "text-blue-600 font-medium" : "text-gray-500"
              )}
              title="Double-click to rename"
            >
              {stepLabels[index]}
            </button>
          )
        ))}
      </div>
    </div>
  )
}

function DimensionSelector({
  value,
  onSave,
}: {
  value?: string
  onSave: (value: string) => Promise<void>
}) {
  const isStandard = STANDARD_DIMENSIONS.some(d => d.value === value)
  const [showCustom, setShowCustom] = useState(!isStandard && !!value)

  const selectOptions = [
    ...STANDARD_DIMENSIONS,
    { label: 'Custom', value: 'CUSTOM' },
  ]

  return (
    <div className="space-y-2">
      <EditableField
        label="Dimensions"
        value={showCustom ? 'CUSTOM' : (value || '')}
        type="select"
        options={selectOptions}
        onSave={async (val) => {
          if (val === 'CUSTOM') {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            await onSave(val)
          }
        }}
      />
      {showCustom && (
        <EditableField
          label="Custom Dimensions"
          value={isStandard ? '' : (value || '')}
          type="text"
          onSave={onSave}
          placeholder="e.g., 3840x2160"
        />
      )}
    </div>
  )
}

function DurationSelector({
  value,
  onSave,
}: {
  value?: number
  onSave: (value: number) => Promise<void>
}) {
  const isStandard = STANDARD_DURATIONS.includes(value || 0)
  const isStatic = value === 0
  const [showCustom, setShowCustom] = useState(!isStandard && !isStatic && !!value)

  const selectOptions = [
    { label: 'Static Image (N/A)', value: '0' },
    ...STANDARD_DURATIONS.map(d => ({ label: `${d} seconds`, value: String(d) })),
    { label: 'Custom', value: 'CUSTOM' },
  ]

  return (
    <div className="space-y-2">
      <EditableField
        label="Duration"
        value={showCustom ? 'CUSTOM' : (value !== undefined ? String(value) : '')}
        type="select"
        options={selectOptions}
        onSave={async (val) => {
          if (val === 'CUSTOM') {
            setShowCustom(true)
          } else {
            setShowCustom(false)
            await onSave(Number(val))
          }
        }}
      />
      {showCustom && (
        <EditableField
          label="Custom Duration (seconds)"
          value={isStandard ? '' : (value || '')}
          type="number"
          onSave={async (val) => await onSave(Number(val))}
          placeholder="e.g., 90"
        />
      )}
    </div>
  )
}

// --- Main Component ---

export function AssetRequestDetailModal({
  isOpen,
  onClose,
  assetRequest,
  onUpdate,
  projectName,
  onNext,
  onPrev,
  currentIndex,
  totalCount
}: AssetRequestDetailModalProps) {
  const { user } = useAuthStore()
  const [linkedUploads, setLinkedUploads] = useState<Upload[]>([])
  const [loadingUploads, setLoadingUploads] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (isOpen && assetRequest.id) {
      setLoadingUploads(true)
      apiClient<{ items: Upload[] }>(`/asset-requests/${assetRequest.id}/uploads`)
        .then(response => {
          setLinkedUploads(response.items || [])
        })
        .catch(err => {
          console.error('Failed to load uploads:', err)
          setLinkedUploads([])
        })
        .finally(() => {
          setLoadingUploads(false)
        })
    }
  }, [isOpen, assetRequest.id])

  const handleUpdate = async (field: string, value: any) => {
    await onUpdate(field, value)
  }

  const handleSendMessage = async (message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderEmail: user?.email || '',
      senderName: user?.name || '',
      message,
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...(assetRequest.messages || []), newMessage]
    await handleUpdate('messages', updatedMessages)
  }

  const handleReviewUpdate = async (uploadId: string, status: DeliverableReviewStatus, notes?: string) => {
    const updates = {
      reviewStatus: status,
      reviewedBy: user?.email || '',
      reviewedAt: new Date().toISOString(),
      ...(notes && { reviewNotes: notes }),
    }
    await apiClient(`/uploads/${uploadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    setLinkedUploads(prev =>
      prev.map(u => u.id === uploadId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u)
    )
  }

  const handleDeleteUpload = async (uploadId: string) => {
    await apiClient(`/uploads/${uploadId}`, { method: 'DELETE' })
    setLinkedUploads(prev => prev.filter(u => u.id !== uploadId))
  }

  const handleDeliverableUploadComplete = async (newUploads: Upload[]) => {
    for (const upload of newUploads) {
      try {
        await apiClient(`/uploads/${upload.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ assetRequestId: assetRequest.id }),
        })
      } catch (err) {
        console.error('Failed to link upload:', err)
      }
    }
    const linked = newUploads.map(u => ({ ...u, assetRequestId: assetRequest.id }))
    setLinkedUploads(prev => [...prev, ...linked])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const versionHistory = [
    {
      version: assetRequest.version,
      date: assetRequest.updatedAt,
      changedBy: assetRequest.createdBy,
      changes: ['Current version']
    }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      className="bg-gray-100"
    >
      {/* ── HEADER BAR ── */}
      <div className="rounded-lg bg-white border border-gray-200 px-5 py-3 mb-5">
        {/* Row 1: Title + pills + close */}
        <div className="flex items-center gap-3">
          <h2 className="flex-1 min-w-0 [&_span]:text-xl [&_span]:font-semibold [&_span]:text-gray-900 [&_input]:text-xl [&_input]:font-semibold [&_div]:text-xl [&_div]:min-h-0 [&_span]:min-h-0 [&_div]:py-0">
            <EditableField
              label=""
              value={assetRequest.title || ''}
              type="text"
              onSave={(value) => handleUpdate('title', value)}
              placeholder="Enter asset request title..."
            />
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PillSelect
              value={assetRequest.status}
              options={statusOptions}
              colors={STATUS_COLORS}
              onSave={(value) => handleUpdate('status', value)}
            />
            <PillSelect
              value={assetRequest.priority}
              options={priorityOptions}
              colors={PRIORITY_COLORS}
              onSave={(value) => handleUpdate('priority', value)}
            />
            {onPrev && onNext && totalCount && totalCount > 1 && (
              <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-3">
                <button
                  onClick={onPrev}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Previous deliverable"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400 tabular-nums min-w-[3ch] text-center">
                  {(currentIndex ?? 0) + 1}/{totalCount}
                </span>
                <button
                  onClick={onNext}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Next deliverable"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Row 2: Project name */}
        {projectName && (
          <div className="px-3 mt-0.5">
            <span className="text-xs font-medium text-gray-400">{projectName}</span>
          </div>
        )}
      </div>

      <div className="max-h-[80vh] overflow-y-auto">
        <div className="space-y-5">

          {/* ── PROGRESS BARS ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="space-y-3">
              <ProductionStepsBar
                currentStep={assetRequest.productionStep}
                onStepChange={(step) => handleUpdate('productionStep', step)}
                stepLabels={assetRequest.productionStepLabels ?? DEFAULT_STEP_LABELS}
                onLabelsChange={(labels) => handleUpdate('productionStepLabels', labels)}
              />
              {assetRequest.creativeType?.toLowerCase().includes('longform') && assetRequest.productionStage && (
                <ProductionProgressBar
                  currentStage={assetRequest.productionStage}
                  onStageChange={(stage) => handleUpdate('productionStage', stage)}
                />
              )}
            </div>
          </div>

          {/* ── TWO-COLUMN LAYOUT (3:2) ── */}
          <div className="grid grid-cols-5 gap-5">
            {/* LEFT COLUMN (3/5) */}
            <div className="col-span-3 space-y-5">
              {/* Asset Specs */}
              <div className="rounded-lg border border-gray-200 bg-white p-5 [&_label]:font-semibold">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Asset Specs</h4>
                <div className="mb-4">
                  <EditableField
                    label="Description"
                    value={assetRequest.description}
                    type="textarea"
                    onSave={(value) => handleUpdate('description', value)}
                    placeholder="Add a description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
                  <EditableField
                    label="Asset Type"
                    value={assetRequest.creativeType}
                    type="select"
                    options={creativeTypeOptions}
                    onSave={(value) => handleUpdate('creativeType', value)}
                    required
                  />
                  <EditableField
                    label="Platform"
                    value={assetRequest.platform}
                    type="select"
                    options={platformOptions}
                    onSave={(value) => handleUpdate('platform', value)}
                    required
                  />
                  <EditableField
                    label="Target Count"
                    value={assetRequest.targetCount}
                    type="number"
                    onSave={(value) => handleUpdate('targetCount', value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <DimensionSelector
                    value={assetRequest.dimensions}
                    onSave={(value) => handleUpdate('dimensions', value)}
                  />
                  <DurationSelector
                    value={assetRequest.duration}
                    onSave={(value) => handleUpdate('duration', value)}
                  />
                </div>
              </div>

              {/* Timeline Calendar */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Timeline</h4>
                <TimelineCalendarView
                  dates={{
                    requestedDate: assetRequest.requestedDate,
                    firstV1ReviewDate: assetRequest.firstV1ReviewDate,
                    finalDeliveryDate: assetRequest.finalDeliveryDate,
                    completedDate: assetRequest.completedDate,
                  }}
                  onDateChange={(field, value) => handleUpdate(field, value)}
                  editable
                />
              </div>
            </div>

            {/* RIGHT COLUMN (2/5) — Chat only */}
            <div className="col-span-2 flex flex-col">
              <div className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 shrink-0">
                  <h4 className="text-lg font-semibold text-gray-900">Chat</h4>
                  <span className="text-xs text-gray-400">{(assetRequest.messages || []).length} messages</span>
                </div>
                <ChatSection
                  messages={assetRequest.messages || []}
                  currentUserEmail={user?.email || ''}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>

          {/* ── DELIVERABLES ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <DeliverablesSection
              projectId={assetRequest.projectId}
              assetRequestId={assetRequest.id}
              uploads={linkedUploads}
              loadingUploads={loadingUploads}
              onUploadComplete={handleDeliverableUploadComplete}
              onReviewUpdate={handleReviewUpdate}
              onDelete={handleDeleteUpload}
            />
          </div>

          {/* ── COLLAPSIBLE DETAILS & HISTORY ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors w-full"
            >
              <svg
                className={cn('h-4 w-4 transition-transform text-gray-400', showDetails && 'rotate-90')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Details & History
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                {/* Linked Files - hidden for now, may re-enable later */}
                {false && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Linked Files</h4>
                  {loadingUploads ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading files...</div>
                  ) : linkedUploads.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {linkedUploads.map(upload => (
                        <div
                          key={upload.id}
                          className="border border-gray-200 rounded-lg p-2 hover:border-blue-300 transition-colors"
                        >
                          {upload.mimeType.startsWith('image/') ? (
                            <div className="aspect-square bg-gray-100 rounded mb-1.5 overflow-hidden">
                              <img src={upload.uri} alt={upload.filename} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-square bg-gray-100 rounded mb-1.5 flex items-center justify-center">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                          <p className="text-xs text-gray-900 truncate font-medium">{upload.filename}</p>
                          <p className="text-[10px] text-gray-500">{formatFileSize(upload.size)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed text-xs">
                      No files linked to this asset request yet
                    </div>
                  )}
                </div>
                )}

                {/* Version History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Version History</h4>
                  <div className="space-y-2">
                    {versionHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                          v{history.version}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{history.changes[0]}</p>
                            <p className="text-xs text-gray-500">{new Date(history.date).toLocaleDateString()}</p>
                          </div>
                          <p className="text-xs text-gray-500">by {history.changedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata — compact single line */}
                <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 pt-3 border-t border-gray-100">
                  <span>Created {new Date(assetRequest.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>Updated {new Date(assetRequest.updatedAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>By {assetRequest.createdBy}</span>
                  <span>·</span>
                  <span className="font-mono text-[10px]">ID: {assetRequest.id}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
