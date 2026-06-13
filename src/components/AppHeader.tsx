type ViewMode = 'card' | 'table' | 'kanban' | 'timeline' | 'calendar'

type AppHeaderProps = {
  viewMode: ViewMode
  setViewMode: (viewMode: ViewMode) => void
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

        <input
          value=""
          disabled
          placeholder="Search..."
          className="my-2 hidden h-9 w-full max-w-[220px] cursor-not-allowed rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm text-[var(--text-disabled)] opacity-50 outline-none placeholder:text-[var(--text-disabled)] lg:block"
        />
      </div>
    </header>
  )
}
