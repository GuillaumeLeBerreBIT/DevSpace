# DevSpace — Session Progress

Open this file at the start of every session to know exactly where things stand.

---

## Current state

**Backend — COMPLETE ✅**
**Frontend auth layer — COMPLETE ✅**
**Frontend data wiring — NOT STARTED ⬜**

---

## What is fully built

### Backend (`backend/`)
- `settings.py` — Neon DB config, CORS, DRF, JWT, env vars via dotenv
- All 6 models: `Project`, `Sprint`, `Task`, `DocPage`, `DevLogEntry`, `Snippet`
- All 6 serializers + viewsets + URL registration
- User ownership: `Project` has `owner` FK → all queries scoped to `request.user`
- JWT auth: `POST /api/token/` returns access + refresh tokens
- Database seeded: run `python manage.py seed` to populate with sample data

**Dev server:** `cd backend && python manage.py runserver`
**Credentials:** username `berre` / password `berre`

### Frontend (`frontend/`)
- `src/lib/token.js` — in-memory JWT token store (module-level variable, not localStorage)
- `src/lib/api.js` — axios instance with request interceptor (auto-attaches Bearer token) and response interceptor (clears token on 401)
- `src/lib/queryClient.js` — TanStack Query client (staleTime 3 min, no refetch on window focus)
- `src/context/AuthContext.jsx` — `isLoggedIn`, `login()`, `logout()` via React context
- `src/components/LoginScreen.jsx` — full login UI matching the custom design
- `main.jsx` — wrapped with `QueryClientProvider` + `AuthProvider`
- `App.jsx` — auth gate: shows `LoginScreen` if not logged in

**Dev server:** `cd frontend && npm run dev`
**URL:** http://localhost:5173

---

## What still needs to be built

### Step 5 — Wire the React frontend to the real API ⬜

Replace all `data.js` imports with TanStack Query hooks. Work through these files in order:

#### 5a. Create `src/hooks/` — one file per resource

Each hook wraps a `useQuery` or `useMutation` call. Create these files:

| File | Hook(s) to write | API call |
|---|---|---|
| `useProjects.js` | `useProjects()` | `GET /api/projects/` |
| `useSprints.js` | `useSprints(projectId)` | `GET /api/sprints/?project=:id` |
| `useTasks.js` | `useTasks(projectId, sprintId)` | `GET /api/tasks/?project=:id&sprint=:id` |
| `useTasks.js` | `useBacklog(projectId)` | `GET /api/tasks/?project=:id&sprint=null` |
| `useTasks.js` | `useUpdateTask()` | `PATCH /api/tasks/:id/` |
| `useTasks.js` | `useCreateTask()` | `POST /api/tasks/` |
| `useDocs.js` | `useDocs(projectId)` | `GET /api/docs/?project=:id` |
| `useDevLog.js` | `useDevLog(projectId)` | `GET /api/devlog/?project=:id` |
| `useSnippets.js` | `useSnippets(projectId?)` | `GET /api/snippets/` |

#### 5b. Update `App.jsx`

- Remove `import { DEVSPACE_DATA } from './data/data'` (line 2)
- Remove `const { projects, sprints, tasks } = DEVSPACE_DATA` (line 17)
- Replace `const [projects] = useState(initialProjects)` with `const { data: projects } = useProjects()`
- Pass real `projects` down to `Rail`, `DashboardSidebar`, `Dashboard`

#### 5c. Update `ProjectView` in `App.jsx`

- Replace `useState(sprints)` with `useSprints(project.id)`
- Replace `tasks` prop with `useTasks(project.id, activeSprint?.id)`

#### 5d. Update `Sidebar` in `App.jsx`

- Replace `DEVSPACE_DATA.tasks.filter(...)` calls (lines 69–70) with counts derived from query data

#### 5e. Update child views

These views currently receive `tasks` as a prop — they will continue to work once `App.jsx` passes real data down. Only views that make their own `DEVSPACE_DATA` calls need updating:
- `Dashboard.jsx` — check if it calls DEVSPACE_DATA directly
- `DevLogView.jsx` — needs `useDevLog(projectId)`
- `DocsView.jsx` — needs `useDocs(projectId)`
- `StackView.jsx` — check if it uses static data
- `SnippetVaultView.jsx` — needs `useSnippets()`

#### 5f. Wire create/update mutations

- `CreateSprintModal` — `useCreateSprint()` mutation on submit
- `TaskPanel` — `useUpdateTask()` mutation on field changes
- "New task" button — `useCreateTask()` mutation

### Step 6 — Remaining models API (already built, just needs UI wiring) ⬜
`DocPage`, `DevLogEntry`, `Snippet` endpoints exist — just need the frontend views to call them.

### Step 7 — Production deploy ⬜
- Backend → Render (add `gunicorn`, `whitenoise`, set `DEBUG=False`)
- Database → Neon (add `DATABASE_URL` to Render env vars)
- Frontend → Vercel or Render static site

---

## Key files to know

```
backend/
  api/models.py          ← all 6 models
  api/serializers.py     ← all 6 serializers
  api/views.py           ← all 6 viewsets (including perform_update for closed_at)
  api/urls.py            ← router + JWT endpoints
  api/management/commands/seed.py  ← run to reset + reseed the DB

frontend/src/
  lib/token.js           ← getToken / setToken / clearToken
  lib/api.js             ← axios instance (interceptors live here)
  lib/queryClient.js     ← TanStack Query client config
  context/AuthContext.jsx ← login / logout / isLoggedIn
  components/LoginScreen.jsx ← login UI
  App.jsx                ← auth gate + all state, routing, layout
  data/data.js           ← static seed data (to be replaced, do not delete yet)
```

---

## Decisions already made (don't re-debate these)

| Decision | Choice | Why |
|---|---|---|
| Frontend data fetching | TanStack Query | Caching, mutations, loading states out of the box |
| JWT token storage | Module-level variable (memory) | XSS-safe, token gone on refresh = forced re-login |
| Model IDs | Server-generated slugs/strings | Meaningful URLs, no frontend ID logic |
| User ownership | FK on `Project` only | Everything else cascades through `project__owner` |
| DB for dev | SQLite | No config needed, swap to Neon for production |
| Registration | Disabled | Single-user app, accounts via `createsuperuser` |

---

## How to start a new session

1. Start the Django backend:
   ```bash
   cd backend && source ../venv/bin/activate && python manage.py runserver
   ```
2. Start the React frontend:
   ```bash
   cd frontend && npm run dev
   ```
3. Open http://localhost:5173 and log in with `berre` / `berre`
4. Pick up from **Step 5a** — creating the `src/hooks/` files
