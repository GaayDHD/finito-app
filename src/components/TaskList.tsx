import type { ReactNode } from 'react'
import type { Section, Task } from '../types'
import { difficultyOptions, priorityOptions, statusOptions } from '../constants'
import { formatDate, getLabel } from '../utils'

type TaskGroup = {
  id: string
  name: string
  tasks: Task[]
}

type TaskListProps = {
  viewMode: 'card' | 'table'
  groupedTasks: TaskGroup[]
  filteredTaskCount: number
  isLoading: boolean
  errorMessage: string | null
  sections: Section[]
  updatingStatusTaskId: string | null
  updatingPriorityTaskId: string | null
  updateTaskStatus: (taskId: string, status: string) => void
  updateTaskPriority: (taskId: string, priority: string) => void
  getTaskComments: (taskId: string) => unknown[]
  getSubtasks: (taskId: string) => Task[]
  renderTask: (task: Task) => ReactNode
}

function getStatusTone(status: string) {
  if (status === 'done') {
    return 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
  }

  if (status === 'blocked' || status.startsWith('stalled')) {
    return 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
  }

  if (status === 'awaiting_response' || status === 'approval_requested') {
    return 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
  }

  if (status === 'in_progress' || status === 'planning') {
    return 'border-[var(--info-main)]/25 bg-[var(--info-light)] text-[var(--info-dark)]'
  }

  return 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

function getPriorityTone(priority: string | null) {
  if (priority === 'critical' || priority === 'overdue') {
    return 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
  }

  if (priority === 'high') {
    return 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
  }

  if (priority === 'medium') {
    return 'border-[var(--primary-main)]/25 bg-[var(--primary-light)] text-[var(--primary-dark)]'
  }

  if (priority === 'low') {
    return 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
  }

  return 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

export function TaskList({
  viewMode,
  groupedTasks,
  filteredTaskCount,
  isLoading,
  errorMessage,
  sections,
  updatingStatusTaskId,
  updatingPriorityTaskId,
  updateTaskStatus,
  updateTaskPriority,
  getTaskComments,
  getSubtasks,
  renderTask,
}: TaskListProps) {
  const isTable = viewMode === 'table'

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--outline-soft)] px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {isTable ? 'Table view' : 'List view'}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {isTable
              ? 'Compact rows grouped by the current view.'
              : 'Tasks grouped by the current view.'}
          </p>
        </div>
        <span className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-semibold text-[var(--primary-main)]">
          {filteredTaskCount} visible
        </span>
      </div>

      {isLoading && <p className="px-4 py-8 text-sm text-[var(--text-muted)]">Loading tasks...</p>}

      {errorMessage && (
        <div className="m-4 rounded-lg border border-[var(--error-main)]/25 bg-[var(--error-light)] p-3 text-sm text-[var(--error-dark)]">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'card' && (
        <div>
          {groupedTasks.map((group) => (
            <section key={group.id} className="border-b border-[var(--outline-soft)] last:border-b-0">
              <div className="flex items-center justify-between bg-[var(--surface-muted)] px-4 py-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {group.name}
                </h3>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {group.tasks.length} tasks
                </span>
              </div>

              {group.tasks.length > 0 ? (
                <div className="divide-y divide-[var(--outline-soft)]">
                  {group.tasks.map((task) => renderTask(task))}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-[var(--text-muted)]">
                  No matching tasks in this group.
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'table' && (
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[minmax(320px,1.8fr)_150px_140px_140px_150px_120px_120px_90px_90px] border-b border-[var(--outline-soft)] bg-[var(--surface-muted)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <div>Task</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Scope</div>
              <div>Section</div>
              <div>Start</div>
              <div>Due</div>
              <div>Comments</div>
              <div>Subtasks</div>
            </div>

            {groupedTasks.map((group) => (
              <section key={group.id} className="border-b border-[var(--outline-soft)] last:border-b-0">
                <div className="flex items-center justify-between bg-[var(--surface-subtle)] px-4 py-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {group.name}
                  </h3>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {group.tasks.length} tasks
                  </span>
                </div>

                {group.tasks.length > 0 ? (
                  <div className="divide-y divide-[var(--outline-soft)]">
                    {group.tasks.map((task) => {
                      const section = sections.find((currentSection) => currentSection.id === task.section_id)
                      const comments = getTaskComments(task.id)
                      const subtasks = getSubtasks(task.id)
                      const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'done').length

                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-[minmax(320px,1.8fr)_150px_140px_140px_150px_120px_120px_90px_90px] items-center gap-0 px-4 py-2 text-sm transition hover:bg-[var(--surface-muted)]"
                        >
                          <div className="min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary-main)]" />
                              <p className="truncate font-medium text-[var(--text-primary)]">{task.title}</p>
                            </div>
                            {task.description && (
                              <p className="mt-0.5 truncate pl-4 text-xs text-[var(--text-muted)]">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div>
                            <select
                              value={task.status}
                              disabled={updatingStatusTaskId === task.id}
                              onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                              className={`h-7 max-w-[130px] rounded-full border px-2 text-xs font-semibold outline-none ${getStatusTone(task.status)}`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <select
                              value={task.priority ?? ''}
                              disabled={updatingPriorityTaskId === task.id}
                              onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                              className={`h-7 max-w-[120px] rounded-full border px-2 text-xs font-semibold outline-none ${getPriorityTone(task.priority)}`}
                            >
                              <option value="">No priority</option>
                              {priorityOptions.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="truncate text-xs text-[var(--text-secondary)]">
                            {getLabel(difficultyOptions, task.difficulty)}
                          </div>

                          <div className="truncate text-xs text-[var(--text-secondary)]">
                            {section?.name ?? 'No section'}
                          </div>

                          <div className="text-xs text-[var(--text-muted)]">
                            {formatDate(task.start_date)}
                          </div>

                          <div className="text-xs text-[var(--text-muted)]">
                            {formatDate(task.due_date)}
                          </div>

                          <div className="text-xs font-medium text-[var(--text-secondary)]">
                            {comments.length}
                          </div>

                          <div className="text-xs font-medium text-[var(--text-secondary)]">
                            {completedSubtasks}/{subtasks.length}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-sm text-[var(--text-muted)]">
                    No matching tasks in this group.
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
