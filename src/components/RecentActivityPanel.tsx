import type { ActivityLog } from '../types'

type RecentActivityPanelProps = {
  activityLogs: ActivityLog[]
}

export function RecentActivityPanel({ activityLogs }: RecentActivityPanelProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent activity</h2>
          <p className="text-sm text-[var(--text-muted)]">Latest changes across this project.</p>
        </div>
        <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          {activityLogs.length} logs
        </span>
      </div>

      {activityLogs.length > 0 ? (
        <div className="space-y-2">
          {activityLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{log.action}</p>
                {log.details && <p className="mt-1 text-sm text-[var(--text-muted)]">{log.details}</p>}
              </div>
              <p className="shrink-0 text-xs text-[var(--text-muted)]">
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
        <div className="rounded-xl border border-dashed border-[var(--outline)] px-5 py-6 text-sm text-[var(--text-muted)]">
          No activity yet.
        </div>
      )}
    </div>
  )
}
