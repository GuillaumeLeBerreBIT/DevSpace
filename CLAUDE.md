# DevSpace — Project Instructions

## What this project is

DevSpace is a personal developer project management tool built for solo developers. It sits between Linear and Notion: sprint-based Agile/Scrum tracking + per-project documentation, dev log, bug tracker, snippet vault, and stack/env tracker. All in one, no team overhead, dark-mode first.

## Project structure

```
DevSpace/
├── frontend/          ← Vite + React SPA (fully built, uses static data.js)
│   └── src/
│       ├── App.jsx                    ← app shell, routing, global state
│       ├── data/data.js               ← static seed data (to be replaced by API)
│       ├── components/
│       │   ├── Components.jsx         ← shared UI primitives
│       │   ├── Dashboard.jsx
│       │   ├── Kanban.jsx
│       │   ├── TaskPanel.jsx
│       │   ├── CreateSprintModal.jsx
│       │   ├── ProjectSettingsModal.jsx
│       │   ├── Icon.jsx
│       │   └── views/                 ← SprintOverview, BacklogView, BugTrackerView, DocsView, DevLogView, StackView, SnippetVaultView
│       └── index.css
├── backend/           ← Django + DRF (scaffolded, models not yet written)
│   ├── api/           ← single Django app (models, serializers, views, urls)
│   ├── backend/       ← Django project config (settings.py, urls.py)
│   └── manage.py
└── venv/              ← Python virtualenv
```

## Tech stack

**Frontend:** React 18, Vite, React Router DOM, Axios, custom CSS design system (no Tailwind — `index.css` is the source of truth for all tokens and styles)

**Backend:** Django 6 + Django REST Framework, Neon (serverless Postgres), psycopg2-binary, djangorestframework-simplejwt (JWT auth), django-cors-headers, django-filter, python-dotenv

**Hosting plan:** Backend → Render, Database → Neon free tier, Frontend → Render or Vercel

## Current state

- Frontend is **complete and functional** with hardcoded static data in `data.js`
- Backend is **scaffolded** (Django project exists) but has no models, serializers, views, or urls yet
- The build order is: backend models → serializers → viewsets → urls → wire up the React frontend to use real API calls

## Data models (derived from data.js — backend must match these exactly)

**Project:** id (slug), name, key (e.g. "DS"), color (hex), tagline, status (Active/Stalled/Shipped/Archived), stack (JSON array), created_at, updated_at

**Sprint:** id (slug e.g. "s-12"), num (int), name, project (FK), date_range (string), start_date, end_date, goal, status (planned/active/completed), capacity, velocity, completion (%), carryover (task count)

**Task:** id (string e.g. "DS-001" — auto-generated, prefix = project key), title, type (Feature/Bug/Fix/Chore/Idea/Docs), status (Backlog/To do/In progress/Blocked/In review/Done), priority (Urgent/High/Medium/Low), points (Fibonacci), sprint (FK, nullable = backlog), project (FK), labels (JSON), description (markdown), branch, pr_url, due_date, closed_at (set server-side on Done transition), created_at, updated_at. Conditional: acceptance (JSON, Feature only), severity (Bug only), steps (Bug only)

**DocPage:** id (slug), project (FK), title, content (markdown), order (int), created_at, updated_at

**DevLogEntry:** id (auto), project (FK), title, body (markdown), created_at

**Snippet:** id (auto), project (FK, nullable), title, description, language (JS/Python/TS/Bash/SQL/Other), code, tags (JSON), created_at

## Critical server-side logic

When a Task's `status` is updated to `Done`, automatically set `closed_at = datetime.now()` in `perform_update`. When status moves away from `Done`, set `closed_at = None`. **Never trust the frontend to send this value** — it drives velocity and burndown calculations.

Task IDs are strings in format `{PROJECT_KEY}-{3-digit-num}` (e.g. `DS-001`), auto-generated on the backend.

## API endpoints

```
GET/POST   /api/projects/
GET/PATCH  /api/projects/:id/

GET/POST   /api/sprints/?project=:id
GET/PATCH  /api/sprints/:id/

GET/POST   /api/tasks/?project=:id
GET/POST   /api/tasks/?project=:id&sprint=:id
GET/POST   /api/tasks/?project=:id&sprint=null   ← backlog
POST/PATCH/DELETE /api/tasks/:id/

GET/POST/PATCH/DELETE /api/docs/?project=:id
GET/POST             /api/devlog/?project=:id
GET/POST/DELETE      /api/snippets/
GET/POST/DELETE      /api/snippets/?project=:id

POST /api/token/          ← JWT login
POST /api/token/refresh/
```

## Auth

Single-user. JWT via djangorestframework-simplejwt. No registration flow — user created via `manage.py createsuperuser`. Frontend stores access token and sends `Authorization: Bearer <token>` on every request.

## Environment variables (backend/.env)

```
SECRET_KEY=
DEBUG=True
DATABASE_URL=postgresql://...  ← from Neon dashboard
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Build order

1. `settings.py` — add Neon DB, CORS, installed apps, JWT auth
2. Project model + serializer + viewset
3. Sprint model + endpoints
4. Task model + endpoints (with closed_at logic)
5. Wire React frontend — replace data.js imports with axios calls + JWT token handling
6. DocPage, DevLog, Snippet models
7. Production deploy (Render + Neon + Vercel/Render static)

---

## How to work with me (teaching mode)

This is a **learning project**. Guillaume is building this to understand Django/DRF and full-stack integration patterns — not just to get working code.

**Always follow this pattern when building anything:**

### Step 1 — Explain first
Before writing any code, explain:
- What we're about to build and why
- The concept behind it (e.g. "A Django viewset is like a controller in MVC — it handles HTTP verbs for one resource")
- Any key decisions or tradeoffs at play

### Step 2 — Build in small named steps
Break every task into numbered steps. Name each step clearly. Build one step at a time and explain what each file/block does.

### Step 3 — Annotate non-obvious code
Add a short comment for anything that isn't immediately obvious — especially Django/DRF conventions, decorator behavior, or queryset tricks. Skip comments on obvious things.

### Step 4 — Check understanding
After completing a logical unit (a model, a viewset, a wiring step), add a "What you just built" section that summarises what exists now and how the pieces connect.

### Step 5 — What's next
Always end with a clear "Next step" so Guillaume knows what comes after without having to re-read the whole plan.

**Tone:** Direct, developer-to-developer. No fluff. Treat Guillaume as a capable developer who is smart but new to this specific stack. Don't over-explain HTML or basic Python syntax — do explain Django ORM patterns, DRF conventions, JWT auth flow, and React ↔ API wiring.

**Never just dump code.** If a task can be done in a single message with explanation + code, great. If it's a larger task, propose the steps first and wait for a go-ahead.

**Flag decisions.** Any time there's a real choice (e.g. ModelViewSet vs APIView, axios interceptors vs context, slug IDs vs integer IDs), call it out explicitly and explain the tradeoff before picking one.
