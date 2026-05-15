import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  difficulty: string | null
  start_date: string | null
  due_date: string | null
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

const difficultyOptions = [
  { value: 'not_scoped', label: 'Not scoped' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'complex', label: 'Complex' },
]

function formatDate(date: string | null) {
  if (!date) return 'No date'

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function isTaskOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${task.due_date}T00:00:00`)
  dueDate.setHours(0, 0, 0, 0)

  return dueDate < today
}

function getLabel(options: { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? 'None'
}

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDifficulty, setTaskDifficulty] = useState('not_scoped')
  const [taskSectionId, setTaskSectionId] = useState('')
  const [taskStartDate, setTaskStartDate] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('not_scoped')
  const [editStartDate, setEditStartDate] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')

  const fallbackSectionId = sections[0]?.id ?? ''

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      const matchesSection = sectionFilter === 'all' || task.section_id === sectionFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesSection
    })
  }, [priorityFilter, searchQuery, sectionFilter, statusFilter, tasks])

  const tasksBySection = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      tasks: filteredTasks.filter((task) => task.section_id === section.id),
    }))
  }, [filteredTasks, sections])

  const unsectionedTasks = useMemo(() => {
    return filteredTasks.filter((task) => !task.section_id)
  }, [filteredTasks])

  const stats = useMemo(() => {
    const blockedTaskIds = new Set(dependencies.map((dependency) => dependency.task_id))
    const overdueCount = tasks.filter(isTaskOverdue).length

    return {
      total: tasks.length,
      done: tasks.filter((task) => task.status === 'done').length,
      blocked: blockedTaskIds.size,
      overdue: overdueCount,
      visible: filteredTasks.length,
    }
  }, [dependencies, filteredTasks.length, tasks])

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
      .select('id, title, description, status, priority, difficulty, start_date, due_date, section_id, position')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      difficulty: taskDifficulty,
      start_date: taskStartDate || null,
      due_date: taskDueDate || null,
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
    setTaskDifficulty('not_scoped')
    setTaskSectionId(taskSectionId || fallbackSectionId)
    setTaskStartDate('')
    setTaskDueDate('')
    setIsCreating(false)
    await loadProjectAndTasks()
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setUpdatingStatusTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingStatusTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    )
    setUpdatingStatusTaskId(null)
  }

  async function updateTaskPriority(taskId: string, priority: string) {
    setUpdatingPriorityTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').update({ priority }).eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingPriorityTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, priority } : task)),
    )
    setUpdatingPriorityTaskId(null)
  }

  async function updateTaskSection(taskId: string, sectionId: string) {
    setUpdatingSectionTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').update({ section_id: sectionId }).eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingSectionTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, section_id: sectionId } : task)),
    )
    setUpdatingSectionTaskId(null)
  }

  function wouldCreateCircularDependency(taskId: string, dependsOnTaskId: string) {
    const visited = new Set<string>()

    function visit(currentTaskId: string): boolean {
      if (currentTaskId === taskId) {
        return true
      }

      if (visited.has(currentTaskId)) {
        return false
      }

      visited.add(currentTaskId)

      return dependencies
        .filter((dependency) => dependency.task_id === currentTaskId)
        .some((dependency) => visit(dependency.depends_on_task_id))
    }

    return visit(dependsOnTaskId)
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

    if (wouldCreateCircularDependency(taskId, dependsOnTaskId)) {
      setErrorMessage('That blocker would create a circular dependency.')
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

    const { error: statusError } = await supabase
      .from('tasks')
      .update({ status: 'blocked' })
      .eq('id', taskId)

    if (statusError) {
      setErrorMessage(statusError.message)
      setAddingDependencyTaskId(null)
      return
    }

    setDependencies((currentDependencies) => [...currentDependencies, data])
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status: 'blocked' } : task,
      ),
    )
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
    setEditDifficulty(task.difficulty ?? 'not_scoped')
    setEditStartDate(task.start_date ?? '')
    setEditDueDate(task.due_date ?? '')
    setErrorMessage(null)
  }

  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditDifficulty('not_scoped')
    setEditStartDate('')
    setEditDueDate('')
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
      difficulty: editDifficulty,
      start_date: editStartDate || null,
      due_date: editDueDate || null,
    }

    const { error } = await supabase.from('tasks').update(updatedTask).eq('id', taskId)

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

    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

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
    const taskIsOverdue = isTaskOverdue(task)

    return (
      <article
        key={task.id}
        className={`rounded-2xl border bg-[#181b1f] p-5 transition hover:bg-[#1d2026] ${
          blockingTasks.length > 0 || taskIsOverdue
            ? 'border-red-300/30 hover:border-red-300/50'
            : 'border-white/10 hover:border-violet-300/40'
        }`}
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

                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={editDifficulty}
                    onChange={(event) => setEditDifficulty(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
                  >
                    {difficultyOptions.map((difficulty) => (
                      <option key={difficulty.value} value={difficulty.value} className="bg-[#181b1f] text-white">
                        {difficulty.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(event) => setEditStartDate(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
                  />

                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) => setEditDueDate(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium">{task.title}</h3>
                  {taskIsOverdue && (
                    <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">
                      Overdue
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-400">
                    Difficulty: {getLabel(difficultyOptions, task.difficulty)}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-400">
                    Start: {formatDate(task.start_date)}
                  </span>
                  <span className={`rounded-full px-3 py-1 ${taskIsOverdue ? 'bg-red-400/10 text-red-200' : 'bg-white/5 text-zinc-400'}`}>
                    Due: {formatDate(task.due_date)}
                  </span>
                </div>

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

        <div className="mb-6 grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Visible</p>
            <p className="mt-2 text-2xl font-semibold">{stats.visible}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Done</p>
            <p className="mt-2 text-2xl font-semibold">{stats.done}</p>
          </div>
          <div className="rounded-2xl border border-red-300/10 bg-red-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Blocked</p>
            <p className="mt-2 text-2xl font-semibold text-red-100">{stats.blocked}</p>
          </div>
          <div className="rounded-2xl border border-red-300/10 bg-red-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Overdue</p>
            <p className="mt-2 text-2xl font-semibold text-red-100">{stats.overdue}</p>
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

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks"
              className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
            />

            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
            >
              <option value="all" className="bg-[#181b1f] text-white">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id} className="bg-[#181b1f] text-white">
                  {section.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
            >
              <option value="all" className="bg-[#181b1f] text-white">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value} className="bg-[#181b1f] text-white">
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/60"
            >
              <option value="all" className="bg-[#181b1f] text-white">All priorities</option>
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value} className="bg-[#181b1f] text-white">
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold">Finito Build</h2>
              <p className="text-sm text-zinc-400">Tasks grouped by project section.</p>
            </div>
            <span className="rounded-full bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-200">
              {filteredTasks.length} visible
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
                      No matching tasks in this section.
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
