import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { ActivityLog, Section, Task, TaskComment, TaskDependency } from './types'
import { difficultyOptions, priorityOptions, statusOptions } from './constants'
import { formatDate, getLabel, isTaskOverdue } from './utils'
import { DashboardStats } from './components/DashboardStats'
import { TaskFilters } from './components/TaskFilters'
import { CreateTaskForm } from './components/CreateTaskForm'
import { TaskList } from './components/TaskList'
import { WorkspaceSidebar } from './components/WorkspaceSidebar'
import { AppHeader } from './components/AppHeader'
import './App.css'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string | null>(null)
  const [updatingPriorityTaskId, setUpdatingPriorityTaskId] = useState<string | null>(null)
  const [updatingSectionTaskId, setUpdatingSectionTaskId] = useState<string | null>(null)
  const [addingDependencyTaskId, setAddingDependencyTaskId] = useState<string | null>(null)
  const [removingDependencyId, setRemovingDependencyId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [archivingTaskId, setArchivingTaskId] = useState<string | null>(null)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [duplicatingTaskId, setDuplicatingTaskId] = useState<string | null>(null)
  const [creatingSubtaskTaskId, setCreatingSubtaskTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [creatingSection, setCreatingSection] = useState(false)
  const [, setRenamingSectionId] = useState<string | null>(null)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [addingCommentTaskId, setAddingCommentTaskId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  const [sectionDraftNames, setSectionDraftNames] = useState<Record<string, string>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({})

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
  const [visibilityFilter, setVisibilityFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'scope'>('status')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [isCreateTaskFormOpen, setIsCreateTaskFormOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

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
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'active' && !task.archived_at) ||
        (visibilityFilter === 'archived' && Boolean(task.archived_at))

      return matchesSearch && matchesStatus && matchesPriority && matchesSection && matchesVisibility
    })
  }, [priorityFilter, searchQuery, sectionFilter, statusFilter, tasks, visibilityFilter])

  const groupedTasks = useMemo(() => {
    const parentTasks = filteredTasks
      .filter((task) => !task.parent_task_id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

    if (groupBy === 'status') {
      return statusOptions.map((status) => ({
        id: status.value,
        name: status.label,
        tasks: parentTasks.filter((task) => task.status === status.value),
      }))
    }

    if (groupBy === 'priority') {
      return [
        ...priorityOptions.map((priority) => ({
          id: priority.value,
          name: priority.label,
          tasks: parentTasks.filter((task) => task.priority === priority.value),
        })),
        {
          id: 'no_priority',
          name: 'No priority',
          tasks: parentTasks.filter((task) => !task.priority),
        },
      ]
    }

    return [
      ...difficultyOptions.map((difficulty) => ({
        id: difficulty.value,
        name: difficulty.label,
        tasks: parentTasks.filter((task) => task.difficulty === difficulty.value),
      })),
      {
        id: 'no_scope',
        name: 'No scope',
        tasks: parentTasks.filter((task) => !task.difficulty),
      },
    ]
  }, [filteredTasks, groupBy])

  const stats = useMemo(() => {
    const blockedTaskIds = new Set(dependencies.map((dependency) => dependency.task_id))
    const overdueCount = tasks.filter(isTaskOverdue).length

    return {
      total: tasks.length,
      done: tasks.filter((task) => task.status === 'done').length,
      blocked: blockedTaskIds.size,
      overdue: overdueCount,
      archived: tasks.filter((task) => task.archived_at).length,
      visible: filteredTasks.length,
    }
  }, [dependencies, filteredTasks.length, tasks])

  async function logActivity(action: string, details?: string, taskId?: string | null) {
    if (!projectId) {
      return
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        project_id: projectId,
        task_id: taskId ?? null,
        action,
        details: details ?? null,
      })
      .select('id, project_id, task_id, action, details, created_at')
      .single()

    if (!error && data) {
      setActivityLogs((currentLogs) => [data, ...currentLogs].slice(0, 20))
    }
  }

  async function loadProjectAndTasks(options: { showLoading?: boolean } = {}) {
    const shouldShowLoading = options.showLoading ?? true

    setErrorMessage(null)

    if (shouldShowLoading) {
      setIsLoading(true)
    }

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
      .select('id, title, description, parent_task_id, status, priority, difficulty, start_date, due_date, archived_at, section_id, position')
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

    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('id, task_id, body, created_at')
      .order('created_at', { ascending: true })

    if (commentError) {
      setErrorMessage(commentError.message)
      setIsLoading(false)
      return
    }

    setComments(commentData ?? [])

    const { data: activityData, error: activityError } = await supabase
      .from('activity_logs')
      .select('id, project_id, task_id, action, details, created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (activityError) {
      setErrorMessage(activityError.message)
      setIsLoading(false)
      return
    }

    setActivityLogs(activityData ?? [])
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
      parent_task_id: null,
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      status: 'not_started',
      priority: taskPriority,
      difficulty: taskDifficulty,
      start_date: taskStartDate || null,
      due_date: taskDueDate || null,
      archived_at: null,
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
    setIsCreateTaskFormOpen(false)
    await logActivity('Created task', taskTitle.trim())
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

    const updatedTask = tasks.find((task) => task.id === taskId)

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    )

    await logActivity(
      'Updated task status',
      `${updatedTask?.title ?? 'Task'} → ${getLabel(statusOptions, status)}`,
      taskId,
    )

    setUpdatingStatusTaskId(null)
  }

  async function updateTaskPriority(taskId: string, priority: string) {
    const nextPriority = priority || null

    setUpdatingPriorityTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').update({ priority: nextPriority }).eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingPriorityTaskId(null)
      return
    }

    const updatedTask = tasks.find((task) => task.id === taskId)

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, priority: nextPriority } : task)),
    )

    await logActivity(
      'Updated task priority',
      `${updatedTask?.title ?? 'Task'} → ${nextPriority ? getLabel(priorityOptions, nextPriority) : 'No priority'}`,
      taskId,
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

  function getTaskComments(taskId: string) {
    return comments.filter((comment) => comment.task_id === taskId)
  }

  async function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newSectionName.trim()) {
      setErrorMessage('Section name is required.')
      return
    }

    if (!projectId) {
      setErrorMessage('Project not loaded yet. Refresh and try again.')
      return
    }

    setCreatingSection(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('sections')
      .insert({
        project_id: projectId,
        name: newSectionName.trim(),
        position: sections.length + 1,
      })
      .select('id, name, position')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setCreatingSection(false)
      return
    }

    setSections((currentSections) => [...currentSections, data])
    setNewSectionName('')
    setCreatingSection(false)
  }

  async function renameSection(sectionId: string) {
    const draftName = sectionDraftNames[sectionId]?.trim()

    if (!draftName) {
      setErrorMessage('Section name is required.')
      return
    }

    setRenamingSectionId(sectionId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('sections')
      .update({ name: draftName })
      .eq('id', sectionId)

    if (error) {
      setErrorMessage(error.message)
      setRenamingSectionId(null)
      return
    }

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, name: draftName } : section,
      ),
    )

    setSectionDraftNames((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }
      delete nextDrafts[sectionId]
      return nextDrafts
    })

    setRenamingSectionId(null)
  }

  async function deleteSection(sectionId: string) {
    const section = sections.find((currentSection) => currentSection.id === sectionId)
    const sectionTaskCount = tasks.filter((task) => task.section_id === sectionId).length

    if (sectionTaskCount > 0) {
      setErrorMessage('Move or delete the tasks in this section before deleting it.')
      return
    }

    const shouldDelete = window.confirm(`Delete the section “${section?.name ?? 'this section'}”?`)

    if (!shouldDelete) {
      return
    }

    setDeletingSectionId(sectionId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)

    if (error) {
      setErrorMessage(error.message)
      setDeletingSectionId(null)
      return
    }

    setSections((currentSections) =>
      currentSections.filter((currentSection) => currentSection.id !== sectionId),
    )
    setDeletingSectionId(null)
  }

  async function addComment(taskId: string) {
    const body = commentDrafts[taskId]?.trim()

    if (!body) {
      setErrorMessage('Comment cannot be empty.')
      return
    }

    setAddingCommentTaskId(taskId)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        body,
      })
      .select('id, task_id, body, created_at')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setAddingCommentTaskId(null)
      return
    }

    const commentedTask = tasks.find((task) => task.id === taskId)

    setComments((currentComments) => [...currentComments, data])
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: '',
    }))

    await logActivity('Added comment', commentedTask?.title ?? 'Task', taskId)

    setAddingCommentTaskId(null)
  }

  async function deleteComment(commentId: string) {
    setDeletingCommentId(commentId)
    setErrorMessage(null)

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      setErrorMessage(error.message)
      setDeletingCommentId(null)
      return
    }

    setComments((currentComments) =>
      currentComments.filter((comment) => comment.id !== commentId),
    )
    setDeletingCommentId(null)
  }

  function getSubtasks(taskId: string) {
    return tasks
      .filter((task) => task.parent_task_id === taskId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  async function createSubtask(parentTask: Task) {
    const title = subtaskDrafts[parentTask.id]?.trim()

    if (!title) {
      return
    }

    if (!projectId) {
      setErrorMessage('Project not loaded yet. Refresh and try again.')
      return
    }

    setCreatingSubtaskTaskId(parentTask.id)
    setErrorMessage(null)

    const siblingSubtasks = getSubtasks(parentTask.id)

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        section_id: parentTask.section_id,
        parent_task_id: parentTask.id,
        title,
        description: null,
        status: 'not_started',
        priority: null,
        difficulty: 'not_scoped',
        start_date: null,
        due_date: parentTask.due_date,
        archived_at: null,
        position: siblingSubtasks.length + 1,
      })
      .select('id, title, description, parent_task_id, status, priority, difficulty, start_date, due_date, archived_at, section_id, position')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setCreatingSubtaskTaskId(null)
      return
    }

    setTasks((currentTasks) => [...currentTasks, data])
    setSubtaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [parentTask.id]: '',
    }))
    setCreatingSubtaskTaskId(null)
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

  async function moveTask(taskId: string, direction: 'up' | 'down') {
    setMovingTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.rpc('finito_move_task', {
      p_task_id: taskId,
      p_direction: direction,
    })

    if (error) {
      setErrorMessage(error.message)
      setMovingTaskId(null)
      return
    }

    await loadProjectAndTasks({ showLoading: false })
    setMovingTaskId(null)
  }

  async function duplicateTask(task: Task) {
    setDuplicatingTaskId(task.id)
    setErrorMessage(null)

    const { error } = await supabase.rpc('finito_duplicate_task', {
      p_task_id: task.id,
    })

    if (error) {
      setErrorMessage(error.message)
      setDuplicatingTaskId(null)
      return
    }

    await loadProjectAndTasks({ showLoading: false })
    setDuplicatingTaskId(null)
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSectionFilter('all')
    setGroupBy('status')
    setVisibilityFilter('active')
  }

  function resetCreateTaskForm() {
    setTaskTitle('')
    setTaskDescription('')
    setTaskSectionId('')
    setTaskPriority('medium')
    setTaskDifficulty('not_scoped')
    setTaskStartDate('')
    setTaskDueDate('')
  }

  function toggleCreateTaskForm() {
    setIsCreateTaskFormOpen((currentValue) => {
      if (currentValue) {
        resetCreateTaskForm()
        return false
      }

      return true
    })
  }

  function closeCreateTaskForm() {
    resetCreateTaskForm()
    setIsCreateTaskFormOpen(false)
  }

  async function quickSetTaskDone(task: Task) {
    const blockingTasks = getBlockingTasks(task.id)
    const isBlocked = task.status === 'blocked' || blockingTasks.length > 0

    if (isBlocked) {
      const shouldContinue = window.confirm(
        'This task is blocked. Mark it as Done anyway?',
      )

      if (!shouldContinue) {
        return
      }
    }

    await updateTaskStatus(task.id, 'done')
  }

  async function quickReopenTask(task: Task) {
    await updateTaskStatus(task.id, 'in_progress')
  }

  async function archiveTask(task: Task) {
    setArchivingTaskId(task.id)
    setErrorMessage(null)

    const archivedAt = new Date().toISOString()

    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: archivedAt })
      .eq('id', task.id)

    if (error) {
      setErrorMessage(error.message)
      setArchivingTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, archived_at: archivedAt } : currentTask,
      ),
    )

    await logActivity('Archived task', task.title, task.id)
    setArchivingTaskId(null)
  }

  async function restoreTask(task: Task) {
    setArchivingTaskId(task.id)
    setErrorMessage(null)

    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: null })
      .eq('id', task.id)

    if (error) {
      setErrorMessage(error.message)
      setArchivingTaskId(null)
      return
    }

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, archived_at: null } : currentTask,
      ),
    )

    await logActivity('Restored task', task.title, task.id)
    setArchivingTaskId(null)
  }

  async function archiveCompletedTasks() {
    const completedTasks = tasks.filter((task) => task.status === 'done' && !task.archived_at)

    if (completedTasks.length === 0) {
      setErrorMessage('There are no completed tasks to archive.')
      return
    }

    const shouldArchive = window.confirm(`Archive ${completedTasks.length} completed task${completedTasks.length === 1 ? '' : 's'}?`)

    if (!shouldArchive) {
      return
    }

    setErrorMessage(null)
    const archivedAt = new Date().toISOString()

    for (const task of completedTasks) {
      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: archivedAt })
        .eq('id', task.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.status === 'done' && !task.archived_at
          ? { ...task, archived_at: archivedAt }
          : task,
      ),
    )

    await logActivity('Archived completed tasks', `${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'}`)
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
    const taskComments = getTaskComments(task.id)
    const subtasks = getSubtasks(task.id)
    const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'done').length
    const sectionTaskOrder = tasks
      .filter((currentTask) => currentTask.section_id === task.section_id && currentTask.parent_task_id === task.parent_task_id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const taskOrderIndex = sectionTaskOrder.findIndex((currentTask) => currentTask.id === task.id)
    const canMoveUp = taskOrderIndex > 0
    const canMoveDown = taskOrderIndex >= 0 && taskOrderIndex < sectionTaskOrder.length - 1

    return (
      <article
        key={task.id}
        className={`border-b border-slate-100 bg-white px-4 py-3 transition hover:bg-[var(--surface-muted)] ${
          blockingTasks.length > 0 || taskIsOverdue
            ? 'border-[var(--error-main)]/35/30 hover:border-[var(--error-main)]/35/50'
            : 'border-[var(--outline-soft)] hover:border-[#8051FF]/50'
        }`}
      >
        <div className="space-y-2">
          <div className="min-w-0">
            {task.status === 'done' ? (
              <button
                type="button"
                onClick={() => quickReopenTask(task)}
                className="rounded-full border border-[var(--warning-main)]/25 bg-[var(--warning-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--warning-dark)] transition hover:border-amber-300/40"
              >
                Reopen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => quickSetTaskDone(task)}
                className="rounded-full border border-[var(--success-main)]/25 bg-[var(--success-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--success-dark)] transition hover:border-emerald-300/40"
              >
                Mark done
              </button>
            )}

            <button
              type="button"
              disabled={!canMoveUp || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'up')}
              className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              Move up
            </button>

            <button
              type="button"
              disabled={!canMoveDown || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'down')}
              className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              Move down
            </button>

            <button
              type="button"
              disabled={duplicatingTaskId === task.id}
              onClick={() => duplicateTask(task)}
              className="rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary-main)] transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              {duplicatingTaskId === task.id ? 'Duplicating…' : 'Duplicate'}
            </button>

            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="w-full rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)]"
                />

                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  placeholder="Description"
                  className="w-full resize-none rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)]"
                />

                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={editDifficulty}
                    onChange={(event) => setEditDifficulty(event.target.value)}
                    className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)]"
                  >
                    {difficultyOptions.map((difficulty) => (
                      <option key={difficulty.value} value={difficulty.value} className="bg-white text-[var(--text-primary)]">
                        {difficulty.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(event) => setEditStartDate(event.target.value)}
                    className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)]"
                  />

                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) => setEditDueDate(event.target.value)}
                    className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)]"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{task.title}</h3>
                  {task.archived_at && (
                    <span className="rounded-full border border-zinc-300/10 bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                      Archived
                    </span>
                  )}
                  {taskIsOverdue && (
                    <span className="rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-3 py-1 text-xs font-semibold text-[var(--error-dark)]">
                      Overdue
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="mt-1 max-w-3xl truncate text-xs leading-5 text-[var(--text-disabled)]">{task.description}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[var(--text-disabled)]">
                    Difficulty: {getLabel(difficultyOptions, task.difficulty)}
                  </span>
                  <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[var(--text-disabled)]">
                    Start: {formatDate(task.start_date)}
                  </span>
                  <span className={`rounded-full px-3 py-1 ${taskIsOverdue ? 'bg-[var(--error-light)] text-[var(--error-dark)]' : 'bg-[var(--surface-subtle)] text-[var(--text-disabled)]'}`}>
                    Due: {formatDate(task.due_date)}
                  </span>
                  <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[var(--text-disabled)]">
                    Comments: {taskComments.length}
                  </span>
                  <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[var(--text-disabled)]">
                    Subtasks: {completedSubtasks}/{subtasks.length}
                  </span>
                </div>

                {blockingTasks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--error-dark)]/70">
                      Blocked by
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {blockingTasks.map(({ dependency, task: blockingTask }) => (
                        <span
                          key={dependency.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)]"
                        >
                          {blockingTask?.title}
                          <button
                            type="button"
                            disabled={removingDependencyId === dependency.id}
                            onClick={() => removeTaskDependency(dependency.id)}
                            className="text-[var(--error-dark)]/70 transition hover:text-[var(--error-dark)] disabled:opacity-65"
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary-main)]/70">
                      Blocks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {blockedTasks.map(({ dependency, task: blockedTask }) => (
                        <span
                          key={dependency.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--primary-main)]"
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

          <div className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Subtasks
              </p>
              <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs text-[var(--text-disabled)]">
                {completedSubtasks}/{subtasks.length}
              </span>
            </div>

            {subtasks.length > 0 && (
              <div className="mb-3 space-y-2">
                {subtasks.map((subtask) => {
                  const subtaskIndex = subtasks.findIndex((currentSubtask) => currentSubtask.id === subtask.id)
                  const canMoveSubtaskUp = subtaskIndex > 0
                  const canMoveSubtaskDown = subtaskIndex >= 0 && subtaskIndex < subtasks.length - 1

                  return (
                    <div
                      key={subtask.id}
                      className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-3"
                    >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{subtask.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {getLabel(statusOptions, subtask.status)} · {subtask.priority ? getLabel(priorityOptions, subtask.priority) : 'No priority'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!canMoveSubtaskUp || movingTaskId === subtask.id}
                          onClick={() => moveTask(subtask.id, 'up')}
                          className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                        >
                          Move up
                        </button>

                        <button
                          type="button"
                          disabled={!canMoveSubtaskDown || movingTaskId === subtask.id}
                          onClick={() => moveTask(subtask.id, 'down')}
                          className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                        >
                          Move down
                        </button>

                        {subtask.status === 'done' ? (
                          <button
                            type="button"
                            onClick={() => quickReopenTask(subtask)}
                            className="rounded-full border border-[var(--warning-main)]/25 bg-[var(--warning-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--warning-dark)] transition hover:border-amber-300/40"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => quickSetTaskDone(subtask)}
                            className="rounded-full border border-[var(--success-main)]/25 bg-[var(--success-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--success-dark)] transition hover:border-emerald-300/40"
                          >
                            Mark done
                          </button>
                        )}

                        <label className="flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-zinc-200">
                          <span className="text-[var(--text-muted)]">Status</span>
                          <select
                            aria-label={`Status for ${subtask.title}`}
                            value={subtask.status}
                            disabled={updatingStatusTaskId === subtask.id}
                            onChange={(event) => updateTaskStatus(subtask.id, event.target.value)}
                            className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value} className="bg-white text-[var(--text-primary)]">
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex items-center gap-2 rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--primary-main)]">
                          <span className="text-[var(--primary-main)]/60">Priority</span>
                          <select
                            aria-label={`Priority for ${subtask.title}`}
                            value={subtask.priority ?? ''}
                            disabled={updatingPriorityTaskId === subtask.id}
                            onChange={(event) => updateTaskPriority(subtask.id, event.target.value)}
                            className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-[var(--primary-main)] outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                          >
                            <option value="" className="bg-white text-[var(--text-primary)]">
                              No priority
                            </option>
                            {priorityOptions.map((priority) => (
                              <option key={priority.value} value={priority.value} className="bg-white text-[var(--text-primary)]">
                                {priority.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          disabled={deletingTaskId === subtask.id}
                          onClick={() => deleteTask(subtask.id)}
                          className="rounded-full border border-[var(--error-main)]/25 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)] transition hover:border-[var(--error-main)]/35/40 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                        >
                          {deletingTaskId === subtask.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={subtaskDrafts[task.id] ?? ''}
                onChange={(event) =>
                  setSubtaskDrafts((currentDrafts) => ({
                    ...currentDrafts,
                    [task.id]: event.target.value,
                  }))
                }
                placeholder="Add a subtask"
                className="min-w-0 flex-1 rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)]"
              />
              <button
                type="button"
                disabled={creatingSubtaskTaskId === task.id || !(subtaskDrafts[task.id] ?? '').trim()}
                onClick={() => createSubtask(task)}
                className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {creatingSubtaskTaskId === task.id ? 'Adding…' : 'Add subtask'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Comments
              </p>
              <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs text-[var(--text-disabled)]">
                {taskComments.length}
              </span>
            </div>

            {taskComments.length > 0 && (
              <div className="mb-3 space-y-2">
                {taskComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm leading-6 text-zinc-200">{comment.body}</p>
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
                    <button
                      type="button"
                      disabled={deletingCommentId === comment.id}
                      onClick={() => deleteComment(comment.id)}
                      className="shrink-0 text-xs font-semibold text-[var(--error-dark)]/70 transition hover:text-[var(--error-dark)] disabled:opacity-65"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={commentDrafts[task.id] ?? ''}
                onChange={(event) =>
                  setCommentDrafts((currentDrafts) => ({
                    ...currentDrafts,
                    [task.id]: event.target.value,
                  }))
                }
                placeholder="Add a comment"
                className="min-w-0 flex-1 rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)]"
              />
              <button
                type="button"
                disabled={addingCommentTaskId === task.id}
                onClick={() => addComment(task.id)}
                className="rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {addingCommentTaskId === task.id ? 'Adding…' : 'Comment'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--outline-soft)] pt-4">
            <label className="flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-[#8051FF]/50">
              <span className="text-[var(--text-muted)]">Section</span>
              <select
                aria-label={`Section for ${task.title}`}
                value={task.section_id ?? ''}
                disabled={updatingSectionTaskId === task.id}
                onChange={(event) => updateTaskSection(task.id, event.target.value)}
                className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id} className="bg-white text-[var(--text-primary)]">
                    {section.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-[#8051FF]/50">
              <span className="text-[var(--text-muted)]">Status</span>
              <select
                aria-label={`Status for ${task.title}`}
                value={task.status}
                disabled={updatingStatusTaskId === task.id}
                onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value} className="bg-white text-[var(--text-primary)]">
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            {task.priority && (
              <label className="flex items-center gap-2 rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--primary-main)] transition hover:border-[#8051FF]/50">
                <span className="text-[var(--primary-main)]/60">Priority</span>
                <select
                  aria-label={`Priority for ${task.title}`}
                  value={task.priority}
                  disabled={updatingPriorityTaskId === task.id}
                  onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                  className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-[var(--primary-main)] outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority.value} value={priority.value} className="bg-white text-[var(--text-primary)]">
                      {priority.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)] transition hover:border-[var(--error-main)]/35/40">
              <span className="text-[var(--error-dark)]/60">Blocked by</span>
              <select
                aria-label={`Add blocker for ${task.title}`}
                defaultValue=""
                disabled={addingDependencyTaskId === task.id || availableBlockers.length === 0}
                onChange={(event) => {
                  addTaskDependency(task.id, event.target.value)
                  event.currentTarget.value = ''
                }}
                className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-[var(--error-dark)] outline-none disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                <option value="" className="bg-white text-[var(--text-primary)]">
                  Add blocker
                </option>
                {availableBlockers.map((candidateTask) => (
                  <option key={candidateTask.id} value={candidateTask.id} className="bg-white text-[var(--text-primary)]">
                    {candidateTask.title}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!canMoveUp || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'up')}
              className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              Move up
            </button>

            <button
              type="button"
              disabled={!canMoveDown || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'down')}
              className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              Move down
            </button>

            <button
              type="button"
              disabled={duplicatingTaskId === task.id}
              onClick={() => duplicateTask(task)}
              className="rounded-full border border-[var(--primary-main)]/30 bg-[var(--primary-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary-main)] transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              {duplicatingTaskId === task.id ? 'Duplicating…' : 'Duplicate'}
            </button>

            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={savingTaskId === task.id}
                  onClick={() => saveTaskEdits(task.id)}
                  className="rounded-full border border-[var(--success-main)]/25 bg-[var(--success-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--success-dark)] transition hover:border-emerald-300/40 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
                >
                  {savingTaskId === task.id ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingTask}
                  className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-white/30"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startEditingTask(task)}
                className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50"
              >
                Edit
              </button>
            )}

            {task.archived_at ? (
              <button
                type="button"
                disabled={archivingTaskId === task.id}
                onClick={() => restoreTask(task)}
                className="rounded-full border border-[var(--success-main)]/25 bg-[var(--success-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--success-dark)] transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {archivingTaskId === task.id ? 'Restoring…' : 'Restore'}
              </button>
            ) : (
              <button
                type="button"
                disabled={archivingTaskId === task.id}
                onClick={() => archiveTask(task)}
                className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-[#8051FF]/50 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
              >
                {archivingTaskId === task.id ? 'Archiving…' : 'Archive'}
              </button>
            )}

            <button
              type="button"
              disabled={deletingTaskId === task.id}
              onClick={() => deleteTask(task.id)}
              className="rounded-full border border-[var(--error-main)]/25 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)] transition hover:border-[var(--error-main)]/35/40 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:border-[var(--outline-soft)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--text-disabled)] disabled:opacity-100"
            >
              {deletingTaskId === task.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </article>
    )
  }

  const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null
  const selectedTaskLinkedBlockerIds = selectedTask
    ? dependencies
        .filter((dependency) => dependency.task_id === selectedTask.id)
        .map((dependency) => dependency.depends_on_task_id)
    : []
  const selectedTaskAvailableBlockers = selectedTask
    ? tasks.filter(
        (candidateTask) =>
          candidateTask.id !== selectedTask.id &&
          !selectedTaskLinkedBlockerIds.includes(candidateTask.id),
      )
    : []

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] text-[var(--text-primary)]">
      <AppHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <section className="mx-auto max-w-[1600px] px-5 py-5">

        <DashboardStats stats={stats} onNewTaskClick={toggleCreateTaskForm} />

        <CreateTaskForm
          isOpen={isCreateTaskFormOpen}
          setIsOpen={(value) => {
            if (value) {
              setIsCreateTaskFormOpen(true)
            } else {
              closeCreateTaskForm()
            }
          }}
          taskTitle={taskTitle}
          setTaskTitle={setTaskTitle}
          taskDescription={taskDescription}
          setTaskDescription={setTaskDescription}
          taskSectionId={taskSectionId}
          setTaskSectionId={setTaskSectionId}
          fallbackSectionId={fallbackSectionId}
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskDifficulty={taskDifficulty}
          setTaskDifficulty={setTaskDifficulty}
          taskStartDate={taskStartDate}
          setTaskStartDate={setTaskStartDate}
          taskDueDate={taskDueDate}
          setTaskDueDate={setTaskDueDate}
          sections={sections}
          isCreating={isCreating}
          createTask={createTask}
        />

        <TaskFilters
              sectionFilter={sectionFilter}
          setSectionFilter={setSectionFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          visibilityFilter={visibilityFilter}
          setVisibilityFilter={setVisibilityFilter}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          sections={sections}
          clearFilters={clearFilters}
          archiveCompletedTasks={archiveCompletedTasks}
        />



        <div className="mb-4 grid items-stretch gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <WorkspaceSidebar
            sections={sections}
            tasks={tasks}
            activityLogs={activityLogs}
            newSectionName={newSectionName}
            setNewSectionName={setNewSectionName}
            sectionDraftNames={sectionDraftNames}
            setSectionDraftNames={setSectionDraftNames}
            creatingSection={creatingSection}
            deletingSectionId={deletingSectionId}
            createSection={createSection}
            renameSection={renameSection}
            deleteSection={deleteSection}
          />

          <TaskList
            viewMode={viewMode}
            groupedTasks={groupedTasks}
            filteredTaskCount={filteredTasks.length}
            isLoading={isLoading}
            errorMessage={errorMessage}
            sections={sections}
            updatingStatusTaskId={updatingStatusTaskId}
            updatingPriorityTaskId={updatingPriorityTaskId}
            updateTaskStatus={updateTaskStatus}
            updateTaskPriority={updateTaskPriority}
            getTaskComments={getTaskComments}
            getSubtasks={getSubtasks}
            selectedTaskId={selectedTaskId}
            onOpenTask={setSelectedTaskId}
            renderTask={renderTask}
          />

          {selectedTask ? (
            <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-2xl">
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
                  onClick={() => setSelectedTaskId(null)}
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
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
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
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Subtasks</p>
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      {getSubtasks(selectedTask.id).length}
                    </span>
                  </div>

                  {getSubtasks(selectedTask.id).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {getSubtasks(selectedTask.id).map((subtask) => (
                        <div key={subtask.id} className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{subtask.title}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            {getLabel(statusOptions, subtask.status)} · {getLabel(priorityOptions, subtask.priority)}
                          </p>
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
                      className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
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
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default App
