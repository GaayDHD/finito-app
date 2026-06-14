export const statusOptions = [
  { value: 'not_started', label: 'Not started' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'approval_requested', label: 'Approval requested' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'stalled_internal', label: 'Stalled - Internal' },
  { value: 'stalled_external', label: 'Stalled - External' },
  { value: 'done', label: 'Done' },
]

// Grouped status options (Hick's Law / Chunking): a long flat list is
// slower to scan than a few labelled buckets.
export const statusGroups = [
  {
    label: 'To do',
    options: [
      { value: 'not_started', label: 'Not started' },
      { value: 'planning', label: 'Planning' },
    ],
  },
  {
    label: 'In progress',
    options: [
      { value: 'in_progress', label: 'In progress' },
      { value: 'awaiting_response', label: 'Awaiting response' },
      { value: 'approval_requested', label: 'Approval requested' },
    ],
  },
  {
    label: 'Stalled',
    options: [
      { value: 'blocked', label: 'Blocked' },
      { value: 'stalled_internal', label: 'Stalled - Internal' },
      { value: 'stalled_external', label: 'Stalled - External' },
    ],
  },
  {
    label: 'Done',
    options: [{ value: 'done', label: 'Done' }],
  },
]

export const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'need_to_scope', label: 'Need to Scope' },
]

export const difficultyOptions = [
  { value: 'not_scoped', label: 'Not scoped' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'complex', label: 'Complex' },
]
