import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Section, Task } from '../types'
import { difficultyOptions, priorityOptions, statusOptions } from '../constants'
import { formatDate } from '../utils'
import { Badge, Checkbox, EmptyState, ICON_DASHED_PLUS, priorityToneClass, StatusGlyph, StatusOptions, StatusToggle, statusToneClass, TaskListSkeleton } from './ui'
import { Icon } from './icons'
import type { IconName } from './icons'

// Ghost "Add task" row shown at the bottom of every list-view group. Clicking
// it reveals an inline name input; the created task inherits the group's value.
function AddTaskRow({
  groupId,
  onAdd,
}: {
  groupId: string
  onAdd: (groupId: string, title: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  function start() {
    doneRef.current = false
    setEditing(true)
  }

  function finish(save: boolean) {
    if (doneRef.current) {
      return
    }
    doneRef.current = true
    const trimmed = value.trim()
    if (save && trimmed) {
      onAdd(groupId, trimmed)
    }
    setValue('')
    setEditing(false)
  }

  return (
    <div className="px-4 py-2 text-[13px]">
      {editing ? (
        <div className="flex items-center gap-2">
          <StatusGlyph markup={ICON_DASHED_PLUS} className="h-5 w-5 shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') finish(true)
              if (event.key === 'Escape') finish(false)
            }}
            onBlur={() => finish(true)}
            placeholder="Task name"
            className="w-full bg-transparent font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
        >
          <StatusGlyph markup={ICON_DASHED_PLUS} className="h-5 w-5 shrink-0" />
          <span className="font-medium">Add task</span>
        </button>
      )}
    </div>
  )
}

type TaskGroup = {
  id: string
  name: string
  tasks: Task[]
}

type SortField =
  | 'title'
  | 'status'
  | 'priority'
  | 'difficulty'
  | 'section_id'
  | 'start_date'
  | 'due_date'
  | 'comments'
  | 'subtasks'

type FilterField = SortField

type TableSort = {
  field: SortField
  direction: 'asc' | 'desc'
}

type TableFilters = Record<FilterField, string[]>

type TaskListProps = {
  viewMode: 'card' | 'table' | 'kanban'
  groupedTasks: TaskGroup[]
  filteredTaskCount: number
  isLoading: boolean
  errorMessage: string | null
  sections: Section[]
  updatingStatusTaskId: string | null
  updatingPriorityTaskId: string | null
  updatingDifficultyTaskId: string | null
  updatingSectionTaskId: string | null
  updateTaskStatus: (taskId: string, status: string) => void
  updateTaskPriority: (taskId: string, priority: string) => void
  updateTaskDifficulty: (taskId: string, difficulty: string) => void
  updateTaskSection: (taskId: string, sectionId: string) => void
  moveTaskToGroup: (taskId: string, groupId: string) => void
  addTaskToGroup: (groupId: string, title: string) => void
  getTaskComments: (taskId: string) => unknown[]
  getSubtasks: (taskId: string) => Task[]
  selectedTaskId: string | null
  onOpenTask: (taskId: string) => void
  renderTask: (task: Task) => ReactNode
  groupBy: 'status' | 'priority' | 'scope'
  setGroupBy: (value: 'status' | 'priority' | 'scope') => void
}

const groupByOptions: { value: 'status' | 'priority' | 'scope'; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'scope', label: 'Scope' },
]

