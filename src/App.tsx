import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  section_id: string | null
  position: number | null
}

type Section = {
  id: string
  name: string
  position: number | null
}

type TaskDependency = {
  id: string
  task_id: string
  depends_on_task_id: string
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
  const [sections, setSections] = useState<Section[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string | null>(null)
  const [updatingPriorityTaskId, setUpdatingPriorityTaskId] = useState<string | null>(null)
  const [updatingSectionTaskId, setUpdatingSectionTaskId] = useState<string | null>(null)
  const [addingDependencyTaskId, setAddingDependencyTaskId] = useState<string | null>(null)
  const [removingDependencyId, setRemovingDependencyId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskSectionId, setTaskSectionId] = useState('')

  const fallbackSectionId = sections[0]?.id ?? ''

  const tasksBySection = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      tasks: tasks.filter((task) => task.section_id === section.id),
    }))
  }, [sections, tasks])

  const unsectionedTasks = useMemo(() => {
    return tasks.filter((task) => !task.section_id)
  }, [tasks])

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

    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('id, name, position')
      .eq('project_id', project.id)
      .order('position', { ascending: true })

    if (sectionError) {
      setErrorMessage(sectionError.message)
      setIsLoading(false)
      return
    }

    setSections(sectionData ?? [])

    if (!taskSectionId && sectionData?.[0]?.id) {
      setTaskSectionId(sectionData[0].id)
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, section_id, position')
      .eq('project_id', project.id)
      .order('position', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setTasks(data ?? [])

    const { data: dependencyData, error: dependencyError } = await supabase
      .from('task_dependencies')
      .select('id, task_id, depends_on_task_id')

    if (dependencyError) {
      setErrorMessage(dependencyError.message)
      setIsLoading(false)
      return
    }

    setDependencies(dependencyData ?? [])
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
      section_id: taskSectionId || fallbackSectionId || null,
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
    setTaskSectionId(taskSectionId || fallbackSectionId)
    setIsCreating(false)
    await loadProjectAndTasks()
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setUpdatingStatusTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingStatusTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    )
    setUpdatingStatusTaskId(null)
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

  async function updateTaskSection(taskId: string, sectionId: string) {
    setUpdatingSectionTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .update({ section_id: sectionId })
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingSectionTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, section_id: sectionId } : task,
      ),
    )
    setUpdatingSectionTaskId(null)
  }


  async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
    if (!dependsOnTaskId || taskId === dependsOnTaskId) {
      return
    }

    const alreadyExists = dependencies.some(
      (dependency) =>
        dependency.task_id === taskId &&
        dependency.depends_on_task_id === dependsOnTaskId,
    )

    if (alreadyExists) {
      setErrorMessage('That blocker is already linked to this task.')
      return
    }

    setAddingDependencyTaskId(taskId)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: 'blocks',
      })
      .select('id, task_id, depends_on_task_id')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setAddingDependencyTaskId(null)
      return
    }

    setDependencies((currentDependencies) => [...currentDependencies, data])
    setAddingDependencyTaskId(null)
  }

  async function removeTaskDependency(dependencyId: string) {
    setRemovingDependencyId(dependencyId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId)

    if (error) {
      setErrorMessage(error.message)
      setRemovingDependencyId(null)
      return
    }

    setDependencies((currentDependencies) =>
      currentDependencies.filter((dependency) => dependency.id !== dependencyId),
    )
    setRemovingDependencyId(null)
  }

  function getBlockingTasks(taskId: string) {
    return dependencies
      .filter((dependency) => dependency.task_id === taskId)
      .map((dependency) => ({
        dependency,
        task: tasks.find((task) => task.id === dependency.depends_on_task_id),
      }))
      .filter((item) => item.task)
  }

  function getBlockedTasks(taskId: string) {
    return dependencies
      .filter((dependency) => dependency.depends_on_task_id === taskId)
      .map((dependency) => ({
        dependency,
        task: tasks.find((task) => task.id === dependency.task_id),
      }))
      .filter((item) => item.task)
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setErrorMessage(null)
  }

  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
  }

  async function saveTaskEdits(taskId: string) {
    if (!editTitle.trim()) {
      setErrorMessage('Task title is required.')
      return
    }

    setSavingTaskId(taskId)
    setErrorMessage(null)

    const updatedTask = {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
    }

    const { error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setSavingTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task,
      ),
    )

    setSavingTaskId(null)
    cancelEditingTask()
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

  function renderTask(task: Task) {
    const isEditing = editingTaskId === task.id
    const blockingTasks = getBlockingTasks(task.id)
    const blockedTasks = getBlockedTasks(task.id)
    const linkedBlockerIds = dependencies
      .filter((dependency) => dependency.task_id === task.id)
      .map((dependency) => dependency.depends_on_task_id)
    const availableBlockers = tasks.filter(
      (candidateTask) =>
        candidateTask.id !== task.id &&
        !linkedBlockerIds.includes(candidateTask.id),
    )

    return (
      <article
        key={task.id}
        className="rounded-2xl border border-white/10 bg-[#181b1f] p-5 transition hover:border-violet-300/40 hover:bg-[#1d2026]"
      >
        <div className="space-y-4">
          <div className="min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
                />
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  placeholder="Description"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
                />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium">{task.title}</h3>
                {task.description && (
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                )}

                {blockingTasks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200/70">
                      Blocked by
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {blockingTasks.map(({ dependency, task: blockingTask }) => (
                        <span
                          key={dependency.id}
                          className="inline-flex items-center gap-2 rounded-full border border-red-300/10 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-100"
                        >
                          {blockingTask?.title}
                          <button
                            type="button"
                            disabled={removingDependencyId === dependency.id}
                            onClick={() => removeTaskDependency(dependency.id)}
                            className="text-red-200/70 transition hover:text-red-100 disabled:opacity-50"
                            aria-label={`Remove blocker ${blockingTask?.title}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {blockedTasks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/70">
                      Blocks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {blockedTasks.map(({ dependency, task: blockedTask }) => (
                        <span
                          key={dependency.id}
                          className="inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-100"
                        >
                          {blockedTask?.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-violet-300/40">
              <span className="text-zinc-500">Section</span>
              <select
                aria-label={`Section for ${task.title}`}
                value={task.section_id ?? ''}
                disabled={updatingSectionTaskId === task.id}
                onChange={(event) => updateTaskSection(task.id, event.target.value)}
                className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id} className="bg-[#181b1f] text-white">
                    {section.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-violet-300/40">
              <span className="text-zinc-500">Status</span>
              <select
                aria-label={`Status for ${task.title}`}
                value={task.status}
                disabled={updatingStatusTaskId === task.id}
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

            <label className="flex items-center gap-2 rounded-full border border-red-300/10 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:border-red-300/40">
              <span className="text-red-200/60">Blocked by</span>
              <select
                aria-label={`Add blocker for ${task.title}`}
                defaultValue=""
                disabled={addingDependencyTaskId === task.id || availableBlockers.length === 0}
                onChange={(event) => {
                  addTaskDependency(task.id, event.target.value)
                  event.currentTarget.value = ''
                }}
                className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-red-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" className="bg-[#181b1f] text-white">
                  Add blocker
                </option>
                {availableBlockers.map((candidateTask) => (
                  <option key={candidateTask.id} value={candidateTask.id} className="bg-[#181b1f] text-white">
                    {candidateTask.title}
                  </option>
                ))}
              </select>
            </label>

            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={savingTaskId === task.id}
                  onClick={() => saveTaskEdits(task.id)}
                  className="rounded-full border border-emerald-300/10 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTaskId === task.id ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingTask}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-white/30"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startEditingTask(task)}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40"
              >
                Edit
              </button>
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
    )
  }

  return (
    <main className="min-h-screen bg-[#111315] px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.28em] text-violet-300">
              Finito
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Project command centre
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              A calm, clean task system for projects, sections, blockers and progress without the corporate migraine.
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
            <p className="text-sm text-zinc-400">Add a new task directly into a project section.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_1.4fr_0.8fr_0.8fr_auto]">
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
              <p className="text-sm text-zinc-400">Tasks grouped by project section.</p>
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
            <div className="space-y-6">
              {tasksBySection.map((section) => (
                <section key={section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      {section.name}
                    </h3>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      {section.tasks.length} tasks
                    </span>
                  </div>

                  {section.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {section.tasks.map((task) => renderTask(task))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-zinc-500">
                      No tasks in this section yet.
                    </div>
                  )}
                </section>
              ))}

              {unsectionedTasks.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      No section
                    </h3>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      {unsectionedTasks.length} tasks
                    </span>
                  </div>
                  <div className="space-y-3">
                    {unsectionedTasks.map((task) => renderTask(task))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
