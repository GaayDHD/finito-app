import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import type { ActivityLog, Section, Task, TaskComment, TaskDependency } from './types'
import { difficultyOptions, priorityOptions, statusOptions } from './constants'
import { formatDate, getLabel, isTaskOverdue } from './utils'
import { DashboardStats } from './components/DashboardStats'
import { TaskFilters } from './components/TaskFilters'
import { RecentActivityPanel } from './components/RecentActivityPanel'
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
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null)
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
        className={`rounded-2xl border bg-[#181b1f] p-5 transition hover:bg-[#1d2026] ${
          blockingTasks.length > 0 || taskIsOverdue
            ? 'border-red-300/30 hover:border-red-300/50'
            : 'border-white/10 hover:border-violet-300/40'
        }`}
      >
        <div className="space-y-4">
          <div className="min-w-0">
            {task.status === 'done' ? (
              <button
                type="button"
                onClick={() => quickReopenTask(task)}
                className="rounded-full border border-amber-300/10 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-300/40"
              >
                Reopen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => quickSetTaskDone(task)}
                className="rounded-full border border-emerald-300/10 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/40"
              >
                Mark done
              </button>
            )}

            <button
              type="button"
              disabled={!canMoveUp || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'up')}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move up
            </button>

            <button
              type="button"
              disabled={!canMoveDown || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'down')}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move down
            </button>

            <button
              type="button"
              disabled={duplicatingTaskId === task.id}
              onClick={() => duplicateTask(task)}
              className="rounded-full border border-violet-300/10 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {duplicatingTaskId === task.id ? 'Duplicating…' : 'Duplicate'}
            </button>

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
                  {task.archived_at && (
                    <span className="rounded-full border border-zinc-300/10 bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                      Archived
                    </span>
                  )}
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
                  <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-400">
                    Comments: {taskComments.length}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-400">
                    Subtasks: {completedSubtasks}/{subtasks.length}
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Subtasks
              </p>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
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
                      className="rounded-2xl border border-white/10 bg-[#111315] p-3"
                    >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{subtask.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {getLabel(statusOptions, subtask.status)} · {subtask.priority ? getLabel(priorityOptions, subtask.priority) : 'No priority'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!canMoveSubtaskUp || movingTaskId === subtask.id}
                          onClick={() => moveTask(subtask.id, 'up')}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move up
                        </button>

                        <button
                          type="button"
                          disabled={!canMoveSubtaskDown || movingTaskId === subtask.id}
                          onClick={() => moveTask(subtask.id, 'down')}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move down
                        </button>

                        {subtask.status === 'done' ? (
                          <button
                            type="button"
                            onClick={() => quickReopenTask(subtask)}
                            className="rounded-full border border-amber-300/10 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-300/40"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => quickSetTaskDone(subtask)}
                            className="rounded-full border border-emerald-300/10 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/40"
                          >
                            Mark done
                          </button>
                        )}

                        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200">
                          <span className="text-zinc-500">Status</span>
                          <select
                            aria-label={`Status for ${subtask.title}`}
                            value={subtask.status}
                            disabled={updatingStatusTaskId === subtask.id}
                            onChange={(event) => updateTaskStatus(subtask.id, event.target.value)}
                            className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value} className="bg-[#181b1f] text-white">
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                          <span className="text-violet-200/60">Priority</span>
                          <select
                            aria-label={`Priority for ${subtask.title}`}
                            value={subtask.priority ?? ''}
                            disabled={updatingPriorityTaskId === subtask.id}
                            onChange={(event) => updateTaskPriority(subtask.id, event.target.value)}
                            className="cursor-pointer appearance-auto bg-transparent text-xs font-semibold text-violet-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="" className="bg-[#181b1f] text-white">
                              No priority
                            </option>
                            {priorityOptions.map((priority) => (
                              <option key={priority.value} value={priority.value} className="bg-[#181b1f] text-white">
                                {priority.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          disabled={deletingTaskId === subtask.id}
                          onClick={() => deleteTask(subtask.id)}
                          className="rounded-full border border-red-300/10 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
              />
              <button
                type="button"
                disabled={creatingSubtaskTaskId === task.id || !(subtaskDrafts[task.id] ?? '').trim()}
                onClick={() => createSubtask(task)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creatingSubtaskTaskId === task.id ? 'Adding…' : 'Add subtask'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Comments
              </p>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                {taskComments.length}
              </span>
            </div>

            {taskComments.length > 0 && (
              <div className="mb-3 space-y-2">
                {taskComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-[#111315] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm leading-6 text-zinc-200">{comment.body}</p>
                      <p className="mt-1 text-xs text-zinc-500">
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
                      className="shrink-0 text-xs font-semibold text-red-200/70 transition hover:text-red-100 disabled:opacity-50"
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
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
              />
              <button
                type="button"
                disabled={addingCommentTaskId === task.id}
                onClick={() => addComment(task.id)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingCommentTaskId === task.id ? 'Adding…' : 'Comment'}
              </button>
            </div>
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

            <button
              type="button"
              disabled={!canMoveUp || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'up')}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move up
            </button>

            <button
              type="button"
              disabled={!canMoveDown || movingTaskId === task.id}
              onClick={() => moveTask(task.id, 'down')}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move down
            </button>

            <button
              type="button"
              disabled={duplicatingTaskId === task.id}
              onClick={() => duplicateTask(task)}
              className="rounded-full border border-violet-300/10 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {duplicatingTaskId === task.id ? 'Duplicating…' : 'Duplicate'}
            </button>

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

            {task.archived_at ? (
              <button
                type="button"
                disabled={archivingTaskId === task.id}
                onClick={() => restoreTask(task)}
                className="rounded-full border border-emerald-300/10 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archivingTaskId === task.id ? 'Restoring…' : 'Restore'}
              </button>
            ) : (
              <button
                type="button"
                disabled={archivingTaskId === task.id}
                onClick={() => archiveTask(task)}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archivingTaskId === task.id ? 'Archiving…' : 'Archive'}
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

        <DashboardStats stats={stats} />

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

        <TaskFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Manage sections</h2>
            <p className="text-sm text-zinc-400">Create, rename and delete empty project sections.</p>
          </div>

          <form onSubmit={createSection} className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              placeholder="New section name"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/60"
            />
            <button
              type="submit"
              disabled={creatingSection}
              className="rounded-2xl bg-violet-300 px-5 py-3 text-sm font-semibold text-[#111315] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingSection ? 'Creating…' : 'Create section'}
            </button>
          </form>

          <div className="space-y-2">
            {sections.map((section) => {
              const sectionTaskCount = tasks.filter((task) => task.section_id === section.id).length

              return (
                <div
                  key={section.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#181b1f] p-3 sm:flex-row sm:items-center"
                >
                  <input
                    value={sectionDraftNames[section.id] ?? section.name}
                    onChange={(event) =>
                      setSectionDraftNames((currentDrafts) => ({
                        ...currentDrafts,
                        [section.id]: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111315] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-300/60"
                  />

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                    {sectionTaskCount} tasks
                  </span>

                  <button
                    type="button"
                    disabled={renamingSectionId === section.id}
                    onClick={() => renameSection(section.id)}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {renamingSectionId === section.id ? 'Saving…' : 'Rename'}
                  </button>

                  <button
                    type="button"
                    disabled={deletingSectionId === section.id || sectionTaskCount > 0}
                    onClick={() => deleteSection(section.id)}
                    className="rounded-xl border border-red-300/10 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <RecentActivityPanel activityLogs={activityLogs} />

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold">Finito Build</h2>
              <p className="text-sm text-zinc-400">Tasks grouped by status, priority or scope.</p>
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
              {groupedTasks.map((group) => (
                <section key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      {group.name}
                    </h3>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                      {group.tasks.length} tasks
                    </span>
                  </div>

                  {group.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {group.tasks.map((task) => renderTask(task))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-zinc-500">
                      No matching tasks in this group.
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
