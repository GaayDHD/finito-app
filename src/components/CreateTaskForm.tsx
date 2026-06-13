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

  return (
    <form
      onSubmit={createTask}
      className="mb-4 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">New task</h2>
          <p className="text-xs text-[var(--text-muted)]">Create a task in the current project.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
        >
          Close
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className={inputClass} />
        <input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description" className={inputClass} />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)} className={inputClass}>
          <option value="">Status</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className={inputClass}>
          <option value="">Priority</option>
          {priorityOptions.map((priority) => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>

        <select value={taskDifficulty} onChange={(event) => setTaskDifficulty(event.target.value)} className={inputClass}>
          <option value="">Scope</option>
          {difficultyOptions.map((difficulty) => (
            <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
          ))}
        </select>

        <select value={taskSectionId || fallbackSectionId} onChange={(event) => setTaskSectionId(event.target.value)} className={inputClass}>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>{section.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
          Start date
          <input type="date" value={taskStartDate} onChange={(event) => setTaskStartDate(event.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
          Due date
          <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className={inputClass} />
        </label>

        <button
          type="submit"
          disabled={isCreating}
          className="h-10 self-end rounded-lg bg-[var(--primary-main)] px-4 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)]"
        >
          {isCreating ? 'Adding...' : 'Create task'}
        </button>
      </div>
    </form>
  )
}
