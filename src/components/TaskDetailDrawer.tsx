import { useEffect } from 'react'
import type { Section, Task, TaskComment, TaskDependency } from '../types'
import { difficultyOptions, priorityOptions } from '../constants'
import { formatDate, getLabel } from '../utils'
import { StatusOptions, SubtaskProgress } from './ui'

type DependencyLink = {
  dependency: TaskDependency
  task: Task | undefined
}

type TaskDetailDrawerProps = {
  selectedTask: Task
  onClose: () => void
  sections: Section[]
  updatingStatusTaskId: string | null
  updateTaskStatus: (taskId: string, status: string) => void
  updatingPriorityTaskId: string | null
  updateTaskPriority: (taskId: string, priority: string) => void
  updatingSectionTaskId: string | null
  updateTaskSection: (taskId: string, sectionId: string) => void
  getSubtasks: (taskId: string) => Task[]
  deletingTaskId: string | null
  deleteTask: (taskId: string) => void
  subtaskDrafts: Record<string, string>
  setSubtaskDrafts: (value: React.SetStateAction<Record<string, string>>) => void
  creatingSubtaskTaskId: string | null
  createSubtask: (parentTask: Task) => void
  getTaskComments: (taskId: string) => TaskComment[]
  commentDrafts: Record<string, string>
  setCommentDrafts: (value: React.SetStateAction<Record<string, string>>) => void
  addingCommentTaskId: string | null
  addComment: (taskId: string) => void
  deletingCommentId: string | null
  deleteComment: (commentId: string) => void
  getBlockingTasks: (taskId: string) => DependencyLink[]
  getBlockedTasks: (taskId: string) => DependencyLink[]
  removingDependencyId: string | null
  removeTaskDependency: (dependencyId: string) => void
  addingDependencyTaskId: string | null
  addTaskDependency: (taskId: string, dependsOnTaskId: string) => void
  selectedTaskAvailableBlockers: Task[]
  selectedTaskCanMoveUp: boolean
  selectedTaskCanMoveDown: boolean
  editingTaskId: string | null
  editTitle: string
  setEditTitle: (value: string) => void
  editDescription: string
  setEditDescription: (value: string) => void
  editDifficulty: string
  setEditDifficulty: (value: string) => void
  editStartDate: string
  setEditStartDate: (value: string) => void
  editDueDate: string
  setEditDueDate: (value: string) => void
  savingTaskId: string | null
  saveTaskEdits: (taskId: string) => void
  cancelEditingTask: () => void
  startEditingTask: (task: Task) => void
  quickSetTaskDone: (task: Task) => void
  quickReopenTask: (task: Task) => void
  duplicatingTaskId: string | null
  duplicateTask: (task: Task) => void
  movingTaskId: string | null
  moveTask: (taskId: string, direction: 'up' | 'down') => void
  archivingTaskId: string | null
  archiveTask: (task: Task) => void
  restoreTask: (task: Task) => void
}