const columns: { id: string; label: string; field: SortField; align: 'left' | 'center'; track: string; minWidth: number; icon?: IconName }[] = [
  { id: 'task', label: 'Task', field: 'title', align: 'left', track: 'minmax(320px,1.8fr)', minWidth: 320, icon: 'subtask' },
  { id: 'status', label: 'Status', field: 'status', align: 'center', track: '150px', minWidth: 150, icon: 'status' },
  { id: 'priority', label: 'Priority', field: 'priority', align: 'center', track: '140px', minWidth: 140, icon: 'priority' },
  { id: 'scope', label: 'Scope', field: 'difficulty', align: 'center', track: '140px', minWidth: 140, icon: 'scope' },
  { id: 'section', label: 'Section', field: 'section_id', align: 'center', track: '150px', minWidth: 150, icon: 'section' },
  { id: 'start', label: 'Start', field: 'start_date', align: 'center', track: '120px', minWidth: 120, icon: 'date' },
  { id: 'due', label: 'Due', field: 'due_date', align: 'center', track: '120px', minWidth: 120, icon: 'date' },
  { id: 'subtasks', label: 'Subtasks', field: 'subtasks', align: 'center', track: '120px', minWidth: 120, icon: 'subtask' },
]

// Every column except the task title can be hidden (Miller's Law).
const toggleableColumns = columns.filter((column) => column.id !== 'task')


function normaliseFilterValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '__none__'
  }

  return String(value)
}

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function getTaskColumnValue(
  task: Task,
  field: SortField,
  getTaskComments: (taskId: string) => unknown[],
  getSubtasks: (taskId: string) => Task[],
) {
  if (field === 'comments') {
    return getTaskComments(task.id).length
  }

  if (field === 'subtasks') {
    return getSubtasks(task.id).length
  }

  if (field === 'section_id') {
    return task.section_id ?? null
  }

  return task[field] ?? null
}

function getTaskSortValue(
  task: Task,
  field: SortField,
  sections: Section[],
  getTaskComments: (taskId: string) => unknown[],
  getSubtasks: (taskId: string) => Task[],
) {
  if (field === 'comments' || field === 'subtasks') {
    return getTaskColumnValue(task, field, getTaskComments, getSubtasks) as number
  }

  if (field === 'section_id') {
    return sections.find((section) => section.id === task.section_id)?.name ?? 'No section'
  }

  return normaliseFilterValue(getTaskColumnValue(task, field, getTaskComments, getSubtasks))
}

function uniqueOptions(options: { value: string; label: string }[]) {
  const seen = new Set<string>()

  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false
    }

    seen.add(option.value)
    return true
  })
}

