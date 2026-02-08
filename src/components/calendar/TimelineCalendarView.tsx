import { useState } from 'react'
import Calendar from 'react-calendar'
import { cn } from '@/lib/cn'

export interface TimelineDates {
  requestedDate?: string
  firstV1ReviewDate?: string
  finalDeliveryDate?: string
  completedDate?: string
}

export interface TimelineCalendarViewProps {
  dates: TimelineDates
  onDateChange: (field: string, value: string) => void
  editable?: boolean
}

const DATE_FIELDS = [
  { key: 'requestedDate', label: 'Requested', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'firstV1ReviewDate', label: 'V1 Review', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'finalDeliveryDate', label: 'Final Delivery', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-200' },
  { key: 'completedDate', label: 'Completed', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-50', border: 'border-purple-200' },
] as const

function toDateOnly(dateStr: string): string {
  // Use UTC methods to avoid timezone-shift bugs (react-calendar uses midnight UTC)
  const d = new Date(dateStr)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function toISOString(date: Date): string {
  // Use UTC methods — react-calendar passes midnight-UTC Date objects
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function TimelineCalendarView({ dates, onDateChange, editable = true }: TimelineCalendarViewProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null)

  // Build a map of date string -> array of matching field configs
  const dateMarkerMap = new Map<string, typeof DATE_FIELDS[number][]>()
  for (const field of DATE_FIELDS) {
    const val = dates[field.key as keyof TimelineDates]
    if (val) {
      const key = toDateOnly(val)
      const existing = dateMarkerMap.get(key) || []
      existing.push(field)
      dateMarkerMap.set(key, existing)
    }
  }

  // Find a reasonable month to display — default to the earliest set date or today
  const setDates = Object.values(dates).filter(Boolean).map(d => new Date(d!))
  const activeDate = setDates.length > 0
    ? new Date(Math.min(...setDates.map(d => d.getTime())))
    : new Date()

  const handleClickDay = (date: Date) => {
    if (!editable || !selectedField) return
    onDateChange(selectedField, toISOString(date))
    setSelectedField(null)
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const key = toISOString(date)
    const markers = dateMarkerMap.get(key)
    if (markers && markers.length > 0) {
      const primary = markers[0]
      return `font-semibold timeline-marker-${primary.key}`
    }
    return ''
  }

  return (
    <div className="space-y-3">
      {/* Legend + Edit Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {DATE_FIELDS.map((field) => {
          const val = dates[field.key as keyof TimelineDates]
          const isSelected = selectedField === field.key
          return (
            <button
              key={field.key}
              onClick={() => {
                if (!editable) return
                setSelectedField(isSelected ? null : field.key)
              }}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-all border',
                isSelected
                  ? `${field.bgLight} ${field.border} ring-1 ring-offset-1 ring-${field.color.replace('bg-', '')}`
                  : 'border-gray-200 hover:border-gray-300',
                editable && 'cursor-pointer'
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', field.color)} />
              <span className={cn('font-medium truncate', field.textColor)}>{field.label}</span>
              <span className="text-gray-500 ml-auto whitespace-nowrap">
                {val
                  ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </span>
              {isSelected && (
                <span className="text-[10px] text-gray-400 flex-shrink-0">Click a day</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Calendar */}
      <div className="timeline-calendar rounded-lg border border-gray-200 overflow-hidden">
        <Calendar
          defaultActiveStartDate={activeDate}
          onClickDay={handleClickDay}
          tileClassName={tileClassName}
          locale="en-US"
          minDetail="month"
          next2Label={null}
          prev2Label={null}
        />
      </div>

      {selectedField && (
        <p className="text-xs text-center text-gray-500">
          Click a date on the calendar to set <span className="font-medium">{DATE_FIELDS.find(f => f.key === selectedField)?.label}</span>
        </p>
      )}
    </div>
  )
}
