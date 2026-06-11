import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Section, Task } from '../types'
import { difficultyOptions, priorityOptions, statusOptions } from '../constants'
import { formatDate, getLabel } from '../utils'

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
  viewMode: 'card' | 'table'
  groupedTasks: TaskGroup[]
  filteredTaskCount: number
  isLoading: boolean
  errorMessage: string | null
  sections: Section[]
  updatingStatusTaskId: string | null
  updatingPriorityTaskId: string | null
  updateTaskStatus: (taskId: string, status: string) => void
  updateTaskPriority: (taskId: string, priority: string) => void
  getTaskComments: (taskId: string) => unknown[]
  getSubtasks: (taskId: string) => Task[]
  renderTask: (task: Task) => ReactNode
}

const columns: { id: string; label: string; field: SortField; align: 'left' | 'center' }[] = [
  { id: 'task', label: 'Task', field: 'title', align: 'left' },
  { id: 'status', label: 'Status', field: 'status', align: 'center' },
  { id: 'priority', label: 'Priority', field: 'priority', align: 'center' },
  { id: 'scope', label: 'Scope', field: 'difficulty', align: 'center' },
  { id: 'section', label: 'Section', field: 'section_id', align: 'center' },
  { id: 'start', label: 'Start', field: 'start_date', align: 'center' },
  { id: 'due', label: 'Due', field: 'due_date', align: 'center' },
  { id: 'comments', label: 'Comments', field: 'comments', align: 'center' },
  { id: 'subtasks', label: 'Subtasks', field: 'subtasks', align: 'center' },
]