export function TaskDetailDrawer({
  selectedTask,
  onClose,
  sections,
  updatingStatusTaskId,
  updateTaskStatus,
  updatingPriorityTaskId,
  updateTaskPriority,
  updatingSectionTaskId,
  updateTaskSection,
  getSubtasks,
  deletingTaskId,
  deleteTask,
  subtaskDrafts,
  setSubtaskDrafts,
  creatingSubtaskTaskId,
  createSubtask,
  getTaskComments,
  commentDrafts,
  setCommentDrafts,
  addingCommentTaskId,
  addComment,
  deletingCommentId,
  deleteComment,
  getBlockingTasks,
  getBlockedTasks,
  removingDependencyId,
  removeTaskDependency,
  addingDependencyTaskId,
  addTaskDependency,
  selectedTaskAvailableBlockers,
  selectedTaskCanMoveUp,
  selectedTaskCanMoveDown,
  editingTaskId,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editDifficulty,
  setEditDifficulty,
  editStartDate,
  setEditStartDate,
  editDueDate,
  setEditDueDate,
  savingTaskId,
  saveTaskEdits,
  cancelEditingTask,
  startEditingTask,
  quickSetTaskDone,
  quickReopenTask,
  duplicatingTaskId,
  duplicateTask,
  movingTaskId,
  moveTask,
  archivingTaskId,
  archiveTask,
  restoreTask,
}: TaskDetailDrawerProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--outline-soft)] px-6 py-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Task details</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{selectedTask.title}</h2>
          {selectedTask.description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{selectedTask.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onClose()}
          className="rounded-full border border-[var(--outline-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</p>
            <select
              aria-label={`Status for ${selectedTask.title}`}
              value={selectedTask.status}
              disabled={updatingStatusTaskId === selectedTask.id}
              onChange={(event) => updateTaskStatus(selectedTask.id, event.target.value)}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--background-paper)] px-2 py-1.5 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <StatusOptions />
            </select>
          </div>
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Priority</p>
            <select
              aria-label={`Priority for ${selectedTask.title}`}
              value={selectedTask.priority ?? ''}
              disabled={updatingPriorityTaskId === selectedTask.id}
              onChange={(event) => updateTaskPriority(selectedTask.id, event.target.value)}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--background-paper)] px-2 py-1.5 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">No priority</option>
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Start</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatDate(selectedTask.start_date)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Due</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{formatDate(selectedTask.due_date)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Section</p>
            <select
              aria-label={`Section for ${selectedTask.title}`}
              value={selectedTask.section_id ?? ''}
              disabled={updatingSectionTaskId === selectedTask.id}
              onChange={(event) => updateTaskSection(selectedTask.id, event.target.value)}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--background-paper)] px-2 py-1.5 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Subtasks</p>
            <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {getSubtasks(selectedTask.id).length}
            </span>
          </div>

          {getSubtasks(selectedTask.id).length > 0 && (
            <SubtaskProgress
              done={getSubtasks(selectedTask.id).filter((subtask) => subtask.status === 'done').length}
              total={getSubtasks(selectedTask.id).length}
              className="mt-3"
            />
          )}

          {getSubtasks(selectedTask.id).length > 0 ? (
            <div className="mt-3 space-y-2">
              {getSubtasks(selectedTask.id).map((subtask) => (
                <div key={subtask.id} className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{subtask.title}</p>
                    <button
                      type="button"
                      disabled={deletingTaskId === subtask.id}
                      onClick={() => deleteTask(subtask.id)}
                      className="shrink-0 text-xs font-semibold text-[var(--error-dark)]/70 transition hover:text-[var(--error-dark)] disabled:opacity-65"
                    >
                      {deletingTaskId === subtask.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      aria-label={`Status for ${subtask.title}`}
                      value={subtask.status}
                      disabled={updatingStatusTaskId === subtask.id}
                      onChange={(event) => updateTaskStatus(subtask.id, event.target.value)}
                      className="cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--background-paper)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <StatusOptions />
                    </select>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {subtask.priority ? getLabel(priorityOptions, subtask.priority) : 'No priority'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No subtasks yet.</p>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={subtaskDrafts[selectedTask.id] ?? ''}
              onChange={(event) =>
                setSubtaskDrafts((currentDrafts) => ({
                  ...currentDrafts,
                  [selectedTask.id]: event.target.value,
                }))
              }
              placeholder="Add a subtask"
              className="min-w-0 flex-1 rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            />
            <button
              type="button"
              disabled={creatingSubtaskTaskId === selectedTask.id || !(subtaskDrafts[selectedTask.id] ?? '').trim()}
              onClick={() => createSubtask(selectedTask)}
              className="shrink-0 rounded-lg bg-[var(--primary-main)] px-3 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingSubtaskTaskId === selectedTask.id ? 'Adding…' : 'Add subtask'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Comments</p>
            <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {getTaskComments(selectedTask.id).length}
            </span>
          </div>

          {getTaskComments(selectedTask.id).length > 0 ? (
            <div className="mt-3 space-y-2">
              {getTaskComments(selectedTask.id).map((comment) => (
                <div key={comment.id} className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{comment.body}</p>
                    <button
                      type="button"
                      disabled={deletingCommentId === comment.id}
                      onClick={() => deleteComment(comment.id)}
                      className="shrink-0 text-xs font-semibold text-[var(--error-dark)]/70 transition hover:text-[var(--error-dark)] disabled:opacity-65"
                    >
                      {deletingCommentId === comment.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {comment.created_at
                      ? new Intl.DateTimeFormat('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(comment.created_at))
                      : 'No date'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No comments yet.</p>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={commentDrafts[selectedTask.id] ?? ''}
              onChange={(event) =>
                setCommentDrafts((currentDrafts) => ({
                  ...currentDrafts,
                  [selectedTask.id]: event.target.value,
                }))
              }
              placeholder="Add a comment"
              className="min-w-0 flex-1 rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            />
            <button
              type="button"
              disabled={addingCommentTaskId === selectedTask.id}
              onClick={() => addComment(selectedTask.id)}
              className="shrink-0 rounded-lg bg-[var(--primary-main)] px-3 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addingCommentTaskId === selectedTask.id ? 'Adding…' : 'Comment'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Blocked by</p>
            <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {getBlockingTasks(selectedTask.id).length}
            </span>
          </div>

          {getBlockingTasks(selectedTask.id).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {getBlockingTasks(selectedTask.id).map(({ dependency, task: blockingTask }) => (
                <span
                  key={dependency.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-2.5 py-1 text-xs font-semibold text-[var(--error-dark)]"
                >
                  {blockingTask?.title ?? 'Unknown task'}
                  <button
                    type="button"
                    disabled={removingDependencyId === dependency.id}
                    onClick={() => removeTaskDependency(dependency.id)}
                    className="text-[var(--error-dark)]/70 transition hover:text-[var(--error-dark)] disabled:opacity-65"
                    aria-label={`Remove blocker ${blockingTask?.title ?? 'task'}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">This task is not blocked.</p>
          )}

          <select
            aria-label={`Add blocker for ${selectedTask.title}`}
            defaultValue=""
            disabled={addingDependencyTaskId === selectedTask.id || selectedTaskAvailableBlockers.length === 0}
            onChange={(event) => {
              addTaskDependency(selectedTask.id, event.target.value)
              event.currentTarget.value = ''
            }}
            className="mt-3 w-full cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {addingDependencyTaskId === selectedTask.id ? 'Adding blocker…' : 'Add blocker'}
            </option>
            {selectedTaskAvailableBlockers.map((candidateTask) => (
              <option key={candidateTask.id} value={candidateTask.id}>
                {candidateTask.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Blocks</p>
            <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {getBlockedTasks(selectedTask.id).length}
            </span>
          </div>

          {getBlockedTasks(selectedTask.id).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {getBlockedTasks(selectedTask.id).map(({ dependency, task: blockedTask }) => (
                <span
                  key={dependency.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-main)]"
                >
                  {blockedTask?.title ?? 'Unknown task'}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">This task does not block anything.</p>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Actions</p>

          {editingTaskId === selectedTask.id ? (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                Title
                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                Description
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Scope
                  <select
                    value={editDifficulty}
                    onChange={(event) => setEditDifficulty(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Start date
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(event) => setEditStartDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                  />
                </label>

                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Due date
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) => setEditDueDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={savingTaskId === selectedTask.id}
                  onClick={() => saveTaskEdits(selectedTask.id)}
                  className="rounded-full bg-[var(--primary-main)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
                >
                  {savingTaskId === selectedTask.id ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingTask}
                  className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => startEditingTask(selectedTask)}
                className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)]"
              >
                Edit details
              </button>

              {selectedTask.status === 'done' ? (
                <button
                  type="button"
                  onClick={() => quickReopenTask(selectedTask)}
                  className="rounded-full border border-[var(--warning-main)]/25 bg-[var(--warning-light)] px-4 py-2 text-sm font-semibold text-[var(--warning-dark)] transition hover:opacity-90"
                >
                  Reopen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => quickSetTaskDone(selectedTask)}
                  className="rounded-full border border-[var(--success-main)]/25 bg-[var(--success-light)] px-4 py-2 text-sm font-semibold text-[var(--success-dark)] transition hover:opacity-90"
                >
                  Mark done
                </button>
              )}

              <button
                type="button"
                disabled={duplicatingTaskId === selectedTask.id}
                onClick={() => duplicateTask(selectedTask)}
                className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] disabled:opacity-60"
              >
                {duplicatingTaskId === selectedTask.id ? 'Duplicating…' : 'Duplicate'}
              </button>

              <button
                type="button"
                disabled={!selectedTaskCanMoveUp || movingTaskId === selectedTask.id}
                onClick={() => moveTask(selectedTask.id, 'up')}
                className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Move up
              </button>

              <button
                type="button"
                disabled={!selectedTaskCanMoveDown || movingTaskId === selectedTask.id}
                onClick={() => moveTask(selectedTask.id, 'down')}
                className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Move down
              </button>

              {selectedTask.archived_at ? (
                <button
                  type="button"
                  disabled={archivingTaskId === selectedTask.id}
                  onClick={() => restoreTask(selectedTask)}
                  className="rounded-full border border-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-light)] disabled:opacity-60"
                >
                  {archivingTaskId === selectedTask.id ? 'Restoring...' : 'Restore'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={archivingTaskId === selectedTask.id}
                  onClick={() => archiveTask(selectedTask)}
                  className="rounded-full border border-[var(--outline-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] disabled:opacity-60"
                >
                  {archivingTaskId === selectedTask.id ? 'Archiving...' : 'Archive'}
                </button>
              )}

              <button
                type="button"
                disabled={deletingTaskId === selectedTask.id}
                onClick={() => deleteTask(selectedTask.id)}
                className="rounded-full border border-[var(--error-main)]/35 px-4 py-2 text-sm font-semibold text-[var(--error-dark)] transition hover:bg-[var(--error-light)] disabled:opacity-60"
              >
                {deletingTaskId === selectedTask.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
