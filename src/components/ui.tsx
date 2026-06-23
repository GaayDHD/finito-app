import { useState } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { statusGroups } from '../constants'
import { Icon } from './icons'
import type { IconName } from './icons'

/** Shared status pill colours so every view (table, card, timeline, calendar) matches (Law of Similarity). */
export function statusToneClass(status: string) {
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

/** Shared priority pill colours, per the design-system data-display card:
 *  critical/overdue = high-emphasis neutral (solid dark outline),
 *  high = error, medium = warning, low = success, else neutral. */
export function priorityToneClass(priority: string | null | undefined) {
  if (priority === 'critical' || priority === 'overdue') {
    return 'border-[var(--text-primary)] bg-[var(--surface-subtle)] text-[var(--text-primary)]'
  }
  if (priority === 'high') {
    return 'border-[var(--error-main)]/25 bg-[var(--error-light)] text-[var(--error-dark)]'
  }
  if (priority === 'medium') {
    return 'border-[var(--warning-main)]/25 bg-[var(--warning-light)] text-[var(--warning-dark)]'
  }
  if (priority === 'low') {
    return 'border-[var(--success-main)]/25 bg-[var(--success-light)] text-[var(--success-dark)]'
  }
  return 'border-[var(--outline)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'
}

/** Matching solid dot colour for compact spots where a full pill won't fit. */
export function statusDotClass(status: string) {
  if (status === 'done') return 'bg-[var(--success-main)]'
  if (status === 'blocked' || status.startsWith('stalled')) return 'bg-[var(--error-main)]'
  if (status === 'awaiting_response' || status === 'approval_requested') return 'bg-[var(--warning-main)]'
  if (status === 'in_progress' || status === 'planning') return 'bg-[var(--info-main)]'
  return 'bg-[var(--text-disabled)]'
}

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

// Status-toggle glyphs (Tabler outline). Circle is #777; the tick is brand
// purple. Inline markup so the two-tone colouring works.
const DASHED_ARCS =
  '<path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95" /><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44" /><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92" /><path d="M8.56 20.31a9 9 0 0 0 3.44 .69" /><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95" /><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44" /><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92" /><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69" />'
const TICK = '<path stroke="#6600ff" d="M9 12l2 2l4 -4" />'
const ICON_DOTTED =
  '<path d="M7.5 4.21l0 .01" /><path d="M4.21 7.5l0 .01" /><path d="M3 12l0 .01" /><path d="M4.21 16.5l0 .01" /><path d="M7.5 19.79l0 .01" /><path d="M12 21l0 .01" /><path d="M16.5 19.79l0 .01" /><path d="M19.79 16.5l0 .01" /><path d="M21 12l0 .01" /><path d="M19.79 7.5l0 .01" /><path d="M16.5 4.21l0 .01" /><path d="M12 3l0 .01" />'
const ICON_DASHED_CHECK = DASHED_ARCS + TICK
const ICON_CIRCLE_CHECK = '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />' + TICK
export const ICON_DASHED_PLUS = DASHED_ARCS + '<path d="M9 12h6" /><path d="M12 9v6" />'

export function StatusGlyph({ markup, className }: { markup: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#777777"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

/**
 * Quick-complete toggle to the left of a task title: dotted circle when
 * incomplete (→ dashed circle + tick on hover), solid circle + tick when done.
 * Clicking flips the task between done and not started, without opening the panel.
 * Shared across the list, card, and kanban views.
 */
export function StatusToggle({
  done,
  disabled = false,
  onToggle,
}: {
  done: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={done ? 'Mark task as not done' : 'Mark task as done'}
      title={done ? 'Mark as not done' : 'Mark as done'}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className="group/status relative flex h-5 w-5 shrink-0 items-center justify-center disabled:opacity-50"
    >
      {done ? (
        <StatusGlyph markup={ICON_CIRCLE_CHECK} className="h-5 w-5" />
      ) : (
        <>
          <StatusGlyph markup={ICON_DOTTED} className="h-5 w-5 transition group-hover/status:opacity-0" />
          <StatusGlyph
            markup={ICON_DASHED_CHECK}
            className="absolute inset-0 h-5 w-5 opacity-0 transition group-hover/status:opacity-100"
          />
        </>
      )}
    </button>
  )
}

// ---- Buttons (design-system primitives) ----
type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3.5',
  md: 'h-10 gap-2 px-5',
  lg: 'h-12 gap-2 px-[26px]',
}
const BTN_FONT: Record<ButtonSize, number> = { sm: 13, md: 13, lg: 15 }
const BTN_ICON: Record<ButtonSize, string> = { sm: 'h-[15px] w-[15px]', md: 'h-4 w-4', lg: 'h-[18px] w-[18px]' }
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-[var(--primary-main)] text-[var(--primary-contrast)] shadow-sm hover:bg-[var(--primary-dark)]',
  secondary: 'border border-[var(--outline)] bg-[var(--background-paper)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--primary-light)]',
  soft: 'border border-transparent bg-[var(--primary-light)] text-[var(--primary-dark)] hover:opacity-90',
  ghost: 'border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]',
  danger: 'border border-transparent bg-[var(--error-main)] text-[var(--error-contrast)] shadow-sm hover:opacity-90',
}

/** Pill button — brand-purple primary plus secondary, soft, ghost and danger
 *  variants, three sizes. Mirrors the design system's Button. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  type = 'button',
  className = '',
  ...rest
}: {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  fullWidth?: boolean
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full transition disabled:cursor-not-allowed disabled:opacity-55 ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: BTN_FONT[size], lineHeight: 1 }}
      {...rest}
    >
      {icon && <Icon name={icon} className={`${BTN_ICON[size]} shrink-0`} strokeWidth={2.2} />}
      {children}
      {iconRight && <Icon name={iconRight} className={`${BTN_ICON[size]} shrink-0`} strokeWidth={2.2} />}
    </button>
  )
}

type IconButtonVariant = 'ghost' | 'outline' | 'soft' | 'primary'
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'
const ICONBTN_SIZE: Record<IconButtonSize, string> = { xs: 'h-5 w-5', sm: 'h-7 w-7', md: 'h-[34px] w-[34px]', lg: 'h-10 w-10' }
const ICONBTN_GLYPH: Record<IconButtonSize, string> = { xs: 'h-3.5 w-3.5', sm: 'h-[15px] w-[15px]', md: 'h-[18px] w-[18px]', lg: 'h-5 w-5' }
const ICONBTN_VARIANT: Record<IconButtonVariant, string> = {
  ghost: 'border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
  outline: 'border border-[var(--outline)] bg-[var(--background-paper)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]',
  soft: 'border border-transparent bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]',
  primary: 'border border-transparent bg-[var(--primary-main)] text-[var(--primary-contrast)] hover:bg-[var(--primary-dark)]',
}

/** Square, pill-rounded icon-only control — close buttons, clear-search, toolbar. */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: {
  icon: IconName
  variant?: IconButtonVariant
  size?: IconButtonSize
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${ICONBTN_SIZE[size]} ${ICONBTN_VARIANT[variant]} ${className}`}
      {...rest}
    >
      <Icon name={icon} className={ICONBTN_GLYPH[size]} />
    </button>
  )
}

/** Text input — 'field' (8px radius) or 'pill' (full radius) shape, optional
 *  leading icon and label/micro-label. Focus deepens border + adds a ring. */
export function Input({
  shape = 'field',
  icon,
  label,
  microLabel,
  fullWidth = true,
  style,
  ...rest
}: {
  shape?: 'field' | 'pill'
  icon?: IconName
  label?: string
  microLabel?: string
  fullWidth?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>) {
  const [focused, setFocused] = useState(false)
  const { onFocus, onBlur, ...inputRest } = rest
  const radius = shape === 'pill' ? 'var(--radius-full)' : 'var(--radius-sm)'

  const field = (
    <div className="relative" style={{ width: fullWidth ? '100%' : undefined }}>
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-[var(--text-muted)]">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      )}
      <input
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        style={{
          width: '100%',
          height: 38,
          padding: icon ? '0 14px 0 36px' : '0 14px',
          borderRadius: radius,
          border: `1px solid ${focused ? 'var(--primary-main)' : 'var(--outline)'}`,
          background: 'var(--background-paper)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          outline: 'none',
          boxShadow: focused ? 'var(--ring-primary)' : 'none',
          transition: 'border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard)',
          ...style,
        }}
        {...inputRest}
      />
    </div>
  )

  if (!label && !microLabel) return field

  return (
    <label className="flex flex-col gap-1.5" style={{ width: fullWidth ? '100%' : undefined }}>
      {microLabel && (
        <span className="text-[10px] font-medium uppercase tracking-[0.6px] text-[var(--auth-field-label)]">{microLabel}</span>
      )}
      {label && <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</span>}
      {field}
    </label>
  )
}

/** Square, 4px-radius custom checkbox with a brand-purple tick. Controlled. */
export function Checkbox({
  checked = false,
  onChange,
  size = 20,
  disabled = false,
  ariaLabel,
  label,
  className = '',
}: {
  checked?: boolean
  onChange?: (next: boolean) => void
  size?: number
  disabled?: boolean
  ariaLabel?: string
  label?: ReactNode
  className?: string
}) {
  const boxClass = 'flex shrink-0 items-center justify-center rounded-[4px] border transition'
  const boxStyle = {
    width: size,
    height: size,
    borderColor: checked ? 'var(--primary-main)' : 'var(--auth-input-border)',
    background: checked ? 'var(--primary-soft)' : 'var(--auth-input-bg)',
  }
  const glyph = checked ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary-main)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: size * 0.66, height: size * 0.66 }}>
      <path d="M5 12l5 5l9 -9" />
    </svg>
  ) : null

  if (!label) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`${boxClass} disabled:cursor-not-allowed disabled:opacity-50`}
        style={boxStyle}
      >
        {glyph}
      </button>
    )
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className={boxClass} style={boxStyle}>{glyph}</span>
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
    </button>
  )
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'
const BADGE_TONE: Record<BadgeTone, { bg: string; text: string; dot: string }> = {
  neutral: { bg: 'bg-[var(--surface-subtle)]', text: 'text-[var(--text-secondary)]', dot: 'bg-[var(--text-disabled)]' },
  primary: { bg: 'bg-[var(--primary-light)]', text: 'text-[var(--primary-dark)]', dot: 'bg-[var(--primary-main)]' },
  success: { bg: 'bg-[var(--success-light)]', text: 'text-[var(--success-dark)]', dot: 'bg-[var(--success-main)]' },
  warning: { bg: 'bg-[var(--warning-light)]', text: 'text-[var(--warning-dark)]', dot: 'bg-[var(--warning-main)]' },
  error: { bg: 'bg-[var(--error-light)]', text: 'text-[var(--error-dark)]', dot: 'bg-[var(--error-main)]' },
  info: { bg: 'bg-[var(--info-light)]', text: 'text-[var(--info-dark)]', dot: 'bg-[var(--info-main)]' },
}

/** Small rounded pill — counter / label badge with a semantic tone and an
 *  optional leading dot. Mirrors the design system's Badge. */
export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}) {
  const t = BADGE_TONE[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${t.bg} ${t.text} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />}
      {children}
    </span>
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
