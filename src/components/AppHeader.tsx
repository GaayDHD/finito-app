import { Icon } from './icons'

type ViewMode = 'card' | 'table' | 'kanban' | 'timeline' | 'calendar'

type AppHeaderProps = {
  viewMode: ViewMode
  setViewMode: (viewMode: ViewMode) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
}

const viewTabs: { mode: ViewMode; label: string }[] = [
  { mode: 'table', label: 'Table' },
  { mode: 'card', label: 'Card' },
  { mode: 'kanban', label: 'Kanban' },
  { mode: 'timeline', label: 'Timeline' },
  { mode: 'calendar', label: 'Calendar' },
]

export function AppHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
}: AppHeaderProps) {
  const tabBase =
    'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition sm:rounded-none sm:border-b-2 sm:px-1 sm:py-0 sm:pb-2.5 sm:pt-1 sm:text-sm'

  const tabClass = (isActive: boolean) =>
    `${tabBase} ${
      isActive
        ? 'bg-[var(--primary-main)] text-white sm:border-[var(--primary)] sm:bg-transparent sm:font-semibold sm:text-[var(--text-primary)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:border-transparent'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--outline-soft)] bg-[var(--background-paper)]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2 sm:gap-5 sm:py-0 sm:pt-3">
          {viewTabs.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => setViewMode(tab.mode)}
              className={tabClass(viewMode === tab.mode)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="relative my-2 hidden w-full max-w-[240px] sm:block">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks..."
            className="h-9 w-full rounded-full border border-[var(--outline)] bg-[var(--background-paper)] pl-9 pr-9 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10 placeholder:text-[var(--text-muted)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            >
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
