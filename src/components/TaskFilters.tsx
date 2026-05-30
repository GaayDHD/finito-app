import type { Section } from '../types'
import { priorityOptions, statusOptions } from '../constants'

type TaskFiltersProps = {
  searchQuery: string
  setSearchQuery: (value: string) => void
  sectionFilter: string
  setSectionFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  priorityFilter: string
  setPriorityFilter: (value: string) => void
  visibilityFilter: 'active' | 'archived' | 'all'
  setVisibilityFilter: (value: 'active' | 'archived' | 'all') => void
  groupBy: 'status' | 'priority' | 'scope'
  setGroupBy: (value: 'status' | 'priority' | 'scope') => void
  sections: Section[]
  clearFilters: () => void
  archiveCompletedTasks: () => void
}

export function TaskFilters({
  searchQuery,
  setSearchQuery,
  sectionFilter,
  setSectionFilter,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  visibilityFilter,
  setVisibilityFilter,
  groupBy,
  setGroupBy,
  sections,
  clearFilters,
  archiveCompletedTasks,
}: TaskFiltersProps) {
  return (
    <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_auto_auto]">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks"
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
        />

        <select
          value={sectionFilter}
          onChange={(event) => setSectionFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          <option value="all" className="bg-[#181b1f] text-white">
            All sections
          </option>
          {sections.map((section) => (
            <option key={section.id} value={section.id} className="bg-[#181b1f] text-white">
              {section.name}
            </option>
          ))}
        </select>

        <select
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as 'status' | 'priority' | 'scope')}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          <option value="status" className="bg-[#181b1f] text-white">
            Group by status
          </option>
          <option value="priority" className="bg-[#181b1f] text-white">
            Group by priority
          </option>
          <option value="scope" className="bg-[#181b1f] text-white">
            Group by scope
          </option>
        </select>

        <select
          value={visibilityFilter}
          onChange={(event) => setVisibilityFilter(event.target.value as 'active' | 'archived' | 'all')}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          <option value="active" className="bg-[#181b1f] text-white">
            Active tasks
          </option>
          <option value="archived" className="bg-[#181b1f] text-white">
            Archived tasks
          </option>
          <option value="all" className="bg-[#181b1f] text-white">
            All tasks
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          <option value="all" className="bg-[#181b1f] text-white">
            All statuses
          </option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value} className="bg-[#181b1f] text-white">
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          <option value="all" className="bg-[#181b1f] text-white">
            All priorities
          </option>
          {priorityOptions.map((priority) => (
            <option key={priority.value} value={priority.value} className="bg-[#181b1f] text-white">
              {priority.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={archiveCompletedTasks}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-violet-300/40"
        >
          Archive done
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-violet-300/40"
        >
          Clear filters
        </button>
      </div>
    </div>
  )
}