function getStatusTone(status: string) {
  if (status === 'done') {
    return 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
  }

  if (status === 'blocked' || status.startsWith('stalled')) {
    return 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
  }

  if (status === 'awaiting_response' || status === 'approval_requested') {
    return 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
  }

  if (status === 'in_progress' || status === 'planning') {
    return 'border-[var(--info-main)]/25 bg-[var(--info-light)] text-[var(--info-dark)]'
  }

  return 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

function getPriorityTone(priority: string | null) {
  if (priority === 'critical' || priority === 'overdue') {
    return 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
  }

  if (priority === 'high') {
    return 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
  }

  if (priority === 'medium') {
    return 'border-[var(--primary-main)]/25 bg-[var(--primary-light)] text-[var(--primary-dark)]'
  }

  if (priority === 'low') {
    return 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
  }

  return 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

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
  updateTaskStatus,
  updateTaskPriority,
  getTaskComments,
  getSubtasks,
  renderTask,
}: TaskListProps) {
  const [openHeaderMenu, setOpenHeaderMenu] = useState<string | null>(null)
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

  function renderHeaderButton(column: { id: string; label: string; field: SortField; align: 'left' | 'center' }) {
    const isSorted = tableSort?.field === column.field
    const hasFilter = tableFilters[column.field].length > 0

    return (
      <div className={`relative flex ${column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <button
          type="button"
          onClick={() => setOpenHeaderMenu((currentValue) => (currentValue === column.id ? null : column.id))}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] ${
            column.align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
          }`}
        >
          {column.label}
          {isSorted && <span>{tableSort.direction === 'asc' ? '↑' : '↓'}</span>}
          {hasFilter && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-main)]" />}
          <span className="text-[10px]">⌄</span>
        </button>
        {renderHeaderMenu(column)}
      </div>
    )
  }

  const isTable = viewMode === 'table'
  const displayedCount = isTable ? tableVisibleCount : filteredTaskCount

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--outline-soft)] px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {isTable ? 'Table view' : 'Card view'}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {isTable
              ? 'Compact rows grouped by the current view.'
              : 'Compact cards grouped by the current view.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTable && (tableSort || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={clearTableControls}
              className="rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              Clear table controls
            </button>
          )}
          <span className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-semibold text-[var(--primary-main)]">
            {displayedCount} visible
          </span>
        </div>
      </div>

      {isLoading && <p className="px-4 py-8 text-sm text-[var(--text-muted)]">Loading tasks...</p>}

      {errorMessage && (
        <div className="m-4 rounded-lg border border-[var(--error-main)]/25 bg-[var(--error-light)] p-3 text-sm text-[var(--error-dark)]">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'card' && (
        <div>
          {groupedTasks.map((group) => (
            <section key={group.id} className="border-b border-[var(--outline-soft)] last:border-b-0">
              <div className="flex items-center justify-between bg-[var(--surface-muted)] px-4 py-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {group.name}
                </h3>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {group.tasks.length} tasks
                </span>
              </div>

              {group.tasks.length > 0 ? (
                <div className="divide-y divide-[var(--outline-soft)]">
                  {group.tasks.map((task) => renderTask(task))}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-[var(--text-muted)]">
                  No matching tasks in this group.
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'table' && (
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[minmax(320px,1.8fr)_150px_140px_140px_150px_120px_120px_90px_90px] border-b border-[var(--outline-soft)] bg-[var(--surface-muted)] px-4 py-2">
              {columns.map((column) => (
                <div key={column.id}>{renderHeaderButton(column)}</div>
              ))}
            </div>

            {tableGroups.map((group) => (
              <section key={group.id} className="border-b border-[var(--outline-soft)] last:border-b-0">
                <div className="flex items-center justify-between bg-[var(--surface-subtle)] px-4 py-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {group.name}
                  </h3>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {group.tasks.length} tasks
                  </span>
                </div>

                {group.tasks.length > 0 ? (
                  <div className="divide-y divide-[var(--outline-soft)]">
                    {group.tasks.map((task) => {
                      const section = sections.find((currentSection) => currentSection.id === task.section_id)
                      const comments = getTaskComments(task.id)
                      const subtasks = getSubtasks(task.id)
                      const completedSubtasks = subtasks.filter((subtask) => subtask.status === 'done').length

                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-[minmax(320px,1.8fr)_150px_140px_140px_150px_120px_120px_90px_90px] items-center gap-0 px-4 py-2 text-sm transition hover:bg-[var(--surface-muted)]"
                        >
                          <div className="min-w-0 pr-4 text-left">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary-main)]" />
                              <p className="truncate font-medium text-[var(--text-primary)]">{task.title}</p>
                            </div>
                            {task.description && (
                              <p className="mt-0.5 truncate pl-4 text-xs text-[var(--text-muted)]">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-center text-center">
                            <select
                              value={task.status}
                              disabled={updatingStatusTaskId === task.id}
                              onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                              className={`h-7 max-w-[130px] rounded-full border px-2 text-center text-xs font-semibold outline-none ${getStatusTone(task.status)}`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-center text-center">
                            <select
                              value={task.priority ?? ''}
                              disabled={updatingPriorityTaskId === task.id}
                              onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                              className={`h-7 max-w-[120px] rounded-full border px-2 text-center text-xs font-semibold outline-none ${getPriorityTone(task.priority)}`}
                            >
                              <option value="">No priority</option>
                              {priorityOptions.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="truncate text-center text-xs text-[var(--text-secondary)]">
                            {getLabel(difficultyOptions, task.difficulty)}
                          </div>

                          <div className="truncate text-center text-xs text-[var(--text-secondary)]">
                            {section?.name ?? 'No section'}
                          </div>

                          <div className="text-center text-xs text-[var(--text-muted)]">
                            {formatDate(task.start_date)}
                          </div>

                          <div className="text-center text-xs text-[var(--text-muted)]">
                            {formatDate(task.due_date)}
                          </div>

                          <div className="text-center text-xs font-medium text-[var(--text-secondary)]">
                            {comments.length}
                          </div>

                          <div className="text-center text-xs font-medium text-[var(--text-secondary)]">
                            {completedSubtasks}/{subtasks.length}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-sm text-[var(--text-muted)]">
                    No matching tasks in this group.
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
