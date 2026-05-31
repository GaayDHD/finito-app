type AppHeaderProps = {
  viewMode: 'card' | 'table'
  setViewMode: (viewMode: 'card' | 'table') => void
}

export function AppHeader({ viewMode, setViewMode }: AppHeaderProps) {
  const tabClass = (isActive: boolean) =>
    isActive
      ? 'rounded-lg bg-[var(--background-paper)] px-4 py-2 text-sm font-semibold text-[var(--primary-main)] shadow-sm'
      : 'rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background-paper)] hover:text-[var(--text-primary)]'

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--outline-soft)] bg-[var(--background-paper)]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="https://res.cloudinary.com/dcd54tom6/image/upload/v1780118631/iTunes_512pt__1x_unphju.png"
            alt="Finito logo"
            className="h-9 w-9 shrink-0 rounded-xl object-contain"
          />

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Finito
            </h1>
            <p className="truncate text-xs text-[var(--text-muted)]">
              Lorem Ipsum Creative
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-xl border border-[var(--outline)] bg-[var(--surface-muted)] p-1.5 md:flex">
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
          <button type="button" disabled className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-disabled)]">
            Kanban
          </button>
          <button type="button" disabled className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-disabled)]">
            Timeline
          </button>
          <button type="button" disabled className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-disabled)]">
            Calendar
          </button>
        </nav>
      </div>

      <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-5 pb-2 md:hidden">
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
        <button type="button" disabled className="rounded-lg px-4 py-2 text-sm text-[var(--text-disabled)]">
          Kanban
        </button>
        <button type="button" disabled className="rounded-lg px-4 py-2 text-sm text-[var(--text-disabled)]">
          Timeline
        </button>
        <button type="button" disabled className="rounded-lg px-4 py-2 text-sm text-[var(--text-disabled)]">
          Calendar
        </button>
      </div>
    </header>
  )
}
