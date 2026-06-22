import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Section, Task } from '../types'
import { difficultyOptions, priorityOptions } from '../constants'
import { formatDate } from '../utils'
import { IconButton, StatusOptions } from './ui'
import { Icon } from './icons'
import type { IconName } from './icons'

type CreateMode = 'close' | 'reset' | 'duplicate'

type CreateTaskFormProps = {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  taskTitle: string
  setTaskTitle: (value: string) => void
  taskDescription: string
  setTaskDescription: (value: string) => void
  taskStatus: string
  setTaskStatus: (value: string) => void
  taskSectionId: string
  setTaskSectionId: (value: string) => void
  fallbackSectionId: string
  taskPriority: string
  setTaskPriority: (value: string) => void
  taskDifficulty: string
  setTaskDifficulty: (value: string) => void
  taskStartDate: string
  setTaskStartDate: (value: string) => void
  taskDueDate: string
  setTaskDueDate: (value: string) => void
  taskSubtaskNames: string[]
  setTaskSubtaskNames: (value: string[]) => void
  taskDependencyId: string
  setTaskDependencyId: (value: string) => void
  taskDependencyDirection: string
  setTaskDependencyDirection: (value: string) => void
  taskDependencyType: string
  setTaskDependencyType: (value: string) => void
  tasks: Task[]
  sections: Section[]
  isCreating: boolean
  createTask: (mode: CreateMode) => void
}

const blockTypes = [
  { value: 'SS', label: 'Start to start' },
  { value: 'SF', label: 'Start to finish' },
  { value: 'FS', label: 'Finish to start' },
  { value: 'FF', label: 'Finish to finish' },
]

const pillBase = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition'
const pillIdle = 'border-[var(--outline)] bg-[var(--background-paper)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
const pillSet = 'border-[var(--primary-main)]/30 bg-[var(--primary-light)] text-[var(--primary-dark)]'

function PillSelect({
  iconName,
  placeholder,
  value,
  onChange,
  children,
  filled,
}: {
  iconName: IconName
  placeholder: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  filled?: boolean
}) {
  const isSet = value !== ''
  return (
    <span className={`${pillBase} ${filled && isSet ? 'border-transparent bg-[var(--surface-subtle)] font-semibold text-[var(--text-primary)]' : isSet ? pillSet : pillIdle}`}>
      <Icon name={iconName} className="h-4 w-4 shrink-0" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="fit-select cursor-pointer bg-transparent font-medium outline-none"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </span>
  )
}

