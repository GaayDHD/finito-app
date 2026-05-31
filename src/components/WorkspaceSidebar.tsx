import { useState } from 'react'
import type { ActivityLog, Section, Task } from '../types'

type WorkspaceSidebarProps = {
  sections: Section[]
  tasks: Task[]
  activityLogs: ActivityLog[]
  sectionDraftNames: Record<string, string>
  setSectionDraftNames: (value: React.SetStateAction<Record<string, string>>) => void
  renamingSectionId: string | null
  deletingSectionId: string | null
  renameSection: (sectionId: string) => void
  deleteSection: (sectionId: string) => void
}

export function WorkspaceSidebar({
  sections,
  tasks,
  activityLogs,
  sectionDraftNames,
  setSectionDraftNames,
  renamingSectionId,
  deletingSectionId,
  renameSection,
  deleteSection,
}: WorkspaceSidebarProps) {
  const [activeTool, setActiveTool] = useState<'sections' | 'activity'>('sections')
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null)
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null)

  const confirmDeleteSection = sections.find((section) => section.id === confirmDeleteSectionId)

  function getSectionTaskCount(sectionId: string) {
    return tasks.filter((task) => task.section_id === sectionId).length
  }

  function saveSectionName(sectionId: string) {
    const draftName = sectionDraftNames[sectionId]?.trim()
    const section = sections.find((currentSection) => currentSection.id === sectionId)

    if (!section || !draftName || draftName === section.name) {
      return
    }

    renameSection(sectionId)
  }

  function handleSectionKeyDown(event: React.KeyboardEvent<HTMLInputElement>, sectionId: string) {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
      saveSectionName(sectionId)
    }

    if (event.key === 'Escape') {
      const section = sections.find((currentSection) => currentSection.id === sectionId)

      if (section) {
        setSectionDraftNames((currentDrafts) => ({
          ...currentDrafts,
          [sectionId]: section.name,
        }))
      }

      event.currentTarget.blur()
    }
  }

  return (
    <aside className="relative h-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="border-b border-[var(--outline-soft)] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Workspace
        </p>
      </div>

      <div className="space-y-2 p-3">
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
        {activeTool === 'sections' ? (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Section options
            </p>

            {sections.map((section) => {
              const sectionTaskCount = getSectionTaskCount(section.id)
              const isHovered = hoveredSectionId === section.id
              const canDelete = sectionTaskCount === 0

              return (
                <div
                  key={section.id}
                  onMouseEnter={() => setHoveredSectionId(section.id)}
                  onMouseLeave={() => setHoveredSectionId(null)}
                  className="group relative flex min-h-10 items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 transition hover:border-[var(--outline)] hover:bg-[var(--background-paper)]"
                >
                  <div className="min-w-0 flex-1">
                    {isHovered ? (
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
                        className="h-6 w-full rounded-md border border-[var(--outline)] bg-[var(--background-paper)] px-2 text-xs font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-2 focus:ring-[var(--primary-main)]/10"
                        autoFocus
                      />
                    ) : (
                      <p className="truncate text-xs font-semibold text-[var(--text-secondary)]">
                        {section.name}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                    {sectionTaskCount}
                  </span>

                  <button
                    type="button"
                    disabled={!canDelete || deletingSectionId === section.id}
                    onClick={() => setConfirmDeleteSectionId(section.id)}
                    className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm text-[var(--text-disabled)] transition hover:bg-[var(--error-light)] hover:text-[var(--error-dark)] disabled:cursor-not-allowed disabled:opacity-30 group-hover:flex"
                    title={canDelete ? 'Delete section' : 'Only empty sections can be deleted'}
                  >
                    ×
                  </button>
                </div>
              )
            })}
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
