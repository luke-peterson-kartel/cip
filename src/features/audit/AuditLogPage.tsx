import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Card, Badge } from '@/components/ui'
import type { AuditEvent } from '@/types'
import { useMockData } from '@/mock/useMockData'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionBadgeVariant(action: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (action) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'info'
    case 'DELETE':
      return 'error'
    default:
      return 'default'
  }
}

export function AuditLogPage() {
  const { auditEvents: auditData, users: usersData } = useMockData()
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ action?: string; resourceType?: string }>({})

  function getUserName(userId: string): string {
    const user = usersData.items.find((u: { id: string; name: string }) => u.id === userId)
    return user?.name || 'Unknown User'
  }

  const events = (auditData.items as AuditEvent[]).filter((event) => {
    if (filter.action && event.action !== filter.action) return false
    if (filter.resourceType && event.resourceType !== filter.resourceType) return false
    return true
  })

  const actions = [...new Set(auditData.items.map((e) => e.action))]
  const resourceTypes = [...new Set(auditData.items.map((e) => e.resourceType))]

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Track all activity in your organization."
      />

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          value={filter.action || ''}
          onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
        >
          <option value="">All Actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          value={filter.resourceType || ''}
          onChange={(e) => setFilter({ ...filter, resourceType: e.target.value || undefined })}
        >
          <option value="">All Resource Types</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="divide-y divide-gray-200">
          {events.map((event) => (
            <div key={event.id} className="p-4">
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpandedEvent(expandedEvent === event.id ? null : event.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={getActionBadgeVariant(event.action)}>
                      {event.action}
                    </Badge>
                    <span className="font-medium text-gray-900 capitalize">
                      {event.resourceType}
                    </span>
                    <span className="text-gray-500">by</span>
                    <span className="text-gray-900">{getUserName(event.userId)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      {formatDate(event.createdAt)}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedEvent === event.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>

              {expandedEvent === event.id && event.details && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Details</h4>
                  <pre className="overflow-x-auto text-xs text-gray-600">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {events.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No audit events found matching your filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
