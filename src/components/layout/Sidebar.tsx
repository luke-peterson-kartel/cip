import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/authStore'
import { useMockClientStore } from '@/store/mockClientStore'
import { Avatar, Modal } from '@/components/ui'
import { getProject, updateProject } from '@/api/endpoints/projects'
import type { Project, TeamMember } from '@/types'
import type { ClientId } from '@/mock/data'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
]

const adminNavigation = [
  {
    name: 'Users',
    href: '/settings/users',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Audit Log',
    href: '/audit',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Organization',
    href: '/settings/organization',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
]

// --- Sidebar Team Panel ---

function EditableLeadField({
  label,
  value,
  onSave,
}: {
  label: string
  value: string
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) onSave(draft.trim())
  }

  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-[10px] font-medium text-gray-400 uppercase shrink-0">{label}:</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
          className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 border-b border-primary-300 outline-none py-0"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 min-w-0 text-left text-xs text-gray-700 truncate hover:text-primary-600 transition-colors"
          title={value || 'Click to set'}
        >
          {value || <span className="italic text-gray-400">Not set</span>}
        </button>
      )}
    </div>
  )
}

function MemberRow({ member, onRemove }: { member: TeamMember; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-1 py-0.5 pr-1">
      <p className="flex-1 min-w-0 text-xs text-gray-700 truncate">{member.email}</p>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-red-100 transition-opacity"
        title="Remove"
      >
        <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function AddMemberInline({ onAdd }: { onAdd: (email: string) => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = () => {
    if (email.trim()) {
      onAdd(email.trim())
      setEmail('')
    }
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary-600 transition-colors py-0.5"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add member
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 py-0.5">
      <input
        ref={inputRef}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setEmail(''); setOpen(false) } }}
        placeholder="email@example.com"
        className="flex-1 min-w-0 text-xs bg-transparent border-b border-primary-300 outline-none py-0 placeholder:text-gray-300"
      />
    </div>
  )
}

function getProjectEmails(project: Project): string[] {
  const emails: string[] = []
  if (project.clientLead) emails.push(project.clientLead)
  for (const m of project.clientTeam || []) emails.push(m.email)
  if (project.accountManager) emails.push(project.accountManager)
  if (project.leadProducer) emails.push(project.leadProducer)
  for (const m of project.kartelTeam || []) emails.push(m.email)
  return [...new Set(emails)]
}

