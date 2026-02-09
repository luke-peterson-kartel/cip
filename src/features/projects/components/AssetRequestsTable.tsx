import { useState } from 'react'
import { Card, CardContent, CardHeader, Badge, Button } from '@/components/ui'
import { AssetRequestDetailModal } from './AssetRequestDetailModal'
import type { AssetRequest, AssetRequestStatus, AssetPriority } from '@/types'
import { cn } from '@/lib/cn'

export interface AssetRequestsTableProps {
  projectId: string
  projectName?: string
  assetRequests: AssetRequest[]
  onUpdate?: (id: string, field: string, value: any) => Promise<void>
  onCreate?: (request: Partial<AssetRequest>) => Promise<AssetRequest | void>
  onDelete?: (id: string) => Promise<void>
}

const statusOptions: AssetRequestStatus[] = ['PENDING', 'APPROVED', 'DENIED', 'NEEDS_IMPROVEMENT', 'NEEDS_ITERATION', 'COMPLETED']
const priorityOptions: AssetPriority[] = ['HIGH', 'MEDIUM', 'LOW']

function getStatusConfig(status: AssetRequestStatus): { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', variant: 'default' }
    case 'APPROVED':
      return { label: 'Approved', variant: 'success' }
    case 'DENIED':
      return { label: 'Denied', variant: 'error' }
    case 'NEEDS_IMPROVEMENT':
      return { label: 'Needs Improvement', variant: 'warning' }
    case 'NEEDS_ITERATION':
      return { label: 'Needs Iteration', variant: 'info' }
    case 'COMPLETED':
      return { label: 'Completed', variant: 'success' }
    default:
      return { label: status, variant: 'default' }
  }
}

function getPriorityConfig(priority: AssetPriority): { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'error' } {
  switch (priority) {
    case 'HIGH':
      return { label: 'High', variant: 'error' }
    case 'MEDIUM':
      return { label: 'Medium', variant: 'warning' }
    case 'LOW':
      return { label: 'Low', variant: 'default' }
    default:
      return { label: priority, variant: 'default' }
  }
}

function getProductionStepLabel(step: string): string {
  switch (step) {
    case 'QC_LIBRARY':
      return 'QC from Library'
    case 'GEN_REFINE':
      return 'Gen/Refine'
    case 'QC_EDIT':
      return 'QC/Edit'
    case 'CLIENT_REVIEW':
      return 'Client Review'
    case 'QC_DISTRO':
      return 'QC/Distro Notes'
    default:
      return step
  }
}

function getProductionStepProgress(step: string): number {
  const steps = ['QC_LIBRARY', 'GEN_REFINE', 'QC_EDIT', 'CLIENT_REVIEW', 'QC_DISTRO']
  const index = steps.indexOf(step)
  return index >= 0 ? ((index + 1) / steps.length) * 100 : 0
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AssetRequestsTable({
  projectId,
  projectName,
  assetRequests,
  onUpdate,
  onCreate,
  onDelete
}: AssetRequestsTableProps) {
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [selectedAsset, setSelectedAsset] = useState<AssetRequest | null>(null)
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(assetRequests.map(r => r.id)))
    } else {
      setSelectedRequests(new Set())
    }
  }

  const handleSelectRequest = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRequests(newSelected)
  }

  const handleCellClick = (id: string, field: string) => {
    if (onUpdate) {
      setEditingCell({ id, field })
    }
  }

  const handleCellUpdate = async (id: string, field: string, value: any) => {
    if (onUpdate) {
      await onUpdate(id, field, value)
    }
    setEditingCell(null)
  }

  const handleModalUpdate = async (field: string, value: any) => {
    if (selectedAsset && onUpdate) {
      await onUpdate(selectedAsset.id, field, value)
      // Update the local state to reflect changes
      const updatedAsset = { ...selectedAsset, [field]: value }
      setSelectedAsset(updatedAsset)
    }
  }

  const handleCreate = async () => {
    await onCreate?.({})
  }

  if (assetRequests.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
            <Button size="sm" onClick={() => handleCreate()}>
              Add Deliverable
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliverables</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new deliverable.</p>
            <div className="mt-6">
              <Button onClick={() => handleCreate()}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Deliverable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedRequests.size > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedRequests.size} selected
                </span>
              )}
              <Button size="sm" onClick={() => handleCreate()}>
                Add Deliverable
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === assetRequests.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creative Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First V1 Review
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Delivery
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assetRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status)
                  const priorityConfig = getPriorityConfig(request.priority)

                  const needsTitle = !request.title

                  return (
                    <tr
                      key={request.id}
                      onClick={() => setSelectedAsset(request)}
                      className={cn(
                        'cursor-pointer hover:bg-gray-50',
                        needsTitle && 'bg-blue-50/60 border-l-2 border-l-blue-400'
                      )}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(request.id)}
                          onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className={cn(
                            'text-sm font-medium',
                            needsTitle ? 'text-blue-600 italic' : 'text-gray-900'
                          )}>
                            {request.title || request.creativeType || 'Click to add title...'}
                          </div>
                          {request.title && (
                            <div className="text-xs text-gray-500 line-clamp-1">{request.creativeType}</div>
                          )}
                          {!request.title && request.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{request.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.platform}</div>
                        {request.dimensions && (
                          <div className="text-xs text-gray-500">{request.dimensions}</div>
                        )}
                        {request.duration && (
                          <div className="text-xs text-gray-500">{request.duration}s</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.targetCount}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingCell?.id === request.id && editingCell?.field === 'status' ? (
                          <select
                            autoFocus
                            value={request.status}
                            onChange={(e) => handleCellUpdate(request.id, 'status', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="text-sm rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>{getStatusConfig(status).label}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge
                            variant={statusConfig.variant}
                            className="cursor-pointer"
                            onClick={() => handleCellClick(request.id, 'status')}
                          >
                            {statusConfig.label}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingCell?.id === request.id && editingCell?.field === 'priority' ? (
                          <select
                            autoFocus
                            value={request.priority}
                            onChange={(e) => handleCellUpdate(request.id, 'priority', e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            className="text-sm rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                          >
                            {priorityOptions.map(priority => (
                              <option key={priority} value={priority}>{getPriorityConfig(priority).label}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge
                            variant={priorityConfig.variant}
                            className="cursor-pointer"
                            onClick={() => handleCellClick(request.id, 'priority')}
                          >
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.firstV1ReviewDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.finalDeliveryDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onDelete?.(request.id)}
                            className="rounded p-1 hover:bg-red-100"
                            title="Delete"
                          >
                            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedAsset && (
        <AssetRequestDetailModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          assetRequest={selectedAsset}
          onUpdate={handleModalUpdate}
          projectName={projectName}
          currentIndex={assetRequests.findIndex(r => r.id === selectedAsset.id)}
          totalCount={assetRequests.length}
          onPrev={() => {
            const idx = assetRequests.findIndex(r => r.id === selectedAsset.id)
            const prevIdx = idx <= 0 ? assetRequests.length - 1 : idx - 1
            setSelectedAsset(assetRequests[prevIdx])
          }}
          onNext={() => {
            const idx = assetRequests.findIndex(r => r.id === selectedAsset.id)
            const nextIdx = idx >= assetRequests.length - 1 ? 0 : idx + 1
            setSelectedAsset(assetRequests[nextIdx])
          }}
        />
      )}
    </>
  )
}
