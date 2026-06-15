```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      ███████╗  ██╗  ███╗   ██╗  ██╗  ████████╗   ██████╗       ║
║      ██╔════╝  ██║  ████╗  ██║  ██║  ╚══██╔══╝  ██╔═══██╗      ║
║      █████╗    ██║  ██╔██╗ ██║  ██║     ██║     ██║   ██║      ║
║      ██╔══╝    ██║  ██║╚██╗██║  ██║     ██║     ██║   ██║      ║
║      ██║       ██║  ██║ ╚████║  ██║     ██║     ╚██████╔╝      ║
║      ╚═╝       ╚═╝  ╚═╝  ╚═══╝  ╚═╝     ╚═╝      ╚═════╝       ║
║                                                                ║
║                  T A S K   W O R K S P A C E                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

> A custom **task & project workspace** in the spirit of Asana / ClickUp /
> Monday — built to be embedded in Wix via iframe and run on Vercel. Compact,
> table-first, and drawer-driven, with five ways to look at the same tasks.

<p align="center">
  <a href="https://finito-nine.vercel.app"><b>&#9654; Live app</b></a>
  &nbsp;&middot;&nbsp; React &nbsp;&middot;&nbsp; TypeScript &nbsp;&middot;&nbsp; Supabase &nbsp;&middot;&nbsp; Vite &nbsp;&middot;&nbsp; Vercel
</p>

---

## ✦ What it does

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   sign in         ┌──────────────────┐       ╔══════════════════╗      │
│   (email +    ──► │  workspaces &    │  ──►  ║  Table · Card ·  ║      │
│    password)      │  tasks stored in │       ║  Kanban ·        ║      │
│   embedded in     │  Supabase + RLS  │       ║  Timeline ·      ║      │
│   Wix via iframe  └──────────────────┘       ║  Calendar        ║      │
│                                              ╚══════════════════╝      │
│                                                                        │
│   Row-level security scopes every workspace, project, and task         │
│   to its owner — you only ever see your own data.                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

Finito is a React + Supabase app. You sign in, work inside a workspace, and
manage tasks across five synchronized views. Auth is email + password, and
Postgres row-level security keeps each account's data fully private.

## ✦ Features

```
╭─ WORKSPACE ────────────────────────────────────────────────────────────╮
│ • Multiple workspaces — create, switch, each isolated by owner         │
│ • Sections to group tasks; assignable from the task drawer             │
│ • Activity log of creates, edits, archives, comments                   │
╰────────────────────────────────────────────────────────────────────────╯

╭─ TASKS ────────────────────────────────────────────────────────────────╮
│ • Create, edit, archive, restore, delete; subtasks one level deep      │
│ • Status, priority, scope, start / due dates, section                  │
│ • Comments and blocker / dependency links between tasks                │
│ • Subtask progress bars; overdue and blocked highlighting              │
╰────────────────────────────────────────────────────────────────────────╯

╭─ VIEWS ────────────────────────────────────────────────────────────────╮
│ • Table — sortable, filterable, customizable columns                   │
│ • Card · Kanban (drag between columns) · Timeline · Calendar           │
│ • Group by status, priority, or scope across every view                │
│ • Search across titles, descriptions, sections, comments               │
╰────────────────────────────────────────────────────────────────────────╯

╭─ UI ───────────────────────────────────────────────────────────────────╮
│ • Right-hand detail panel (Esc / click-out to close)                   │
│ • Light / dark / system theming, persisted                             │
│ • Mobile responsive with a bottom nav bar                              │
│ • Atkinson Hyperlegible Mono headings · Next body                      │
╰────────────────────────────────────────────────────────────────────────╯
```

## ✦ Views

```
┌────────────┬─────────────────────────────────────────────────────┐
│ VIEW       │ WHAT IT SHOWS                                       │
├────────────┼─────────────────────────────────────────────────────┤
│ Table      │ Dense grid; per-column sort/filter, hide columns    │
│ Card       │ Roomy cards grouped by the current grouping         │
│ Kanban     │ Columns by group; drag a card to change its field   │
│ Timeline   │ Gantt-style bars spanning each task's start → due   │
│ Calendar   │ Month grid placing tasks on their due date          │
└────────────┴─────────────────────────────────────────────────────┘
```

## ✦ Quick start

```bash
npm install      # install dependencies
npm run dev      # Vite dev server   ─►  http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
```

> **Tip** — the dev server is also defined in `.claude/launch.json`
> (named `finito-dev`, pinned to port `5173`).

## ✦ Environment

The app talks to Supabase through two Vite env vars — set them in a local
`.env.local` and in your Vercel project settings:

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  VITE_SUPABASE_URL       = https://<project>.supabase.co               │
│  VITE_SUPABASE_ANON_KEY  = <Supabase publishable / anon key>           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

The anon key is a publishable client key; all real protection comes from
Supabase Auth and owner-scoped RLS policies on every table.

## ✦ Project structure

```
finito-app/
├── src/
│   ├── App.tsx              ◄─ orchestration: state, data, task CRUD
│   ├── components/          ◄─ views, detail drawer, modals, sidebar
│   │   ├── TaskList.tsx          Table · Card · Kanban
│   │   ├── TimelineView.tsx      Gantt-style timeline
│   │   ├── CalendarView.tsx      month calendar
│   │   ├── TaskDetailDrawer.tsx  right-hand detail panel
│   │   ├── SettingsModal.tsx     account · theme · delete
│   │   └── ui.tsx                shared pills, progress, skeletons
│   ├── lib/supabase.ts      ◄─ Supabase client (Vite env vars)
│   ├── constants.ts         ◄─ status / priority / scope options
│   └── index.css            ◄─ design tokens, themes, @font-face
├── public/fonts/            ◄─ Atkinson Hyperlegible Next + Mono (woff2)
├── package.json
└── README.md
```

## ✦ Tech stack

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  React + TS   │  │   Supabase    │  │     Vite      │  │    Vercel     │
│  19 + Vite    │  │ auth·DB·RLS   │  │ dev + bundler │  │ hosting + CI  │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

[React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) on
[Vite](https://vite.dev), styled with [Tailwind CSS](https://tailwindcss.com).
[Supabase](https://supabase.com) provides auth, Postgres, and row-level
security.

## ✦ Deployment

Hosted on **Vercel**, deployed automatically on every push to `main` via the
GitHub integration, then embedded into Wix as an iframe.

```
git push ─► main ─► Vercel build ─► finito-nine.vercel.app ─► Wix iframe
```

---

<p align="center"><sub>Table-first · drawer-driven · five views over one set of tasks.</sub></p>
