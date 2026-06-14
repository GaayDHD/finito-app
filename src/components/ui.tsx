import type { ReactNode } from 'react'
import { statusGroups } from '../constants'

/** Grouped <optgroup> status options for any status <select> (Hick's Law / Chunking). */
export function StatusOptions() {
  return (
    <>
      {statusGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

/** Thin progress bar for subtask completion (Goal-Gradient / Zeigarnik). */
export function SubtaskProgress({ done, total, className = '' }: { done: number; total: number; className?: string }) {
  if (total === 0) {
    return null
  }

  const percent = Math.round((done / total) * 100)
  const complete = done === total

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-[var(--success-main)]' : 'bg-[var(--primary-main)]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-[var(--text-muted)]">
        {done}/{total}
      </span>
    </div>
  )
}

/** Shimmering skeleton block for loading states (Doherty Threshold). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--surface-subtle)] ${className}`} />
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] p-4 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>
      {[0, 1].map((group) => (
        <div key={group} className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
          <div className="bg-[var(--surface-muted)] px-4 py-2.5">
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="divide-y divide-[var(--outline-soft)]">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Centred empty state with an icon, message, and optional action (White Space / Contrast). */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
