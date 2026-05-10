import { FormEvent, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  position: number | null
}

const statusOptions = [
  { value: 'not_started', label: 'Not started' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'approval_requested', label: 'Approval requested' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'stalled_internal', label: 'Stalled - Internal' },
  { value: 'stalled_external', label: 'Stalled - External' },
  { value: 'done', label: 'Done' },
]

const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'need_to_scope', label: 'Need to Scope' },
]

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [updatingPriorityTaskId, setUpdatingPriorityTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')

  async function loadProjectAndTasks() {
    setErrorMessage(null)
    setIsLoading(true)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', 'Finito Build')
      .single()

    if (projectError) {
      setErrorMessage(projectError.message)
      setIsLoading(false)
      return
    }

    setProjectId(project.id)

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, position')
      .eq('project_id', project.id)
      .order('position', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setTasks(data ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadProjectAndTasks()
  }, [])

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!taskTitle.trim()) {
      setErrorMessage('Task title is required.')
      return
    }

    if (!projectId) {
      setErrorMessage('Project not loaded yet. Refresh and try again.')
      return
    }

    setIsCreating(true)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').insert({
      project_id: projectId,
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      status: 'not_started',
      priority: taskPriority,
      position: tasks.length + 1,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsCreating(false)
      return
    }

    setTaskTitle('')
    setTaskDescription('')
    setTaskPriority('medium')
    setIsCreating(false)
    await loadProjectAndTasks()
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setUpdatingTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    )
    setUpdatingTaskId(null)
  }

  async function updateTaskPriority(taskId: string, priority: string) {
    setUpdatingPriorityTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingPriorityTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, priority } : task,
      ),
    )
    setUpdatingPriorityTaskId(null)
  }

  async function deleteTask(taskId: string) {
    const shouldDelete = window.confirm('Delete this task? This cannot be undone.')

    if (!shouldDelete) {
      return
    }

    setDeletingTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setDeletingTaskId(null)
      return
    }

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    setDeletingTaskId(null)
  }

  return (
    <main className="min-h-screen bg-[#111315] px-6 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.28em] text-violet-300">
              Finito
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Project command centre
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              A calm, clean task system for projects, blockers and progress without the corporate migraine.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            <span className="text-zinc-500">Workspace</span>
            <div className="font-medium text-white">Lorem Ipsum Creative</div>
          </div>
        </div>

        <form
          onSubmit={createTask}
          className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/20"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Create task</h2>
            <p className="text-sm text-zinc-400">Add a new task directly into Supabase.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_1.6fr_0.8fr_auto]">
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

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-2xl bg-violet-300 px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold">Finito Build</h2>
              <p className="text-sm text-zinc-400">Starter tasks pulled from Supabase.</p>
            </div>
            <span className="rounded-full bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-200">
              {tasks.length} tasks
            </span>
          </div>

          {isLoading && <p className="py-8 text-zinc-400">Loading tasks…</p>}

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && (
            <div className="space-y-3">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-white/10 bg-[#181b1f] p-5 transition hover:border-violet-300/40 hover:bg-[#1d2026]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-violet-300/40">
                        <span className="text-zinc-500">Status</span>
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                          className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value} className="bg-[#181b1f] text-white">
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {task.priority && (
                        <label className="flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:border-violet-300/40">
                          <span className="text-violet-200/60">Priority</span>
                          <select
                            aria-label={`Priority for ${task.title}`}
                            value={task.priority}
                            disabled={updatingPriorityTaskId === task.id}
                            onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                            className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-violet-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {priorityOptions.map((priority) => (
                              <option key={priority.value} value={priority.value} className="bg-[#181b1f] text-white">
                                {priority.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <button
                        type="button"
                        disabled={deletingTaskId === task.id}
                        onClick={() => deleteTask(task.id)}
                        className="rounded-full border border-red-300/10 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-300/40 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingTaskId === task.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
