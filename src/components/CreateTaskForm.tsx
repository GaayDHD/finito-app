import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
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
  tasks: Task[]
  sections: Section[]
  isCreating: boolean
  createTask: (mode: CreateMode) => void
}

const pillBase =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition'
const pillIdle =
  'border-[var(--outline)] bg-[var(--background-paper)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
const pillSet =
  'border-[var(--primary-main)]/30 bg-[var(--primary-light)] text-[var(--primary-dark)]'

function PillSelect({
  icon,
  placeholder,
  value,
  onChange,
  children,
  filled,
}: {
  icon: ReactNode
  placeholder: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  filled?: boolean
}) {
  const isSet = value !== ''
  return (
    <span className={`${pillBase} ${filled && isSet ? 'border-transparent bg-[var(--surface-subtle)] font-semibold text-[var(--text-primary)]' : isSet ? pillSet : pillIdle}`}>
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer bg-transparent font-medium outline-none"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </span>
  )
}

function DatePill({
  icon,
  label,
  value,
  onChange,
}: {
  icon: ReactNode
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const isSet = value !== ''
  return (
    <span className={`relative ${pillBase} ${isSet ? pillSet : pillIdle}`}>
      <span aria-hidden="true" className="shrink-0">{icon}</span>
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

const icons = {
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  priority: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 15V4M4 4h11l-2 4 2 4H4" />
    </svg>
  ),
  scope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  section: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  date: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  dependency: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
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
  tasks,
  sections,
  isCreating,
  createTask,
}: CreateTaskFormProps) {
  const [showTitleError, setShowTitleError] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

      <form
        onSubmit={handleFormSubmit}
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[var(--background-paper)] shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--outline-soft)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Create new task</h2>
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <input
            value={taskTitle}
            onChange={(event) => {
              setTaskTitle(event.target.value)
              if (showTitleError && event.target.value.trim()) {
                setShowTitleError(false)
              }
            }}
            placeholder="Task Name"
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              Add description
            </button>
          )}

          {/* Subtask name (¼-size Task Name) */}
          <input
            value={taskSubtaskName}
            onChange={(event) => setTaskSubtaskName(event.target.value)}
            placeholder="Subtask name"
            className="mt-4 w-full bg-transparent text-lg font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
          />

          {/* Fields */}
          <p className="mt-6 text-xs font-semibold text-[var(--text-muted)]">Fields</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PillSelect icon={icons.status} placeholder="Status" value={taskStatus} onChange={setTaskStatus} filled>
              <StatusOptions />
            </PillSelect>

            <PillSelect icon={icons.priority} placeholder="Priority" value={taskPriority} onChange={setTaskPriority}>
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </PillSelect>

            <PillSelect icon={icons.scope} placeholder="Scope" value={taskDifficulty} onChange={setTaskDifficulty}>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
              ))}
            </PillSelect>

            <PillSelect icon={icons.section} placeholder="Section" value={taskSectionId || fallbackSectionId} onChange={setTaskSectionId}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </PillSelect>

            <DatePill icon={icons.date} label="Start date" value={taskStartDate} onChange={setTaskStartDate} />
            <DatePill icon={icons.date} label="Due date" value={taskDueDate} onChange={setTaskDueDate} />

            <PillSelect icon={icons.dependency} placeholder="Dependency" value={taskDependencyId} onChange={setTaskDependencyId}>
              {dependencyOptions.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </PillSelect>

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
        <div className="flex items-center justify-between gap-3 border-t border-[var(--outline-soft)] px-6 py-4">
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

          {/* Split create button */}
          <div className="relative flex">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-l-lg bg-[var(--primary-main)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-contrast)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {isCreating ? 'Creating…' : 'Create Task'}
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
                    Create and Add New
                  </button>
                  <button
                    type="button"
                    onClick={() => submit('duplicate')}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                  >
                    Create and Duplicate
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
