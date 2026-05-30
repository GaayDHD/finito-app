import type { ReactNode } from 'react'
import type { Task } from '../types'

type TaskGroup = {
  id: string
  name: string
  tasks: Task[]
}

type TaskListProps = {
  groupedTasks: TaskGroup[]
  filteredTaskCount: number
  isLoading: boolean
  errorMessage: string | null
  renderTask: (task: Task) => ReactNode
}

export function TaskList({
  groupedTasks,
  filteredTaskCount,
  isLoading,
  errorMessage,
  renderTask,
}: TaskListProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-semibold">Finito Build</h2>
          <p className="text-sm text-zinc-400">Tasks grouped by status, priority or scope.</p>
        </div>
        <span className="rounded-full bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-200">
          {filteredTaskCount} visible
        </span>
      </div>

      {isLoading && <p className="py-8 text-zinc-400">Loading tasks…</p>}

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <div className="space-y-6">
          {groupedTasks.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {group.name}
                </h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  {group.tasks.length} tasks
                </span>
              </div>

              {group.tasks.length > 0 ? (
                <div className="space-y-3">
                  {group.tasks.map((task) => renderTask(task))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-zinc-500">
                  No matching tasks in this group.
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
