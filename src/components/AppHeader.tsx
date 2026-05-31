type AppHeaderProps = {
  viewMode: 'card' | 'table'
  setViewMode: (viewMode: 'card' | 'table') => void
  searchQuery: string
  setSearchQuery: (value: string) => void
}

export function AppHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
}: AppHeaderProps) {
  const tabClass = (isActive: boolean) =>
    `relative z-10 flex h-10 min-w-[72px] items-center justify-center rounded-xl px-3 text-sm transition ${
      isActive
        ? 'font-bold text-[var(--primary-main)]'
        : 'font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--outline-soft)] bg-[var(--background-paper)]">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(220px,1fr)_auto_minmax(320px,1fr)] items-center gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--outline-soft)] bg-[var(--background-paper)] shadow-sm">
            <img
              src="https://res.cloudinary.com/dcd54tom6/image/upload/v1780118631/iTunes_512pt__1x_unphju.png"
              alt="Finito logo"
              className="h-10 w-10 rounded-lg object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-[30px] font-semibold leading-none tracking-tight text-[var(--text-primary)]">
              Finito
            </h1>
          </div>
        </div>

        <nav className="relative hidden h-14 items-center justify-center gap-1.5 rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] p-2 md:flex">
          <span
            className={`absolute left-2 top-2 h-10 w-[72px] rounded-xl bg-[var(--background-paper)] shadow-sm transition-transform duration-200 ease-out ${
              viewMode === 'card' ? 'translate-x-[78px]' : 'translate-x-0'
            }`}
            aria-hidden="true"
          />

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

          <button
            type="button"
            disabled
            className="relative z-10 flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-[var(--text-disabled)] opacity-50"
          >
            Kanban
          </button>

          <button
            type="button"
            disabled
            className="relative z-10 flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-[var(--text-disabled)] opacity-50"
          >
            Timeline
          </button>

          <button
            type="button"
            disabled
            className="relative z-10 flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-[var(--text-disabled)] opacity-50"
          >
            Calendar
          </button>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks..."
            className="hidden h-14 w-full max-w-[220px] rounded-2xl border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10 lg:block"
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-5 pb-3 md:hidden">
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`rounded-xl px-4 py-2.5 text-sm transition ${
            viewMode === 'table'
              ? 'bg-[var(--primary-light)] font-bold text-[var(--primary-main)]'
              : 'font-medium text-[var(--text-muted)]'
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setViewMode('card')}
          className={`rounded-xl px-4 py-2.5 text-sm transition ${
            viewMode === 'card'
              ? 'bg-[var(--primary-light)] font-bold text-[var(--primary-main)]'
              : 'font-medium text-[var(--text-muted)]'
          }`}
        >
          Card
        </button>
        <button type="button" disabled className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-disabled)] opacity-50">
          Kanban
        </button>
        <button type="button" disabled className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-disabled)] opacity-50">
          Timeline
        </button>
        <button type="button" disabled className="rounded-xl px-4 py-2.5 text-sm text-[var(--text-disabled)] opacity-50">
          Calendar
        </button>
      </div>

      <div className="mx-auto px-5 pb-3 lg:hidden">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tasks..."
          className="h-14 w-full rounded-2xl border border-[var(--outline)] bg-[var(--background-paper)] px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-main)] focus:ring-4 focus:ring-[var(--primary-main)]/10"
        />
      </div>
    </header>
  )
}
