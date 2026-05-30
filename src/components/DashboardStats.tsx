type DashboardStatsProps = {
  stats: {
    total: number
    visible: number
    done: number
    blocked: number
    overdue: number
    archived?: number
  }
}

const statItems = [
  { key: 'total', label: 'Total', tone: 'neutral' },
  { key: 'visible', label: 'Visible', tone: 'neutral' },
  { key: 'done', label: 'Done', tone: 'success' },
  { key: 'blocked', label: 'Blocked', tone: 'error' },
  { key: 'overdue', label: 'Overdue', tone: 'warning' },
  { key: 'archived', label: 'Archived', tone: 'neutral' },
] as const

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="mb-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => {
        const value = item.key === 'archived' ? stats.archived ?? 0 : stats[item.key]

        const toneClass =
          item.tone === 'success'
            ? 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
            : item.tone === 'error'
              ? 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
              : item.tone === 'warning'
                ? 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
                : 'border-[var(--outline-soft)] bg-[var(--background-paper)] text-[var(--text-primary)]'

        return (
          <div
            key={item.key}
            className={`rounded-xl border px-4 py-3 shadow-sm ${toneClass}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        )
      })}
    </section>
  )
}
