import { useEffect, useState } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, priority, position')
        .order('position', { ascending: true })

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setTasks(data ?? [])
      setIsLoading(false)
    }

    loadTasks()
  }, [])

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
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
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
