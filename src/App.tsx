import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { ActivityLog, Section, Task, TaskComment, TaskDependency, Workspace } from './types'
import { difficultyOptions, priorityOptions, statusOptions } from './constants'
import { formatDate, getLabel, isTaskOverdue } from './utils'
import { DashboardStats } from './components/DashboardStats'
import { TaskFilters } from './components/TaskFilters'
import { CreateTaskForm } from './components/CreateTaskForm'
import { TaskList } from './components/TaskList'
import { WorkspaceSidebar } from './components/WorkspaceSidebar'
import type { SidebarTool, ThemePreference } from './components/WorkspaceSidebar'
import { AppHeader } from './components/AppHeader'
import { AuthScreen } from './components/AuthScreen'
import { SettingsModal } from './components/SettingsModal'
import { TaskDetailDrawer } from './components/TaskDetailDrawer'
import { CalendarView } from './components/CalendarView'
import { TimelineView } from './components/TimelineView'
import { StatusOptions, SubtaskProgress } from './components/ui'
import { Icon } from './components/icons'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string | null>(null)
  const [updatingPriorityTaskId, setUpdatingPriorityTaskId] = useState<string | null>(null)
  const [updatingSectionTaskId, setUpdatingSectionTaskId] = useState<string | null>(null)
  const [updatingDifficultyTaskId, setUpdatingDifficultyTaskId] = useState<string | null>(null)
  const [addingDependencyTaskId, setAddingDependencyTaskId] = useState<string | null>(null)
  const [removingDependencyId, setRemovingDependencyId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [archivingTaskId, setArchivingTaskId] = useState<string | null>(null)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [duplicatingTaskId, setDuplicatingTaskId] = useState<string | null>(null)
  const [creatingSubtaskTaskId, setCreatingSubtaskTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [addingCommentTaskId, setAddingCommentTaskId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({})

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskStatus, setTaskStatus] = useState('')
  const [taskPriority, setTaskPriority] = useState('')
  const [taskDifficulty, setTaskDifficulty] = useState('')
  const [taskSectionId, setTaskSectionId] = useState('')
  const [taskStartDate, setTaskStartDate] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskSubtaskNames, setTaskSubtaskNames] = useState<string[]>([''])
  const [taskDependencyId, setTaskDependencyId] = useState('')
  const [taskDependencyDirection, setTaskDependencyDirection] = useState('')
  const [taskDependencyType, setTaskDependencyType] = useState('')

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
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'kanban' | 'timeline' | 'calendar'>('table')
  const [isCreateTaskFormOpen, setIsCreateTaskFormOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sidebarTool, setSidebarTool] = useState<SidebarTool>('workspaces')
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('finito-theme')
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })

  useEffect(() => {
    localStorage.setItem('finito-theme', theme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }

    applyTheme()

    if (theme === 'system') {
      media.addEventListener('change', applyTheme)
      return () => media.removeEventListener('change', applyTheme)
    }
  }, [theme])

  function openMobileTool(tool: SidebarTool) {
    setSidebarTool(tool)
    setIsMobileSheetOpen(true)
  }

  const fallbackSectionId = sections[0]?.id ?? ''

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return tasks.filter((task) => {
      const sectionName = sections.find((section) => section.id === task.section_id)?.name ?? ''
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false) ||
        sectionName.toLowerCase().includes(query) ||
        comments.some(
          (comment) => comment.task_id === task.id && comment.body.toLowerCase().includes(query),
        )

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      const matchesSection = sectionFilter === 'all' || task.section_id === sectionFilter
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'active' && !task.archived_at) ||
        (visibilityFilter === 'archived' && Boolean(task.archived_at))

      return matchesSearch && matchesStatus && matchesPriority && matchesSection && matchesVisibility
    })
  }, [comments, priorityFilter, searchQuery, sections, sectionFilter, statusFilter, tasks, visibilityFilter])

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

  async function loadProjectAndTasks(options: { showLoading?: boolean; workspaceId?: string } = {}) {
    const shouldShowLoading = options.showLoading ?? true

    setErrorMessage(null)

    if (shouldShowLoading) {
      setIsLoading(true)
    }

    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .order('created_at', { ascending: true })

    if (workspaceError) {
      setErrorMessage(workspaceError.message)
      setIsLoading(false)
      return
    }

    setWorkspaces(workspaceData ?? [])

    const targetWorkspaceId = options.workspaceId ?? workspaceId ?? workspaceData?.[0]?.id ?? null
    const isWorkspaceSwitch = targetWorkspaceId !== workspaceId
    setWorkspaceId(targetWorkspaceId)

    if (!targetWorkspaceId) {
      setProjectId(null)
      setSections([])
      setTasks([])
      setIsLoading(false)
      return
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', targetWorkspaceId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (projectError) {
      setErrorMessage(projectError.message)
      setIsLoading(false)
      return
    }

    const project = projectData?.[0]

    if (!project) {
      setProjectId(null)
      setSections([])
      setTasks([])
      setActivityLogs([])
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

    if ((isWorkspaceSwitch || !taskSectionId) && sectionData) {
      setTaskSectionId(sectionData[0]?.id ?? '')
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadProjectAndTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  async function signOut() {
    setSelectedTaskId(null)
    setWorkspaceId(null)
    setProjectId(null)
    setWorkspaces([])
    setTasks([])
    setSections([])
    setComments([])
    setDependencies([])
    setActivityLogs([])
    await supabase.auth.signOut()
  }

  async function createTask(mode: 'close' | 'reset' | 'duplicate' = 'close') {
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

    const sectionId = taskSectionId || fallbackSectionId || null

    const { data: createdTask, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        section_id: sectionId,
        parent_task_id: null,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        status: taskStatus || 'not_started',
        priority: taskPriority || null,
        difficulty: taskDifficulty || 'not_scoped',
        start_date: taskStartDate || null,
        due_date: taskDueDate || null,
        archived_at: null,
        position: tasks.length + 1,
      })
      .select('id')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setIsCreating(false)
      return
    }

    // Optional subtasks created inline with the parent.
    const subtaskTitles = taskSubtaskNames.map((name) => name.trim()).filter(Boolean)
    if (subtaskTitles.length > 0 && createdTask) {
      await supabase.from('tasks').insert(
        subtaskTitles.map((title, index) => ({
          project_id: projectId,
          section_id: sectionId,
          parent_task_id: createdTask.id,
          title,
          description: null,
          status: 'not_started',
          priority: null,
          difficulty: 'not_scoped',
          start_date: null,
          due_date: taskDueDate || null,
          archived_at: null,
          position: index + 1,
        })),
      )
    }

    // Optional dependency on an existing task: direction (this task is
    // Blocked by / Blocking the target) + block type (SS/SF/FS/FF).
    if (taskDependencyId && createdTask) {
      const blockType = taskDependencyType || 'FS'
      const link =
        taskDependencyDirection === 'blocking'
          ? { task_id: taskDependencyId, depends_on_task_id: createdTask.id }
          : { task_id: createdTask.id, depends_on_task_id: taskDependencyId }
      await supabase.from('task_dependencies').insert({ ...link, dependency_type: blockType })
    }

    await logActivity('Created task', taskTitle.trim())

    if (mode === 'close' || mode === 'reset') {
      setTaskTitle('')
      setTaskDescription('')
      setTaskStatus('')
      setTaskPriority('')
      setTaskDifficulty('')
      setTaskSectionId(taskSectionId || fallbackSectionId)
      setTaskStartDate('')
      setTaskDueDate('')
      setTaskSubtaskNames([''])
      setTaskDependencyId('')
      setTaskDependencyDirection('')
      setTaskDependencyType('')
    }
    // 'duplicate' keeps every field as-is so the next task is pre-filled.

    setIsCreating(false)
    if (mode === 'close') {
      setIsCreateTaskFormOpen(false)
    }
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

  async function updateTaskDifficulty(taskId: string, difficulty: string) {
    const nextDifficulty = difficulty || 'not_scoped'

    setUpdatingDifficultyTaskId(taskId)
    setErrorMessage(null)

    const { error } = await supabase.from('tasks').update({ difficulty: nextDifficulty }).eq('id', taskId)

    if (error) {
      setErrorMessage(error.message)
      setUpdatingDifficultyTaskId(null)
      return
    }

    const updatedTask = tasks.find((task) => task.id === taskId)

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, difficulty: nextDifficulty } : task)),
    )

    await logActivity(
      'Updated task scope',
      `${updatedTask?.title ?? 'Task'} → ${getLabel(difficultyOptions, nextDifficulty)}`,
      taskId,
    )

    setUpdatingDifficultyTaskId(null)
  }

  function moveTaskToGroup(taskId: string, groupId: string) {
    if (groupBy === 'status') {
      updateTaskStatus(taskId, groupId)
    } else if (groupBy === 'priority') {
      updateTaskPriority(taskId, groupId === 'no_priority' ? '' : groupId)
    } else {
      updateTaskDifficulty(taskId, groupId === 'no_scope' ? '' : groupId)
    }
  }

  // Inline "Add task" from a list-view group: the new task inherits the
  // group's value for whatever field is currently grouped on.
  async function addTaskToGroup(groupId: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed || !projectId) {
      return
    }

    const newTask = {
      project_id: projectId,
      section_id: fallbackSectionId || null,
      parent_task_id: null,
      title: trimmed,
      description: null,
      status: groupBy === 'status' ? groupId : 'not_started',
      priority: groupBy === 'priority' ? (groupId === 'no_priority' ? null : groupId) : null,
      difficulty: groupBy === 'scope' ? (groupId === 'no_scope' ? 'not_scoped' : groupId) : 'not_scoped',
      start_date: null,
      due_date: null,
      archived_at: null,
      position: tasks.length + 1,
    }

    const { error } = await supabase.from('tasks').insert(newTask)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await logActivity('Created task', trimmed)
    await loadProjectAndTasks()
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

    const removed = dependencies.find((dependency) => dependency.id === dependencyId)

    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('id', dependencyId)

    if (error) {
      setErrorMessage(error.message)
      setRemovingDependencyId(null)
      return
    }

    const remainingDependencies = dependencies.filter((dependency) => dependency.id !== dependencyId)
    setDependencies(remainingDependencies)

    // When the last blocker is cleared, a task that was auto-marked Blocked
    // shouldn't stay stuck — return it to Not started.
    if (removed) {
      const blockedTask = tasks.find((task) => task.id === removed.task_id)
      const stillBlocked = remainingDependencies.some((dependency) => dependency.task_id === removed.task_id)

      if (blockedTask && blockedTask.status === 'blocked' && !stillBlocked) {
        const { error: statusError } = await supabase
          .from('tasks')
          .update({ status: 'not_started' })
          .eq('id', removed.task_id)

        if (!statusError) {
          setTasks((currentTasks) =>
            currentTasks.map((task) =>
              task.id === removed.task_id ? { ...task, status: 'not_started' } : task,
            ),
          )
          await logActivity('Updated task status', `${blockedTask.title} → Not started`, removed.task_id)
        }
      }
    }

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

  async function switchWorkspace(nextWorkspaceId: string) {
    if (nextWorkspaceId === workspaceId) {
      return
    }

    setSelectedTaskId(null)
    await loadProjectAndTasks({ workspaceId: nextWorkspaceId })
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = newWorkspaceName.trim()

    if (!name) {
      setErrorMessage('Workspace name is required.')
      return
    }

    setCreatingWorkspace(true)
    setErrorMessage(null)

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: session?.user.id })
      .select('id, name')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setCreatingWorkspace(false)
      return
    }

    const { error: projectError } = await supabase
      .from('projects')
      .insert({ workspace_id: workspace.id, name: 'General' })

    if (projectError) {
      setErrorMessage(projectError.message)
      setCreatingWorkspace(false)
      return
    }

    setNewWorkspaceName('')
    setCreatingWorkspace(false)
    setSelectedTaskId(null)
    await loadProjectAndTasks({ workspaceId: workspace.id })
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

  const pillSelectClass =
    'h-8 max-w-[160px] cursor-pointer rounded-full border px-2.5 text-xs font-semibold outline-none transition'
  const pillToneNeutral = 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
  const pillTonePrimary = 'border-[var(--primary-main)]/30 bg-[var(--primary-light)] text-[var(--primary-dark)]'

  function renderTask(task: Task) {
    const blockingTasks = getBlockingTasks(task.id)
    const taskIsOverdue = isTaskOverdue(task)
    const subtasks = getSubtasks(task.id)
    const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'done').length

    return (
      <article
        key={task.id}
        className="border-b border-[var(--outline-soft)] bg-[var(--background-paper)] px-4 py-3 transition hover:bg-[var(--surface-muted)]"
      >
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{task.title}</h3>
          {task.archived_at && (
            <span className="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              Archived
            </span>
          )}
          {taskIsOverdue && (
            <span className="shrink-0 rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)]">
              Overdue
            </span>
          )}
          {blockingTasks.length > 0 && (
            <span className="shrink-0 rounded-full border border-[var(--error-main)]/35 bg-[var(--error-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--error-dark)]">
              Blocked by {blockingTasks.length}
            </span>
          )}
        </div>

        {task.description && (
          <p className="mt-1 max-w-3xl truncate text-xs leading-5 text-[var(--text-disabled)]">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <select
            aria-label={`Status for ${task.title}`}
            value={task.status}
            disabled={updatingStatusTaskId === task.id}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => updateTaskStatus(task.id, event.target.value)}
            className={`${pillSelectClass} ${pillToneNeutral}`}
          >
            <StatusOptions />
          </select>

          <select
            aria-label={`Priority for ${task.title}`}
            value={task.priority ?? ''}
            disabled={updatingPriorityTaskId === task.id}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => updateTaskPriority(task.id, event.target.value)}
            className={`${pillSelectClass} ${task.priority ? pillTonePrimary : pillToneNeutral}`}
          >
            <option value="">No priority</option>
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>

          <select
            aria-label={`Scope for ${task.title}`}
            value={task.difficulty ?? 'not_scoped'}
            disabled={updatingDifficultyTaskId === task.id}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => updateTaskDifficulty(task.id, event.target.value)}
            className={`${pillSelectClass} ${pillToneNeutral}`}
          >
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
            ))}
          </select>

          {sections.length > 0 && (
            <select
              aria-label={`Section for ${task.title}`}
              value={task.section_id ?? ''}
              disabled={updatingSectionTaskId === task.id}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => updateTaskSection(task.id, event.target.value)}
              className={`${pillSelectClass} ${pillToneNeutral}`}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          )}

          <span className={`rounded-full px-3 py-1 text-[11px] ${taskIsOverdue ? 'bg-[var(--error-light)] text-[var(--error-dark)]' : 'bg-[var(--surface-subtle)] text-[var(--text-disabled)]'}`}>
            Due: {formatDate(task.due_date)}
          </span>
        </div>

        {subtasks.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Subtasks</span>
            <SubtaskProgress done={completedSubtasks} total={subtasks.length} className="max-w-[200px] flex-1" />
          </div>
        )}
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
  const selectedTaskSiblings = selectedTask
    ? tasks
        .filter(
          (currentTask) =>
            currentTask.section_id === selectedTask.section_id &&
            currentTask.parent_task_id === selectedTask.parent_task_id,
        )
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : []
  const selectedTaskOrderIndex = selectedTask
    ? selectedTaskSiblings.findIndex((currentTask) => currentTask.id === selectedTask.id)
    : -1
  const selectedTaskCanMoveUp = selectedTaskOrderIndex > 0
  const selectedTaskCanMoveDown =
    selectedTaskOrderIndex >= 0 && selectedTaskOrderIndex < selectedTaskSiblings.length - 1

  if (!authReady) {
    return <main className="min-h-screen bg-[var(--surface-muted)]" />
  }

  if (!session) {
    return <AuthScreen />
  }

  const workspacesIcon = <Icon name="workspaces" className="h-[22px] w-[22px]" />
  const activityIcon = <Icon name="activity" className="h-[22px] w-[22px]" />
  const settingsIcon = <Icon name="settings" className="h-[22px] w-[22px]" />

  const sheetNavItems: { tool: SidebarTool; label: string; icon: React.ReactNode }[] = [
    { tool: 'workspaces', label: 'Workspaces', icon: workspacesIcon },
    { tool: 'activity', label: 'Activity', icon: activityIcon },
  ]

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] text-[var(--text-primary)]">
      <AppHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <section className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-5 lg:pb-5">

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
          taskStatus={taskStatus}
          setTaskStatus={setTaskStatus}
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
          taskSubtaskNames={taskSubtaskNames}
          setTaskSubtaskNames={setTaskSubtaskNames}
          taskDependencyId={taskDependencyId}
          setTaskDependencyId={setTaskDependencyId}
          taskDependencyDirection={taskDependencyDirection}
          setTaskDependencyDirection={setTaskDependencyDirection}
          taskDependencyType={taskDependencyType}
          setTaskDependencyType={setTaskDependencyType}
          tasks={tasks}
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



        <div className="mb-4 grid items-stretch gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <WorkspaceSidebar
              activityLogs={activityLogs}
              workspaces={workspaces}
              currentWorkspaceId={workspaceId}
              newWorkspaceName={newWorkspaceName}
              setNewWorkspaceName={setNewWorkspaceName}
              creatingWorkspace={creatingWorkspace}
              createWorkspace={createWorkspace}
              switchWorkspace={switchWorkspace}
              activeTool={sidebarTool}
              setActiveTool={setSidebarTool}
              onOpenSettings={() => setIsSettingsOpen(true)}
              signOut={signOut}
            />
          </div>

          <div className="min-w-0 space-y-4">
          <DashboardStats stats={stats} onNewTaskClick={toggleCreateTaskForm} />

          {viewMode === 'calendar' ? (
            <CalendarView
              tasks={groupedTasks.flatMap((group) => group.tasks)}
              getSubtasks={getSubtasks}
              selectedTaskId={selectedTaskId}
              onOpenTask={setSelectedTaskId}
            />
          ) : viewMode === 'timeline' ? (
            <TimelineView
              tasks={groupedTasks.flatMap((group) => group.tasks)}
              getSubtasks={getSubtasks}
              selectedTaskId={selectedTaskId}
              onOpenTask={setSelectedTaskId}
            />
          ) : (
          <TaskList
            viewMode={viewMode}
            groupedTasks={groupedTasks}
            filteredTaskCount={filteredTasks.length}
            isLoading={isLoading}
            errorMessage={errorMessage}
            sections={sections}
            updatingStatusTaskId={updatingStatusTaskId}
            updatingPriorityTaskId={updatingPriorityTaskId}
            updatingDifficultyTaskId={updatingDifficultyTaskId}
            updatingSectionTaskId={updatingSectionTaskId}
            updateTaskStatus={updateTaskStatus}
            updateTaskPriority={updateTaskPriority}
            updateTaskDifficulty={updateTaskDifficulty}
            updateTaskSection={updateTaskSection}
            moveTaskToGroup={moveTaskToGroup}
            addTaskToGroup={addTaskToGroup}
            getTaskComments={getTaskComments}
            getSubtasks={getSubtasks}
            selectedTaskId={selectedTaskId}
            onOpenTask={setSelectedTaskId}
            renderTask={renderTask}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
          />
          )}
          </div>

          {selectedTask ? (
            <TaskDetailDrawer
              selectedTask={selectedTask}
              onClose={() => setSelectedTaskId(null)}
              sections={sections}
              updatingStatusTaskId={updatingStatusTaskId}
              updateTaskStatus={updateTaskStatus}
              updatingPriorityTaskId={updatingPriorityTaskId}
              updateTaskPriority={updateTaskPriority}
              updatingSectionTaskId={updatingSectionTaskId}
              updateTaskSection={updateTaskSection}
              getSubtasks={getSubtasks}
              deletingTaskId={deletingTaskId}
              deleteTask={deleteTask}
              subtaskDrafts={subtaskDrafts}
              setSubtaskDrafts={setSubtaskDrafts}
              creatingSubtaskTaskId={creatingSubtaskTaskId}
              createSubtask={createSubtask}
              getTaskComments={getTaskComments}
              commentDrafts={commentDrafts}
              setCommentDrafts={setCommentDrafts}
              addingCommentTaskId={addingCommentTaskId}
              addComment={addComment}
              deletingCommentId={deletingCommentId}
              deleteComment={deleteComment}
              getBlockingTasks={getBlockingTasks}
              getBlockedTasks={getBlockedTasks}
              removingDependencyId={removingDependencyId}
              removeTaskDependency={removeTaskDependency}
              addingDependencyTaskId={addingDependencyTaskId}
              addTaskDependency={addTaskDependency}
              selectedTaskAvailableBlockers={selectedTaskAvailableBlockers}
              selectedTaskCanMoveUp={selectedTaskCanMoveUp}
              selectedTaskCanMoveDown={selectedTaskCanMoveDown}
              editingTaskId={editingTaskId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              editDifficulty={editDifficulty}
              setEditDifficulty={setEditDifficulty}
              editStartDate={editStartDate}
              setEditStartDate={setEditStartDate}
              editDueDate={editDueDate}
              setEditDueDate={setEditDueDate}
              savingTaskId={savingTaskId}
              saveTaskEdits={saveTaskEdits}
              cancelEditingTask={cancelEditingTask}
              startEditingTask={startEditingTask}
              quickSetTaskDone={quickSetTaskDone}
              quickReopenTask={quickReopenTask}
              duplicatingTaskId={duplicatingTaskId}
              duplicateTask={duplicateTask}
              movingTaskId={movingTaskId}
              moveTask={moveTask}
              archivingTaskId={archivingTaskId}
              archiveTask={archiveTask}
              restoreTask={restoreTask}
            />
          ) : null}
        </div>
      </section>

      {/* Mobile sheet for sidebar tools */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[var(--background-paper)] pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl">
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-[var(--outline)]" />
            </div>
            <WorkspaceSidebar
              activityLogs={activityLogs}
              workspaces={workspaces}
              currentWorkspaceId={workspaceId}
              newWorkspaceName={newWorkspaceName}
              setNewWorkspaceName={setNewWorkspaceName}
              creatingWorkspace={creatingWorkspace}
              createWorkspace={createWorkspace}
              switchWorkspace={(id) => {
                switchWorkspace(id)
                setIsMobileSheetOpen(false)
              }}
              activeTool={sidebarTool}
              setActiveTool={setSidebarTool}
              onOpenSettings={() => {
                setIsMobileSheetOpen(false)
                setIsSettingsOpen(true)
              }}
              signOut={signOut}
              sticky={false}
            />
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-[var(--outline-soft)] bg-[var(--background-paper)] pb-[max(env(safe-area-inset-bottom),0px)] lg:hidden">
        {sheetNavItems.map((item) => {
          const isActive = isMobileSheetOpen && sidebarTool === item.tool
          return (
            <button
              key={item.tool}
              type="button"
              onClick={() => {
                if (isMobileSheetOpen && sidebarTool === item.tool) {
                  setIsMobileSheetOpen(false)
                } else {
                  openMobileTool(item.tool)
                }
              }}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => {
            setIsMobileSheetOpen(false)
            setIsSettingsOpen(true)
          }}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-[var(--text-muted)]"
        >
          <span aria-hidden="true">{settingsIcon}</span>
          Settings
        </button>
        <button
          type="button"
          onClick={toggleCreateTaskForm}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-[var(--primary)]"
        >
          <span aria-hidden="true">
            <Icon name="add" className="h-[22px] w-[22px]" />
          </span>
          New
        </button>
      </nav>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={session.user.email ?? ''}
        theme={theme}
        setTheme={setTheme}
        signOut={signOut}
      />
    </main>
  )
}

export default App
