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

const controlClass =
  'h-9 rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10'

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
    <section className="mb-4 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks..."
          className={`${controlClass} min-w-[220px] flex-1`}
        />

        <select value={groupBy} onChange={(event) => setGroupBy(event.target.value as 'status' | 'priority' | 'scope')} className={controlClass}>
          <option value="status">Group by status</option>
          <option value="priority">Group by priority</option>
          <option value="scope">Group by scope</option>
        </select>

        <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as 'active' | 'archived' | 'all')} className={controlClass}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>

        <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className={controlClass}>
          <option value="all">All sections</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>{section.name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={controlClass}>
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={controlClass}>
          <option value="all">All priorities</option>
          {priorityOptions.map((priority) => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={archiveCompletedTasks}
          className="h-9 rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 text-sm font-semibold text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-muted)]"
        >
          Archive done
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="h-9 rounded-lg bg-[var(--text-primary)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Clear
        </button>
      </div>
    </section>
  )
}
