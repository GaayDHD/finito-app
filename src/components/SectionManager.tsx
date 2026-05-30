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
    <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Manage sections</h2>
        <p className="text-sm text-zinc-400">Create, rename and delete empty project sections.</p>
      </div>

      <form onSubmit={createSection} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={newSectionName}
          onChange={(event) => setNewSectionName(event.target.value)}
          placeholder="New section name"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
        />
        <button
          type="submit"
          disabled={creatingSection}
          className="rounded-2xl bg-violet-300 px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#181b1f] p-3 sm:flex-row sm:items-center"
            >
              <input
                value={sectionDraftNames[section.id] ?? section.name}
                onChange={(event) =>
                  setSectionDraftNames((currentDrafts) => ({
                    ...currentDrafts,
                    [section.id]: event.target.value,
                  }))
                }
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111315] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-300/60"
              />

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {sectionTaskCount} tasks
              </span>

              <button
                type="button"
                disabled={renamingSectionId === section.id}
                onClick={() => renameSection(section.id)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {renamingSectionId === section.id ? 'Saving…' : 'Rename'}
              </button>

              <button
                type="button"
                disabled={deletingSectionId === section.id || sectionTaskCount > 0}
                onClick={() => deleteSection(section.id)}
                className="rounded-xl border border-red-300/10 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-40"
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
