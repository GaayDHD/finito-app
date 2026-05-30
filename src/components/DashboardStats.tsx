type DashboardStatsProps = {
  stats: {
    total: number
    visible: number
    done: number
    blocked: number
    overdue: number
    archived?: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total</p>
        <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Visible</p>
        <p className="mt-2 text-2xl font-semibold">{stats.visible}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Done</p>
        <p className="mt-2 text-2xl font-semibold">{stats.done}</p>
      </div>

      <div className="rounded-2xl border border-red-300/10 bg-red-400/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Blocked</p>
        <p className="mt-2 text-2xl font-semibold text-red-100">{stats.blocked}</p>
      </div>

      <div className="rounded-2xl border border-red-300/10 bg-red-400/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Overdue</p>
        <p className="mt-2 text-2xl font-semibold text-red-100">{stats.overdue}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Archived</p>
        <p className="mt-2 text-2xl font-semibold">{stats.archived ?? 0}</p>
      </div>
    </div>
  )
}
