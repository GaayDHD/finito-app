import type { FormEvent } from 'react'
import type { Section } from '../types'
import { difficultyOptions, priorityOptions } from '../constants'

type CreateTaskFormProps = {
  taskTitle: string
  setTaskTitle: (value: string) => void
  taskDescription: string
  setTaskDescription: (value: string) => void
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
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
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
  return (
    <details className="mb-4 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
        + New task
      </summary>

      <form onSubmit={createTask} className="border-t border-[var(--outline-soft)] p-4">
        <div className="grid gap-2 lg:grid-cols-[1.1fr_1.4fr_0.8fr_0.8fr]">
          <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className={inputClass} />
          <input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description" className={inputClass} />

          <select value={taskSectionId || fallbackSectionId} onChange={(event) => setTaskSectionId(event.target.value)} className={inputClass}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>

          <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className={inputClass}>
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 lg:grid-cols-[0.8fr_0.8fr_0.8fr_auto]">
          <select value={taskDifficulty} onChange={(event) => setTaskDifficulty(event.target.value)} className={inputClass}>
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
            ))}
          </select>

          <input type="date" value={taskStartDate} onChange={(event) => setTaskStartDate(event.target.value)} className={inputClass} />
          <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className={inputClass} />

          <button
            type="submit"
            disabled={isCreating}
            className="h-10 rounded-lg bg-[var(--primary-main)] px-4 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)]"
          >
            {isCreating ? 'Adding...' : 'Add task'}
          </button>
        </div>
      </form>
    </details>
  )
}