function generateIcs(title: string, date: string, time: string, durationMin: number, attendees: string[]): string {
  const start = new Date(`${date}T${time}:00`)
  const end = new Date(start.getTime() + durationMin * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const uid = `${Date.now()}@kartel.ai`
  const attendeeLines = attendees.map(e => `ATTENDEE;CN=${e}:mailto:${e}`).join('\r\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kartel//CIP//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function ScheduleMeetingModal({ isOpen, onClose, project }: { isOpen: boolean; onClose: () => void; project: Project }) {
  const allEmails = getProjectEmails(project)
  const [title, setTitle] = useState(project.name + ' Meeting')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('10:00')
  const [duration, setDuration] = useState(60)
  const [selected, setSelected] = useState<Set<string>>(new Set(allEmails))

  useEffect(() => {
    if (isOpen) {
      const emails = getProjectEmails(project)
      setSelected(new Set(emails))
      setTitle(project.name + ' Meeting')
    }
  }, [isOpen, project])

  const toggle = (email: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const getStartEnd = () => {
    const start = new Date(`${date}T${time}:00`)
    const end = new Date(start.getTime() + duration * 60000)
    return { start, end }
  }

  const handleDownload = () => {
    const ics = generateIcs(title, date, time, duration, [...selected])
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  const handleGmail = () => {
    const { start, end } = getStartEnd()
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${fmt(start)}/${fmt(end)}`,
      add: [...selected].join(','),
    })
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank')
    onClose()
  }

  const handleOutlook = () => {
    const { start, end } = getStartEnd()
    const params = new URLSearchParams({
      subject: title,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      to: [...selected].join(';'),
      path: '/calendar/action/compose',
    })
    window.open(`https://outlook.office.com/calendar/0/action/compose?${params}`, '_blank')
    onClose()
  }

  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputClass}>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
          {allEmails.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No team members yet</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {allEmails.map(email => (
                <label key={email} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(email)}
                    onChange={() => toggle(email)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 truncate">{email}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Open with</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleGmail}
              disabled={selected.size === 0 || !title.trim()}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Gmail
            </button>
            <button
              onClick={handleOutlook}
              disabled={selected.size === 0 || !title.trim()}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Outlook
            </button>
            <button
              onClick={handleDownload}
              disabled={selected.size === 0 || !title.trim()}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              .ics File
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function SidebarTeamPanel({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [showMeeting, setShowMeeting] = useState(false)

  const handleLeadSave = async (field: string, value: string) => {
    await updateProject(project.id, { [field]: value })
    onRefresh()
  }

  const handleAddMember = async (section: 'clientTeam' | 'kartelTeam', email: string) => {
    const current = project[section] || []
    await updateProject(project.id, {
      [section]: [...current, { email }],
    })
    onRefresh()
  }

  const handleRemoveMember = async (section: 'clientTeam' | 'kartelTeam', idx: number) => {
    const current = [...(project[section] || [])]
    current.splice(idx, 1)
    await updateProject(project.id, { [section]: current })
    onRefresh()
  }

  return (
    <div className="border-t border-gray-200 bg-primary-50/50">
      <div className="border-l-2 border-primary-500 px-3 py-3 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">Project Team</p>

        {/* Client */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Client</p>
          <EditableLeadField
            label="Lead"
            value={project.clientLead || ''}
            onSave={(val) => handleLeadSave('clientLead', val)}
          />
          {(project.clientTeam || []).map((m, i) => (
            <MemberRow key={m.email + i} member={m} onRemove={() => handleRemoveMember('clientTeam', i)} />
          ))}
          <AddMemberInline onAdd={(email) => handleAddMember('clientTeam', email)} />
        </div>

        {/* Kartel */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Kartel</p>
          <EditableLeadField
            label="AM"
            value={project.accountManager || ''}
            onSave={(val) => handleLeadSave('accountManager', val)}
          />
          <EditableLeadField
            label="LP"
            value={project.leadProducer || ''}
            onSave={(val) => handleLeadSave('leadProducer', val)}
          />
          {(project.kartelTeam || []).map((m, i) => (
            <MemberRow key={m.email + i} member={m} onRemove={() => handleRemoveMember('kartelTeam', i)} />
          ))}
          <AddMemberInline onAdd={(email) => handleAddMember('kartelTeam', email)} />
        </div>

        {/* Schedule Meeting */}
        <button
          onClick={() => setShowMeeting(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule Meeting
        </button>
      </div>

      <ScheduleMeetingModal isOpen={showMeeting} onClose={() => setShowMeeting(false)} project={project} />
    </div>
  )
}

// --- Main Sidebar ---

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()
  const { user, organization } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  // Project awareness — fetch project when on a project detail route
  const projectMatch = location.pathname.match(/\/projects\/([^/]+)/)
  const projectId = projectMatch?.[1]
  const [project, setProject] = useState<Project | null>(null)

  const fetchProject = async (id: string) => {
    try {
      const p = await getProject(id)
      setProject(p)
    } catch {
      setProject(null)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    } else {
      setProject(null)
    }
  }, [projectId])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [location.pathname])

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:static lg:translate-x-0'
    )}>
      {/* Logo */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary-600">Kartel</span>
          <span className="text-xl text-gray-400">.ai</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">Creative Intelligence Platform</p>
      </div>

      {/* Company/Brand */}
      {organization && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase text-gray-400">Company</p>
            <p className="truncate text-sm font-medium text-gray-900">{organization.name}</p>
          </div>
          {organization.brand && (
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-xs font-medium uppercase text-gray-400">Brand</p>
              <p className="truncate text-sm font-medium text-gray-900">{organization.brand}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href)

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-200" />
            <p className="mb-2 px-3 text-xs font-medium uppercase text-gray-400">Admin</p>
            <ul className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href)

                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </nav>

      {/* Project Team Panel */}
      {project && (
        <SidebarTeamPanel project={project} onRefresh={() => fetchProject(project.id)} />
      )}

      {/* Demo Client Switcher */}
      <div className="border-t border-gray-200 px-4 py-3">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Demo Client
        </label>
        <select
          value={useMockClientStore.getState().clientId}
          onChange={(e) => useMockClientStore.getState().setClientId(e.target.value as ClientId)}
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="newell">Newell (Bubba)</option>
          <option value="earnin">EarnIn</option>
        </select>
      </div>

      {/* User */}
      {user && (
        <div className="border-t border-gray-200 p-4">
          <NavLink
            to="/settings/profile"
            className="flex items-center gap-3 rounded-md p-2 -m-2 transition-colors hover:bg-gray-50"
          >
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </NavLink>
        </div>
      )}
    </aside>
  )
}
