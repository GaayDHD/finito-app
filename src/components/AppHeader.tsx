type AppHeaderProps = {
  viewMode: 'card' | 'table'
  setViewMode: (viewMode: 'card' | 'table') => void
  onSignOut: () => void
}

const comingSoonTabs = ['Kanban', 'Timeline', 'Calendar']

export function AppHeader({
  viewMode,
  setViewMode,
  onSignOut,
}: AppHeaderProps) {
  const tabClass = (isActive: boolean) =>
    `relative flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-sm transition ${
      isActive
        ? 'border-[var(--primary)] font-semibold text-[var(--text-primary)]'
        : 'border-transparent font-medium text-[var(--text-muted)] hover:border-[var(--outline)] hover:text-[var(--text-primary)]'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--outline-soft)] bg-[var(--background-paper)]">
      <div className="mx-auto max-w-[1600px] px-6">
        <div className="flex items-center justify-between gap-4 pb-1 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="https://res.cloudinary.com/dcd54tom6/image/upload/v1780118631/iTunes_512pt__1x_unphju.png"
              alt="Finito logo"
              className="h-9 w-9 shrink-0 rounded-[10px] object-contain"
            />
            <h1 className="truncate text-xl font-semibold leading-none tracking-tight text-[var(--text-primary)]">
              Finito
            </h1>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <input
              value=""
              disabled
              placeholder="Search..."
              className="hidden h-9 w-full max-w-[220px] cursor-not-allowed rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm text-[var(--text-disabled)] opacity-50 outline-none placeholder:text-[var(--text-disabled)] lg:block"
            />
            <button
              type="button"
              onClick={onSignOut}
              className="h-9 shrink-0 rounded-full border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)]"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-5 overflow-x-auto pt-2">
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
      </div>
    </header>
  )
}
