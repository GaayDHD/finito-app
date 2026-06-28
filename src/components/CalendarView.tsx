import { useState } from 'react'
import type { Task } from '../types'
import { statusDotClass, SubtaskProgress } from './ui'

type CalendarViewProps = {
  tasks: Task[]
  getSubtasks: (taskId: string) => Task[]
  selectedTaskId: string | null
  onOpenTask: (taskId: string) => void
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function chipTone(task: Task, day: Date, today: Date) {
  // Overdue (not done) always reads red; otherwise a calm neutral chip with a
  // status dot carrying the colour, matching the other views.
  if (task.status !== 'done' && day < today) {
    return 'bg-[var(--error-light)] text-[var(--error-dark)]'
  }
  if (task.status === 'done') {
    return 'bg-[var(--success-light)] text-[var(--success-dark)]'
  }
  return 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

export function CalendarView({ tasks, getSubtasks, selectedTaskId, onOpenTask }: CalendarViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()

  const gridStart = new Date(year, month, 1)
  gridStart.setDate(1 - gridStart.getDay())

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })

  const datedTasks = tasks.filter((task) => task.due_date)
  const unscheduled = tasks.filter((task) => !task.due_date)

  function tasksForDay(day: Date) {
    return datedTasks.filter((task) => task.due_date && sameDay(parseDate(task.due_date), day))
  }

  function goToToday() {
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline-soft)] px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            {monthNames[month]} {year}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Tasks shown on their due date.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="h-8 w-8 rounded-full border border-[var(--outline)] text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="h-8 rounded-full border border-[var(--outline)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="h-8 w-8 rounded-full border border-[var(--outline)] text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[var(--outline-soft)] bg-[var(--surface-muted)]">
        {weekdays.map((weekday) => (
          <div key={weekday} className="px-2 py-2 text-center text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const inMonth = day.getMonth() === month
          const isToday = sameDay(day, today)
          const dayTasks = tasksForDay(day)

          return (
            <div
              key={index}
              className={`min-h-[104px] border-b border-r border-[var(--outline-soft)] p-1.5 ${
                inMonth ? 'bg-[var(--background-paper)]' : 'bg-[var(--surface-muted)]'
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-[var(--primary-main)] text-white'
                      : inMonth
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-disabled)]'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const subtasks = getSubtasks(task.id)
                  const done = subtasks.filter((subtask) => subtask.status === 'done').length

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className={`block w-full rounded-md px-1.5 py-1 text-left transition ${chipTone(task, day, today)} ${
                        selectedTaskId === task.id ? 'ring-2 ring-[var(--primary-main)]/40' : ''
                      }`}
                      title={task.title}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(task.status)}`} />
                        <span className="truncate text-[11px] font-medium">{task.title}</span>
                      </span>
                      {subtasks.length > 0 && (
                        <span className="mt-1 block">
                          <SubtaskProgress done={done} total={subtasks.length} />
                        </span>
                      )}
                    </button>
                  )
                })}
                {dayTasks.length > 3 && (
                  <p className="px-1.5 text-[10px] font-semibold text-[var(--text-muted)]">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="border-t border-[var(--outline-soft)] px-4 py-3">
          <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            No due date ({unscheduled.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task.id)}
                className={`flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] ${
                  selectedTaskId === task.id ? 'ring-2 ring-[var(--primary-main)]/40' : ''
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(task.status)}`} />
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
