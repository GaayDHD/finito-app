import { useState } from 'react'
import type { ActivityLog, Workspace } from '../types'
import { supabase } from '../lib/supabase'

export type SidebarTool = 'workspaces' | 'activity' | 'settings'
export type ThemePreference = 'light' | 'dark' | 'system'

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
  userEmail: string
  signOut: () => void
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  sticky?: boolean
}

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

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
  userEmail,
  signOut,
  theme,
  setTheme,
  sticky = true,
}: WorkspaceSidebarProps) {
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [sendingReset, setSendingReset] = useState(false)

  async function sendPasswordReset() {
    setSendingReset(true)
    setResetMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail)

    setResetMessage(error ? error.message : 'Password reset email sent.')
    setSendingReset(false)
  }

  const toolButtonClass = (tool: SidebarTool) =>
    `w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
      activeTool === tool
        ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]'
        : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)]'
    }`

  return (
    <aside className="relative h-full rounded-2xl bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
      <div className={sticky ? 'sticky top-[118px]' : ''}>
        <div className="border-b border-[var(--sidebar-stroke)] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sidebar-faint)]">
            Workspace Tools
          </p>
        </div>

        <div className="space-y-2 p-3">
          <button type="button" onClick={() => setActiveTool('workspaces')} className={toolButtonClass('workspaces')}>
            Workspaces
          </button>

          <button type="button" onClick={() => setActiveTool('activity')} className={toolButtonClass('activity')}>
            Activity
          </button>

          <button type="button" onClick={() => setActiveTool('settings')} className={toolButtonClass('settings')}>
            Settings
          </button>
        </div>

        <div className="border-t border-[var(--sidebar-stroke)] p-3">
          {activeTool === 'workspaces' ? (
            <div className="space-y-2">
              {workspaces.map((workspace) => {
                const isCurrent = workspace.id === currentWorkspaceId

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => switchWorkspace(workspace.id)}
                    className={`flex min-h-8 w-full items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-left transition ${
                      isCurrent
                        ? 'border-transparent bg-[var(--sidebar-active)]'
                        : 'border-[var(--sidebar-stroke)] bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-active)]'
                    }`}
                    title={isCurrent ? 'Current workspace' : 'Switch to this workspace'}
                  >
                    <span
                      className={`min-w-0 truncate text-xs font-semibold ${
                        isCurrent ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-text)]'
                      }`}
                    >
                      {workspace.name}
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-[var(--sidebar-chip)] px-2 py-0.5 text-[10px] font-semibold text-[var(--sidebar-active-text)]">
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
                  className="flex min-h-8 w-full items-center gap-2 rounded-full border border-dashed border-[var(--sidebar-stroke-strong)] bg-[var(--sidebar-hover)] px-3 py-1.5"
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
                    className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[var(--sidebar-text)] outline-none placeholder:text-[var(--sidebar-faint)]"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={creatingWorkspace}
                    className="shrink-0 rounded-full bg-[var(--sidebar-active)] px-2 py-0.5 text-[10px] font-semibold text-[var(--sidebar-active-text)] disabled:cursor-not-allowed disabled:text-[var(--sidebar-faint)]"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingWorkspace(true)}
                  className="flex min-h-8 w-full items-center justify-between rounded-full border border-dashed border-[var(--sidebar-stroke-strong)] bg-transparent px-3 py-1.5 text-left text-xs font-semibold text-[var(--sidebar-muted)] transition hover:text-[var(--sidebar-text)]"
                  title="Add workspace"
                >
                  <span>Add workspace</span>
                  <span className="text-sm leading-none">+</span>
                </button>
              )}
            </div>
          ) : activeTool === 'activity' ? (
            <div className="space-y-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sidebar-faint)]">
                Recent activity
              </p>

              {activityLogs.length > 0 ? (
                activityLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-[var(--sidebar-stroke)] bg-[var(--sidebar-hover)] px-3 py-2"
                  >
                    <p className="truncate text-xs font-semibold text-[var(--sidebar-text)]">
                      {log.action}
                    </p>
                    {log.details && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--sidebar-muted)]">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--sidebar-stroke-strong)] px-3 py-4 text-xs text-[var(--sidebar-muted)]">
                  No activity yet.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sidebar-faint)]">
                  Account
                </p>
                <p className="mt-2 truncate rounded-xl border border-[var(--sidebar-stroke)] bg-[var(--sidebar-hover)] px-3 py-2 text-xs font-semibold text-[var(--sidebar-text)]" title={userEmail}>
                  {userEmail}
                </p>

                <button
                  type="button"
                  disabled={sendingReset}
                  onClick={sendPasswordReset}
                  className="mt-2 w-full rounded-full border border-[var(--sidebar-stroke-strong)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--sidebar-muted)] transition hover:text-[var(--sidebar-text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingReset ? 'Sending…' : 'Send password reset email'}
                </button>

                {resetMessage && (
                  <p className="mt-2 px-1 text-[11px] text-[var(--sidebar-muted)]">{resetMessage}</p>
                )}

                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 w-full rounded-full border border-[var(--error-main)]/40 bg-[var(--error-light)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--error-dark)] transition hover:opacity-85"
                >
                  Sign out
                </button>
              </div>

              <div>
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sidebar-faint)]">
                  Appearance
                </p>
                <div className="mt-2 flex rounded-full border border-[var(--sidebar-stroke)] bg-[var(--sidebar-hover)] p-1">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`flex-1 rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                        theme === option.value
                          ? 'bg-[var(--sidebar-chip)] text-[var(--sidebar-active-text)]'
                          : 'text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
