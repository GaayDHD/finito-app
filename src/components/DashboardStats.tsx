import { useState } from 'react'
import { Badge, Button } from './ui'

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
  { key: 'total', label: 'Total', tone: 'neutral', dot: false },
  { key: 'visible', label: 'Visible', tone: 'primary', dot: false },
  { key: 'done', label: 'Done', tone: 'success', dot: true },
  { key: 'blocked', label: 'Blocked', tone: 'error', dot: true },
  { key: 'overdue', label: 'Overdue', tone: 'warning', dot: true },
  { key: 'archived', label: 'Archived', tone: 'neutral', dot: true },
] as const

export function DashboardStats({ stats, onNewTaskClick }: DashboardStatsProps) {
  const [pinned, setPinned] = useState(false)

  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div
        className="group relative"
        onMouseLeave={() => setPinned(false)}
      >
        <Button variant="secondary" onClick={() => setPinned((value) => !value)}>
          Task Overview
        </Button>

        <div
          className={`absolute left-0 top-12 z-20 w-72 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-2 shadow-xl transition ${
            pinned
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100'
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {statItems.map((item) => {
              const value = item.key === 'archived' ? stats.archived ?? 0 : stats[item.key]

              return (
                <Badge key={item.key} tone={item.tone} dot={item.dot} className="uppercase tracking-[0.04em]">
                  {value} {item.label}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

      <Button variant="primary" icon="add" className="shrink-0" onClick={onNewTaskClick}>
        New Task
      </Button>
    </section>
  )
}
