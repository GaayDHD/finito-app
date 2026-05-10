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

const statusLabels: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
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
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">
                        {statusLabels[task.status] ?? task.status}
                      </span>
                      {task.priority && (
                        <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
                          {task.priority}
                        </span>
                      )}
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