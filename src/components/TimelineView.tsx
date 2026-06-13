import type { Task } from '../types'

type TimelineViewProps = {
  tasks: Task[]
  selectedTaskId: string | null
  onOpenTask: (taskId: string) => void
}

const DAY_MS = 24 * 60 * 60 * 1000

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function formatTick(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short' }).format(date)
}

function barTone(task: Task, end: Date, today: Date) {
  if (task.status === 'done') {
    return 'bg-[var(--success-main)]'
  }
  if (end < today) {
    return 'bg-[var(--error-main)]'
  }
  if (task.status === 'blocked' || task.status.startsWith('stalled')) {
    return 'bg-[var(--error-main)]'
  }
  return 'bg-[var(--primary-main)]'
}

export function TimelineView({ tasks, selectedTaskId, onOpenTask }: TimelineViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dated = tasks
    .map((task) => {
      const startRaw = task.start_date ?? task.due_date
      const endRaw = task.due_date ?? task.start_date
      if (!startRaw || !endRaw) {
        return null
      }
      let start = parseDate(startRaw)
      let end = parseDate(endRaw)
      if (end < start) {
        ;[start, end] = [end, start]
      }
      return { task, start, end }
    })
    .filter((item): item is { task: Task; start: Date; end: Date } => item !== null)

  const undated = tasks.filter((task) => !task.start_date && !task.due_date)

  if (dated.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-4 py-10 text-center shadow-sm">
        <p className="text-sm text-[var(--text-muted)]">No tasks with start or due dates to place on the timeline.</p>
      </section>
    )
  }

  let min = dated[0].start.getTime()
  let max = dated[0].end.getTime()
  for (const item of dated) {
    min = Math.min(min, item.start.getTime())
    max = Math.max(max, item.end.getTime())
  }
  // Pad the range by a day on each side so edge bars are readable.
  min -= DAY_MS
  max += DAY_MS
  const range = Math.max(max - min, DAY_MS)

  const tickCount = 6
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const time = min + (range * index) / tickCount
    return { left: (index / tickCount) * 100, date: new Date(time) }
  })

  const todayLeft = ((today.getTime() - min) / range) * 100
  const showToday = todayLeft >= 0 && todayLeft <= 100

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="border-b border-[var(--outline-soft)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Timeline</h2>
        <p className="text-xs text-[var(--text-muted)]">Tasks spanning their start and due dates.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Axis */}
          <div className="grid grid-cols-[200px_1fr] border-b border-[var(--outline-soft)] bg-[var(--surface-muted)]">
            <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Task</div>
            <div className="relative h-8">
              {ticks.map((tick, index) => (
                <div
                  key={index}
                  className="absolute top-0 flex h-full -translate-x-1/2 items-center text-[10px] font-medium text-[var(--text-muted)]"
                  style={{ left: `${tick.left}%` }}
                >
                  {formatTick(tick.date)}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {showToday && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[var(--primary-main)]/60"
                style={{ left: `calc(200px + (100% - 200px) * ${todayLeft / 100})` }}
              />
            )}

            {dated.map(({ task, start, end }) => {
              const left = ((start.getTime() - min) / range) * 100
              const width = Math.max(((end.getTime() - start.getTime()) / range) * 100, 1.5)

              return (
                <div key={task.id} className="grid grid-cols-[200px_1fr] items-center border-b border-[var(--outline-soft)]">
                  <div className="truncate px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]" title={task.title}>
                    {task.title}
                  </div>
                  <div className="relative h-9">
                    <button
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className={`absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-full px-2 text-[10px] font-semibold text-white transition hover:opacity-90 ${barTone(task, end, today)} ${
                        selectedTaskId === task.id ? 'ring-2 ring-[var(--primary-main)]/40' : ''
                      }`}
                      style={{ left: `${left}%`, width: `${width}%`, minWidth: '24px' }}
                      title={`${task.title} · ${formatTick(start)} → ${formatTick(end)}`}
                    >
                      <span className="truncate">{formatTick(start)} → {formatTick(end)}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {undated.length > 0 && (
        <div className="border-t border-[var(--outline-soft)] px-4 py-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            No dates ({undated.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task.id)}
                className={`rounded-full border border-[var(--outline)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] ${
                  selectedTaskId === task.id ? 'ring-2 ring-[var(--primary-main)]/40' : ''
                }`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
