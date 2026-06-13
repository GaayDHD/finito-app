import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ActivityLog, Workspace } from '../types'

export type SidebarTool = 'workspaces' | 'activity'
export type { ThemePreference } from './SettingsModal'

type WorkspaceSidebarProps = {
  activityLogs: ActivityLog[]
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  newWorkspaceName: string
  setNewWorkspaceName: (value: string) => void
  creatingWorkspace: boolean
  createWorkspace: (event: React.FormEvent<HTMLFormElement>) => void
  switchWorkspace: (workspaceId: string) => void
  activeTool: SidebarTool
  setActiveTool: (tool: SidebarTool) => void
  onOpenSettings: () => void
  signOut: () => void
  sticky?: boolean
}

const workspacesIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const activityIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

const settingsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const logoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export function WorkspaceSidebar({
  activityLogs,
  workspaces,
  currentWorkspaceId,
  newWorkspaceName,
  setNewWorkspaceName,
  creatingWorkspace,
  createWorkspace,
  switchWorkspace,
  activeTool,
  setActiveTool,
  onOpenSettings,
  signOut,
  sticky = true,
}: WorkspaceSidebarProps) {
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)

  function NavItem({
    icon,
    label,
    isActive,
    onClick,
  }: {
    icon: ReactNode
    label: string
    isActive: boolean
    onClick: () => void
  }) {
    return (
      <li className="w-full">
        <button
          type="button"
          onClick={onClick}
          className={`group flex w-full items-center gap-3 rounded-full p-3 text-sm font-semibold transition-all ease-linear ${
            isActive
              ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary-dark)] hover:shadow-inner'
          }`}
        >
          <span className={isActive ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--primary-main)]'}>
            {icon}
          </span>
          {label}
        </button>
      </li>
    )
  }

  return (
    <aside className="h-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4 shadow-md shadow-purple-200/40">
      <div className={sticky ? 'sticky top-[118px]' : ''}>
        <ul className="flex w-full flex-col gap-1.5">
          <NavItem icon={workspacesIcon} label="Workspaces" isActive={activeTool === 'workspaces'} onClick={() => setActiveTool('workspaces')} />
          <NavItem icon={activityIcon} label="Activity" isActive={activeTool === 'activity'} onClick={() => setActiveTool('activity')} />
          <NavItem icon={settingsIcon} label="Settings" isActive={false} onClick={onOpenSettings} />
          <NavItem icon={logoutIcon} label="Logout" isActive={false} onClick={signOut} />
        </ul>

        <div className="mt-4 border-t border-[var(--outline-soft)] pt-4">
          {activeTool === 'workspaces' ? (
            <div className="space-y-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Workspaces</p>
              {workspaces.map((workspace) => {
                const isCurrent = workspace.id === currentWorkspaceId

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => switchWorkspace(workspace.id)}
                    className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                      isCurrent
                        ? 'border-[var(--primary-main)]/30 bg-[var(--primary-light)]'
                        : 'border-[var(--outline-soft)] bg-[var(--surface-muted)] hover:border-[var(--primary-main)]/30'
                    }`}
                    title={isCurrent ? 'Current workspace' : 'Switch to this workspace'}
                  >
                    <span
                      className={`min-w-0 truncate text-xs font-semibold ${
                        isCurrent ? 'text-[var(--primary-dark)]' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {workspace.name}
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-[var(--background-paper)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-main)]">
                        Current
                      </span>
                    )}
                  </button>
                )
              })}

              {isAddingWorkspace ? (
                <form
                  onSubmit={(event) => {
                    createWorkspace(event)
                    setIsAddingWorkspace(false)
                  }}
                  className="flex min-h-9 w-full items-center gap-2 rounded-xl border border-dashed border-[var(--primary-main)]/35 bg-[var(--surface-muted)] px-3 py-2"
                >
                  <input
                    value={newWorkspaceName}
                    onChange={(event) => setNewWorkspaceName(event.target.value)}
                    onBlur={() => {
                      if (!newWorkspaceName.trim()) {
                        setIsAddingWorkspace(false)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setNewWorkspaceName('')
                        setIsAddingWorkspace(false)
                      }
                    }}
                    placeholder="Workspace name"
                    className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={creatingWorkspace}
                    className="shrink-0 rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-main)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingWorkspace(true)}
                  className="flex min-h-9 w-full items-center justify-between rounded-xl border border-dashed border-[var(--outline)] bg-transparent px-3 py-2 text-left text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--primary-main)]/35 hover:text-[var(--primary-main)]"
                  title="Add workspace"
                >
                  <span>Add workspace</span>
                  <span className="text-sm leading-none">+</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Recent activity</p>

              {activityLogs.length > 0 ? (
                activityLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2">
                    <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{log.action}</p>
                    {log.details && <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-muted)]">{log.details}</p>}
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--outline)] px-3 py-4 text-xs text-[var(--text-muted)]">No activity yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
