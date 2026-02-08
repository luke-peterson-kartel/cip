import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui'
import { getProject, updateProject } from '@/api/endpoints/projects'
import type { Project, TeamMember } from '@/types'

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
    <div className="group flex items-center gap-2 py-0.5 pr-1">
      <Avatar name={member.name || member.email} size="xs" />
      <p className="flex-1 min-w-0 text-xs text-gray-700 truncate">{member.name || member.email}</p>
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

function SidebarTeamPanel({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const handleLeadSave = async (field: string, value: string) => {
    await updateProject(project.id, { [field]: value })
    onRefresh()
  }

  const handleAddMember = async (section: 'clientTeam' | 'kartelTeam', email: string) => {
    const current = project[section] || []
    await updateProject(project.id, {
      [section]: [...current, { email, name: email.split('@')[0] }],
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
    <div className="border-t border-gray-200">
      <div className="border-l-2 border-primary-500 px-3 py-3 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Project Team</p>

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
      </div>
    </div>
  )
}

// --- Main Sidebar ---

export function Sidebar() {
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

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
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
