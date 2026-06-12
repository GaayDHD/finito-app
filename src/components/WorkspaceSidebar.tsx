import { useState } from 'react'
import type { ActivityLog, Section, Task, Workspace } from '../types'

type WorkspaceSidebarProps = {
  sections: Section[]
  tasks: Task[]
  activityLogs: ActivityLog[]
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  newWorkspaceName: string
  setNewWorkspaceName: (value: string) => void
  creatingWorkspace: boolean
  createWorkspace: (event: React.FormEvent<HTMLFormElement>) => void
  switchWorkspace: (workspaceId: string) => void
  newSectionName: string
  setNewSectionName: (value: string) => void
  sectionDraftNames: Record<string, string>
  setSectionDraftNames: (value: React.SetStateAction<Record<string, string>>) => void
  creatingSection: boolean
  deletingSectionId: string | null
  createSection: (event: React.FormEvent<HTMLFormElement>) => void
  renameSection: (sectionId: string) => void
  deleteSection: (sectionId: string) => void
}

export function WorkspaceSidebar({
  sections,
  tasks,
  activityLogs,
  workspaces,
  currentWorkspaceId,
  newWorkspaceName,
  setNewWorkspaceName,
  creatingWorkspace,
  createWorkspace,
  switchWorkspace,
  newSectionName,
  setNewSectionName,
  sectionDraftNames,
  setSectionDraftNames,
  creatingSection,
  deletingSectionId,
  createSection,
  renameSection,
  deleteSection,
}: WorkspaceSidebarProps) {
  const [activeTool, setActiveTool] = useState<'workspaces' | 'sections' | 'activity'>('workspaces')
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null)
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null)

  const confirmDeleteSection = sections.find((section) => section.id === confirmDeleteSectionId)

  function getSectionTaskCount(sectionId: string) {
    return tasks.filter((task) => task.section_id === sectionId).length
  }

  function saveSectionName(sectionId: string) {
    const draftName = sectionDraftNames[sectionId]?.trim()
    const section = sections.find((currentSection) => currentSection.id === sectionId)

    setEditingSectionId(null)

    if (!section || !draftName || draftName === section.name) {
      return
    }

    renameSection(sectionId)
  }

  function cancelSectionEdit(sectionId: string) {
    const section = sections.find((currentSection) => currentSection.id === sectionId)

    if (section) {
      setSectionDraftNames((currentDrafts) => ({
        ...currentDrafts,
        [sectionId]: section.name,
      }))
    }

    setEditingSectionId(null)
  }

  function handleSectionKeyDown(event: React.KeyboardEvent<HTMLInputElement>, sectionId: string) {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
      saveSectionName(sectionId)
    }

    if (event.key === 'Escape') {
      cancelSectionEdit(sectionId)
      event.currentTarget.blur()
    }
  }

  return (
    <aside className="relative h-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="border-b border-[var(--outline-soft)] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Workspace Tools
        </p>
      </div>

      <div className="space-y-2 p-3">
        <button
          type="button"
          onClick={() => setActiveTool('workspaces')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
            activeTool === 'workspaces'
              ? 'bg-[var(--primary-light)] text-[var(--primary-dark)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          Workspaces
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('sections')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
            activeTool === 'sections'
              ? 'bg-[var(--primary-light)] text-[var(--primary-dark)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          Sections
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('activity')}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
            activeTool === 'activity'
              ? 'bg-[var(--primary-light)] text-[var(--primary-dark)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          Activity
        </button>
      </div>

      <div className="border-t border-[var(--outline-soft)] p-3">
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
                      ? 'border-[var(--primary-main)]/35 bg-[var(--primary-light)]'
                      : 'border-[var(--outline-soft)] bg-[var(--surface-subtle)] hover:border-[var(--outline)]'
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
                className="flex min-h-8 w-full items-center gap-2 rounded-full border border-dashed border-[var(--primary-main)]/35 bg-[var(--surface-subtle)] px-3 py-1.5"
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
                  className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
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
                className="flex min-h-8 w-full items-center justify-between rounded-full border border-dashed border-[var(--outline)] bg-[var(--surface-subtle)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--primary-main)]/35 hover:text-[var(--primary-main)]"
                title="Add workspace"
              >
                <span>Add workspace</span>
                <span className="text-sm leading-none">+</span>
              </button>
            )}
          </div>
        ) : activeTool === 'sections' ? (
          <div className="space-y-2">
            {sections.map((section) => {
              const sectionTaskCount = getSectionTaskCount(section.id)
              const isHovered = hoveredSectionId === section.id
              const isEditing = editingSectionId === section.id
              const canDelete = sectionTaskCount === 0

              return (
                <div
                  key={section.id}
                  onMouseEnter={() => setHoveredSectionId(section.id)}
                  onMouseLeave={() => setHoveredSectionId(null)}
                  className="group relative flex min-h-8 items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-3 py-1.5 transition hover:border-[var(--outline)]"
                >
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        value={sectionDraftNames[section.id] ?? section.name}
                        onChange={(event) =>
                          setSectionDraftNames((currentDrafts) => ({
                            ...currentDrafts,
                            [section.id]: event.target.value,
                          }))
                        }
                        onBlur={() => saveSectionName(section.id)}
                        onKeyDown={(event) => handleSectionKeyDown(event, section.id)}
                        className="h-6 w-full rounded-md border border-[var(--outline)] bg-[var(--background-paper)] px-2 text-xs font-normal text-[var(--text-secondary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-2 focus:ring-[var(--primary-main)]/10"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSectionId(section.id)}
                        className="block max-w-full truncate text-left text-xs font-semibold text-[var(--text-secondary)]"
                        title="Click to rename section"
                      >
                        {section.name}
                      </button>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-[var(--background-paper)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                    {sectionTaskCount}
                  </span>

                  <button
                    type="button"
                    disabled={!canDelete || deletingSectionId === section.id}
                    onClick={() => setConfirmDeleteSectionId(section.id)}
                    className={`h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm text-[var(--text-disabled)] transition hover:bg-[var(--error-light)] hover:text-[var(--error-dark)] disabled:cursor-not-allowed disabled:opacity-30 ${
                      isHovered ? 'flex' : 'hidden'
                    }`}
                    title={canDelete ? 'Delete section' : 'Only empty sections can be deleted'}
                  >
                    ×
                  </button>
                </div>
              )
            })}

            {isAddingSection ? (
              <form
                onSubmit={(event) => {
                  createSection(event)
                  setIsAddingSection(false)
                }}
                className="flex min-h-8 w-full items-center gap-2 rounded-full border border-dashed border-[var(--primary-main)]/35 bg-[var(--surface-subtle)] px-3 py-1.5"
              >
                <input
                  value={newSectionName}
                  onChange={(event) => setNewSectionName(event.target.value)}
                  onBlur={() => {
                    if (!newSectionName.trim()) {
                      setIsAddingSection(false)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setNewSectionName('')
                      setIsAddingSection(false)
                    }
                  }}
                  placeholder="Section name"
                  className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={creatingSection}
                  className="shrink-0 rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-main)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSection(true)}
                className="flex min-h-8 w-full items-center justify-between rounded-full border border-dashed border-[var(--outline)] bg-[var(--surface-subtle)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--text-muted)] transition hover:border-[var(--primary-main)]/35 hover:text-[var(--primary-main)]"
                title="Add section"
              >
                <span>Add section</span>
                <span className="text-sm leading-none">+</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Recent activity
            </p>

            {activityLogs.length > 0 ? (
              activityLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2"
                >
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {log.action}
                  </p>
                  {log.details && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--text-muted)]">
                      {log.details}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--outline)] px-3 py-4 text-xs text-[var(--text-muted)]">
                No activity yet.
              </p>
            )}
          </div>
        )}
      </div>

      {confirmDeleteSection && (
        <div className="absolute left-3 right-3 top-24 z-20 rounded-xl border border-[var(--error-main)]/25 bg-[var(--background-paper)] p-3 shadow-xl">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Delete section?</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            This will delete “{confirmDeleteSection.name}”. This action cannot be undone.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteSectionId(null)}
              className="rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                deleteSection(confirmDeleteSection.id)
                setConfirmDeleteSectionId(null)
              }}
              className="rounded-lg bg-[var(--error-main)] px-3 py-1.5 text-xs font-semibold text-[var(--error-contrast)] transition hover:bg-[var(--error-dark)]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
