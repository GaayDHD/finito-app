type AppHeaderProps = {
  viewMode: 'card' | 'table'
  setViewMode: (viewMode: 'card' | 'table') => void
}

const comingSoonTabs = ['Kanban', 'Timeline', 'Calendar']

export function AppHeader({
  viewMode,
  setViewMode,
}: AppHeaderProps) {
  const tabClass = (isActive: boolean) =>
    `relative flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-sm transition ${
      isActive
        ? 'border-[var(--primary)] font-semibold text-[var(--text-primary)]'
        : 'border-transparent font-medium text-[var(--text-muted)] hover:border-[var(--outline)] hover:text-[var(--text-primary)]'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--outline-soft)] bg-[var(--background-paper)]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <nav className="flex items-center gap-5 overflow-x-auto pt-3">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={tabClass(viewMode === 'table')}
          >
            List
          </button>

          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={tabClass(viewMode === 'card')}
          >
            Card
          </button>

          {comingSoonTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              disabled
              className="flex cursor-not-allowed items-center border-b-2 border-transparent px-1 pb-2.5 pt-1 text-sm font-medium text-[var(--text-disabled)] opacity-60"
            >
              {tab}
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
