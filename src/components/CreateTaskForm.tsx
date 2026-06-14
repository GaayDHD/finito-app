import type { FormEvent } from 'react'
import type { Section } from '../types'
import { difficultyOptions, priorityOptions, statusOptions } from '../constants'

type CreateTaskFormProps = {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  taskTitle: string
  setTaskTitle: (value: string) => void
  taskDescription: string
  setTaskDescription: (value: string) => void
  taskStatus: string
  setTaskStatus: (value: string) => void
  taskSectionId: string
  setTaskSectionId: (value: string) => void
  fallbackSectionId: string
  taskPriority: string
  setTaskPriority: (value: string) => void
  taskDifficulty: string
  setTaskDifficulty: (value: string) => void
  taskStartDate: string
  setTaskStartDate: (value: string) => void
  taskDueDate: string
  setTaskDueDate: (value: string) => void
  sections: Section[]
  isCreating: boolean
  createTask: (event: FormEvent<HTMLFormElement>) => void
}

const inputClass =
  'h-10 rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10'

export function CreateTaskForm({
  isOpen,
  setIsOpen,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskStatus,
  setTaskStatus,
  taskSectionId,
  setTaskSectionId,
  fallbackSectionId,
  taskPriority,
  setTaskPriority,
  taskDifficulty,
  setTaskDifficulty,
  taskStartDate,
  setTaskStartDate,
  taskDueDate,
  setTaskDueDate,
  sections,
  isCreating,
  createTask,
}: CreateTaskFormProps) {
  if (!isOpen) {
    return null
  }

  const fieldLabel = 'flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

      <form
        onSubmit={createTask}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[var(--background-paper)] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--outline-soft)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">New task</h2>
            <p className="text-sm text-[var(--text-muted)]">Create a task in the current project.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="shrink-0 rounded-full border border-[var(--outline)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className={fieldLabel}>
            Title
            <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" autoFocus className={inputClass} />
          </label>

          <label className={fieldLabel}>
            Description
            <input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description" className={inputClass} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={fieldLabel}>
              Status
              <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)} className={inputClass}>
                <option value="">Status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>

            <label className={fieldLabel}>
              Priority
              <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className={inputClass}>
                <option value="">Priority</option>
                {priorityOptions.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </label>

            <label className={fieldLabel}>
              Scope
              <select value={taskDifficulty} onChange={(event) => setTaskDifficulty(event.target.value)} className={inputClass}>
                <option value="">Scope</option>
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
                ))}
              </select>
            </label>

            <label className={fieldLabel}>
              Section
              <select value={taskSectionId || fallbackSectionId} onChange={(event) => setTaskSectionId(event.target.value)} className={inputClass}>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </label>

            <label className={fieldLabel}>
              Start date
              <input type="date" value={taskStartDate} onChange={(event) => setTaskStartDate(event.target.value)} className={inputClass} />
            </label>

            <label className={fieldLabel}>
              Due date
              <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className={inputClass} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--outline-soft)] px-6 py-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-[var(--outline)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-full bg-[var(--primary-main)] px-5 py-2 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Adding...' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  )
}
