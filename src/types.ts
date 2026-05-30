export type Task = {
  id: string
  title: string
  description: string | null
  parent_task_id: string | null
  status: string
  priority: string | null
  difficulty: string | null
  start_date: string | null
  due_date: string | null
  archived_at?: string | null
  section_id: string | null
  position: number | null
}

export type Section = {
  id: string
  name: string
  position: number | null
}

export type TaskDependency = {
  id: string
  task_id: string
  depends_on_task_id: string
}

export type TaskComment = {
  id: string
  task_id: string
  body: string
  created_at: string | null
}

export type ActivityLog = {
  id: string
  project_id: string | null
  task_id: string | null
  action: string
  details: string | null
  created_at: string | null
}