export function TaskList({
  viewMode,
  groupedTasks,
  filteredTaskCount,
  isLoading,
  errorMessage,
  sections,
  updatingStatusTaskId,
  updatingPriorityTaskId,
  updatingDifficultyTaskId,
  updatingSectionTaskId,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskDifficulty,
  updateTaskSection,
  moveTaskToGroup,
  addTaskToGroup,
  getTaskComments,
  getSubtasks,
  selectedTaskId,
  onOpenTask,
  renderTask,
  groupBy,
  setGroupBy,
}: TaskListProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [openHeaderMenu, setOpenHeaderMenu] = useState<string | null>(null)
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('finito-hidden-columns')
      return stored ? (JSON.parse(stored) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })
  const [tableSort, setTableSort] = useState<TableSort | null>(null)
  const [tableFilters, setTableFilters] = useState<TableFilters>({
    title: [],
    status: [],
    priority: [],
    difficulty: [],
    section_id: [],
    start_date: [],
    due_date: [],
    comments: [],
    subtasks: [],
  })

  const allTableTasks = useMemo(
    () => groupedTasks.flatMap((group) => group.tasks),
    [groupedTasks],
  )

  const filterOptionsByField = useMemo(() => {
    return {
      title: uniqueOptions(
        allTableTasks
          .map((task) => ({
            value: task.title,
            label: task.title,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ),
      status: statusOptions.map((status) => ({
        value: status.value,
        label: status.label,
      })),
      priority: [
        ...priorityOptions.map((priority) => ({
          value: priority.value,
          label: priority.label,
        })),
        { value: '__none__', label: 'No priority' },
      ],
      difficulty: [
        ...difficultyOptions.map((difficulty) => ({
          value: difficulty.value,
          label: difficulty.label,
        })),
        { value: '__none__', label: 'No scope' },
      ],
      section_id: [
        ...sections.map((section) => ({
          value: section.id,
          label: section.name,
        })),
        { value: '__none__', label: 'No section' },
      ],
      start_date: uniqueOptions(
        allTableTasks
          .map((task) => ({
            value: normaliseFilterValue(task.start_date),
            label: task.start_date ? formatDate(task.start_date) : 'No start date',
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ),
      due_date: uniqueOptions(
        allTableTasks
          .map((task) => ({
            value: normaliseFilterValue(task.due_date),
            label: task.due_date ? formatDate(task.due_date) : 'No due date',
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ),
      comments: uniqueOptions(
        allTableTasks
          .map((task) => {
            const count = getTaskComments(task.id).length
            return {
              value: String(count),
              label: String(count),
            }
          })
          .sort((a, b) => Number(a.value) - Number(b.value)),
      ),
      subtasks: uniqueOptions(
        allTableTasks
          .map((task) => {
            const count = getSubtasks(task.id).length
            return {
              value: String(count),
              label: String(count),
            }
          })
          .sort((a, b) => Number(a.value) - Number(b.value)),
      ),
    } satisfies Record<FilterField, { value: string; label: string }[]>
  }, [allTableTasks, getTaskComments, getSubtasks, sections])

  const activeFilterCount = Object.values(tableFilters).reduce(
    (total, values) => total + values.length,
    0,
  )

  const tableGroups = useMemo(() => {
    return groupedTasks.map((group) => {
      const filteredTasks = group.tasks.filter((task) => {
        return columns.every((column) => {
          const activeValues = tableFilters[column.field]

          if (activeValues.length === 0) {
            return true
          }

          const taskValue = normaliseFilterValue(
            getTaskColumnValue(task, column.field, getTaskComments, getSubtasks),
          )

          return activeValues.includes(taskValue)
        })
      })

      const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (!tableSort) {
          return (a.position ?? 0) - (b.position ?? 0)
        }

        const aValue = getTaskSortValue(a, tableSort.field, sections, getTaskComments, getSubtasks)
        const bValue = getTaskSortValue(b, tableSort.field, sections, getTaskComments, getSubtasks)
        const result = compareValues(aValue, bValue)

        return tableSort.direction === 'asc' ? result : -result
      })

      return {
        ...group,
        tasks: sortedTasks,
      }
    })
  }, [getSubtasks, getTaskComments, groupedTasks, sections, tableFilters, tableSort])

  const tableVisibleCount = tableGroups.reduce((total, group) => total + group.tasks.length, 0)

  function selectSort(field: SortField) {
    setTableSort((currentSort) => {
      if (currentSort?.field === field) {
        return {
          field,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        field,
        direction: 'asc',
      }
    })
  }

  function toggleFilter(field: FilterField, value: string) {
    setTableFilters((currentFilters) => {
      const currentValues = currentFilters[field]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value]

      return {
        ...currentFilters,
        [field]: nextValues,
      }
    })
  }

  function clearTableControls() {
    setTableSort(null)
    setTableFilters({
      title: [],
      status: [],
      priority: [],
      difficulty: [],
      section_id: [],
      start_date: [],
      due_date: [],
      comments: [],
      subtasks: [],
    })
  }

  function clearColumnFilter(field: FilterField) {
    setTableFilters((currentFilters) => ({
      ...currentFilters,
      [field]: [],
    }))
  }

  function renderHeaderMenu(column: { id: string; label: string; field: SortField }) {
    const isOpen = openHeaderMenu === column.id
    const filterOptions = filterOptionsByField[column.field]

    if (!isOpen) {
      return null
    }

    return (
      <div className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-3 text-left shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Sort by {column.label}
          </p>
          {tableSort?.field === column.field && (
            <span className="rounded-full bg-[var(--primary-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-main)]">
              {tableSort.direction === 'asc' ? 'ASC' : 'DESC'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => selectSort(column.field)}
          className="mb-4 w-full rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--primary-light)] hover:text-[var(--primary-dark)]"
        >
          Sort by {column.label}
          {tableSort?.field === column.field && (
            <span className="ml-1 text-[var(--primary-main)]">
              {tableSort.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Filter by {column.label}
          </p>
          {tableFilters[column.field].length > 0 && (
            <button
              type="button"
              onClick={() => clearColumnFilter(column.field)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mb-4 max-h-52 space-y-1 overflow-auto pr-1">
          {filterOptions.length > 0 ? (
            filterOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
              >
                <input
                  type="checkbox"
                  checked={tableFilters[column.field].includes(option.value)}
                  onChange={() => toggleFilter(column.field, option.value)}
                  className="h-3.5 w-3.5 accent-[var(--primary-main)]"
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))
          ) : (
            <p className="rounded-lg bg-[var(--surface-muted)] px-2 py-2 text-xs text-[var(--text-muted)]">
              No filter options.
            </p>
          )}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Group by {column.label}
        </p>
        <button
          type="button"
          disabled
          className="w-full rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-3 py-2 text-left text-xs font-semibold text-[var(--text-disabled)]"
        >
          Coming soon
        </button>
      </div>
    )
  }

  function renderHeaderButton(column: { id: string; label: string; field: SortField; align: 'left' | 'center'; icon?: IconName }) {
    const isSorted = tableSort?.field === column.field
    const hasFilter = tableFilters[column.field].length > 0

    return (
      <div className={`relative flex w-full ${column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <button
          type="button"
          onClick={() => setOpenHeaderMenu((currentValue) => (currentValue === column.id ? null : column.id))}
          className="group/h inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--text-secondary)]"
        >
          {column.icon && <Icon name={column.icon} className="h-3.5 w-3.5 shrink-0 text-[var(--text-disabled)]" />}
          {column.label}
          {isSorted && <span className="text-[var(--text-secondary)]">{tableSort.direction === 'asc' ? '↑' : '↓'}</span>}
          {hasFilter && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-main)]" />}
          <span className="text-[9px] opacity-0 transition group-hover/h:opacity-100">⌄</span>
        </button>
        {renderHeaderMenu(column)}
      </div>
    )
  }

  const isTable = viewMode === 'table'
  const displayedCount = isTable ? tableVisibleCount : filteredTaskCount

  useEffect(() => {
    localStorage.setItem('finito-hidden-columns', JSON.stringify(hiddenColumns))
  }, [hiddenColumns])

  const isColumnVisible = (id: string) => id === 'task' || !hiddenColumns[id]
  const visibleColumns = columns.filter((column) => isColumnVisible(column.id))
  const gridTemplateColumns = visibleColumns.map((column) => column.track).join(' ')
  const tableMinWidth = visibleColumns.reduce((total, column) => total + column.minWidth, 0)

  function toggleColumn(id: string) {
    setHiddenColumns((current) => ({ ...current, [id]: !current[id] }))
  }

  if (isLoading) {
    return <TaskListSkeleton />
  }

  const emptyCard = (
    <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        }
        title="No tasks to show"
        description="Create a task, or adjust your search and filters to see results."
      />
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            {viewMode === 'table' ? 'List view' : viewMode === 'kanban' ? 'Kanban board' : 'Card view'}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Grouped by {groupByOptions.find((option) => option.value === groupBy)?.label.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-muted)]">Group by</span>
            <div className="flex rounded-full border border-[var(--outline-soft)] bg-[var(--surface-muted)] p-0.5">
              {groupByOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGroupBy(option.value)}
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold transition ${
                    groupBy === option.value
                      ? 'bg-[var(--primary-main)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {isTable && (tableSort || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={clearTableControls}
              className="rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-1 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              Clear table controls
            </button>
          )}
          {isTable && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-1 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18" />
                </svg>
                Columns
              </button>

              {columnsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setColumnsMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-1.5 shadow-xl">
                    <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Show columns</p>
                    {toggleableColumns.map((column) => (
                      <Checkbox
                        key={column.id}
                        checked={isColumnVisible(column.id)}
                        onChange={() => toggleColumn(column.id)}
                        size={16}
                        label={column.label}
                        className="w-full rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--surface-muted)]"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <Badge tone="primary" className="uppercase tracking-[0.04em]">
            {displayedCount} visible
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="m-4 rounded-lg border border-[var(--error-main)]/25 bg-[var(--error-light)] p-3 text-sm text-[var(--error-dark)]">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'card' && (
        <>
          {groupedTasks.filter((group) => group.tasks.length > 0).map((group) => (
            <section key={group.id} className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
              <div className="flex items-center justify-between bg-[var(--surface-muted)] px-4 py-2">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {group.name}
                </h3>
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  {group.tasks.length} tasks
                </span>
              </div>

              <div className="divide-y divide-[var(--outline-soft)]">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task.id)}
                    className={`cursor-pointer transition ${selectedTaskId === task.id ? 'ring-2 ring-inset ring-[var(--primary)]/20' : ''}`}
                  >
                    {renderTask(task)}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {groupedTasks.every((group) => group.tasks.length === 0) && (
            emptyCard
          )}
        </>
      )}

      {!isLoading && !errorMessage && viewMode === 'table' && (
        <>
          {tableGroups.map((group) => (
            <section key={group.id} className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
              <div className="flex items-center justify-between bg-[var(--surface-subtle)] px-4 py-2">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {group.name}
                </h3>
                <span className="text-[13px] font-medium text-[var(--text-muted)]">
                  {group.tasks.length} tasks
                </span>
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${tableMinWidth}px` }}>
                  <div className="grid border-b border-[var(--outline-soft)] bg-[var(--surface-muted)] px-4 py-1.5 [&>div]:flex [&>div]:items-center [&>div]:border-r [&>div]:border-[var(--outline-soft)] [&>div]:px-2 [&>div:first-child]:pl-0 [&>div:last-child]:border-r-0" style={{ gridTemplateColumns }}>
                    {visibleColumns.map((column) => (
                      <div key={column.id}>{renderHeaderButton(column)}</div>
                    ))}
                  </div>
                  <div className="divide-y divide-[var(--outline-soft)]">
                    {group.tasks.map((task) => {
                      const subtasks = getSubtasks(task.id)
                      const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'done').length

                      return (
                        <div
                          key={task.id}
                          onClick={() => onOpenTask(task.id)}
                          style={{ gridTemplateColumns }}
                          className={`grid cursor-pointer items-stretch gap-0 px-4 text-[13px] transition hover:bg-[var(--surface-muted)] [&>div]:flex [&>div]:min-h-[38px] [&>div]:items-center [&>div]:border-r [&>div]:border-[var(--outline-soft)] [&>div]:px-2 [&>div:first-child]:pl-0 [&>div:last-child]:border-r-0 ${
                            selectedTaskId === task.id ? 'bg-[var(--surface-subtle)]' : ''
                          } ${task.status === 'done' ? 'opacity-55' : ''}`}
                        >
                          <div className="min-w-0 gap-2 text-left">
                            <StatusToggle
                              done={task.status === 'done'}
                              disabled={updatingStatusTaskId === task.id}
                              onToggle={() => updateTaskStatus(task.id, task.status === 'done' ? 'not_started' : 'done')}
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`truncate font-medium text-[var(--text-primary)] ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                              {task.description && (
                                <p className="truncate text-xs text-[var(--text-muted)]">{task.description}</p>
                              )}
                            </div>
                          </div>

                          {isColumnVisible('status') && (
                          <div className="flex justify-center text-center">
                            <select
                              value={task.status}
                              disabled={updatingStatusTaskId === task.id}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                              className={`h-8 max-w-[140px] cursor-pointer rounded-full border px-2.5 text-center text-[13px] font-semibold outline-none ${statusToneClass(task.status)}`}
                            >
                              <StatusOptions />
                            </select>
                          </div>
                          )}

                          {isColumnVisible('priority') && (
                          <div className="flex justify-center text-center">
                            <select
                              value={task.priority ?? ''}
                              disabled={updatingPriorityTaskId === task.id}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                              className={`h-8 max-w-[130px] cursor-pointer rounded-full border px-2.5 text-center text-[13px] font-semibold outline-none ${priorityToneClass(task.priority)}`}
                            >
                              <option value="">No priority</option>
                              {priorityOptions.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          )}

                          {isColumnVisible('scope') && (
                          <div className="flex justify-center text-center">
                            <select
                              value={task.difficulty ?? 'not_scoped'}
                              disabled={updatingDifficultyTaskId === task.id}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTaskDifficulty(task.id, event.target.value)}
                              className="h-8 max-w-[140px] cursor-pointer rounded-full border border-[var(--outline)] bg-[var(--surface-muted)] px-2.5 text-center text-[13px] font-semibold text-[var(--text-secondary)] outline-none"
                            >
                              {difficultyOptions.map((difficulty) => (
                                <option key={difficulty.value} value={difficulty.value}>
                                  {difficulty.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          )}

                          {isColumnVisible('section') && (
                          <div className="flex justify-center text-center">
                            <select
                              value={task.section_id ?? ''}
                              disabled={updatingSectionTaskId === task.id || sections.length === 0}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateTaskSection(task.id, event.target.value)}
                              className="h-8 max-w-[140px] cursor-pointer rounded-full border border-[var(--outline)] bg-[var(--surface-muted)] px-2.5 text-center text-[13px] font-semibold text-[var(--text-secondary)] outline-none"
                            >
                              {sections.length === 0 && <option value="">No section</option>}
                              {sections.map((sectionOption) => (
                                <option key={sectionOption.id} value={sectionOption.id}>
                                  {sectionOption.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          )}

                          {isColumnVisible('start') && (
                          <div className="justify-center text-center text-[13px] text-[var(--text-muted)]">
                            {formatDate(task.start_date)}
                          </div>
                          )}

                          {isColumnVisible('due') && (
                          <div className="justify-center text-center text-[13px] text-[var(--text-muted)]">
                            {formatDate(task.due_date)}
                          </div>
                          )}

                          {isColumnVisible('subtasks') && (
                          <div className="justify-center text-center text-[13px] font-medium text-[var(--text-secondary)]">
                            {completedSubtasks}/{subtasks.length}
                          </div>
                          )}
                        </div>
                      )
                    })}
                    <AddTaskRow groupId={group.id} onAdd={addTaskToGroup} />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </>
      )}

      {!isLoading && !errorMessage && viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {groupedTasks.map((group) => (
            <section
              key={group.id}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverGroup(group.id)
              }}
              onDragLeave={() => setDragOverGroup((current) => (current === group.id ? null : current))}
              onDrop={() => {
                if (dragTaskId) {
                  moveTaskToGroup(dragTaskId, group.id)
                }
                setDragTaskId(null)
                setDragOverGroup(null)
              }}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-[var(--surface-muted)] transition ${
                dragOverGroup === group.id
                  ? 'border-[var(--primary-main)] ring-2 ring-[var(--primary-main)]/20'
                  : 'border-[var(--outline-soft)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--outline-soft)] px-3 py-2.5">
                <h3 className="truncate text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  {group.name}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--background-paper)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  {group.tasks.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-2">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragTaskId(task.id)}
                    onDragEnd={() => {
                      setDragTaskId(null)
                      setDragOverGroup(null)
                    }}
                    onClick={() => onOpenTask(task.id)}
                    className={`cursor-pointer overflow-hidden rounded-xl border bg-[var(--background-paper)] shadow-sm transition hover:shadow-md ${
                      selectedTaskId === task.id ? 'border-[var(--primary-main)] ring-2 ring-[var(--primary-main)]/20' : 'border-[var(--outline-soft)]'
                    } ${dragTaskId === task.id ? 'opacity-50' : ''}`}
                  >
                    {renderTask(task)}
                  </div>
                ))}

                {group.tasks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[var(--outline)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                    Drop tasks here
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
