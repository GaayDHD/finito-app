import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Section, Task } from '../types'
import { difficultyOptions, priorityOptions } from '../constants'
import { formatDate } from '../utils'
import { StatusOptions } from './ui'

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
  taskSubtaskName: string
  setTaskSubtaskName: (value: string) => void
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

const ICON = {
  subtask: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781754200/icons8-subtask-16_v5bsry.png',
  status: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753835/icons8-status-16_jfi8zs.png',
  section: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753834/icons8-section-16_rqjo45.png',
  scope: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753832/icons8-ranking-16_zfp0ro.png',
  priority: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753832/icons8-ranking-16_zfp0ro.png',
  description: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753829/icons8-description-16_vcvcf6.png',
  dependency: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753828/icons8-dependency-16_uz9mz1.png',
  blockedBy: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781756588/blocked-by_srpj5q.png',
  blocking: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781756591/blocking_kzw33m.png',
  date: 'https://res.cloudinary.com/djiec5oir/image/upload/v1781753826/icons8-date-16_glzit2.png',
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

function Icon({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden="true" className="field-icon h-4 w-4 shrink-0" />
}

function PillSelect({
  iconSrc,
  placeholder,
  value,
  onChange,
  children,
  filled,
}: {
  iconSrc: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  filled?: boolean
}) {
  const isSet = value !== ''
  return (
    <span className={`${pillBase} ${filled && isSet ? 'border-transparent bg-[var(--surface-subtle)] font-semibold text-[var(--text-primary)]' : isSet ? pillSet : pillIdle}`}>
      <Icon src={iconSrc} />
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
      <Icon src={ICON.date} />
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
  taskSubtaskName,
  setTaskSubtaskName,
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
  const directionIcon =
    taskDependencyDirection === 'blocking' ? ICON.blocking : taskDependencyDirection === 'blocked' ? ICON.blockedBy : ICON.dependency

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-16">
      <div className="fixed inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

      <form
        onSubmit={handleFormSubmit}
        className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--background-paper)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--outline-soft)] px-7 pb-5 pt-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Create new task</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
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
            className="w-full bg-transparent text-3xl font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
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
              <Icon src={ICON.description} />
              Add description
            </button>
          )}

          {/* Subtask name (only once added from the overflow) */}
          {showSubtask && (
            <input
              value={taskSubtaskName}
              onChange={(event) => setTaskSubtaskName(event.target.value)}
              placeholder="Subtask name"
              className="mt-4 w-full bg-transparent text-lg font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
            />
          )}

          {/* Fields */}
          <p className="mt-6 text-xs font-semibold text-[var(--text-muted)]">Fields</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PillSelect iconSrc={ICON.status} placeholder="Status" value={taskStatus} onChange={setTaskStatus} filled>
              <StatusOptions />
            </PillSelect>

            <PillSelect iconSrc={ICON.priority} placeholder="Priority" value={taskPriority} onChange={setTaskPriority}>
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </PillSelect>

            <PillSelect iconSrc={ICON.scope} placeholder="Scope" value={taskDifficulty} onChange={setTaskDifficulty}>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
              ))}
            </PillSelect>

            <PillSelect iconSrc={ICON.section} placeholder="Section" value={taskSectionId || fallbackSectionId} onChange={setTaskSectionId}>
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
                  <Icon src={directionIcon} />
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

                <PillSelect iconSrc={ICON.dependency} placeholder="Block type" value={taskDependencyType} onChange={setTaskDependencyType}>
                  {blockTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </PillSelect>

                <PillSelect iconSrc={ICON.dependency} placeholder="Task" value={taskDependencyId} onChange={setTaskDependencyId}>
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
                      <Icon src={ICON.subtask} /> Subtask {showSubtask && <span className="ml-auto text-[var(--primary-main)]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDependency((v) => !v); setOverflowOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                    >
                      <Icon src={ICON.dependency} /> Dependency {showDependency && <span className="ml-auto text-[var(--primary-main)]">✓</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              disabled
              title="Custom fields aren't supported yet"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] opacity-70"
            >
              <span className="text-base leading-none">+</span> Create new field
            </button>
          </div>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <div className="relative flex">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-l-lg bg-[var(--primary-main)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {isCreating ? 'Creating…' : 'Create task'}
            </button>
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setCreateMenuOpen((open) => !open)}
              aria-label="More create options"
              className="flex items-center rounded-r-lg border-l border-white/25 bg-[var(--primary-main)] px-2.5 text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M6 9l6 6 6-6" />
              </svg>
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
