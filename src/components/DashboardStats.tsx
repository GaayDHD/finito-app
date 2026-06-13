import { useState } from 'react'

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
  const [pinned, setPinned] = useState(false)

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
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div
        className="group relative"
        onMouseLeave={() => setPinned(false)}
      >
        <button
          type="button"
          onClick={() => setPinned((value) => !value)}
          className="inline-flex h-10 items-center rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-muted)]"
        >
          Task Overview
        </button>

        <div
          className={`absolute left-0 top-12 z-20 w-72 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-2 shadow-xl transition ${
            pinned
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100'
          }`}
        >
          <div className="space-y-1">
            {statItems.map((item) => {
              const value = item.key === 'archived' ? stats.archived ?? 0 : stats[item.key]

              return (
                <div key={item.key} className="flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getToneClass(item.tone)}`}>{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewTaskClick}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--primary-main)] px-5 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm transition hover:bg-[var(--primary-dark)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Task
      </button>
    </section>
  )
}
