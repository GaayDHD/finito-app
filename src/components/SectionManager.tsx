import type { FormEvent } from 'react'
import type { Section, Task } from '../types'

type SectionManagerProps = {
  sections: Section[]
  tasks: Task[]
  newSectionName: string
  setNewSectionName: (value: string) => void
  sectionDraftNames: Record<string, string>
  setSectionDraftNames: (value: React.SetStateAction<Record<string, string>>) => void
  creatingSection: boolean
  renamingSectionId: string | null
  deletingSectionId: string | null
  createSection: (event: FormEvent<HTMLFormElement>) => void
  renameSection: (sectionId: string) => void
  deleteSection: (sectionId: string) => void
}

export function SectionManager({
  sections,
  tasks,
  newSectionName,
  setNewSectionName,
  sectionDraftNames,
  setSectionDraftNames,
  creatingSection,
  renamingSectionId,
  deletingSectionId,
  createSection,
  renameSection,
  deleteSection,
}: SectionManagerProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Manage sections</h2>
        <p className="text-sm text-[var(--text-muted)]">Create, rename and delete empty project sections.</p>
      </div>

      <form onSubmit={createSection} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={newSectionName}
          onChange={(event) => setNewSectionName(event.target.value)}
          placeholder="New section name"
          className="min-w-0 flex-1 rounded-xl border border-[var(--outline)] bg-[var(--background-paper)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10"
        />
        <button
          type="submit"
          disabled={creatingSection}
          className="rounded-xl bg-[var(--primary-main)] px-5 py-3 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)]"
        >
          {creatingSection ? 'Creating…' : 'Create section'}
        </button>
      </form>

      <div className="space-y-2">
        {sections.map((section) => {
          const sectionTaskCount = tasks.filter((task) => task.section_id === section.id).length

          return (
            <div
              key={section.id}
              className="flex flex-col gap-2 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-3 sm:flex-row sm:items-center"
            >
              <input
                value={sectionDraftNames[section.id] ?? section.name}
                onChange={(event) =>
                  setSectionDraftNames((currentDrafts) => ({
                    ...currentDrafts,
                    [section.id]: event.target.value,
                  }))
                }
                className="min-w-0 flex-1 rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10"
              />

              <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {sectionTaskCount} tasks
              </span>

              <button
                type="button"
                disabled={renamingSectionId === section.id}
                onClick={() => renameSection(section.id)}
                className="rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)]"
              >
                {renamingSectionId === section.id ? 'Saving…' : 'Rename'}
              </button>

              <button
                type="button"
                disabled={deletingSectionId === section.id || sectionTaskCount > 0}
                onClick={() => deleteSection(section.id)}
                className="rounded-lg border border-[var(--error-main)]/25 bg-[var(--error-light)] px-3 py-2 text-xs font-semibold text-[var(--error-dark)] transition hover:border-[var(--error-main)]/40 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)]"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
