import type { ActivityLog } from '../types'

type RecentActivityPanelProps = {
  activityLogs: ActivityLog[]
}

export function RecentActivityPanel({ activityLogs }: RecentActivityPanelProps) {
  return (
    <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <p className="text-sm text-zinc-400">Latest changes across this project.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
          {activityLogs.length} logs
        </span>
      </div>

      {activityLogs.length > 0 ? (
        <div className="space-y-2">
          {activityLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#181b1f] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-100">{log.action}</p>
                {log.details && <p className="mt-1 text-sm text-zinc-400">{log.details}</p>}
              </div>
              <p className="shrink-0 text-xs text-zinc-500">
                {log.created_at
                  ? new Intl.DateTimeFormat('en-AU', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(log.created_at))
                  : 'No date'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-zinc-500">
          No activity yet.
        </div>
      )}
    </div>
  )
}
