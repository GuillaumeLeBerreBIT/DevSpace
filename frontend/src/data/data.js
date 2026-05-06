// DevSpace — sample data for a solo developer
// Three projects: a SaaS, a CLI tool, and a side project

export const DEVSPACE_DATA = (function () {
  const projects = [
    { id: 'devspace', key: 'DS', name: 'DevSpace', tagline: 'The app you are looking at', color: '#7F77DD', stack: ['React', 'TypeScript', 'Postgres', 'tRPC'], status: 'Active', progress: 0.62, openTasks: 24, lastActivity: '2h ago' },
    { id: 'kettle', key: 'KT', name: 'kettle-cli', tagline: 'Local-first task runner', color: '#46a758', stack: ['Rust', 'Tokio', 'Clap'], status: 'Active', progress: 0.41, openTasks: 11, lastActivity: 'Yesterday' },
    { id: 'fieldnotes', key: 'FN', name: 'Fieldnotes', tagline: 'Personal writing app', color: '#ffb224', stack: ['Swift', 'SwiftUI', 'CloudKit'], status: 'Stalled', progress: 0.18, openTasks: 6, lastActivity: '6 days ago' },
    { id: 'inkwell', key: 'IN', name: 'Inkwell', tagline: 'Markdown blog engine', color: '#4d9aff', stack: ['Astro', 'MDX'], status: 'Shipped', progress: 1.0, openTasks: 0, lastActivity: '3 weeks ago' },
  ];

  const sprints = [
    { id: 's-12', num: 12, name: 'Polish & Ship', dateRange: 'Apr 22 – May 5', status: 'active', goal: 'Ship the v0.4 release: stabilize the Kanban DnD, finish the sprint retrospective UI, and clean up empty states across the app.', capacity: 32, velocity: 18, completion: 0.56, carryover: 3 },
    { id: 's-11', num: 11, name: 'Sprint planning rework', dateRange: 'Apr 8 – Apr 21', status: 'completed', goal: 'Replace the old sprint flow with the new metric cards and burndown.', capacity: 28, velocity: 26, completion: 1.0, carryover: 2 },
    { id: 's-10', num: 10, name: 'Bug tracker', dateRange: 'Mar 25 – Apr 7', status: 'completed', goal: 'Build dedicated bug tracker view with severity grouping.', capacity: 24, velocity: 22, completion: 1.0, carryover: 0 },
    { id: 's-13', num: 13, name: 'Mobile parity', dateRange: 'May 6 – May 19', status: 'planned', goal: '', capacity: 30, velocity: 0, completion: 0, carryover: 0 },
  ];

  const tasks = [
    { id: 'DS-042', title: 'Drag-and-drop on Kanban board', type: 'Feature', status: 'In progress', priority: 'High', points: 5, sprint: 's-12', labels: ['frontend', 'kanban'], branch: 'feat/kanban-dnd', pr: '#118', due: 'May 2', acceptance: [{ text: 'Cards drag smoothly with no flicker', done: true }, { text: 'Drop zones highlight on hover', done: true }, { text: 'Order persists to server', done: false }, { text: 'Works on touch devices', done: false }], description: 'Replace the placeholder click-to-move with a real DnD implementation. Use react-dnd for now — can revisit dnd-kit if perf becomes an issue.\n\nThe column should accept drops and reorder optimistically. Roll back on server error.', created: 'Apr 24', updated: '2h ago', linked: ['DS-051'], carryover: false },
    { id: 'DS-051', title: 'DnD touch support broken on iPad', type: 'Bug', status: 'Blocked', priority: 'High', points: 2, sprint: 's-12', labels: ['frontend', 'mobile'], severity: 'Major', steps: '1. Open board on iPad Safari\n2. Long-press a card\n3. Drag to new column\n\nExpected: card moves\nActual: page scrolls instead', branch: '', pr: '', description: 'react-dnd HTML5 backend doesnt fire on touch. Need to swap in TouchBackend or move to dnd-kit.', created: 'Apr 25', updated: '1h ago', linked: ['DS-042'], carryover: false },
    { id: 'DS-039', title: 'Sprint retrospective section', type: 'Feature', status: 'In progress', priority: 'Medium', points: 3, sprint: 's-12', labels: ['frontend', 'sprints'], branch: 'feat/retro', pr: '', acceptance: [{ text: 'Three text fields: went well, didnt, adjustments', done: true }, { text: 'Auto-saves on blur', done: false }, { text: 'Collapsible by default after sprint ends', done: false }], description: 'Add a retro section below the sprint board. Should feel calm — three stacked textareas, no submit button, just save on blur.', created: 'Apr 22', updated: '4h ago', carryover: false },
    { id: 'DS-055', title: 'Empty state for new projects', type: 'Feature', status: 'To do', priority: 'Medium', points: 2, sprint: 's-12', labels: ['frontend', 'onboarding'], acceptance: [{ text: 'Friendly illustration or pattern', done: false }, { text: 'CTA to create first task', done: false }], description: 'When you open a brand-new project, the board is empty and lifeless. Add a calm empty state with a single CTA.', created: 'Apr 26', updated: 'Yesterday', carryover: false },
    { id: 'DS-058', title: 'Markdown editor: keyboard shortcuts', type: 'Chore', status: 'To do', priority: 'Low', points: 1, sprint: 's-12', labels: ['editor'], description: 'Bind Cmd+B, Cmd+I, Cmd+K (link). Use the existing toolbar handlers.', created: 'Apr 26', updated: 'Yesterday', carryover: false },
    { id: 'DS-061', title: 'Autosave indicator flickers', type: 'Bug', status: 'To do', priority: 'Low', points: 1, sprint: 's-12', labels: ['editor'], severity: 'Minor', steps: 'Type fast in the docs editor — the "Saved" indicator briefly flashes "Saving..." between every keystroke.', description: 'Debounce the indicator state, not just the save call.', created: 'Apr 27', updated: '5h ago', carryover: false },
    { id: 'DS-040', title: 'Refactor sprint store into Zustand slice', type: 'Chore', status: 'In review', priority: 'Medium', points: 3, sprint: 's-12', labels: ['refactor', 'state'], branch: 'chore/sprint-slice', pr: '#114', description: 'The sprint state is scattered across three contexts. Consolidate into a single Zustand slice.', created: 'Apr 23', updated: '1d ago', carryover: false },
    { id: 'DS-035', title: 'Metric cards on sprint overview', type: 'Feature', status: 'Done', priority: 'High', points: 3, sprint: 's-12', labels: ['frontend', 'sprints'], branch: 'feat/sprint-metrics', pr: '#109', acceptance: [{ text: 'Capacity / Velocity / Completion / Carryover', done: true }, { text: 'Progress ring for completion', done: true }], description: 'Four metric cards at the top of the sprint overview screen.', created: 'Apr 18', updated: '2d ago', closedAt: 'Apr 26 · 16:24', carryover: false },
    { id: 'DS-037', title: 'Carryover badge on rolled-over tasks', type: 'Feature', status: 'Done', priority: 'Medium', points: 1, sprint: 's-12', labels: ['frontend', 'sprints'], description: 'Small "↻" badge on cards that rolled over from the previous sprint.', created: 'Apr 19', updated: '2d ago', closedAt: 'Apr 26 · 11:08', carryover: true },
    { id: 'DS-033', title: 'Fix dark mode flicker on first paint', type: 'Fix', status: 'Done', priority: 'Medium', points: 1, sprint: 's-12', labels: ['frontend', 'theme'], branch: 'fix/theme-flicker', pr: '#106', linked: ['DS-029'], description: 'Inline a tiny script in <head> that sets the theme class before React boots.', created: 'Apr 17', updated: '3d ago', closedAt: 'Apr 25 · 09:41', carryover: false },
    { id: 'DS-070', title: 'Rich link previews in dev log', type: 'Feature', status: 'Backlog', priority: 'Medium', points: 5, sprint: null, labels: ['editor', 'devlog'], description: 'Paste a URL → fetch OG metadata → render a card.', created: 'Apr 27', updated: 'Yesterday', carryover: false },
    { id: 'DS-071', title: 'Idea: AI summary of last sprint', type: 'Idea', status: 'Backlog', priority: 'Low', points: 3, sprint: null, labels: ['ai', 'sprints'], description: 'At the end of a sprint, Claude could summarize what shipped, link the dev log entries, and surface unfinished items.', created: 'Apr 26', updated: '2d ago', carryover: false },
    { id: 'DS-072', title: 'Bug: timezone on due dates', type: 'Bug', status: 'Backlog', priority: 'Medium', points: 2, sprint: null, labels: ['dates'], severity: 'Minor', steps: 'Set a due date in PST. Switch system to UTC. Date is off by one day.', description: 'Store dates as ISO with TZ, render in user TZ. Currently storing as YYYY-MM-DD.', created: 'Apr 24', updated: '4d ago', carryover: false },
    { id: 'DS-073', title: 'Document the keyboard shortcuts', type: 'Docs', status: 'Backlog', priority: 'Low', points: 1, sprint: null, labels: ['docs'], description: 'Compile the existing shortcuts and put them in a Help page.', created: 'Apr 23', updated: '5d ago', carryover: false },
    { id: 'DS-074', title: 'Chore: upgrade to React 19', type: 'Chore', status: 'Backlog', priority: 'Low', points: 2, sprint: null, labels: ['deps'], description: 'Test compat, especially with react-dnd.', created: 'Apr 20', updated: '1w ago', carryover: false },
    { id: 'DS-075', title: 'Crash on empty sprint goal', type: 'Bug', status: 'Backlog', priority: 'Urgent', points: 1, sprint: null, labels: ['sprints'], severity: 'Critical', steps: 'Create a sprint with no goal. Click into overview. Crash.', description: 'Null-check the goal field in SprintHeader.', created: 'Apr 28', updated: '30m ago', carryover: false },
    { id: 'DS-076', title: 'Idea: weekly streak indicator', type: 'Idea', status: 'Backlog', priority: 'Low', points: 2, sprint: null, labels: ['gamification'], description: 'Show a streak counter on the dashboard for consecutive days with at least one closed task.', created: 'Apr 19', updated: '1w ago', carryover: false },
  ];

  const focusToday = [
    { taskId: 'DS-042', projectId: 'devspace', done: false },
    { taskId: 'DS-051', projectId: 'devspace', done: false },
    { taskId: 'DS-039', projectId: 'devspace', done: true },
    { taskId: 'KT-014', projectId: 'kettle', done: false, title: 'Fix race in job scheduler', type: 'Bug' },
    { taskId: 'FN-008', projectId: 'fieldnotes', done: false, title: 'Sketch widget layout', type: 'Idea' },
  ];

  const devLog = [
    { id: 'log-1', timestamp: 'Apr 28 · 09:42', title: 'DnD: settled on react-dnd, will revisit', body: 'Tried dnd-kit first — beautiful API, but the drop animation lagged on lists >50. react-dnd is older but the HTML5 backend is rock solid. Touch is a known gap; addressing in DS-051.\n\nNote to self: do NOT abstract this behind a wrapper yet. Premature.' },
    { id: 'log-2', timestamp: 'Apr 27 · 22:18', title: 'Sprint metric ring math', body: 'Spent an embarrassing amount of time getting the SVG progress ring to look right. Stroke-dasharray is the trick. Tomorrow: animate it.' },
    { id: 'log-3', timestamp: 'Apr 26 · 14:03', title: 'Decision: keep markdown, skip rich-text', body: 'Considered switching the editor to TipTap. Decided against — the whole point is that this is a developer tool, and markdown is the format devs already think in. Stay simple.' },
    { id: 'log-4', timestamp: 'Apr 24 · 11:30', title: 'Fieldnotes is officially stalled', body: 'Marked as Stalled. The Swift learning curve + CloudKit auth issues killed momentum. Coming back to it after DevSpace v0.4 ships.' },
    { id: 'log-5', timestamp: 'Apr 22 · 17:55', title: 'Sprint 12 kicked off', body: 'Goal: ship v0.4. Pulled in 32 points across 9 tasks. Carryover: 3 from last sprint (DnD, retro, autosave fix).' },
  ];

  const docPages = [
    { id: 'overview', title: 'Overview', icon: 'home' },
    { id: 'architecture', title: 'Architecture', icon: 'box' },
    { id: 'stack', title: 'Stack & env', icon: 'layers' },
    { id: 'api', title: 'API reference', icon: 'code' },
    { id: 'decisions', title: 'Decision log', icon: 'flag' },
    { id: 'shortcuts', title: 'Keyboard shortcuts', icon: 'cmd' },
  ];

  const stackDetail = {
    tech: [
      { category: 'Frontend', items: [{ name: 'React', version: '18.3.1', note: 'Considering 19 upgrade — see DS-074' }, { name: 'TypeScript', version: '5.4.5' }, { name: 'Vite', version: '5.2.10' }, { name: 'Zustand', version: '4.5.2', note: 'State management' }, { name: 'react-dnd', version: '16.0.1', note: 'Kanban DnD backend' }] },
      { category: 'Backend', items: [{ name: 'Hono', version: '4.3.0' }, { name: 'tRPC', version: '11.0.0-rc.366' }, { name: 'Drizzle ORM', version: '0.30.10' }] },
      { category: 'Infrastructure', items: [{ name: 'Postgres', version: '16 (Neon)' }, { name: 'Fly.io', version: 'shared-1x' }, { name: 'Clerk', version: '5.0.x', note: 'Auth, single-tenant' }] },
    ],
    env: [
      { key: 'DATABASE_URL', value: 'postgresql://devspace:***@ep-cool-mode-1234.neon.tech/devspace', description: 'Neon Postgres connection string for the primary app database.' },
      { key: 'SECRET_KEY', value: '***', description: 'Django session + signing secret. Rotate quarterly.' },
      { key: 'CLERK_PUBLISHABLE_KEY', value: 'pk_live_***', description: 'Public Clerk key — embedded in the frontend bundle.' },
      { key: 'SAXO_CLIENT_ID', value: 'saxo_***', description: 'OAuth client ID for the Saxo trading data integration.' },
      { key: 'REDIS_URL', value: 'redis://***@redis-12345.c1.us-east1.ec2.upstash.io:6379', description: 'Upstash Redis used for rate limits and the job queue.' },
    ],
    deps2: [
      { name: 'react', version: '18.3.1', purpose: 'UI library — the entire client is React' },
      { name: 'django', version: '5.1.2', purpose: 'API server, ORM, and admin' },
      { name: 'djangorestframework', version: '3.15.2', purpose: 'REST endpoints over the ORM' },
      { name: '@clerk/clerk-react', version: '5.1.0', purpose: 'Auth — single-tenant Clerk session' },
      { name: 'zustand', version: '4.5.2', purpose: 'Client state — sprint + board slices' },
      { name: 'react-dnd', version: '16.0.1', purpose: 'Kanban drag-and-drop backend' },
    ],
    deps: [
      { name: 'react', current: '18.3.1', latest: '19.0.0', kind: 'major' },
      { name: 'react-dom', current: '18.3.1', latest: '19.0.0', kind: 'major' },
      { name: 'typescript', current: '5.4.5', latest: '5.4.5', kind: 'ok' },
      { name: 'vite', current: '5.2.10', latest: '5.2.11', kind: 'patch' },
      { name: 'zustand', current: '4.5.2', latest: '4.5.4', kind: 'patch' },
      { name: 'react-dnd', current: '16.0.1', latest: '16.0.1', kind: 'ok' },
      { name: '@trpc/client', current: '11.0.0-rc.366', latest: '11.0.0-rc.382', kind: 'minor' },
      { name: 'drizzle-orm', current: '0.30.10', latest: '0.31.2', kind: 'minor' },
      { name: 'hono', current: '4.3.0', latest: '4.4.7', kind: 'minor' },
      { name: '@clerk/nextjs', current: '5.0.5', latest: '5.1.0', kind: 'minor' },
      { name: 'lucide-react', current: '0.378.0', latest: '0.378.0', kind: 'ok' },
      { name: 'tailwindcss', current: '3.4.3', latest: '3.4.4', kind: 'patch' },
    ],
  };

  const snippets = [
    { id: 'sn-1', title: 'Django: soft-delete model mixin', description: 'Drop-in abstract base for soft deletion + manager.', language: 'Python', tags: ['django', 'orm', 'mixin'], code: `class SoftDeleteQuerySet(models.QuerySet):\n    def alive(self):\n        return self.filter(deleted_at__isnull=True)\n\nclass SoftDeleteModel(models.Model):\n    deleted_at = models.DateTimeField(null=True, blank=True)\n    objects = SoftDeleteQuerySet.as_manager()\n\n    class Meta:\n        abstract = True\n\n    def delete(self, using=None, keep_parents=False):\n        self.deleted_at = timezone.now()\n        self.save(update_fields=['deleted_at'])` },
    { id: 'sn-2', title: 'useDebouncedValue hook', description: 'Returns a value that updates only after `delay` ms of quiet.', language: 'TypeScript', tags: ['react', 'hook', 'perf'], code: `import { useEffect, useState } from 'react';\n\nexport function useDebouncedValue<T>(value: T, delay = 200): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(t);\n  }, [value, delay]);\n  return debounced;\n}` },
    { id: 'sn-3', title: 'Postgres: latest row per group', description: 'Window-function pattern for "newest item per user".', language: 'SQL', tags: ['postgres', 'window'], code: `SELECT *\nFROM (\n  SELECT\n    e.*,\n    ROW_NUMBER() OVER (\n      PARTITION BY e.user_id\n      ORDER BY e.created_at DESC\n    ) AS rn\n  FROM events e\n) ranked\nWHERE rn = 1;` },
    { id: 'sn-4', title: 'Deploy: tag, push, restart', description: 'Tag the current commit and trigger a Fly restart.', language: 'Bash', tags: ['deploy', 'fly'], code: `#!/usr/bin/env bash\nset -euo pipefail\n\nTAG="v$(date +%Y.%m.%d)-$(git rev-parse --short HEAD)"\ngit tag -a "$TAG" -m "release $TAG"\ngit push origin "$TAG"\n\nflyctl deploy --strategy rolling --app devspace\nflyctl status --app devspace` },
    { id: 'sn-5', title: 'React: portal-based toast', description: 'Imperative toast() call, no provider needed.', language: 'JavaScript', tags: ['react', 'ui'], code: `let host;\nexport function toast(message, ms = 2000) {\n  if (!host) {\n    host = document.createElement('div');\n    host.className = 'toast-host';\n    document.body.appendChild(host);\n  }\n  const el = document.createElement('div');\n  el.className = 'toast';\n  el.textContent = message;\n  host.appendChild(el);\n  setTimeout(() => el.remove(), ms);\n}` },
    { id: 'sn-6', title: 'DRF: custom permission class', description: 'Allow safe methods to anyone, writes only to the owner.', language: 'Python', tags: ['django', 'drf', 'auth'], code: `from rest_framework import permissions\n\nclass IsOwnerOrReadOnly(permissions.BasePermission):\n    def has_object_permission(self, request, view, obj):\n        if request.method in permissions.SAFE_METHODS:\n            return True\n        return obj.owner_id == request.user.id` },
  ];

  const definitionOfDone = [
    { id: 'dod-1', text: 'Acceptance criteria all checked' },
    { id: 'dod-2', text: 'No console errors or warnings' },
    { id: 'dod-3', text: 'Branch merged and PR closed' },
    { id: 'dod-4', text: 'Docs updated if behaviour changed' },
    { id: 'dod-5', text: 'Tested on at least one real dataset' },
  ];

  const projectColors = ['#7F77DD', '#46a758', '#ffb224', '#4d9aff', '#e5484d', '#14b8a6', '#ec4899', '#a78bfa'];

  return { projects, sprints, tasks, focusToday, devLog, docPages, stackDetail, snippets, definitionOfDone, projectColors };
})();
