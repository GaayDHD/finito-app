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
    <form
      onSubmit={createTask}
      className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Create task</h2>
        <p className="text-sm text-zinc-400">Add a new task directly into a project section.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.1fr_1.4fr_0.8fr_0.8fr]">
        <input
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="Task title"
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
        />

        <input
          value={taskDescription}
          onChange={(event) => setTaskDescription(event.target.value)}
          placeholder="Description"
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
        />

        <select
          value={taskSectionId || fallbackSectionId}
          onChange={(event) => setTaskSectionId(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id} className="bg-[#181b1f] text-white">
              {section.name}
            </option>
          ))}
        </select>

        <select
          value={taskPriority}
          onChange={(event) => setTaskPriority(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          {priorityOptions.map((priority) => (
            <option key={priority.value} value={priority.value} className="bg-[#181b1f] text-white">
              {priority.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_0.8fr_0.8fr_auto]">
        <select
          value={taskDifficulty}
          onChange={(event) => setTaskDifficulty(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        >
          {difficultyOptions.map((difficulty) => (
            <option key={difficulty.value} value={difficulty.value} className="bg-[#181b1f] text-white">
              {difficulty.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={taskStartDate}
          onChange={(event) => setTaskStartDate(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        />

        <input
          type="date"
          value={taskDueDate}
          onChange={(event) => setTaskDueDate(event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
        />

        <button
          type="submit"
          disabled={isCreating}
          className="rounded-2xl bg-violet-300 px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? 'Adding…' : 'Add task'}
        </button>
      </div>
    </form>
  )
}
