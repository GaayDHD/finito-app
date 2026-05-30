export function AppHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.28em] text-violet-300">
          Finito
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Project command centre
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          A calm, clean task system for projects, sections, blockers and progress without the corporate migraine.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
        <span className="text-zinc-500">Workspace</span>
        <div className="font-medium text-white">Lorem Ipsum Creative</div>
      </div>
    </div>
  )
}
