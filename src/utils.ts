import type { Task } from './types'

export function formatDate(date: string | null) {
  if (!date) return 'No date'

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function isTaskOverdue(task: Task) {
  if (!task.due_date || task.status === 'done') {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${task.due_date}T00:00:00`)
  dueDate.setHours(0, 0, 0, 0)

  return dueDate < today
}

export function getLabel(options: { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? 'None'
}
