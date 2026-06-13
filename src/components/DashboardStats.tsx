type DashboardStatsProps = {
  stats: {
    total: number
    visible: number
    done: number
    blocked: number
    overdue: number
    archived?: number
  }
  onNewTaskClick: () => void
}

const statItems = [
  { key: 'total', label: 'Total', tone: 'neutral' },
  { key: 'visible', label: 'Visible', tone: 'neutral' },
  { key: 'done', label: 'Done', tone: 'success' },
  { key: 'blocked', label: 'Blocked', tone: 'error' },
  { key: 'overdue', label: 'Overdue', tone: 'warning' },
  { key: 'archived', label: 'Archived', tone: 'neutral' },
] as const

export function DashboardStats({ stats, onNewTaskClick }: DashboardStatsProps) {
  const getToneClass = (tone: string) => {
    if (tone === 'success') {
      return 'bg-[var(--success-light)] text-[var(--success-dark)]'
    }

    if (tone === 'error') {
      return 'bg-[var(--error-light)] text-[var(--error-dark)]'
    }

    if (tone === 'warning') {
      return 'bg-[var(--warning-light)] text-[var(--warning-dark)]'
    }

    return 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
  }

  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Tasks</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {statItems.map((item) => {
            const value = item.key === 'archived' ? stats.archived ?? 0 : stats[item.key]

            return (
              <span
                key={item.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getToneClass(item.tone)}`}
              >
                {item.label}
                <span className="font-bold">{value}</span>
              </span>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onNewTaskClick}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Task
      </button>
    </section>
  )
}