function DatePill({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const isSet = value !== ''
  return (
    <span className={`relative ${pillBase} ${isSet ? pillSet : pillIdle}`}>
      <Icon name="date" className="h-4 w-4 shrink-0" />
      <span className="font-medium">{isSet ? formatDate(value) : label}</span>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={() => ref.current?.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      />
    </span>
  )
}

export function CreateTaskForm({
  isOpen,
  setIsOpen,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskStatus,
  setTaskStatus,
  taskSectionId,
  setTaskSectionId,
  fallbackSectionId,
  taskPriority,
  setTaskPriority,
  taskDifficulty,
  setTaskDifficulty,
  taskStartDate,
  setTaskStartDate,
  taskDueDate,
  setTaskDueDate,
  taskSubtaskNames,
  setTaskSubtaskNames,
  taskDependencyId,
  setTaskDependencyId,
  taskDependencyDirection,
  setTaskDependencyDirection,
  taskDependencyType,
  setTaskDependencyType,
  tasks,
  sections,
  isCreating,
  createTask,
}: CreateTaskFormProps) {
  const [showTitleError, setShowTitleError] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showSubtask, setShowSubtask] = useState(false)
  const [showDependency, setShowDependency] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) {
    return null
  }

  function submit(mode: CreateMode) {
    if (!taskTitle.trim()) {
      setShowTitleError(true)
      return
    }
    setShowTitleError(false)
    setCreateMenuOpen(false)
    createTask(mode)
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit('close')
  }

  const dependencyOptions = tasks.filter((task) => !task.parent_task_id)
  const descriptionVisible = showDescription || taskDescription.trim() !== ''
  const directionIcon: IconName =
    taskDependencyDirection === 'blocking' ? 'blocking' : taskDependencyDirection === 'blocked' ? 'blocked-by' : 'dependency'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-16">
      <div className="fixed inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

      <form
        onSubmit={handleFormSubmit}
        className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--background-paper)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--outline-soft)] px-7 py-2.5">
          <h2 className="text-base font-normal text-[var(--text-disabled)]" style={{ fontFamily: 'var(--font-sans)' }}>Create new task</h2>
          <IconButton icon="x" variant="soft" size="sm" aria-label="Close" onClick={() => setIsOpen(false)} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          <input
            value={taskTitle}
            onChange={(event) => {
              setTaskTitle(event.target.value)
              if (showTitleError && event.target.value.trim()) {
                setShowTitleError(false)
              }
            }}
            placeholder="Task name"
            autoFocus
            style={{ fontSize: '52px', fontWeight: 500, lineHeight: 1.1 }}
            className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
          />
          {showTitleError && (
            <p className="mt-1 text-xs font-medium text-[var(--error-dark)]">Give your task a name to continue.</p>
          )}

          {/* Description */}
          {descriptionVisible ? (
            <input
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Add description"
              autoFocus
              className="mt-3 w-full bg-transparent text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
            >
              <Icon name="description" className="h-4 w-4 shrink-0" />
              Add description
            </button>
          )}

          {/* Subtasks (only once added from the overflow) */}
          {showSubtask && (
            <div className="mt-4 space-y-2 pl-6">
              {taskSubtaskNames.map((name, index) => (
                <input
                  key={index}
                  value={name}
                  onChange={(event) => {
                    const next = [...taskSubtaskNames]
                    next[index] = event.target.value
                    setTaskSubtaskNames(next)
                  }}
                  placeholder="Subtask name"
                  className="w-full bg-transparent text-lg font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
                />
              ))}
              <button
                type="button"
                onClick={() => setTaskSubtaskNames([...taskSubtaskNames, ''])}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
              >
                <Icon name="add" className="h-4 w-4 shrink-0" />
                Add subtask
              </button>
            </div>
          )}

          {/* Fields */}
          <p className="mt-6 text-xs font-semibold text-[var(--text-muted)]">Fields</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PillSelect iconName="status" placeholder="Status" value={taskStatus} onChange={setTaskStatus} filled>
              <StatusOptions />
            </PillSelect>

            <PillSelect iconName="priority" placeholder="Priority" value={taskPriority} onChange={setTaskPriority}>
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </PillSelect>

            <PillSelect iconName="scope" placeholder="Scope" value={taskDifficulty} onChange={setTaskDifficulty}>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
              ))}
            </PillSelect>

            <PillSelect iconName="section" placeholder="Section" value={taskSectionId || fallbackSectionId} onChange={setTaskSectionId}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </PillSelect>

            <DatePill label="Start date" value={taskStartDate} onChange={setTaskStartDate} />
            <DatePill label="Due date" value={taskDueDate} onChange={setTaskDueDate} />

            {/* Dependency controls appear once added from the overflow */}
            {showDependency && (
              <>
                <span className={`${pillBase} ${taskDependencyDirection ? pillSet : pillIdle}`}>
                  <Icon name={directionIcon} className="h-4 w-4 shrink-0" />
                  <select
                    value={taskDependencyDirection}
                    onChange={(event) => setTaskDependencyDirection(event.target.value)}
                    className="fit-select cursor-pointer bg-transparent font-medium outline-none"
                  >
                    <option value="">Dependency</option>
                    <option value="blocked">Blocked by</option>
                    <option value="blocking">Blocking</option>
                  </select>
                </span>

                <PillSelect iconName="dependency" placeholder="Block type" value={taskDependencyType} onChange={setTaskDependencyType}>
                  {blockTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </PillSelect>

                <PillSelect iconName="dependency" placeholder="Task" value={taskDependencyId} onChange={setTaskDependencyId}>
                  {dependencyOptions.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </PillSelect>
              </>
            )}

            {/* Overflow: Subtask + Dependency */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOverflowOpen((open) => !open)}
                aria-label="More fields"
                className={`${pillBase} ${pillIdle}`}
              >
                <span className="leading-none">···</span>
              </button>
              {overflowOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOverflowOpen(false)} aria-hidden="true" />
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => { setShowSubtask((v) => !v); setOverflowOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <Icon name="subtask" className="h-4 w-4 shrink-0" /> Subtask {showSubtask && <span className="ml-auto text-[var(--primary-main)]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDependency((v) => !v); setOverflowOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <Icon name="dependency" className="h-4 w-4 shrink-0" /> Dependency {showDependency && <span className="ml-auto text-[var(--primary-main)]">✓</span>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Custom fields aren't supported yet"
            className="mt-3 inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] opacity-70"
          >
            <span className="text-base leading-none">+</span> Create new field
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--outline-soft)] px-7 py-4">
          <button
            type="button"
            disabled
            title="Attachments aren't supported yet"
            aria-label="Add attachment (coming soon)"
            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-[var(--text-disabled)] opacity-70"
          >
            <Icon name="attachment" className="h-5 w-5" />
          </button>

          <div className="relative flex">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-l-full bg-[var(--primary-main)] py-2.5 pl-5 pr-4 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {isCreating ? 'Creating…' : 'Create task'}
            </button>
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setCreateMenuOpen((open) => !open)}
              aria-label="More create options"
              className="flex items-center rounded-r-full border-l border-white/25 bg-[var(--primary-main)] pl-2.5 pr-3.5 text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              <Icon name="chevron" className="h-4 w-4" strokeWidth={2.2} />
            </button>

            {createMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCreateMenuOpen(false)} aria-hidden="true" />
                <div className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => submit('reset')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                  >
                    Create and add new
                  </button>
                  <button
                    type="button"
                    onClick={() => submit('duplicate')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                  >
                    Create and duplicate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
