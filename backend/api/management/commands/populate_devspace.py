"""
Populate the DevSpace project with its own documentation, sprints, dev log, and snippets.

This command treats the DevSpace project as a living example of itself — the docs in
NOTES.md become DocPages, the build phases become Sprints, the technical decisions
become DevLog entries, and the key code patterns become Snippets.

Idempotent: wipes the DevSpace project's content and rebuilds from scratch.
Run with:  python manage.py populate_devspace
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from api.models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet


# ─────────────────────────────────────────────────────────────────────────────
# SPRINTS — each represents a build phase with the tasks completed in it
# ─────────────────────────────────────────────────────────────────────────────

SPRINTS = [
    {
        'num': 1, 'name': 'Backend Foundation', 'status': 'completed',
        'date_range': 'Phase 1', 'capacity': 30, 'velocity': 30, 'completion': 100,
        'goal': 'Django + DRF scaffold with all 6 core models, JWT auth, and Neon connectivity.',
        'tasks': [
            ('Set up Django project with DRF, dotenv, CORS', 'Chore', 'Done', 'High', 3),
            ('Configure Neon Postgres via DATABASE_URL', 'Chore', 'Done', 'High', 2),
            ('Custom user model extending AbstractUser', 'Feature', 'Done', 'High', 3),
            ('Project model with slug PK auto-generated in save()', 'Feature', 'Done', 'High', 5),
            ('Sprint and Task models with auto-generated string IDs', 'Feature', 'Done', 'High', 5),
            ('DocPage, DevLogEntry, Snippet models', 'Feature', 'Done', 'Medium', 5),
            ('Serializers for all models with read_only_fields', 'Feature', 'Done', 'High', 3),
            ('ViewSets with owner-scoped get_queryset', 'Feature', 'Done', 'High', 3),
            ('Auto-set closed_at server-side on Task → Done', 'Feature', 'Done', 'High', 2),
            ('JWT auth with djangorestframework-simplejwt', 'Feature', 'Done', 'High', 3),
            ('URL router with DefaultRouter + manual paths', 'Chore', 'Done', 'Medium', 2),
        ],
    },
    {
        'num': 2, 'name': 'Frontend Wiring', 'status': 'completed',
        'date_range': 'Phase 2', 'capacity': 35, 'velocity': 35, 'completion': 100,
        'goal': 'Replace static data.js with real API calls via TanStack Query + axios.',
        'tasks': [
            ('Install TanStack Query, axios, React Router', 'Chore', 'Done', 'High', 1),
            ('Build axios instance with request/response interceptors', 'Feature', 'Done', 'High', 3),
            ('In-memory token storage (token.js module variable)', 'Feature', 'Done', 'High', 3),
            ('AuthContext provider with login/logout', 'Feature', 'Done', 'High', 5),
            ('LoginScreen with username/password form', 'Feature', 'Done', 'High', 3),
            ('useProjects hook with TanStack useQuery', 'Feature', 'Done', 'High', 2),
            ('useSprints hook scoped by projectId', 'Feature', 'Done', 'High', 2),
            ('useTasks + useBacklog hooks', 'Feature', 'Done', 'High', 3),
            ('useDocs, useDevLog, useSnippets hooks', 'Feature', 'Done', 'High', 5),
            ('AuthenticatedApp pattern for hook ordering', 'Fix', 'Done', 'Urgent', 5),
            ('Wire 401 response interceptor for token expiry', 'Feature', 'Done', 'Medium', 3),
        ],
    },
    {
        'num': 3, 'name': 'Feature Polish', 'status': 'completed',
        'date_range': 'Phase 3', 'capacity': 40, 'velocity': 40, 'completion': 100,
        'goal': 'Every UI interaction hooked to the backend — task editing, search, dashboard.',
        'tasks': [
            ('User profile settings (display_name, role) via /api/me/', 'Feature', 'Done', 'Medium', 3),
            ('Global search Cmd+K across tasks, docs, snippets, devlog', 'Feature', 'Done', 'High', 8),
            ('Dashboard with active sprints, bugs, devlog, stats', 'Feature', 'Done', 'High', 8),
            ('Task delete with confirmation banner', 'Feature', 'Done', 'Medium', 2),
            ('Inline task title and description editing', 'Feature', 'Done', 'Medium', 5),
            ('Move task between sprints from TaskPanel', 'Feature', 'Done', 'Medium', 3),
            ('Add acceptance criteria after task creation', 'Feature', 'Done', 'Low', 3),
            ('Sprint Start action (planned → active)', 'Feature', 'Done', 'Medium', 2),
            ('Sprint Complete action with carryover handling', 'Feature', 'Done', 'High', 3),
            ('Edit sprint modal (name/goal/dates)', 'Feature', 'Done', 'Medium', 3),
            ('Dev log delete with hover X button', 'Feature', 'Done', 'Low', 2),
            ('Snippet code content search', 'Feature', 'Done', 'Low', 1),
            ('Due date field on task creation modal', 'Feature', 'Done', 'Low', 2),
        ],
    },
    {
        'num': 4, 'name': 'Environment Variables Vault', 'status': 'completed',
        'date_range': 'Phase 4', 'capacity': 20, 'velocity': 20, 'completion': 100,
        'goal': 'Encrypted vault for sensitive project credentials with auto-lock timer.',
        'tasks': [
            ('Add vault_password_hash + vault_timeout to Project', 'Feature', 'Done', 'High', 2),
            ('Create EnvVariable model with project FK', 'Feature', 'Done', 'High', 2),
            ('POST /api/projects/:id/unlock-vault/ endpoint', 'Feature', 'Done', 'High', 3),
            ('POST /api/projects/:id/set-vault-password/ endpoint', 'Feature', 'Done', 'High', 2),
            ('EnvVariable CRUD viewset scoped by project owner', 'Feature', 'Done', 'High', 2),
            ('useEnvVars + useUnlockVault hooks', 'Feature', 'Done', 'High', 3),
            ('Vault UI on Stack page with locked/unlocked states', 'Feature', 'Done', 'High', 5),
            ('Eye toggle per row to reveal masked values', 'Feature', 'Done', 'Medium', 2),
            ('Auto-lock timer (setTimeout, in-memory only)', 'Feature', 'Done', 'High', 3),
            ('Lock countdown badge ("locks in Xm")', 'Feature', 'Done', 'Low', 1),
            ('Vault timeout setting in project settings', 'Feature', 'Done', 'Low', 1),
        ],
    },
    {
        'num': 5, 'name': 'Production Deploy', 'status': 'active',
        'date_range': 'Phase 5', 'capacity': 15, 'velocity': 3, 'completion': 20,
        'goal': 'Deploy DevSpace to Render + Neon and verify end-to-end with real credentials.',
        'tasks': [
            ('Migrate data from local SQLite to Neon Postgres', 'Chore', 'Done', 'High', 3),
            ('Verify login + all API endpoints against Neon', 'Chore', 'In progress', 'High', 2),
            ('Deploy Django backend to Render', 'Chore', 'To do', 'High', 5),
            ('Deploy React frontend to Vercel', 'Chore', 'To do', 'High', 3),
            ('Configure production CORS_ALLOWED_ORIGINS', 'Chore', 'To do', 'High', 1),
            ('Set production env vars (SECRET_KEY, DEBUG=False)', 'Chore', 'To do', 'High', 1),
            ('Smoke test full flow on production URLs', 'Chore', 'To do', 'High', 2),
        ],
    },
    {
        'num': 6, 'name': 'Teams + Multi-user', 'status': 'planned',
        'date_range': 'Future', 'capacity': 25, 'velocity': 0, 'completion': 0,
        'goal': 'Support 5-10 person teams per project with owner/editor/viewer roles.',
        'tasks': [
            ('Design Membership model (user × project × role)', 'Feature', 'Backlog', 'High', 3),
            ('Update all viewset get_queryset to use memberships', 'Feature', 'Backlog', 'High', 8),
            ('Invite flow with UUID accept tokens', 'Feature', 'Backlog', 'High', 5),
            ('Email invitations via SMTP or transactional service', 'Feature', 'Backlog', 'Medium', 3),
            ('Role-based UI (hide delete for non-owners)', 'Feature', 'Backlog', 'High', 5),
            ('Project members management UI', 'Feature', 'Backlog', 'Medium', 5),
            ('Migrate existing solo projects to membership model', 'Chore', 'Backlog', 'High', 2),
        ],
    },
    {
        'num': 7, 'name': 'GitHub + AI Agent', 'status': 'planned',
        'date_range': 'Future', 'capacity': 30, 'velocity': 0, 'completion': 0,
        'goal': 'Link GitHub repos to projects and integrate Claude as a project-aware assistant.',
        'tasks': [
            ('Add github_repo field to Project model', 'Feature', 'Backlog', 'Medium', 1),
            ('Store user GitHub PAT (encrypted at rest)', 'Feature', 'Backlog', 'High', 3),
            ('GitHub API client wrapper (file tree, commits, PRs)', 'Feature', 'Backlog', 'Medium', 5),
            ('File tree view on Stack page', 'Feature', 'Backlog', 'Medium', 5),
            ('Open PRs panel synced from GitHub', 'Feature', 'Backlog', 'Low', 3),
            ('Anthropic SDK integration (pip install anthropic)', 'Feature', 'Backlog', 'High', 1),
            ('POST /api/projects/:id/chat/ with project context', 'Feature', 'Backlog', 'High', 5),
            ('Streaming response handler', 'Feature', 'Backlog', 'Medium', 3),
            ('Chat panel UI in sidebar', 'Feature', 'Backlog', 'High', 5),
            ('Context builder: tasks + devlog + docs as prompt', 'Feature', 'Backlog', 'High', 3),
        ],
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# DOCS — distilled chapters from NOTES.md, ordered for reading
# ─────────────────────────────────────────────────────────────────────────────

DOCS = [
    {
        'title': 'Overview & Architecture',
        'order': 1,
        'content': '''# DevSpace Architecture

DevSpace is a single-user developer project management tool. Three layers:

```
Browser (React SPA)
    │  HTTP/JSON via axios, JWT Bearer
    ▼
Django + DRF (port 8000)
    │  psycopg2 over DATABASE_URL
    ▼
Neon (serverless Postgres)
```

## Three processes in dev

- `npm run dev` → Vite on port 5173 (serves React)
- `python manage.py runserver` → Django on port 8000 (serves API)
- Neon → always-on cloud Postgres

## Tech stack

**Backend:** Django 6, DRF, djangorestframework-simplejwt, psycopg2, dj-database-url, python-dotenv, django-cors-headers.

**Frontend:** React 18, Vite, TanStack Query, axios, React Router, Radix UI primitives, custom CSS design system.

**Database:** Neon serverless Postgres (production), SQLite (initial dev).

## Why these choices

- **TanStack Query** over plain `useEffect` + axios: free caching, deduplication, loading states, mutation invalidation.
- **JWT in memory** over localStorage: XSS-safe — script can't read another module's private variables.
- **Server-generated IDs** (slugs for Project, `s-{num}` for Sprint, `{KEY}-{num}` for Task): readable URLs, no enumeration attacks.
- **Owner scoping on every viewset**: security by default — every queryset filters by `project__owner=request.user`.
- **Neon over self-hosted Postgres**: zero ops, free tier, automatic backups, easy DATABASE_URL.''',
    },
    {
        'title': 'Django Settings & Environment',
        'order': 2,
        'content': '''# Settings.py — The Foundation

## BASE_DIR

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```

`__file__` is `backend/backend/settings.py`. Two `.parent` calls take us up to `backend/` — the directory containing `manage.py`.

## Loading .env

```python
load_dotenv(BASE_DIR / '.env.backend')
```

Reads the `.env.backend` file once at startup and dumps all values into `os.environ`. After this line, `os.environ.get('DATABASE_URL')` works.

## The DEBUG cast trap

```python
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
```

Environment variables are always **strings**. `os.environ.get('DEBUG')` returns `"False"`, not the boolean `False`. Any non-empty string is truthy in Python, so `if os.environ.get('DEBUG')` is ALWAYS true — even when set to "False". Compare explicitly.

## CORS middleware order

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',   # ← MUST be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]
```

Browsers fire a preflight `OPTIONS` request before any cross-origin POST/PATCH. If CorsMiddleware isn't first, Django's own middleware may reject the request before CORS headers can attach.

## Neon DATABASE_URL parsing

```python
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))
_db_options = {k: v for k, v in parse_qsl(tmpPostgres.query) if k != 'channel_binding'}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': tmpPostgres.path.replace('/', ''),
        'USER': tmpPostgres.username,
        'PASSWORD': tmpPostgres.password,
        'HOST': tmpPostgres.hostname,
        'PORT': 5432,
        'OPTIONS': _db_options,
    }
}
```

The `channel_binding=require` parameter Neon adds to its connection strings is NOT supported by psycopg2 — it breaks the SSL handshake. Strip it before passing to Django.''',
    },
    {
        'title': 'Models & Migrations',
        'order': 3,
        'content': '''# Django Models

## What is a migration?

A Python file Django generates that describes a schema change. `makemigrations` compares your `models.py` to the last migration and writes the diff. `migrate` runs that diff as SQL. You never write `CREATE TABLE` — Django does it from your classes.

## Slug PKs over auto-incrementing integers

```python
class Project(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)

    def save(self, *args, **kwargs):
        if not self.pk:                      # only on first save (creation)
            base = slugify(self.name)
            slug, counter = base, 1
            while Project.objects.filter(pk=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.pk = slug
        super().save(*args, **kwargs)        # ALWAYS call super
```

Integer PKs give you `/api/projects/4/`. Slug PKs give you `/api/projects/devspace/` — readable, meaningful, and not enumerable.

**Never forget `super().save()`** — without it, nothing writes to the DB.

## on_delete: CASCADE vs SET_NULL

- **CASCADE**: delete parent → delete all children. Used on `project FK` everywhere — deleting a project removes all its sprints, tasks, docs.
- **SET_NULL**: delete parent → child's FK becomes NULL. Used on `Task.sprint` — deleting a sprint moves its tasks back to the backlog (FK = null). Requires `null=True`.

## related_name

```python
sprint = ForeignKey(Sprint, related_name='tasks')
```

Creates the reverse accessor: `my_sprint.tasks.all()`. Without it, you'd write the awkward `my_sprint.task_set.all()`.

## Server-side state transitions

`Task.closed_at` is set in `TaskViewSet.perform_update()` when `status` transitions to `Done`. The frontend never sends `closed_at` — it's marked `read_only` in the serializer and silently stripped from incoming bodies. This is critical because `closed_at` drives velocity and burndown calculations.''',
    },
    {
        'title': 'DRF Serializers',
        'order': 4,
        'content': '''# Serializers — The Translation Layer

A serializer converts a Django model (Python object) ↔ JSON (what the frontend speaks).

## ModelSerializer auto-generates

```python
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'closed_at', 'created_at', 'updated_at']
```

From `Task` model fields, it auto-builds:
- **Validators**: `CharField(max_length=500)` → serializer rejects strings > 500 chars
- **Type coercion**: `DateField` → validates ISO date strings
- **Required/optional**: fields with `blank=True` → optional in the serializer

## What read_only_fields does

| Field | In GET response | In POST/PATCH body |
|---|---|---|
| `id` | ✅ returned | ❌ silently ignored |
| `closed_at` | ✅ returned | ❌ silently ignored |
| `title` | ✅ returned | ✅ accepted |

Read-only fields are stripped from incoming bodies before validation. The frontend can include them or not — they're never written from the request.

## SerializerMethodField for computed fields

```python
class ProjectSerializer(serializers.ModelSerializer):
    has_vault_password = serializers.SerializerMethodField()

    def get_has_vault_password(self, obj):
        return bool(obj.vault_password_hash)

    class Meta:
        model = Project
        exclude = ['vault_password_hash']    # never expose the raw hash
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
```

The vault hash never leaves the server. Instead, the API exposes a boolean — enough for the frontend to know whether to show "unlock" or "set password" UI.''',
    },
    {
        'title': 'DRF ViewSets & Override Hooks',
        'order': 5,
        'content': '''# ViewSets — The Controllers

`ModelViewSet` inherits from 5 mixins that each implement one operation:

```
ModelViewSet
  ├── ListModelMixin       →  GET    /api/tasks/         → list()
  ├── CreateModelMixin     →  POST   /api/tasks/         → create()
  ├── RetrieveModelMixin   →  GET    /api/tasks/DS-001/  → retrieve()
  ├── UpdateModelMixin     →  PATCH  /api/tasks/DS-001/  → partial_update()
  └── DestroyModelMixin    →  DELETE /api/tasks/DS-001/  → destroy()
```

## The three override hooks

### get_queryset() — control which rows are returned

```python
def get_queryset(self):
    project_id = self.request.query_params.get('project')
    qs = Sprint.objects.filter(project__owner=self.request.user)
    if project_id:
        qs = qs.filter(project_id=project_id)
    return qs.order_by('num')
```

Runs on every request. The `project__owner=request.user` filter is the security boundary — a user can never reach another user's data.

### perform_create() — inject server-side values on POST

```python
def perform_create(self, serializer):
    serializer.save(owner=self.request.user)
```

Without this, `owner` would need to be in the POST body (and could be lied about). With it, `owner` is read-only in the serializer and injected here from `request.user`.

### perform_update() — server-side logic on PATCH

```python
def perform_update(self, serializer):
    new_status = serializer.validated_data.get('status', serializer.instance.status)
    if new_status == 'Done' and serializer.instance.status != 'Done':
        serializer.save(closed_at=timezone.now())
    elif new_status != 'Done' and serializer.instance.status == 'Done':
        serializer.save(closed_at=None)
    else:
        serializer.save()
```

The fallback in `.get('status', serializer.instance.status)` matters: if `status` isn't in the PATCH body, use the current DB value. Without it, patching just `priority` would set `new_status=None` and wrongly trigger the "moving away from Done" branch.''',
    },
    {
        'title': 'Request Lifecycle',
        'order': 6,
        'content': '''# What Happens On a PATCH

```
PATCH /api/tasks/DS-001/  body: {"status": "Done"}
Authorization: Bearer <jwt>
```

```
1. CorsMiddleware checks Origin → allowed? ✅
2. JWTAuthentication reads Bearer token → decodes → fetches user → sets request.user
3. URL router matches /api/tasks/DS-001/ → TaskViewSet, action=partial_update
4. IsAuthenticated permission → request.user authenticated? ✅
5. TaskViewSet.get_queryset() → Task.objects.filter(project__owner=request.user)
   - Does DS-001 belong to this user's project? ✅ → continue
   - Belongs to someone else? ❌ → 404
6. TaskSerializer(instance=<task>, data={"status": "Done"}, partial=True)
   - validates the body
   - strips read_only fields (id, closed_at, etc.)
7. TaskViewSet.perform_update(serializer)  ← our override fires here
   - new_status = "Done"
   - instance.status = "In progress"
   - First branch fires → serializer.save(closed_at=timezone.now())
8. serializer.save() merges validated_data + kwargs
   - DB: UPDATE api_task SET status='Done', closed_at=<now> WHERE id='DS-001'
9. Serializer serializes the updated instance to JSON
10. HTTP 200 with the full updated task body
```

The frontend never sent `closed_at` — it was injected at step 7. The frontend never needed to know about it. This is what server-side logic gives you: invariants that hold regardless of what the client sends.''',
    },
    {
        'title': 'JWT Authentication',
        'order': 7,
        'content': '''# How JWT Auth Works

## The login flow

```
1. POST /api/token/  { username, password }
2. SimpleJWT verifies credentials against User table
3. Returns { access: "eyJ...", refresh: "eyJ..." }
4. Frontend stores access token in memory (token.js module variable)
5. Frontend ignores refresh token (re-login on page refresh — acceptable for solo tool)
```

## Every API request

```python
# axios interceptor (frontend)
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

```python
# Django side (REST_FRAMEWORK setting)
DEFAULT_AUTHENTICATION_CLASSES = (
    'rest_framework_simplejwt.authentication.JWTAuthentication',
    'rest_framework.authentication.SessionAuthentication',
)
DEFAULT_PERMISSION_CLASSES = ('rest_framework.permissions.IsAuthenticated',)
```

JWTAuthentication reads the `Authorization: Bearer <token>` header on every request, validates the signature against `SECRET_KEY`, checks expiry, and sets `request.user`. If anything fails → 401 before your viewset code runs.

## Token expiry handling

The frontend response interceptor catches 401 and reloads:

```python
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTokenEndpoint = error.config?.url?.includes('/token/');
    if (error.response?.status === 401 && !isTokenEndpoint) {
      clearToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);
```

The `isTokenEndpoint` guard is critical — without it, a wrong password at login would 401 and trigger a reload, hiding the error message before the user could see it.

## Token settings

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}
```

One-day access tokens mean you won't be logged out mid-session. `ROTATE_REFRESH_TOKENS` issues a new refresh token on every refresh call — limits the damage if a refresh token leaks.''',
    },
    {
        'title': 'TanStack Query Patterns',
        'order': 8,
        'content': '''# TanStack Query — The Frontend Cache

## Why not plain useEffect + axios?

```js
// 6 lines of boilerplate, no caching, no background refresh
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
useEffect(() => {
  axios.get('/api/projects/').then(r => setData(r.data)).catch(setError).finally(() => setLoading(false))
}, [])
```

vs TanStack:

```js
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.get('/projects/').then(r => r.data)
})
```

## queryKey — the cache address

Every result is stored at a unique key:

```
['projects']                       → all projects
['sprints', 'devspace']            → sprints for one project
['tasks', 'devspace', 's-1']       → tasks for one sprint
['tasks', 'devspace', 'backlog']   → backlog
```

Switching projects? `['sprints', 'devspace']` and `['sprints', 'inkwell']` are different cache entries — instant when you return.

## The hook pair pattern

Every resource gets one `useQuery` for reading and one or more `useMutation` for writing:

```js
export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.get('/sprints/', { params: { project: projectId } }).then(r => r.data),
    enabled: !!projectId,    // don't fetch with undefined projectId
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/sprints/', data).then(r => r.data),
    onSuccess: (newSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', newSprint.project] });
    },
  });
}
```

## Prefix matching in invalidateQueries

```js
queryClient.invalidateQueries({ queryKey: ['tasks', 'devspace'] })
```

Invalidates EVERY cache entry whose key starts with `['tasks', 'devspace']`:
- `['tasks', 'devspace', 's-1']` ✅
- `['tasks', 'devspace', 'backlog']` ✅
- `['tasks', 'other-project', 's-1']` ❌ (different prefix)

One invalidation wipes the kanban, the backlog, and any other task list for that project.

## The full mutation cycle

```
User submits form
  → createSprint.mutate(data)
    → POST /api/sprints/
      → onSuccess(newSprint) fires → invalidateQueries(['sprints', newSprint.project])
        → useSprints sees cache is stale
          → automatic re-fetch
            → component re-renders with the new sprint
```

You never manually setState after a mutation. Invalidate the key, and TanStack handles the rest.''',
    },
    {
        'title': 'Token Security & The Vault',
        'order': 9,
        'content': '''# Why Token in Memory, Not localStorage

## The XSS attack

`localStorage` is accessible by any JavaScript running on the page. If an XSS vulnerability is ever introduced — injected script tag, malicious npm dependency — the attacker can run `localStorage.getItem('token')` and steal the session.

## In-memory storage

```js
// token.js
let _token = null;
export const getToken = () => _token;
export const setToken = (t) => { _token = t; };
export const clearToken = () => { _token = null; };
```

JavaScript modules are singletons. Every file that imports `token.js` gets the same instance. The variable lives in the JS engine's memory, not in the DOM. A script can't access another module's private variables.

**Downside:** the token is gone on page refresh — re-login required. For a solo dev tool, acceptable.

## The vault model — same idea, project-scoped

The Environment Variables Vault uses identical reasoning for env vars at rest in the browser:

```python
# Backend stores SHA-256 hash on Project
project.vault_password_hash = hashlib.sha256(password.encode()).hexdigest()
```

```js
// Frontend tracks unlock state in React state — never localStorage
const [unlockedUntil, setUnlockedUntil] = useState(null);

const handleUnlock = (password) => {
  unlockVault.mutate({ projectId, password }, {
    onSuccess: (data) => {
      if (data.success) {
        // Auto-lock after timeout minutes
        setUnlockedUntil(Date.now() + data.timeout * 60 * 1000);
      }
    },
  });
};

// Auto-lock via setTimeout
useEffect(() => {
  if (!unlockedUntil) return;
  const ms = unlockedUntil - Date.now();
  const t = setTimeout(() => setUnlockedUntil(null), ms);
  return () => clearTimeout(t);
}, [unlockedUntil]);
```

Page refresh → unlocked state gone → vault locked again. Same threat model as the JWT: prevent persistent client-side storage of sensitive data.

## What SHA-256 buys you

Not bcrypt-level strength, but for a personal single-user tool it's enough. An attacker who somehow reads `vault_password_hash` from the database still has to brute-force the hash. For multi-user products you'd upgrade to bcrypt/argon2 with a salt.''',
    },
    {
        'title': 'Future Features Roadmap',
        'order': 10,
        'content': '''# What's Next

Three planned features, in the order they should be built.

## 1. Teams / Multi-user (build first)

Currently every viewset filters by `project__owner=request.user`. Teams replace this with a membership join.

```python
class Membership(models.Model):
    ROLE_CHOICES = [('owner', 'Owner'), ('editor', 'Editor'), ('viewer', 'Viewer')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'project')]
```

Every viewset's `get_queryset` changes from `project__owner=request.user` to filter through the membership table. **Build this first** — every other feature should be built multi-user from day one.

## 2. GitHub Integration

Add `github_repo` to Project and `github_token` to CustomUser. Use the GitHub REST API to pull file trees, commits, and PRs:

```python
import requests

def get_repo_files(repo, token):
    headers = {'Authorization': f'token {token}'}
    url = f'https://api.github.com/repos/{repo}/git/trees/HEAD?recursive=1'
    return requests.get(url, headers=headers).json()
```

Start with personal access tokens, add OAuth later. Tokens must be encrypted at rest.

## 3. AI Agent (Claude API)

```python
import anthropic

class ProjectChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id, owner=request.user)
        message = request.data.get('message', '')

        # Build context from project data
        context = f"Project: {project.name}\\nActive tasks: ..."

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        result = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1024,
            system=f"You are a project-aware assistant.\\n\\n{context}",
            messages=[{'role': 'user', 'content': message}]
        )
        return Response({'reply': result.content[0].text})
```

Model choice: Claude Sonnet 4.6 — fast, ~$0.01–0.05 per call at typical context sizes, strong long-context reasoning.

## Auth for Teams

When Teams ships, social login (GitHub, Google) becomes valuable. Use `django-allauth` — handles OAuth for both providers cleanly, plugs into the existing CustomUser model in ~50 lines of config.''',
    },

    # ─── Backend Reference Series — boilerplate for any Django + DRF project ───

    {
        'title': 'Backend Reference: Project Setup',
        'order': 11,
        'content': '''# Starting A New Django + DRF Backend

Everything you need to scaffold a fresh backend that mirrors DevSpace.

## Folder layout

```
backend/
├── backend/              # The "config" package — settings, root urls, wsgi/asgi
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── api/                  # Your first business app
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── users/                # Custom user app — keep separate from business logic
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── manage.py
├── requirements.txt
└── .env.backend          # NEVER commit — add to .gitignore
```

**Why a separate `users` app?** You always want a custom user model from day one. Keeping it in its own app means user-specific logic (signals, managers, profile fields) lives in one place instead of polluting your business app.

## Minimal requirements.txt

```
Django>=6.0
djangorestframework>=3.16
djangorestframework-simplejwt>=5.5
django-cors-headers>=4.7
psycopg2-binary>=2.9
python-dotenv>=1.0
```

Add as needed:
- `dj-database-url` if you want one-line DATABASE_URL parsing
- `django-filter` for query-param filtering
- `Pillow` if you use ImageField
- `django-extensions` for shell_plus and other dev goodies

## Bootstrap commands

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

django-admin startproject backend .
python manage.py startapp api
python manage.py startapp users

# Critical: create custom user model BEFORE the first migration
# (edit users/models.py first, then AUTH_USER_MODEL in settings.py)

python manage.py makemigrations users
python manage.py migrate users

python manage.py makemigrations api
python manage.py migrate

python manage.py createsuperuser
```

## The order-of-operations rule

**Decide on your custom user model on day zero.** Changing `AUTH_USER_MODEL` after migrations have run with real data requires painful data migration gymnastics. Even if you do not need extra fields immediately, create the custom user model upfront so you can extend it later without pain.

## Pre-flight checklist before runserver

- [ ] `.env.backend` exists with `SECRET_KEY`, `DATABASE_URL`, `DEBUG=True`
- [ ] `.env.backend` is in `.gitignore`
- [ ] Custom user model exists and `AUTH_USER_MODEL = 'users.CustomUser'`
- [ ] All apps in `INSTALLED_APPS` (yours + `rest_framework`, `corsheaders`)
- [ ] `CorsMiddleware` is ABOVE `CommonMiddleware`
- [ ] Initial migrations ran without errors
- [ ] Superuser created

When all of these pass, `python manage.py runserver` boots cleanly and `/admin/` works.''',
    },

    {
        'title': 'Backend Reference: Models In Depth',
        'order': 12,
        'content': '''# Django Models — Every Field Type

The complete reference: every common field type, every option, when to reach for what.

## Text fields

| Field | Use for | Notes |
|---|---|---|
| `CharField(max_length=N)` | Short text, titles, slugs | `max_length` is REQUIRED |
| `TextField()` | Long text, markdown, descriptions | No length limit |
| `SlugField(max_length=100)` | URL-safe identifiers | Validates slug pattern |
| `EmailField()` | Email addresses | Validates email format |
| `URLField()` | URLs | Validates URL format |

## Numeric fields

| Field | Range / use |
|---|---|
| `IntegerField()` | -2.1B to 2.1B |
| `PositiveIntegerField()` | 0 to 2.1B (counts, points) |
| `BigIntegerField()` | -9.2 quintillion to 9.2 quintillion |
| `FloatField()` | Floating point — use sparingly (precision issues) |
| `DecimalField(max_digits=10, decimal_places=2)` | Money, exact percentages |

## Date / time fields

| Field | What it stores |
|---|---|
| `DateField()` | Date only |
| `DateTimeField()` | Date + time + timezone |
| `TimeField()` | Time only |
| `DurationField()` | Time delta (Python `timedelta`) |

## Boolean & enum

```python
class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_public = models.BooleanField(default=False)
```

## JSON & files

```python
tags = models.JSONField(default=list)
config = models.JSONField(default=dict)

avatar = models.ImageField(upload_to='avatars/%Y/%m/')
attachment = models.FileField(upload_to='attachments/')
```

## Field options every field accepts

| Option | What it does |
|---|---|
| `null=True` | Allow NULL in the database |
| `blank=True` | Allow empty in forms / serializers |
| `default=...` | Default value when not provided |
| `unique=True` | Add a UNIQUE constraint |
| `db_index=True` | Add an index for query speed |
| `editable=False` | Hide from admin and forms |
| `help_text="..."` | Documentation shown in admin |
| `verbose_name="..."` | Human-readable name |
| `validators=[...]` | List of validation functions |

**The `null` vs `blank` rule:** `null=True` is about the database, `blank=True` is about validation. For string fields, prefer `blank=True` only (use empty string instead of NULL). For numeric/date fields, use both: `null=True, blank=True`.

## Primary keys — three patterns

```python
# 1. Default — auto-incrementing integer
# Django adds this automatically if you write no PK field

# 2. UUID — non-enumerable, globally unique
import uuid
id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

# 3. Slug — human-readable, set in save()
id = models.SlugField(primary_key=True, max_length=100)

def save(self, *args, **kwargs):
    if not self.pk:
        self.pk = slugify(self.name)
    super().save(*args, **kwargs)
```

## Meta options

```python
class Project(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']                       # default sort
        verbose_name_plural = 'Projects'                 # admin label
        unique_together = [['owner', 'name']]            # composite unique
        indexes = [models.Index(fields=['owner', '-created_at'])]
```

## auto_now vs auto_now_add

```python
created_at = models.DateTimeField(auto_now_add=True)    # set ONCE on create
updated_at = models.DateTimeField(auto_now=True)        # set on EVERY save
```

These bypass the serializer — Django sets them at the model layer. Always mark them `read_only_fields` in the serializer or the frontend could send fake timestamps.''',
    },

    {
        'title': 'Backend Reference: Relationships & ORM',
        'order': 13,
        'content': '''# Relationships and Querying

ForeignKey, ManyToMany, the `__` lookup syntax, and how to avoid N+1 query problems.

## ForeignKey

```python
class Task(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
```

Reverse access: `project.tasks.all()` returns all tasks (thanks to `related_name`).

### on_delete options

| Option | Behavior |
|---|---|
| `CASCADE` | Delete parent → delete children |
| `SET_NULL` | Delete parent → set FK to NULL (needs `null=True`) |
| `SET_DEFAULT` | Delete parent → set FK to default value |
| `SET(callable)` | Delete parent → set FK to result of callable |
| `PROTECT` | Prevent deletion (raises ProtectedError) |
| `RESTRICT` | Like PROTECT but allows if a CASCADE cleans it up |
| `DO_NOTHING` | No action (DB constraints may fail) |

**Rule of thumb:** `CASCADE` for children with no meaning without the parent (Task → Project). `SET_NULL` for relationships that should "demote" when the parent is gone (Task → Sprint becomes a backlog task).

## ManyToManyField

```python
class Task(models.Model):
    labels = models.ManyToManyField('Label', related_name='tasks', blank=True)
```

Django auto-creates a join table. Use it like:

```python
task.labels.add(label1, label2)
task.labels.remove(label1)
task.labels.set([label1, label3])   # replace all
task.labels.clear()
```

### Through model — when you need fields on the relationship

```python
class Membership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    role = models.CharField(max_length=20)
    joined_at = models.DateTimeField(auto_now_add=True)

class Project(models.Model):
    members = models.ManyToManyField(User, through=Membership, related_name='projects')
```

This is exactly the pattern Teams will use in DevSpace.

## OneToOneField

```python
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
```

Use for splitting a wide model. The Profile extension pattern is the canonical case — keep User small, put squishier fields on Profile.

## The `__` lookup syntax

Traverse FK relationships in filters:

```python
Sprint.objects.filter(project__owner=request.user)
Task.objects.filter(sprint__project__owner__email='dev@example.com')
```

## Common lookups

| Lookup | SQL equivalent |
|---|---|
| `field=value` | `field = value` |
| `field__iexact='x'` | Case-insensitive equals |
| `field__contains='x'` | `LIKE %x%` |
| `field__icontains='x'` | `LIKE %x%` case-insensitive |
| `field__startswith='x'` | `LIKE x%` |
| `field__in=[1,2,3]` | `IN (1,2,3)` |
| `field__gt=value` | `field > value` |
| `field__gte=value` | `field >= value` |
| `field__lt=value` | `field < value` |
| `field__isnull=True` | `IS NULL` |
| `date__year=2026` | Extract year from date |

## Q objects — OR conditions

```python
from django.db.models import Q

Task.objects.filter(
    Q(status='Backlog') | Q(status='To do')
)
```

## F objects — reference another field of the same row

```python
from django.db.models import F

# Atomic increment, no race condition
Task.objects.filter(id=task_id).update(view_count=F('view_count') + 1)
```

## select_related vs prefetch_related — N+1 problem

```python
# BAD: one query per task
for task in Task.objects.all():
    print(task.project.name)         # ← extra query per iteration

# GOOD: single JOIN
for task in Task.objects.select_related('project').all():
    print(task.project.name)

# For M2M and reverse FK, use prefetch_related
for project in Project.objects.prefetch_related('tasks').all():
    for task in project.tasks.all():   # ← reuses prefetched data
        print(task.title)
```

**Rule of thumb:** `select_related` for forward FK and OneToOne (single JOIN). `prefetch_related` for M2M and reverse FK (separate query, then matched in Python). Use `django-debug-toolbar` in dev to spot N+1.''',
    },

    {
        'title': 'Backend Reference: Custom User Models',
        'order': 14,
        'content': '''# Custom User Models — Four Approaches

Django gives you four ways to extend the user. Pick one on day zero.

## 1. The default User — just use it

If you genuinely have no user-specific fields, you can use `django.contrib.auth.models.User` directly. **Do not do this in a real project.** You will eventually need a custom field, and migrating later is painful.

## 2. AbstractUser — extend the default (recommended for most apps)

Inherit from `AbstractUser` to keep everything Django gives you (`username`, `email`, `password`, `is_staff`, `is_active`, `is_superuser`, `groups`, `user_permissions`) and add fields:

```python
# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    display_name = models.CharField(max_length=80, blank=True)
    role = models.CharField(max_length=80, blank=True, default='Solo dev')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
```

```python
# settings.py
AUTH_USER_MODEL = 'users.CustomUser'
```

DevSpace uses this approach. Simplest, most compatible with third-party apps.

## 3. AbstractBaseUser — full control (advanced)

Use when you need to change fundamental authentication behavior — like using email as the unique identifier instead of username.

```python
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class EmailUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
```

You write more code, but you control everything.

## 4. Profile model with OneToOne — additive

Keep the default User untouched, add a Profile that has a OneToOne back to it.

```python
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
```

Auto-create on signup with a signal:

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

**Use this when:** You can't change the user model (e.g. shared user across apps). Otherwise prefer `AbstractUser`.

## Which to pick

| Approach | When |
|---|---|
| Default User | Never in real projects |
| **AbstractUser** | **Default choice — 90% of apps** |
| AbstractBaseUser | Email-as-login, or custom auth flow |
| Profile + OneToOne | Can't modify the user table |

## Critical rules

1. **Decide on day zero.** Switching after migrations is painful.
2. **`AUTH_USER_MODEL` set BEFORE first migration.** Otherwise you migrate the default User table and then can't swap.
3. **Reference via `settings.AUTH_USER_MODEL`** in FK definitions, not the import:

```python
# GOOD
owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

# BAD — hardcodes the model class, breaks if you swap
from django.contrib.auth.models import User
owner = models.ForeignKey(User, on_delete=models.CASCADE)
```''',
    },

    {
        'title': 'Backend Reference: DRF View Types',
        'order': 15,
        'content': '''# DRF View Types — Every Option

DRF gives you a ladder of abstractions. Pick the highest one that fits.

## 1. APIView — minimal, you do everything

```python
from rest_framework.views import APIView
from rest_framework.response import Response

class HelloView(APIView):
    def get(self, request):
        return Response({'message': 'hello'})

    def post(self, request):
        return Response({'received': request.data}, status=201)
```

You manually define `get`, `post`, `put`, `patch`, `delete`. No queryset. No serializer. Maximum freedom, maximum boilerplate.

**Use when:** Custom action endpoints that do not map to a model (login, search, dashboard, webhooks).

## 2. GenericAPIView + mixins — pick your operations

```python
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, CreateModelMixin

class TaskListView(ListModelMixin, CreateModelMixin, GenericAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get(self, request):
        return self.list(request)

    def post(self, request):
        return self.create(request)
```

Mixins to combine: `ListModelMixin`, `CreateModelMixin`, `RetrieveModelMixin`, `UpdateModelMixin`, `DestroyModelMixin`.

## 3. Concrete generic views — one-line views

DRF bundles common mixin combinations:

```python
from rest_framework import generics

class TaskList(generics.ListCreateAPIView):           # GET + POST
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class TaskDetail(generics.RetrieveUpdateDestroyAPIView):   # GET + PATCH + DELETE
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
```

Full list:

| Class | HTTP verbs |
|---|---|
| `ListAPIView` | GET |
| `CreateAPIView` | POST |
| `RetrieveAPIView` | GET (one) |
| `UpdateAPIView` | PUT, PATCH |
| `DestroyAPIView` | DELETE |
| `ListCreateAPIView` | GET, POST |
| `RetrieveUpdateAPIView` | GET, PUT, PATCH |
| `RetrieveDestroyAPIView` | GET, DELETE |
| `RetrieveUpdateDestroyAPIView` | GET, PUT, PATCH, DELETE |

DevSpace uses `RetrieveUpdateAPIView` for the `/api/me/` endpoint:

```python
class MeView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
```

## 4. ViewSets — group related views under one class

```python
from rest_framework import viewsets

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(project__owner=self.request.user)
```

`ModelViewSet` inherits all 5 CRUD operations. Use with a `DefaultRouter` and you get all the URLs for free:

```python
# urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
```

Generated URLs:

| URL | Method | Action |
|---|---|---|
| `/tasks/` | GET | list |
| `/tasks/` | POST | create |
| `/tasks/{pk}/` | GET | retrieve |
| `/tasks/{pk}/` | PUT | update |
| `/tasks/{pk}/` | PATCH | partial_update |
| `/tasks/{pk}/` | DELETE | destroy |

## Custom actions on ViewSets

```python
from rest_framework.decorators import action

class TaskViewSet(viewsets.ModelViewSet):
    # ...

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        # POST /tasks/{pk}/archive/
        task = self.get_object()
        task.status = 'Archived'
        task.save()
        return Response({'status': 'archived'})

    @action(detail=False)
    def stats(self, request):
        # GET /tasks/stats/
        total = self.get_queryset().count()
        return Response({'total': total})
```

`detail=True` → operates on a single instance, URL has `{pk}`. `detail=False` → operates on the collection.

## The override hooks every ViewSet supports

| Hook | When it runs |
|---|---|
| `get_queryset()` | Every request, to filter the rows |
| `get_serializer_class()` | Every request — return different serializer per action |
| `get_object()` | When fetching a single instance |
| `perform_create(serializer)` | After validation, before save (POST) |
| `perform_update(serializer)` | After validation, before save (PATCH/PUT) |
| `perform_destroy(instance)` | Before delete |

## When to pick what

| You need | Use |
|---|---|
| Full CRUD on one model | `ModelViewSet` |
| Just list + create | `ListCreateAPIView` |
| GET / PATCH on `request.user` | `RetrieveUpdateAPIView` with `get_object()` |
| Custom non-CRUD action | `APIView` |
| Aggregate or search endpoint | `APIView` |''',
    },

    {
        'title': 'Backend Reference: DRF Permissions',
        'order': 16,
        'content': '''# DRF Permissions — Auth at the Right Layer

Permissions answer "can this user do this action?" They run after authentication, before your view code.

## The built-in classes

```python
from rest_framework.permissions import (
    AllowAny,                    # everyone allowed
    IsAuthenticated,             # must be logged in
    IsAdminUser,                 # must have is_staff=True
    IsAuthenticatedOrReadOnly,   # auth for POST/PATCH/DELETE, anyone can GET
)
```

## Global defaults

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
```

Now EVERY endpoint requires a valid token unless overridden.

## Per-view override

```python
class PublicView(APIView):
    permission_classes = [AllowAny]   # this endpoint is public
```

```python
class AdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]   # AND combined
```

Multiple classes are combined with AND — all must return `True`.

## Object-level permissions

```python
from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwner]
```

`has_object_permission` is called when `self.get_object()` runs — after the row is fetched, before the view logic.

**Important:** Object-level permissions only run when the view explicitly fetches a single object (`retrieve`, `update`, `destroy`). For `list`, you must filter the queryset yourself in `get_queryset()`.

## Role-based — full custom permission

```python
class IsProjectMember(BasePermission):
    """Allow access only if the user is a member of the project."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id') or request.query_params.get('project')
        if not project_id:
            return False
        return Membership.objects.filter(
            user=request.user,
            project_id=project_id,
        ).exists()

    def has_object_permission(self, request, view, obj):
        # Different roles for different verbs
        membership = Membership.objects.filter(user=request.user, project=obj.project).first()
        if not membership:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True   # any member can read
        return membership.role in ('owner', 'editor')   # write requires editor+
```

## SAFE_METHODS shortcut

```python
from rest_framework.permissions import SAFE_METHODS, BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user
```

`SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')` — anything that does not modify state.

## OR / NOT composition (DRF 3.9+)

```python
permission_classes = [IsAuthenticated & (IsOwner | IsAdminUser)]
```

`&` is AND, `|` is OR, `~` is NOT. Use parentheses for clarity.

## Two layers of security

```python
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Layer 1: filter the LIST to user's own data
        return Project.objects.filter(owner=self.request.user)

    # Layer 2 (if needed): per-object check
    # IsOwner permission class would catch DETAIL endpoints
```

**The security boundary is in `get_queryset()` for list endpoints, and in `has_object_permission()` for detail endpoints.** Never rely on the URL to filter — always filter the queryset.''',
    },

    {
        'title': 'Backend Reference: DRF Serializers Advanced',
        'order': 17,
        'content': '''# DRF Serializers — Beyond ModelSerializer

Nested serializers, custom validation, computed fields, write-only fields, and when to drop into `Serializer` directly.

## Computed fields with SerializerMethodField

```python
class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    has_vault_password = serializers.SerializerMethodField()

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_has_vault_password(self, obj):
        return bool(obj.vault_password_hash)

    class Meta:
        model = Project
        fields = ['id', 'name', 'task_count', 'has_vault_password']
```

SerializerMethodField is always read-only. Useful for exposing booleans or aggregates without exposing the raw underlying field.

## Nested serializers — embed related data

```python
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'status']

class SprintSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)   # nested

    class Meta:
        model = Sprint
        fields = ['id', 'name', 'tasks']
```

GET `/api/sprints/s-1/` returns:

```json
{
  "id": "s-1",
  "name": "Sprint 1",
  "tasks": [
    {"id": "DS-001", "title": "Write tests", "status": "Done"}
  ]
}
```

`read_only=True` is important — otherwise DRF expects nested writes which require manual handling.

## PrimaryKeyRelatedField — accept IDs, return IDs

```python
class TaskSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Task
        fields = ['id', 'title', 'project']
```

Default for FK in ModelSerializer. Frontend sends `"project": "devspace"`, receives the same.

## StringRelatedField — return the model's __str__

```python
project = serializers.StringRelatedField()   # read-only by default
```

Returns `"DevSpace"` instead of the ID. Read-only.

## Custom validation

### Field-level

```python
class TaskSerializer(serializers.ModelSerializer):
    def validate_title(self, value):
        if 'TODO' in value:
            raise serializers.ValidationError("Title cannot contain 'TODO'")
        return value
```

`validate_<fieldname>` runs after the built-in field validators.

### Object-level

```python
def validate(self, data):
    if data.get('status') == 'Done' and not data.get('closed_at'):
        # Cross-field validation — closed_at must be set when Done
        data['closed_at'] = timezone.now()
    return data
```

`validate()` runs after all field validations pass. Returns the cleaned `data` dict (you can mutate it).

## Write-only fields

```python
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   # hash it
        user.save()
        return user
```

`write_only=True` means the field accepts input but never appears in responses. Perfect for passwords.

## extra_kwargs — modify auto-generated field config

```python
class Meta:
    model = User
    fields = ['id', 'username', 'password']
    extra_kwargs = {
        'password': {'write_only': True, 'min_length': 8},
    }
```

Cleaner than declaring the field at the top of the class.

## When to drop to plain Serializer

ModelSerializer is great for CRUD on a single model. Drop to `serializers.Serializer` (or no serializer at all) when:

- The endpoint accepts shapes that do not map to one model
- You are building an action endpoint (login, search, batch operations)

```python
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data['user'] = user
        return data
```

## Different serializers for different actions

```python
class TaskViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer       # minimal fields for fast list
        return TaskDetailSerializer         # full fields for detail
```

Use this for list-vs-detail responses, or for write-vs-read shape differences.''',
    },

    {
        'title': 'Backend Reference: JWT Tokens Deep Dive',
        'order': 18,
        'content': '''# JWT Tokens — Structure, Customization, Refresh Flow

What is actually inside a JWT, how to customize what is in it, and how the refresh flow works.

## Anatomy of a JWT

A JWT is three base64-encoded segments separated by dots:

```
eyJhbGciOiJIUzI1NiIs...   <- header
.eyJ0b2tlbl90eXBlIjoi...  <- payload (claims)
.kQ8d3p3Q1ZJtzv3xLgs...   <- signature
```

Decode the payload at jwt.io. You will see something like:

```json
{
  "token_type": "access",
  "exp": 1735660800,        // expiry (unix timestamp)
  "iat": 1735574400,        // issued at
  "jti": "abc123...",       // JWT ID (unique per token)
  "user_id": 1              // your custom claim — points to a real user
}
```

**Critical:** The payload is BASE64, not encrypted. Anyone with the token can read its contents. Never put sensitive data in a JWT.

## How the signature protects against tampering

The signature is `HMAC_SHA256(header + "." + payload, SECRET_KEY)`. If anyone changes the payload, the signature stops matching. Django verifies the signature using `SECRET_KEY` on every request — if it does not match, 401.

This is why your `SECRET_KEY` must be:
1. Long and random (50+ chars)
2. Never committed to git
3. Never shared across environments

Leaking `SECRET_KEY` means an attacker can forge tokens for any user. Rotate immediately if it leaks.

## Default SimpleJWT settings

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),     # default — too short for SPAs
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_TYPE_CLAIM': 'token_type',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

DevSpace overrides a few:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## The refresh flow

```
1. Login:
   POST /api/token/  { username, password }
   → { access: "...", refresh: "..." }

2. Access token expires after ACCESS_TOKEN_LIFETIME:
   GET /api/projects/  with stale token
   → 401 Unauthorized

3. Frontend uses refresh token to get a new access token:
   POST /api/token/refresh/  { refresh: "..." }
   → { access: "..." (new) }

4. Continue with new access token
```

## Adding custom claims to tokens

Override the token serializer to add data to the payload:

```python
# users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['display_name'] = user.display_name
        token['is_staff'] = user.is_staff
        return token
```

```python
# users/views.py
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
```

Now the frontend can decode the JWT and get the display_name without a separate `/api/me/` call.

## Token blacklisting (logout)

By default JWTs cannot be invalidated server-side — they are valid until they expire. To enable blacklisting:

```python
INSTALLED_APPS += ['rest_framework_simplejwt.token_blacklist']

SIMPLE_JWT = {
    # ...
    'BLACKLIST_AFTER_ROTATION': True,
}
```

```python
# Logout endpoint
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=205)
        except Exception:
            return Response(status=400)
```

## RS256 vs HS256 (algorithm choice)

| Algorithm | Use when |
|---|---|
| **HS256** (HMAC) | Single backend, one secret for sign + verify (DevSpace default) |
| **RS256** (RSA) | Multiple services need to verify tokens without the signing key |

For solo backend apps, HS256 is fine. For microservices, switch to RS256.

## Frontend best practices

1. Store the access token in memory, NOT localStorage (XSS protection)
2. Store the refresh token in an HttpOnly cookie if you need persistence
3. Send `Authorization: Bearer <token>` via an axios interceptor
4. On 401, attempt one refresh, then redirect to login on failure
5. Never decode tokens client-side to make security decisions — only the server can be trusted''',
    },

    {
        'title': 'Backend Reference: Environment & Secrets',
        'order': 19,
        'content': '''# Environment Variables & Secrets

How to manage secrets across dev, staging, and production — without committing them.

## The .env pattern

Create `.env.backend` in your `backend/` directory:

```bash
# .env.backend
SECRET_KEY=django-insecure-very-long-random-string-here
DEBUG=True
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Third-party secrets
ANTHROPIC_API_KEY=sk-...
GITHUB_CLIENT_SECRET=...
```

Load with `python-dotenv` in settings.py:

```python
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env.backend')

import os
SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
```

## The DEBUG cast trap

```python
DEBUG = os.environ.get('DEBUG', 'True') == 'True'   # ✅
```

NOT this:

```python
DEBUG = bool(os.environ.get('DEBUG'))   # ❌ "False" is truthy!
```

Environment variables are always strings. Any non-empty string is truthy in Python — including the literal string `"False"`. Always compare explicitly.

## What to NEVER commit

Add to `.gitignore`:

```
# .gitignore
*.env
.env*
!.env.example
db.sqlite3
__pycache__/
*.pyc
/staticfiles/
/media/
```

Never commit:
- `SECRET_KEY`
- Database passwords / connection strings with credentials
- API keys (OpenAI, Anthropic, Stripe, AWS, etc.)
- OAuth client secrets
- Encryption keys
- Personal access tokens

## .env.example — the template that IS committed

```bash
# .env.example  ← commit this
SECRET_KEY=
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp_dev
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

New team members copy `.env.example` → `.env.backend` and fill in real values.

## Generating a secure SECRET_KEY

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

50 random characters, suitable for cryptographic use.

## Production vs development

Use environment-specific files:

```
.env.backend           ← development (gitignored)
.env.backend.staging   ← staging (gitignored)
.env.backend.prod      ← production (gitignored)
```

In production (Render/Vercel/etc.), DO NOT use a `.env` file at all. Set env vars via the platform's UI/CLI. The `os.environ.get(...)` in settings.py reads them the same way — no code change needed.

## Validating required env vars on boot

```python
REQUIRED_ENV = ['SECRET_KEY', 'DATABASE_URL']

for var in REQUIRED_ENV:
    if not os.environ.get(var):
        raise ImproperlyConfigured(f"Missing required env var: {var}")
```

Fail fast on missing config rather than silently running with defaults.

## Common secret types

| What | Where it goes | Notes |
|---|---|---|
| Django SECRET_KEY | env var | Rotate if leaked — invalidates all sessions |
| DATABASE_URL | env var | Includes password — never log it |
| OAuth client secret | env var | Rotate every 90 days |
| API keys (Anthropic, etc.) | env var | Use per-environment keys |
| Encryption keys for stored data | env var (or KMS) | Cannot be rotated without re-encrypting data |
| OAuth tokens FROM users | encrypted DB field | Use `cryptography` library |

## Encrypting tokens at rest

For things like user GitHub tokens stored in your DB:

```python
from cryptography.fernet import Fernet
import os

FERNET_KEY = os.environ['FERNET_KEY']   # 32-url-safe-base64-encoded bytes
cipher = Fernet(FERNET_KEY.encode())

def encrypt(plaintext: str) -> str:
    return cipher.encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    return cipher.decrypt(ciphertext.encode()).decode()
```

Generate FERNET_KEY once: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.

Lose this key → all your encrypted data is lost. Back it up.''',
    },

    {
        'title': 'Backend Reference: Production Deployment Checklist',
        'order': 20,
        'content': '''# Production Deployment — The Settings Checklist

Everything to flip when moving from development to production.

## Critical settings to change

### 1. DEBUG = False

```python
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
```

In production, set `DEBUG=False` in env vars. With DEBUG=False:
- Django will NOT show the yellow error page (leaks code & settings)
- Static files are NOT served by Django (you need a real server / CDN)
- `ALLOWED_HOSTS` must be set or all requests are rejected

### 2. ALLOWED_HOSTS

```python
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Render injects RENDER_EXTERNAL_HOSTNAME automatically — add it if present
_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if _render_host:
    ALLOWED_HOSTS.append(_render_host)
```

This pattern means you never have to manually set `ALLOWED_HOSTS` on Render — the platform tells Django its own hostname at boot. No env var to configure, no `DisallowedHost` errors.

If you want to set it manually instead:

```bash
ALLOWED_HOSTS=api.devspace.com,devspace-api.onrender.com
```

Without this, Django rejects every request with `DisallowedHost`.

### 3. SECRET_KEY

Generate a fresh key for production. Never reuse the dev key.

```python
SECRET_KEY = os.environ['SECRET_KEY']   # no fallback — fail if missing
```

### 4. CORS_ALLOWED_ORIGINS

```python
if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [r'^http://localhost:\\d+$']
else:
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
```

```bash
CORS_ALLOWED_ORIGINS=https://devspace.com,https://www.devspace.com
```

Never use `CORS_ALLOW_ALL_ORIGINS=True` in production.

### 5. Database connection pooling

```python
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,        # reuse connections for 10 minutes
        ssl_require=not DEBUG,   # require SSL in production
    )
}
```

`conn_max_age` is critical for serverless Postgres (Neon, Supabase) — without it you open a new connection per request and exhaust the pool.

### 6. Security headers

```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000    # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'
```

### 7. Static files (if you serve them)

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Add WhiteNoise to MIDDLEWARE (just after SecurityMiddleware)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # ← here
    # ...
]

# In production, use compressed manifest storage for cache-busting
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

Run `python manage.py collectstatic` during deploy.

### 8. Logging

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if not DEBUG else 'DEBUG',
    },
}
```

Most hosting platforms (Render, Heroku) capture stdout/stderr automatically.

## The deployment checklist

Run through this before deploying:

- [ ] `DEBUG=False` in production env
- [ ] `SECRET_KEY` is unique to production (generated, not shared)
- [ ] `ALLOWED_HOSTS` includes your production domain
- [ ] `CORS_ALLOWED_ORIGINS` lists your frontend domain
- [ ] `DATABASE_URL` points to production DB with SSL
- [ ] `conn_max_age` set to 600+ for serverless Postgres
- [ ] Static files configured (WhiteNoise or CDN)
- [ ] `collectstatic` runs in deploy step
- [ ] Migrations run in deploy step (`python manage.py migrate`)
- [ ] Security headers enabled (HSTS, secure cookies)
- [ ] Logging captures to stdout (not files)
- [ ] Healthcheck endpoint exists for the platform
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Backups configured on the database

## Healthcheck endpoint

Most platforms ping a URL to know if your app is alive. Add one:

```python
# urls.py
from django.http import JsonResponse

def healthcheck(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('healthz/', healthcheck),
    # ...
]
```

Configure your platform to hit `/healthz/` — keep it cheap (no DB query).

## Build & start commands (Render example)

```bash
# Build command
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate

# Start command
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2
```

`$PORT` is set by the platform — bind to it, not a hardcoded port.

## Worker count rule of thumb

```
workers = 2 * CPU_count + 1
```

For a 1-CPU Render instance: `--workers 3`. More workers = more concurrent requests but more memory. Start with 2–3 and scale based on observed latency.

## After deploy — verify

1. Hit `/healthz/` → 200 OK
2. Hit `/admin/` → loads (proves static files work)
3. POST `/api/token/` with valid creds → returns tokens
4. Use token to GET an authenticated endpoint → returns data
5. Check error tracking shows zero errors after smoke test

If all pass, you are live.''',
    },

    {
        'title': 'Deploying: Render + Vercel + Neon',
        'order': 22,
        'content': '''# Deploying: Render + Vercel + Neon

The exact steps used to deploy DevSpace. Stack: Django on Render, React on Vercel, Postgres on Neon.

## Architecture

```
Browser → Vercel CDN (React SPA)
              ↓ API calls (axios)
        Render Web Service (Django + gunicorn)
              ↓ SQL
        Neon Serverless Postgres
```

Each service is independent. Vercel serves static files only — it never talks to Django directly. The React app runs entirely in the browser and calls the Render API.

## Step 1 — Neon (Database)

Neon is serverless Postgres. Already done for DevSpace, but for future projects:

1. Create account at neon.tech
2. Create a new project → copy the connection string
3. It looks like: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require&channel_binding=require`

**Critical:** Strip `channel_binding=require` from the URL — psycopg2 does not support it and will fail the SSL handshake silently. Handle it in settings.py:

```python
from urllib.parse import urlparse, parse_qsl

tmpPostgres = urlparse(os.getenv("DATABASE_URL"))
_db_options = {k: v for k, v in parse_qsl(tmpPostgres.query) if k != "channel_binding"}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": tmpPostgres.path.replace("/", ""),
        "USER": tmpPostgres.username,
        "PASSWORD": tmpPostgres.password,
        "HOST": tmpPostgres.hostname,
        "PORT": 5432,
        "OPTIONS": _db_options,
    }
}
```

## Step 2 — Render (Django backend)

### Requirements

Make sure `gunicorn` is in `requirements.txt`:

```
gunicorn==23.0.0
```

### Create the Web Service

1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Configure build & start commands:

```bash
# Build command
pip install -r requirements.txt && python manage.py migrate

# Start command
gunicorn backend.wsgi --bind 0.0.0.0:$PORT
```

`backend.wsgi` refers to `backend/backend/wsgi.py` — the inner `backend` is the Django project package name. `$PORT` is injected by Render automatically.

### Environment variables on Render

Set these in Render → Environment:

| Key | Value |
|---|---|
| `DATABASE_URL` | Full Neon connection string |
| `SECRET_KEY` | Long random string (generate one) |
| `DEBUG` | `False` |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |

Do NOT set `ALLOWED_HOSTS` — Render injects `RENDER_EXTERNAL_HOSTNAME` automatically and our settings.py picks it up:

```python
_render_host = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if _render_host:
    ALLOWED_HOSTS.append(_render_host)
```

### Automatic env vars Render injects

You get these for free — no configuration needed:

| Variable | Value |
|---|---|
| `RENDER_EXTERNAL_HOSTNAME` | `devspace-sb95.onrender.com` |
| `RENDER_EXTERNAL_URL` | `https://devspace-sb95.onrender.com` |
| `RENDER_SERVICE_NAME` | your service name |
| `RENDER_ENV` | `production` |
| `PORT` | port gunicorn should bind to |

### Free tier caveat

Render free tier spins down after 15 minutes of inactivity. The first request after a cold start takes 30–60 seconds. Fine for a personal tool. Upgrade to $7/mo for always-on.

## Step 3 — Vercel (React frontend)

1. Go to vercel.com → New Project → Import your repo
2. Set **Root Directory** to `frontend`
3. Vercel auto-detects Vite — framework preset: **Vite**
4. Build settings (usually auto-filled):
   - Build command: `npm run build`
   - Output directory: `dist`

### Environment variables on Vercel

```bash
VITE_API_URL=https://devspace-sb95.onrender.com
```

Note the `VITE_` prefix — Vite only exposes env vars with this prefix to the browser bundle.

Make sure your `api.js` reads it:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Step 4 — Wire CORS

Once Vercel assigns your domain (e.g. `https://devspace-abc.vercel.app`), set it in Render:

```
CORS_ALLOWED_ORIGINS=https://devspace-abc.vercel.app
```

In `settings.py`:

```python
if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^http://localhost:\\d+$"]
else:
    CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
```

## Step 5 — Smoke test

After both services are live:

1. `GET https://your-api.onrender.com/api/projects/` → should return 401 (auth required — proves Django is alive)
2. `POST https://your-api.onrender.com/api/token/` with credentials → should return access + refresh tokens
3. Open the Vercel URL → login → projects load → you are live

## Debugging common errors

| Error | Cause | Fix |
|---|---|---|
| `DisallowedHost` | `ALLOWED_HOSTS` missing the Render domain | Use `RENDER_EXTERNAL_HOSTNAME` pattern |
| `gunicorn: command not found` | gunicorn not in requirements.txt | Add `gunicorn==23.0.0` |
| `CORS blocked` | Frontend domain not in `CORS_ALLOWED_ORIGINS` | Set the env var on Render |
| `password auth failed` | Neon `channel_binding` not stripped | Filter it out in settings.py |
| `502 Bad Gateway` | Start command points to wrong wsgi | Use `backend.wsgi` not `your_application.wsgi` |
| Cold start (30–60s first load) | Render free tier spin-down | Expected behaviour; upgrade to paid to eliminate |
''',
    },

    {
        'title': 'Frontend Reference: TanStack Query In Depth',
        'order': 21,
        'content': '''# TanStack Query — The Complete Reference

Every option, every callback, every pattern. The frontend cache that replaces useEffect + useState data fetching.

## Setup

```js
// main.jsx
import { QueryClient, QueryClientProvider } from '\''@tanstack/react-query'\'';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,          // 1 min — data is "fresh" before refetch
      gcTime: 1000 * 60 * 5,         // 5 min — cache eviction time
      retry: 1,                       // retry once on failure
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById('\''root'\'')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

## useQuery — every option

```js
const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
  queryKey: ['\''tasks'\'', projectId, sprintId],
  queryFn: () => api.get('\''/tasks/'\'').then(r => r.data),

  // Conditional fetch
  enabled: !!projectId,

  // Transform the data before returning it
  select: (data) => data.filter(t => t.status !== '\''Archived'\''),

  // Cache freshness
  staleTime: 1000 * 60 * 3,           // fresh for 3 min — no refetch in this window
  gcTime: 1000 * 60 * 10,             // remove from cache 10 min after last use

  // Automatic refetch
  refetchInterval: 30_000,             // poll every 30s
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,

  // Retry on error
  retry: 3,                             // retry up to 3 times
  retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),  // exp backoff

  // Show previous data while fetching new (for pagination/search)
  placeholderData: (prev) => prev,
});
```

### What the return values mean

| Field | When true |
|---|---|
| `isLoading` | First fetch in progress, no data yet |
| `isFetching` | ANY fetch in progress (including background refetches) |
| `isError` | The last fetch threw |
| `isSuccess` | Data has been successfully fetched at least once |
| `isStale` | Data is older than `staleTime` |
| `isFetched` | At least one fetch has completed |

**Rule of thumb:** Use `isLoading` for "show a spinner the first time." Use `isFetching` for "show a tiny background refresh indicator." Use `data` directly when it has loaded.

## queryKey — the cache address

The key uniquely identifies a cached entry. Same key → same cache slot → deduplicated request.

```js
['\''projects'\'']                          // all projects
['\''sprints'\'', projectId]                // sprints for one project
['\''tasks'\'', projectId, sprintId]        // tasks in a specific sprint
['\''search'\'', debouncedQuery]            // search by query string
```

Keys can be strings, numbers, booleans, arrays, plain objects. They are compared by structural equality.

## queryFn — three patterns

```js
// 1. Inline chain (most concise)
queryFn: () => api.get('\''/tasks/'\'').then(r => r.data),

// 2. async / await (when you need to transform)
queryFn: async () => {
  const res = await api.get('\''/tasks/'\'');
  return res.data;
},

// 3. Receives context — access queryKey, signal for cancellation
queryFn: async ({ queryKey, signal }) => {
  const [, projectId] = queryKey;
  const res = await api.get('\''/tasks/'\'', {
    params: { project: projectId },
    signal,    // abort on unmount
  });
  return res.data;
},
```

Whatever the function returns becomes `data` in the consumer.

## useMutation — every option

```js
const mutation = useMutation({
  mutationFn: (variables) => api.post('\''/tasks/'\'', variables).then(r => r.data),

  // Fires BEFORE mutationFn runs — perfect for optimistic updates
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['\''tasks'\''] });
    const previous = queryClient.getQueryData(['\''tasks'\'']);
    queryClient.setQueryData(['\''tasks'\''], (old) => [...(old ?? []), { ...variables, id: '\''temp'\'' }]);
    return { previous };   // returned context is passed to onError/onSettled
  },

  onSuccess: (data, variables, context) => {
    // mutationFn resolved successfully
  },

  onError: (error, variables, context) => {
    // mutationFn threw — roll back optimistic update
    if (context?.previous) {
      queryClient.setQueryData(['\''tasks'\''], context.previous);
    }
  },

  onSettled: (data, error, variables, context) => {
    // Always runs — success or error
    queryClient.invalidateQueries({ queryKey: ['\''tasks'\''] });
  },
});

// Trigger:
mutation.mutate({ title: '\''New task'\'' });
mutation.mutateAsync({ title: '\''New task'\'' });   // returns promise
```

### The callback firing order

```
onMutate              ← first, sets up optimistic state
  ↓
mutationFn runs (the actual HTTP request)
  ↓
onSuccess OR onError  ← depends on the result
  ↓
onSettled             ← always
```

## Optimistic updates — the full pattern

```js
const updateTask = useMutation({
  mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}/`, data).then(r => r.data),

  onMutate: async ({ id, ...newData }) => {
    // Cancel in-flight refetches so they do not overwrite our optimistic state
    await queryClient.cancelQueries({ queryKey: ['\''tasks'\''] });

    // Snapshot the previous value so we can roll back
    const previous = queryClient.getQueryData(['\''tasks'\'', projectId]);

    // Optimistically update the cache
    queryClient.setQueryData(['\''tasks'\'', projectId], (old) =>
      old.map(t => t.id === id ? { ...t, ...newData } : t)
    );

    return { previous };
  },

  onError: (err, variables, context) => {
    // Roll back to the snapshot
    queryClient.setQueryData(['\''tasks'\'', projectId], context.previous);
  },

  onSettled: () => {
    // Refetch in the background to ensure we are in sync with the server
    queryClient.invalidateQueries({ queryKey: ['\''tasks'\'', projectId] });
  },
});
```

UI updates instantly. If the server errors, the change is rolled back.

## Invalidation — prefix matching

```js
// Invalidate every cache entry whose key starts with this prefix
queryClient.invalidateQueries({ queryKey: ['\''tasks'\'', '\''devspace'\''] })
```

Matches:
- `['\''tasks'\'', '\''devspace'\'', '\''s-1'\'']` ✅
- `['\''tasks'\'', '\''devspace'\'', '\''backlog'\'']` ✅
- `['\''tasks'\'', '\''other'\'', '\''s-1'\'']` ❌ (different prefix)

### Invalidation options

```js
queryClient.invalidateQueries({
  queryKey: ['\''tasks'\''],
  exact: true,           // only the exact key, no prefix matching
  refetchType: '\''active'\'', // only refetch queries that components are currently using
});
```

## Dependent queries

```js
// Step 1: fetch the user
const { data: user } = useQuery({
  queryKey: ['\''me'\''],
  queryFn: () => api.get('\''/me/'\'').then(r => r.data),
});

// Step 2: fetch the user'\''s projects — only when user is loaded
const { data: projects } = useQuery({
  queryKey: ['\''projects'\'', user?.id],
  queryFn: () => api.get('\''/projects/'\'').then(r => r.data),
  enabled: !!user?.id,   // depends on Step 1
});
```

## Prefetching

```js
// Prefetch on hover — UX trick for instant navigation
<Link
  to={`/projects/${id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['\''sprints'\'', id],
      queryFn: () => api.get('\''/sprints/'\'', { params: { project: id } }).then(r => r.data),
    });
  }}
>
  {name}
</Link>
```

When the user clicks the link, the data is already cached — page renders instantly.

## Validation — handling server-side errors

DRF returns structured validation errors:

```json
{
  "title": ["This field is required."],
  "points": ["Must be a positive integer."]
}
```

Handle them in the mutation:

```js
const createTask = useMutation({
  mutationFn: (data) => api.post('\''/tasks/'\'', data).then(r => r.data),
  onError: (error) => {
    if (error.response?.status === 400) {
      const fieldErrors = error.response.data;
      // Set field-level errors in your form state
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        setFieldError(field, messages[0]);
      });
    }
  },
});
```

For UI feedback, use `mutation.error`:

```jsx
{mutation.isError && (
  <div className="error">{mutation.error.response?.data?.detail ?? '\''Something went wrong'\''}</div>
)}
```

## useInfiniteQuery — pagination/scrolling

```js
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['\''tasks-feed'\''],
  queryFn: ({ pageParam = 1 }) =>
    api.get(`/tasks/?page=${pageParam}`).then(r => r.data),
  getNextPageParam: (lastPage) => lastPage.next_page ?? undefined,
  initialPageParam: 1,
});

// Render
data?.pages.flatMap(p => p.results).map(task => <TaskCard key={task.id} task={task} />)
```

`fetchNextPage()` appends the next page'\''s results to `data.pages`. When `hasNextPage` becomes false, you have reached the end.

## When NOT to use TanStack Query

- Form state → use React state or a form library (react-hook-form)
- UI-only state (modals, hovers) → use `useState`
- Global app state that is not server-derived → use Context or Zustand

TanStack Query is for **server state** — anything that comes from a remote source. Mixing local UI state into queries adds complexity without benefit.''',
    },

    {
        'title': 'AI Agent Architecture',
        'order': 23,
        'content': '''# AI Agent Architecture

DevSpace embeds an AI agent that can read your linked GitHub repo, read your project state (sprints, tasks, dev log), and **propose** mutations (create tasks, sprints, dev log entries) that you confirm before they apply.

## Stack

| Layer | Choice | Why |
|---|---|---|
| LLM | Groq + Llama 3.3 70B | Free tier, very fast, 128k context, native tool calling |
| Agent framework | LangGraph | State-machine-based agent loops, clean tool integration |
| Tool definitions | LangChain `@tool` decorator | Auto-generates JSON schema from Python type hints |
| Memory | DB-backed `Conversation` + `Message` | Survives page reloads, multiple chats per project |
| Trust model | Read auto, Write confirmed | Agent does heavy thinking on its own; user approves data changes |

## High-level flow

```
User: "Create a task to fix the auth bug"
        ↓
Frontend POST /api/conversations/:id/messages/
        ↓
Backend: run_agent(conversation, content)
        ↓
   LangGraph loop:
     ┌─ agent_node (LLM with tools bound) ─┐
     │   "I should call create_task(...)" │
     └─────────────────┬───────────────────┘
                       ↓
     ┌─ tool_node (executes the call) ────┐
     │   create_task() → pushes to        │
     │   pending_sink, returns "QUEUED"   │
     └─────────────────┬───────────────────┘
                       ↓
              back to agent_node
                       ↓
   "I've proposed the change." → END
        ↓
Backend saves Message with pending_mutations
        ↓
Frontend renders confirmation panel
        ↓
User clicks Apply → POST /apply/
        ↓
Backend executes each mutation → 201
        ↓
TanStack Query invalidates ['tasks'] → UI updates
```

## Why this split (read auto, write queued)

Three options were considered:

1. **Full autonomy** — agent creates/updates freely. Risk: if it misunderstands, 10 wrong tasks appear.
2. **Confirm every action** — agent asks "may I?" before each tool. Safe but breaks flow.
3. **Auto for reads, batch confirm for writes** ← chosen.

Option 3 lets the agent do all the thinking on its own, but you stay the deciding human on anything that mutates data. Same pattern as Cursor/Copilot Agent.

## Tool inventory

| Tool | Type | Effect |
|---|---|---|
| `list_repo_files` | Read | List GitHub repo contents at a path |
| `read_repo_file` | Read | Read one file from the linked repo |
| `search_repo_code` | Read | GitHub code search within the linked repo |
| `list_sprints` | Read | All sprints with status + goal |
| `list_tasks` | Read | Tasks with optional sprint/status filter |
| `list_devlog` | Read | Recent dev log entries |
| `create_task` | Write | Queue task creation |
| `update_task` | Write | Queue task field update |
| `create_sprint` | Write | Queue sprint creation |
| `create_devlog_entry` | Write | Queue dev log creation |
| `create_snippet` | Write | Queue snippet creation |
| `create_doc_page` | Write | Queue doc page creation |

See linked snippets for actual code.

## Security model

- Per-user JWT auth (same as the rest of DevSpace)
- Conversations scoped to `project__owner=request.user` — no cross-user access
- GitHub PAT encrypted at rest with Fernet symmetric encryption
- Write mutations require explicit user confirmation before they touch the DB
- LLM never receives the raw PAT — it gets file contents back via the tool layer

See [[snippet-langgraph-agent-loop]], [[snippet-langchain-tool-decorator]], [[snippet-pending-mutations]], [[snippet-fernet-encryption]].''',
    },

    {
        'title': 'Backend Reference: LangChain & LangGraph In Depth',
        'order': 24,
        'content': '''# Backend Reference: LangChain & LangGraph In Depth

A reference for building AI agents in Python that can use tools, maintain state across turns, and survive deployment.

## The mental model

LangChain alone gives you primitives: LLM clients, tool decorators, message types, output parsers. LangGraph adds a **state machine** for orchestrating those primitives into loops — call LLM, decide what tool to run, run it, feed result back, repeat.

### When you need LangGraph vs. plain function calling

| Need | Use |
|---|---|
| One LLM call, no tools | Raw Groq / OpenAI SDK |
| LLM + one tool call | LangChain `bind_tools` |
| LLM that decides which of N tools to call, loops until done | LangGraph |
| Branching logic, retries, multi-agent | LangGraph (this is its sweet spot) |

For DevSpace we went straight to LangGraph because the agent needs to chain tool calls (e.g. `list_files` → pick interesting one → `read_file` → answer) without us writing the loop manually.

## LangGraph core concepts

### 1. State

State is a `TypedDict` that flows through the graph. Most agents use just `messages`:

```python
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
```

The `Annotated[..., add_messages]` is a **reducer**: when a node returns `{'messages': [new_msg]}`, the reducer appends instead of replacing.

### 2. Nodes

A node is a function that takes state and returns a partial state update:

```python
def agent_node(state: AgentState):
    response = llm.invoke(state['messages'])
    return {'messages': [response]}   # gets appended via reducer
```

### 3. Edges

Edges route between nodes. Conditional edges let the LLM "decide" what happens next:

```python
def should_continue(state):
    last = state['messages'][-1]
    if last.tool_calls:
        return 'tools'    # LLM wants to call a tool
    return END            # LLM is done

graph.add_conditional_edges('agent', should_continue, {
    'tools': 'tools',
    END: END,
})
```

### 4. The agent loop

```
START → agent → (tool_calls?) → tools → agent → (tool_calls?) → END
```

The loop continues until the LLM produces a message without tool calls. The `recursion_limit` config caps how many times this can repeat.

## Defining tools

Use the `@tool` decorator. The function signature + docstring become the tool's JSON schema:

```python
from langchain_core.tools import tool

@tool
def list_repo_files(path: str = '') -> str:
    """List files in the repo at the given path.
    Path is empty for root, or 'backend/api' for a subfolder."""
    # ... your code
    return result
```

The LLM sees:
- Tool name: `list_repo_files`
- Description: the docstring (this is what the LLM reads to decide whether to call it)
- Parameters: from type hints (`path: str = ''`)

**Critical:** the docstring is how the LLM understands the tool. Write it like documentation for a colleague.

## Binding tools to the LLM

```python
from langchain_groq import ChatGroq

llm = ChatGroq(model='llama-3.3-70b-versatile').bind_tools([
    list_repo_files, read_repo_file, search_repo_code,
])
```

`bind_tools` returns a new LLM that automatically knows about your tools and can call them.

## Reading the agent's output

The agent's final state has a `messages` list. Walking it:

```python
for m in result['messages']:
    if isinstance(m, AIMessage):
        print('Assistant:', m.content)
        for tc in (m.tool_calls or []):
            print(f'  Called: {tc["name"]}({tc["args"]})')
    elif isinstance(m, ToolMessage):
        print('  Tool returned:', m.content)
```

## Memory: persisting across requests

LangGraph has a built-in `MemorySaver` checkpointer, but for a server you usually want **DB-backed memory**:

```python
# Instead of MemorySaver:
def build_initial_messages(conversation):
    msgs = [SystemMessage(SYSTEM_PROMPT)]
    for m in conversation.messages.all():
        if m.role == 'user':
            msgs.append(HumanMessage(m.content))
        elif m.role == 'assistant':
            msgs.append(AIMessage(m.content))
    return msgs

result = app.invoke({'messages': build_initial_messages(conv) + [HumanMessage(new_input)]})
```

This is the pattern DevSpace uses — every request loads the full conversation from Postgres, runs the agent, then persists the new turn. Survives reboots, scales horizontally.

## The "write-queue" pattern

A core DevSpace innovation: write tools don't execute, they queue. This pattern is powerful for any agent that mutates user data:

```python
def build_tools(project, pending_sink: list):

    @tool
    def create_task(title: str, type: str = 'Feature') -> str:
        """Queue creation of a task. User will confirm."""
        pending_sink.append({
            'tool': 'create_task',
            'args': {'title': title, 'type': type},
            'preview': f"Create {type}: '{title}'",
        })
        return f"QUEUED: Create {type}: '{title}'"

    return [create_task]

# Caller:
pending = []
tools = build_tools(project, pending)
llm = ChatGroq(...).bind_tools(tools)
# ... run agent ...
# pending now has all the queued writes — show to user for confirmation
```

The LLM thinks it called a real function (it got "QUEUED" back). The user sees a clean confirmation panel. Pure separation between intent and execution.

## Common gotchas

1. **Recursion limit** — default is 25. For complex agents, raise it. For simple ones, lower it to fail fast.
2. **System prompt position** — put it FIRST in the messages list, every time. Some LLMs ignore mid-conversation system messages.
3. **Tool error handling** — if a tool raises, LangGraph passes the error string back to the LLM. The LLM might retry. Wrap tools in try/except and return user-friendly error strings.
4. **Token usage** — every turn re-sends the full conversation history. Long chats get expensive. Consider summarization or sliding-window history above N messages.
5. **Temperature** — lower (0.2-0.4) for tool use, the LLM should be deterministic about which tool to call. Higher for creative writing.

See [[snippet-langgraph-agent-loop]], [[snippet-langchain-tool-decorator]], [[snippet-llm-with-history-from-db]].''',
    },

    {
        'title': 'Backend Reference: GitHub Integration with Encrypted PATs',
        'order': 25,
        'content': '''# Backend Reference: GitHub Integration with Encrypted PATs

How DevSpace stores GitHub personal access tokens safely and uses them to fetch repo content.

## The threat model

A GitHub PAT with `repo` scope is essentially **a password** for your code — anyone with the token can read, write, and delete repositories. Storing it in plaintext in the DB means:
- Any DB backup leak compromises every user's GitHub access
- A SQL injection bug exposes tokens
- Internal access requests can see live tokens

The fix: **encrypt at rest, decrypt only at the boundary where you call GitHub**.

## Fernet symmetric encryption

`cryptography.fernet` is the standard Python implementation of authenticated symmetric encryption (AES-128-CBC + HMAC-SHA256). The advantages:

- **Authenticated** — ciphertext is tamper-detected, can't be quietly modified
- **Includes IV** — automatic per-encryption nonce, no nonce management
- **Simple API** — `Fernet(key).encrypt(plaintext)` / `.decrypt(ciphertext)`

### Generating a key

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

This returns a 44-character URL-safe base64 string. Store it in `FERNET_KEY` env var.

### Encrypt/decrypt helpers

```python
import os
from cryptography.fernet import Fernet
from django.core.exceptions import ImproperlyConfigured

def _cipher():
    key = os.environ.get('FERNET_KEY')
    if not key:
        raise ImproperlyConfigured('FERNET_KEY is not set.')
    return Fernet(key.encode())

def encrypt(plaintext: str) -> str:
    return _cipher().encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    return _cipher().decrypt(ciphertext.encode()).decode()
```

## The GithubAccount model

One per user (OneToOne):

```python
class GithubAccount(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name='github_account')
    encrypted_token = models.TextField()                # Fernet ciphertext, ~140 chars
    github_username = models.CharField(max_length=200, blank=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_validated_at = models.DateTimeField(null=True, blank=True)
```

Why per-user instead of per-project: most devs have one GitHub account but many projects. One token, many repo links.

## The serializer never returns the token

```python
class GithubAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = GithubAccount
        fields = ['github_username', 'connected_at', 'last_validated_at']
        # encrypted_token deliberately excluded
        read_only_fields = fields
```

There is no scenario where the API should return the token to the frontend. The user pastes it once, after that the frontend never needs to see it again.

## The connect flow

```python
class GithubAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = (request.data.get('token') or '').strip()
        if not token:
            return Response({'detail': 'token is required'}, status=400)

        # Validate the token by calling GitHub BEFORE saving anything
        try:
            profile = GithubClient(token).validate()
        except GithubError as e:
            return Response({'detail': str(e)}, status=e.status or 400)

        # Only encrypt+save once we know the token actually works
        GithubAccount.objects.update_or_create(
            owner=request.user,
            defaults={
                'encrypted_token': encrypt(token),
                'github_username': profile.get('login', ''),
                'last_validated_at': timezone.now(),
            },
        )
        return Response({'connected': True, ...}, status=201)
```

The key principle: **never save what you haven't validated**.

## Where decryption happens

Exactly one place: when we instantiate the GitHub client for an outbound API call.

```python
def _github_client():
    acct = GithubAccount.objects.filter(owner=user).first()
    if not acct:
        return None
    return GithubClient(decrypt(acct.encrypted_token))   # only place decrypt() is called
```

The decrypted token lives in memory for the duration of one HTTP request, then gets garbage collected. Never written to a log, never returned in a response.

## The GitHub client wrapper

Wrapping the GitHub API in a class means tools can call `client.list_files()` without thinking about HTTP, auth headers, or error handling:

```python
class GithubClient:
    def __init__(self, token: str):
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        })

    def _get(self, path: str, params=None):
        r = self._session.get(f'https://api.github.com{path}', params=params, timeout=15)
        if r.status_code == 401: raise GithubError('Invalid token', 401)
        if not r.ok: raise GithubError(f'GitHub {r.status_code}', r.status_code)
        return r.json()

    def list_repos(self):
        return self._get('/user/repos', params={'sort': 'pushed', 'direction': 'desc'})

    def read_file(self, repo, path):
        result = self._get(f'/repos/{repo}/contents/{path}')
        return base64.b64decode(result['content']).decode('utf-8')
```

Everything raises `GithubError` so callers wrap one try/except.

## Token rotation

Users should be able to disconnect (delete the encrypted token) easily:

```python
def delete(self, request):
    GithubAccount.objects.filter(owner=request.user).delete()
    return Response(status=204)
```

No "soft delete" — when a user wants the token gone, it's gone. The DB cascade also drops any project link metadata.

## Key rotation (advanced)

If `FERNET_KEY` is compromised, you need to re-encrypt every stored token. Fernet supports key rotation via `MultiFernet`:

```python
from cryptography.fernet import MultiFernet, Fernet

# During rotation, support both old and new keys
cipher = MultiFernet([Fernet(NEW_KEY), Fernet(OLD_KEY)])

# Re-encrypt all tokens:
for acct in GithubAccount.objects.all():
    new_ciphertext = cipher.rotate(acct.encrypted_token.encode())
    acct.encrypted_token = new_ciphertext.decode()
    acct.save()
```

`rotate()` decrypts with any of the keys, re-encrypts with the first key in the list. Once all tokens are rotated, drop the old key from the list.

See [[snippet-fernet-encryption]], [[snippet-github-client-wrapper]], [[snippet-token-validation-before-save]].''',
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# DEVLOG — chronological build log
# ─────────────────────────────────────────────────────────────────────────────

DEVLOG = [
    {
        'days_ago': 14,
        'title': 'Day 1 — Django + DRF scaffold',
        'body': '''Bootstrapped the backend. Django 6 + DRF, django-cors-headers, simplejwt, python-dotenv. Project structure: `backend/backend/` (config) and `backend/api/` (the app).

Key decision: single `api` app instead of per-resource apps. For a small project this is simpler — splitting comes later if it's actually needed.

CORS middleware placement caught me — it MUST be above CommonMiddleware to intercept preflight OPTIONS requests.''',
    },
    {
        'days_ago': 13,
        'title': 'Day 2 — All 6 models written',
        'body': '''Project, Sprint, Task, DocPage, DevLogEntry, Snippet. Three ID strategies:

- **Slug PK** for Project and DocPage (readable URLs)
- **`s-{num}` PK** for Sprint
- **`{KEY}-{num}` PK** for Task ("DS-001")

All generated server-side in `save()`. Frontend never sends IDs. The `save()` override pattern is concise:

```python
def save(self, *args, **kwargs):
    if not self.pk:
        self.pk = generate_id()
    super().save(*args, **kwargs)
```

Forgetting `super().save()` is a classic mistake — Django silently does nothing.''',
    },
    {
        'days_ago': 12,
        'title': 'Day 3 — Serializers + viewsets',
        'body': '''One ModelSerializer per model, one ModelViewSet per model. `fields = "__all__"` + `read_only_fields = ['id', 'created_at', 'updated_at']`.

The interesting one: `TaskViewSet.perform_update` sets `closed_at = timezone.now()` when status transitions to Done, clears it on transition away. Critical: the frontend NEVER sends `closed_at` — it's marked read-only and stripped from incoming bodies. This drives velocity calculations.''',
    },
    {
        'days_ago': 11,
        'title': 'Day 4 — JWT authentication working',
        'body': '''SimpleJWT integration. `POST /api/token/` returns access + refresh tokens. ACCESS_TOKEN_LIFETIME = 1 day, REFRESH_TOKEN_LIFETIME = 30 days, ROTATE_REFRESH_TOKENS = True.

Custom user model extends AbstractUser with `display_name` and `role` fields. `AUTH_USER_MODEL = 'users.CustomUser'` set BEFORE first migration — changing it later requires data migration gymnastics.''',
    },
    {
        'days_ago': 10,
        'title': 'Day 5 — Database seeded',
        'body': '''Custom management command `python manage.py seed` populates sample data scoped to user 'berre'. Idempotent — wipes the user's data first, then rebuilds.

Management commands are discovered by convention: `app/management/commands/<name>.py` with a `Command` class extending `BaseCommand`. No registration needed.''',
    },
    {
        'days_ago': 9,
        'title': 'Day 6 — TanStack Query hooks built',
        'body': '''Six hook files: useProjects, useSprints, useTasks, useDocs, useDevLog, useSnippets. Each exports one `useQuery` for reading and one or more `useMutation` for writing.

Key insight: prefix matching in `invalidateQueries`. One invalidation of `['tasks', projectId]` wipes the kanban, the backlog, and every sprint-scoped task list at once — because they all share the prefix.''',
    },
    {
        'days_ago': 8,
        'title': 'Day 7 — End-to-end auth flow',
        'body': '''Login flow finally working end-to-end. Hit two bugs:

1. **Rules of Hooks violation**: `useProjects()` was called AFTER `if (!isLoggedIn) return <LoginScreen />`. When `isLoggedIn` flipped true, React detected new hooks → crash. Fix: AuthenticatedApp pattern — outer App only calls useAuth, inner AuthenticatedApp mounts after login with all the data hooks.

2. **401 from /token/ triggered reload**: response interceptor was reloading on ANY 401, including the login failure itself — hiding the error before the user could see it. Fix: `isTokenEndpoint` guard.''',
    },
    {
        'days_ago': 7,
        'title': 'Day 8 — User profile + Cmd+K search',
        'body': '''Replaced hardcoded "Guillaume" / "Solo dev" with real data. New `/api/me/` endpoint via `RetrieveUpdateAPIView` — GET returns the user, PATCH updates display_name and role.

Cmd+K global search: single `/api/search/?q=` endpoint queries Tasks (title/description/id), DocPages (title/content), Snippets (title/description/code), DevLog (title/body), Projects (name/tagline). Capped at 8 results per category. Debounced 300ms.''',
    },
    {
        'days_ago': 6,
        'title': 'Day 9 — Real dashboard data',
        'body': '''Built `/api/dashboard/` — one endpoint that aggregates active sprints (with days_remaining + completion %), open bugs sorted by severity, recent dev log entries, and stats (total tasks, in progress, done this week, open bugs). Refetches every 2 minutes.

Per-project hooks would have fired N queries for N projects. One endpoint = one round trip.''',
    },
    {
        'days_ago': 5,
        'title': 'Day 10 — Task editing + sprint actions',
        'body': '''Inline title and description editing on the TaskPanel. EditableSelect pattern: an invisible `<select>` overlaid on a styled display value — keeps native dropdown UX without ugly default styling.

Sprint state machine: planned → active (Start sprint button) → completed (Complete sprint with carryover warning). Carryover counts the task IDs that aren't Done when the sprint completes.''',
    },
    {
        'days_ago': 3,
        'title': 'Day 11 — Environment variables vault',
        'body': '''Added vault_password_hash + vault_timeout to Project. New EnvVariable model. Two custom endpoints: `/unlock-vault/` and `/set-vault-password/`. SHA-256 hash stored server-side, NEVER exposed in API responses — instead `ProjectSerializer.has_vault_password` (boolean SerializerMethodField) tells the frontend whether a password is set.

Unlock state lives in React component state, never in localStorage. Auto-locks via setTimeout. Page refresh = vault locked. Same threat model as the JWT in-memory pattern.''',
    },
    {
        'days_ago': 1,
        'title': 'Day 12 — Migrated to Neon Postgres',
        'body': '''Used `dumpdata --natural-foreign` from a temporary `settings_sqlite.py` override to export, then `migrate` + `loaddata` against Neon. Final step: reset Postgres sequences with `pg_get_serial_sequence` because Postgres doesn't auto-update them after explicit-PK inserts (SQLite does).

Hit one snag: `channel_binding=require` in the Neon DATABASE_URL broke psycopg2's auth handshake. Filtered it out in settings.py before passing OPTIONS to Django.''',
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# SNIPPETS — code patterns worth keeping
# ─────────────────────────────────────────────────────────────────────────────

SNIPPETS = [
    {
        'title': 'Slug PK with save() override',
        'language': 'Python',
        'description': 'Auto-generate a readable slug PK from the model name. Handles collisions with a counter.',
        'tags': ['django', 'models', 'slug'],
        'code': '''def save(self, *args, **kwargs):
    if not self.pk:                          # only on first save (creation)
        base = slugify(self.name)
        slug, counter = base, 1
        while Project.objects.filter(pk=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        self.pk = slug
    super().save(*args, **kwargs)            # ALWAYS call super''',
    },
    {
        'title': 'Owner-scoped queryset (security boundary)',
        'language': 'Python',
        'description': 'Every viewset uses this pattern to scope data to the authenticated user. The `__` traverses the FK to project.owner.',
        'tags': ['drf', 'security', 'queryset'],
        'code': '''def get_queryset(self):
    project_id = self.request.query_params.get('project')
    qs = Sprint.objects.filter(project__owner=self.request.user)
    if project_id:
        qs = qs.filter(project_id=project_id)
    return qs.order_by('num')''',
    },
    {
        'title': 'perform_create injects owner from request',
        'language': 'Python',
        'description': 'Stamp the owner field from request.user instead of trusting the frontend to send it. Owner is read_only in the serializer.',
        'tags': ['drf', 'viewset', 'security'],
        'code': '''class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        # owner is marked read_only in ProjectSerializer — injected here instead
        serializer.save(owner=self.request.user)''',
    },
    {
        'title': 'perform_update with state transition logic',
        'language': 'Python',
        'description': "Set closed_at server-side when status transitions to Done. The .get() fallback prevents triggering when status is not in the PATCH body.",
        'tags': ['drf', 'viewset', 'state-machine'],
        'code': '''def perform_update(self, serializer):
    # Fallback: if status isn't in the PATCH body, use the current DB value
    new_status = serializer.validated_data.get('status', serializer.instance.status)

    if new_status == 'Done' and serializer.instance.status != 'Done':
        serializer.save(closed_at=timezone.now())     # transitioning IN
    elif new_status != 'Done' and serializer.instance.status == 'Done':
        serializer.save(closed_at=None)               # transitioning OUT
    else:
        serializer.save()                             # normal update''',
    },
    {
        'title': 'Q objects for OR queries',
        'language': 'Python',
        'description': 'Use Q objects to express OR conditions in a Django queryset. Normal filter chaining is always AND.',
        'tags': ['django', 'orm', 'queryset'],
        'code': '''from django.db import models

# Snippets can be global (no project) OR belong to a user's project
Snippet.objects.filter(
    models.Q(project__isnull=True) | models.Q(project__owner=user)
)

# Multi-field text search
Task.objects.filter(
    models.Q(title__icontains=q) | models.Q(description__icontains=q) | models.Q(id__icontains=q)
)''',
    },
    {
        'title': 'SerializerMethodField for computed boolean',
        'language': 'Python',
        'description': 'Expose a boolean to the frontend without exposing the underlying sensitive field (vault password hash).',
        'tags': ['drf', 'serializer', 'security'],
        'code': '''class ProjectSerializer(serializers.ModelSerializer):
    has_vault_password = serializers.SerializerMethodField()

    def get_has_vault_password(self, obj):
        return bool(obj.vault_password_hash)

    class Meta:
        model = Project
        exclude = ['vault_password_hash']     # raw hash NEVER leaves the server
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']''',
    },
    {
        'title': 'JWT SimpleJWT configuration',
        'language': 'Python',
        'description': 'DRF SimpleJWT settings for a single-user app. 1-day access token, 30-day refresh token, rotation enabled.',
        'tags': ['jwt', 'auth', 'drf'],
        'code': '''from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}''',
    },
    {
        'title': 'SHA-256 vault password hash',
        'language': 'Python',
        'description': 'Backend endpoint that verifies the vault password. Hash is compared, plaintext is never stored.',
        'tags': ['security', 'vault', 'hash'],
        'code': '''import hashlib
from rest_framework.views import APIView
from rest_framework.response import Response

class VaultUnlockView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id, owner=request.user)
        password = request.data.get('password', '')

        if not project.vault_password_hash:
            return Response({'success': True, 'timeout': project.vault_timeout})

        incoming_hash = hashlib.sha256(password.encode()).hexdigest()
        if incoming_hash == project.vault_password_hash:
            return Response({'success': True, 'timeout': project.vault_timeout})
        return Response({'success': False}, status=403)''',
    },
    {
        'title': 'Neon DATABASE_URL parsing',
        'language': 'Python',
        'description': 'Parse Neon connection string into Django DATABASES dict. Strip channel_binding which psycopg2 does not support.',
        'tags': ['django', 'neon', 'postgres'],
        'code': '''from urllib.parse import urlparse, parse_qsl

tmpPostgres = urlparse(os.getenv("DATABASE_URL"))
# channel_binding=require breaks psycopg2 SSL handshake — strip it
_db_options = {k: v for k, v in parse_qsl(tmpPostgres.query) if k != 'channel_binding'}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': tmpPostgres.path.replace('/', ''),
        'USER': tmpPostgres.username,
        'PASSWORD': tmpPostgres.password,
        'HOST': tmpPostgres.hostname,
        'PORT': 5432,
        'OPTIONS': _db_options,
    }
}''',
    },
    {
        'title': 'In-memory JWT token storage',
        'language': 'JS',
        'description': 'Store the access token in a module-level variable instead of localStorage to prevent XSS theft.',
        'tags': ['security', 'jwt', 'frontend'],
        'code': '''// token.js — JS modules are singletons. Every importer shares this variable.
let _token = null;

export const getToken = () => _token;
export const setToken = (t) => { _token = t; };
export const clearToken = () => { _token = null; };

// Downside: token gone on page refresh. Acceptable for a personal dev tool.
// localStorage is readable by any script — XSS would steal the token.''',
    },
    {
        'title': 'Axios interceptors (auth + 401 handling)',
        'language': 'JS',
        'description': 'Inject JWT on every request. Reload on 401, except from the /token/ endpoint itself (login errors).',
        'tags': ['axios', 'auth', 'frontend'],
        'code': '''import axios from 'axios';
import { getToken, clearToken } from './token';

const api = axios.create({ baseURL: '/api' });

// Request interceptor: stamp the JWT on every outgoing request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: 401 from anywhere except /token/ means session expired
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isTokenEndpoint = error.config?.url?.includes('/token/');
    if (error.response?.status === 401 && !isTokenEndpoint) {
      clearToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;''',
    },
    {
        'title': 'useQuery hook pattern',
        'language': 'JS',
        'description': 'TanStack Query hook for reading data. The `enabled` guard prevents fetching with an undefined parameter.',
        'tags': ['tanstack-query', 'hooks', 'frontend'],
        'code': '''import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.get('/sprints/', { params: { project: projectId } }).then(r => r.data),
    enabled: !!projectId,    // don't fetch when projectId is undefined
  });
}

// In a component:
// const { data: sprints = [], isLoading } = useSprints(project.id);''',
    },
    {
        'title': 'useMutation with cache invalidation',
        'language': 'JS',
        'description': 'TanStack mutation hook. Invalidates the prefix on success so all related queries refetch automatically.',
        'tags': ['tanstack-query', 'hooks', 'frontend'],
        'code': '''import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/tasks/', data).then(r => r.data),
    onSuccess: (newTask) => {
      // Prefix invalidation: wipes kanban, backlog, and every task cache for this project
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project] });
    },
  });
}

// In a component:
// const createTask = useCreateTask();
// createTask.mutate({ title: 'Fix login', project: 'devspace' });''',
    },
    {
        'title': 'useDebounce hook',
        'language': 'JS',
        'description': 'Debounce a fast-changing value (search input) so the API call only fires after the user stops typing.',
        'tags': ['hooks', 'frontend'],
        'code': '''import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// Usage:
// const debouncedQuery = useDebounce(searchInput, 300);
// useQuery({ queryKey: ['search', debouncedQuery], queryFn: ... })''',
    },
    {
        'title': 'AuthenticatedApp pattern (Rules of Hooks)',
        'language': 'JS',
        'description': 'Split App into outer and inner components so data hooks only mount after login. Avoids "hooks called conditionally" crash.',
        'tags': ['react', 'hooks', 'auth'],
        'code': '''function App() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <LoginScreen />;
  return <AuthenticatedApp />;   // separate component
}

// AuthenticatedApp only mounts when logged in.
// All data hooks live here — never conditionally called.
function AuthenticatedApp() {
  const { data: user } = useMe();
  const { data: projects = [] } = useProjects();
  const [activeProject, setActiveProject] = useState(null);
  // ... rest of the app
}

// Why: if useMe() was called in App() AFTER the LoginScreen guard,
// the hook order would change when isLoggedIn flipped → React crashes.''',
    },
    {
        'title': 'Dumpdata + loaddata for DB migration',
        'language': 'Bash',
        'description': 'Migrate from SQLite to Postgres without losing data. Use a temp settings override for the dump.',
        'tags': ['django', 'database', 'migration'],
        'code': '''# 1. Create a temp settings file pointing to SQLite
cat > backend/backend/settings_sqlite.py <<EOF
from backend.settings import *
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
EOF

# 2. Dump from SQLite (using the override)
python manage.py dumpdata --settings=backend.settings_sqlite \\
  --natural-foreign --indent 2 \\
  --exclude contenttypes --exclude auth.permission \\
  --exclude admin.logentry --exclude sessions \\
  > fixture.json

# 3. Run migrations on Postgres (default settings)
python manage.py migrate

# 4. Load the fixture into Postgres
python manage.py loaddata fixture.json

# 5. Reset Postgres sequences (not auto-incremented after explicit PK inserts)
python manage.py sqlsequencereset api users | python manage.py dbshell''',
    },

    # ─── Snippets for the in-depth reference docs ───

    {
        'title': 'Optimistic update mutation (TanStack Query)',
        'language': 'JS',
        'description': 'Update the cache before the server responds, roll back on error. UI feels instant.',
        'tags': ['tanstack-query', 'mutation', 'optimistic'],
        'code': '''const updateTask = useMutation({
  mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}/`, data).then(r => r.data),

  onMutate: async ({ id, ...newData }) => {
    // Cancel in-flight refetches so they do not overwrite our optimistic state
    await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });

    // Snapshot the current cache for rollback
    const previous = queryClient.getQueryData(['tasks', projectId]);

    // Apply the change optimistically
    queryClient.setQueryData(['tasks', projectId], (old) =>
      old.map(t => t.id === id ? { ...t, ...newData } : t)
    );

    return { previous };   // passed to onError / onSettled as context
  },

  onError: (err, vars, context) => {
    // Roll back on failure
    queryClient.setQueryData(['tasks', projectId], context.previous);
  },

  onSettled: () => {
    // Re-sync with the server regardless of outcome
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  },
});''',
    },
    {
        'title': 'Dependent queries (TanStack)',
        'language': 'JS',
        'description': 'Fetch B only after A has resolved. enabled gates the second query on the first.',
        'tags': ['tanstack-query', 'hooks'],
        'code': '''// Step 1: fetch the current user
const { data: user } = useQuery({
  queryKey: ['me'],
  queryFn: () => api.get('/me/').then(r => r.data),
});

// Step 2: fetch their projects — only when step 1 has data
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => api.get('/projects/').then(r => r.data),
  enabled: !!user?.id,   // ← the dependency
});''',
    },
    {
        'title': 'Query prefetching on hover',
        'language': 'JS',
        'description': 'Warm the cache when the user hovers a link so the next page renders instantly.',
        'tags': ['tanstack-query', 'performance'],
        'code': '''const queryClient = useQueryClient();

<Link
  to={`/projects/${id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['sprints', id],
      queryFn: () => api.get('/sprints/', { params: { project: id } }).then(r => r.data),
    });
  }}
>
  {name}
</Link>''',
    },
    {
        'title': 'select transformer (TanStack)',
        'language': 'JS',
        'description': 'Transform server data without re-fetching. Filter, sort, or shape data inside the cache layer.',
        'tags': ['tanstack-query', 'hooks'],
        'code': '''// Filter archived tasks at the cache layer
const { data: activeTasks } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => api.get('/tasks/', { params: { project: projectId } }).then(r => r.data),
  select: (tasks) => tasks.filter(t => t.status !== 'Archived'),
});

// Compute aggregates without fetching twice
const { data: stats } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => api.get('/tasks/', { params: { project: projectId } }).then(r => r.data),
  select: (tasks) => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'Done').length,
  }),
});''',
    },
    {
        'title': 'Server-side validation error handling',
        'language': 'JS',
        'description': 'Catch DRF 400 responses and surface them as per-field errors in the form.',
        'tags': ['tanstack-query', 'validation', 'forms'],
        'code': '''const createTask = useMutation({
  mutationFn: (data) => api.post('/tasks/', data).then(r => r.data),
  onError: (error) => {
    if (error.response?.status === 400) {
      const fieldErrors = error.response.data;
      // DRF shape: { title: ['This field is required.'], points: ['Must be positive.'] }
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        setFieldError(field, messages[0]);
      });
    }
  },
});

// In the JSX:
// {createTask.isError && <div className="error">{createTask.error.response?.data?.detail}</div>}''',
    },
    {
        'title': 'Custom DRF permission (object-level)',
        'language': 'Python',
        'description': 'Allow read for any project member, but write only for owners and editors. Two methods cover list + detail.',
        'tags': ['drf', 'permissions', 'security'],
        'code': '''from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsProjectMember(BasePermission):
    """List-level: must be a member of the project to see any of its data."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id') or request.query_params.get('project')
        if not project_id:
            return False
        return Membership.objects.filter(
            user=request.user, project_id=project_id
        ).exists()

    def has_object_permission(self, request, view, obj):
        membership = Membership.objects.filter(
            user=request.user, project=obj.project
        ).first()
        if not membership:
            return False
        if request.method in SAFE_METHODS:
            return True   # any member can read
        return membership.role in ('owner', 'editor')   # write requires editor+''',
    },
    {
        'title': 'Custom JWT claims',
        'language': 'Python',
        'description': 'Add display_name and is_staff to the JWT payload so the frontend can decode them without a separate /me/ call.',
        'tags': ['jwt', 'simplejwt', 'auth'],
        'code': '''# users/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims (visible in the decoded JWT, NOT encrypted)
        token['username'] = user.username
        token['display_name'] = user.display_name
        token['is_staff'] = user.is_staff
        return token

# users/views.py
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

# Remember: JWT payload is base64, not encrypted. Never put secrets in claims.''',
    },
    {
        'title': 'Custom UserManager for email login',
        'language': 'Python',
        'description': 'Replace username-as-login with email. Pair with AbstractBaseUser when you need email as USERNAME_FIELD.',
        'tags': ['django', 'user-model', 'auth'],
        'code': '''from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class EmailUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = 'email'        # this is what authenticate() expects
    REQUIRED_FIELDS = []''',
    },
    {
        'title': 'Custom @action endpoint on ModelViewSet',
        'language': 'Python',
        'description': 'Add non-CRUD endpoints to a ViewSet. detail=True needs a pk, detail=False operates on the collection.',
        'tags': ['drf', 'viewset', 'actions'],
        'code': '''from rest_framework.decorators import action
from rest_framework.response import Response

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(project__owner=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        # POST /api/tasks/DS-001/archive/
        task = self.get_object()
        task.status = 'Archived'
        task.save()
        return Response({'status': 'archived'})

    @action(detail=False)
    def stats(self, request):
        # GET /api/tasks/stats/  — operates on the queryset, no pk
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'done': qs.filter(status='Done').count(),
        })''',
    },
    {
        'title': 'select_related + prefetch_related (fix N+1)',
        'language': 'Python',
        'description': 'select_related JOINs forward FK and OneToOne in one query. prefetch_related handles M2M and reverse FK in two queries.',
        'tags': ['django', 'orm', 'performance'],
        'code': '''# BAD — N+1 query problem
for task in Task.objects.all():
    print(task.project.name)         # one extra query per iteration

# GOOD — single JOIN query for forward FK
for task in Task.objects.select_related('project', 'sprint').all():
    print(task.project.name)         # no extra query

# For reverse FK and M2M, use prefetch_related
for project in Project.objects.prefetch_related('tasks', 'docs').all():
    for task in project.tasks.all(): # reuses prefetched data
        print(task.title)

# Chain both when you need them
qs = Task.objects.select_related('project').prefetch_related('labels').all()''',
    },
    {
        'title': 'Field + object-level serializer validation',
        'language': 'Python',
        'description': 'Field-level validates one field. Object-level validates across fields. Both raise ValidationError to reject input.',
        'tags': ['drf', 'serializer', 'validation'],
        'code': '''from rest_framework import serializers

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'status', 'closed_at', 'points']

    # Field-level: validate_<fieldname>
    def validate_title(self, value):
        if 'TODO' in value:
            raise serializers.ValidationError("Title cannot contain 'TODO'")
        return value

    def validate_points(self, value):
        if value < 0:
            raise serializers.ValidationError("Points must be non-negative.")
        return value

    # Object-level: validate(data) sees all fields together
    def validate(self, data):
        if data.get('status') == 'Done' and not data.get('closed_at'):
            # Mutate the validated data — set closed_at automatically
            data['closed_at'] = timezone.now()
        return data''',
    },
    {
        'title': 'Encrypted token storage (Fernet)',
        'language': 'Python',
        'description': 'Encrypt sensitive strings (OAuth tokens, API keys) before storing in the DB. Uses symmetric AES via cryptography.',
        'tags': ['security', 'encryption', 'tokens'],
        'code': '''import os
from cryptography.fernet import Fernet

# Generate once and store in env: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY = os.environ['FERNET_KEY']
cipher = Fernet(FERNET_KEY.encode())

def encrypt(plaintext: str) -> str:
    return cipher.encrypt(plaintext.encode()).decode()

def decrypt(ciphertext: str) -> str:
    return cipher.decrypt(ciphertext.encode()).decode()


# In a model — store the encrypted version, decrypt on access
class UserGitHubToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    encrypted_token = models.CharField(max_length=500)

    def set_token(self, raw_token):
        self.encrypted_token = encrypt(raw_token)

    def get_token(self):
        return decrypt(self.encrypted_token)

# WARNING: lose FERNET_KEY → all encrypted data is unrecoverable. Back it up safely.''',
    },
    {
        'title': 'Healthcheck endpoint for deploy platforms',
        'language': 'Python',
        'description': 'Cheap endpoint platforms ping to verify the app is alive. No DB query — keep it instant.',
        'tags': ['deployment', 'django'],
        'code': '''# backend/urls.py
from django.http import JsonResponse
from django.urls import path

def healthcheck(request):
    # Keep it instant: do NOT hit the DB here
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('healthz/', healthcheck),
    # ... other urls
]

# Configure your platform (Render, Fly.io, etc.) to ping /healthz/
# every 30s. If it returns non-200 the platform restarts the container.''',
    },
    {
        'title': 'WhiteNoise static files for production',
        'language': 'Python',
        'description': 'Serve hashed/compressed static files from Django without needing a separate CDN. Works with collectstatic.',
        'tags': ['deployment', 'static-files'],
        'code': '''# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',     # ← right after SecurityMiddleware
    # ... rest of middleware
]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Production: compressed + hashed filenames for cache-busting
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# Deploy step:
# pip install whitenoise
# python manage.py collectstatic --noinput''',
    },
    {
        'title': 'Production security headers',
        'language': 'Python',
        'description': 'HSTS, secure cookies, X-Frame-Options. Lock down the app once DEBUG=False.',
        'tags': ['deployment', 'security'],
        'code': '''# settings.py — apply only when not in DEBUG
if not DEBUG:
    SECURE_SSL_REDIRECT = True              # redirect HTTP -> HTTPS
    SECURE_HSTS_SECONDS = 31536000          # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True            # cookies only over HTTPS
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'                # no embedding in iframes
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')''',
    },
    {
        'title': 'LangGraph agent loop with tools',
        'language': 'Python',
        'description': 'Complete LangGraph state machine: LLM decides what tool to call, tool node runs it, result feeds back to LLM. Loop until LLM is done.',
        'tags': ['langgraph', 'ai', 'agent'],
        'code': '''from typing import Annotated, TypedDict
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode


class AgentState(TypedDict):
    # add_messages reducer appends new messages instead of replacing
    messages: Annotated[list, add_messages]


def build_agent(tools: list, model: str = 'llama-3.3-70b-versatile'):
    llm = ChatGroq(model=model, temperature=0.3).bind_tools(tools)

    def agent_node(state: AgentState):
        return {'messages': [llm.invoke(state['messages'])]}

    def should_continue(state: AgentState):
        last = state['messages'][-1]
        if getattr(last, 'tool_calls', None):
            return 'tools'    # LLM wants to call a tool
        return END            # LLM produced a final answer

    graph = StateGraph(AgentState)
    graph.add_node('agent', agent_node)
    graph.add_node('tools', ToolNode(tools))
    graph.set_entry_point('agent')
    graph.add_conditional_edges('agent', should_continue, {'tools': 'tools', END: END})
    graph.add_edge('tools', 'agent')   # tool result → back to LLM
    return graph.compile()


# Usage:
SYSTEM = "You are a helpful coding assistant."
app = build_agent(my_tools)
result = app.invoke({
    'messages': [SystemMessage(SYSTEM), HumanMessage('How many open tasks are there?')],
}, config={'recursion_limit': 12})

# The final assistant message is the last AIMessage with content
for m in result['messages']:
    if isinstance(m, AIMessage) and m.content:
        print(m.content)''',
    },
    {
        'title': 'LangChain @tool decorator',
        'language': 'Python',
        'description': 'Defining tools the LLM can call. The docstring is the description the LLM reads to decide whether to call it.',
        'tags': ['langchain', 'ai', 'agent'],
        'code': '''from langchain_core.tools import tool


@tool
def list_repo_files(path: str = '') -> str:
    """List files in the project repo at the given path.
    Use empty path for the root, or a folder path like 'backend/api'.
    Returns one entry per line as '[type] name'."""
    entries = github.list_files(repo, path)
    return '\\n'.join(f"[{e['type']}] {e['name']}" for e in entries)


@tool
def create_task(title: str, type: str = 'Feature', priority: str = 'Medium') -> str:
    """Queue creation of a new task. type must be one of:
    Feature, Bug, Fix, Chore, Idea, Docs. priority: Urgent/High/Medium/Low."""
    pending_writes.append({'tool': 'create_task', 'args': locals()})
    return f"QUEUED: Create {type} task: '{title}'"


# Bind tools to the LLM
from langchain_groq import ChatGroq
llm = ChatGroq(model='llama-3.3-70b-versatile').bind_tools([
    list_repo_files, create_task,
])

# The LLM sees:
#   - Tool name: list_repo_files
#   - Description: the docstring  ← critical, write it like API docs
#   - Parameters: from type hints
#
# Lesson: docstring quality directly determines whether the LLM
# picks the right tool. Treat them as user-facing documentation.''',
    },
    {
        'title': 'Pending mutations queue pattern',
        'language': 'Python',
        'description': 'Write tools that queue intents instead of executing. Lets users confirm before any DB write. Same pattern as Cursor/Copilot agent mode.',
        'tags': ['ai', 'agent', 'safety', 'pattern'],
        'code': '''from langchain_core.tools import tool


def build_tools(project, pending_sink: list[dict]):
    """Returns tools bound to this project. Write tools push to pending_sink
    instead of executing — the caller decides when (or whether) to apply them."""

    def _queue(name: str, args: dict, preview: str) -> str:
        pending_sink.append({'tool': name, 'args': args, 'preview': preview})
        return f"QUEUED: {preview}"

    @tool
    def create_task(title: str, type: str = 'Feature', priority: str = 'Medium') -> str:
        """Queue creation of a new task. User will confirm before it's saved."""
        return _queue('create_task', {'title': title, 'type': type, 'priority': priority},
                      f"Create {type}: '{title}'")

    @tool
    def update_task(task_id: str, status: str = '') -> str:
        """Queue update of an existing task."""
        return _queue('update_task', {'task_id': task_id, 'status': status},
                      f"Update {task_id}: status={status}")

    return [create_task, update_task]


# Caller:
pending = []
tools = build_tools(project, pending)
result = agent.invoke({'messages': [...]})

# pending now has all queued writes — show to user:
#   [
#     {'tool': 'create_task', 'args': {...}, 'preview': "Create Feature: 'Fix auth bug'"},
#     {'tool': 'update_task', 'args': {...}, 'preview': "Update DS-007: status=Done"},
#   ]

# Apply later when user confirms:
def apply_mutation(project, m):
    if m['tool'] == 'create_task':
        return Task.objects.create(project=project, **m['args'])
    if m['tool'] == 'update_task':
        Task.objects.filter(pk=m['args']['task_id']).update(status=m['args']['status'])''',
    },
    {
        'title': 'Load chat history from DB into LangGraph',
        'language': 'Python',
        'description': 'Build the initial message list from your persisted conversation rows. Lets the agent "remember" across requests without LangGraph checkpointers.',
        'tags': ['langgraph', 'ai', 'memory'],
        'code': '''from langchain_core.messages import SystemMessage, HumanMessage, AIMessage


SYSTEM_PROMPT = "You are DevSpace AI, an assistant for solo developers..."


def build_initial_messages(conversation, user_input: str):
    """Convert DB-backed Message rows into LangChain message types."""
    msgs = [SystemMessage(SYSTEM_PROMPT)]
    for m in conversation.messages.all():
        if m.role == 'user':
            msgs.append(HumanMessage(m.content))
        elif m.role == 'assistant':
            msgs.append(AIMessage(m.content))
    msgs.append(HumanMessage(user_input))   # the new message
    return msgs


# Each turn loads full history, runs the agent, persists the new turn
def run_turn(conversation, user_input):
    initial = build_initial_messages(conversation, user_input)
    result = app.invoke({'messages': initial}, config={'recursion_limit': 12})

    final_text = ''
    for m in result['messages']:
        if isinstance(m, AIMessage) and m.content:
            final_text = m.content   # last non-empty wins

    # Persist both turns
    Message.objects.create(conversation=conversation, role='user', content=user_input)
    Message.objects.create(conversation=conversation, role='assistant', content=final_text)
    return final_text


# Why not LangGraph's MemorySaver?
# - MemorySaver is in-process — lost on restart
# - DB-backed scales horizontally (any worker can pick up the conversation)
# - Lets users see/edit/delete history through the standard CRUD UI''',
    },
    {
        'title': 'Token validation before save',
        'language': 'Python',
        'description': 'Never save a credential without validating it works first. Prevents storing dead tokens.',
        'tags': ['security', 'api', 'pattern'],
        'code': '''from rest_framework.views import APIView
from rest_framework.response import Response


class GithubAccountView(APIView):
    def post(self, request):
        token = (request.data.get('token') or '').strip()
        if not token:
            return Response({'detail': 'token is required'}, status=400)

        # CRITICAL: validate the token BEFORE encrypting & saving
        try:
            profile = GithubClient(token).validate()   # calls /user endpoint
        except GithubError as e:
            return Response({'detail': str(e)}, status=e.status or 400)

        # Only now do we persist anything
        GithubAccount.objects.update_or_create(
            owner=request.user,
            defaults={
                'encrypted_token': encrypt(token),
                'github_username': profile['login'],
                'last_validated_at': timezone.now(),
            },
        )
        return Response({'connected': True}, status=201)


# Why this matters:
# - User pastes a typo → they see the error immediately, not "weeks later when nothing works"
# - Revoked tokens get caught at save time
# - The error message comes from GitHub itself, so it's accurate
# - No dead rows in the DB''',
    },
    {
        'title': 'GitHub API client wrapper',
        'language': 'Python',
        'description': 'Thin Session-based wrapper around the GitHub REST API. One try/except handles all error paths.',
        'tags': ['github', 'api', 'requests'],
        'code': '''import base64
import requests


class GithubError(Exception):
    def __init__(self, message, status=0):
        super().__init__(message)
        self.status = status


class GithubClient:
    def __init__(self, token: str):
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        })

    def _get(self, path: str, params=None):
        r = self._session.get(f'https://api.github.com{path}', params=params, timeout=15)
        if r.status_code == 401:
            raise GithubError('Invalid or expired token.', 401)
        if r.status_code == 404:
            raise GithubError('Not found on GitHub.', 404)
        if r.status_code == 403 and 'rate limit' in r.text.lower():
            raise GithubError('GitHub rate limit hit.', 403)
        if not r.ok:
            raise GithubError(f'GitHub error {r.status_code}', r.status_code)
        return r.json()

    def validate(self):
        return self._get('/user')

    def list_repos(self):
        return self._get('/user/repos', params={'sort': 'pushed', 'direction': 'desc', 'per_page': 100})

    def read_file(self, repo: str, path: str) -> str:
        result = self._get(f'/repos/{repo}/contents/{path}')
        if result.get('encoding') != 'base64':
            raise GithubError('Unexpected encoding', 500)
        return base64.b64decode(result['content']).decode('utf-8', errors='replace')

    def search_code(self, repo: str, query: str, per_page=20):
        return self._get('/search/code', params={
            'q': f'{query} repo:{repo}', 'per_page': per_page,
        }).get('items', [])''',
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# COMMAND
# ─────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Populate the DevSpace project with its own documentation, sprints, dev log, and snippets.'

    def handle(self, *args, **options):
        User = get_user_model()
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            self.stderr.write('No superuser found. Create one with createsuperuser first.')
            return

        # ── 1. Project ──
        project, created = Project.objects.update_or_create(
            id='devspace',
            defaults={
                'owner': user,
                'name': 'DevSpace',
                'key': 'DS',
                'color': '#7F77DD',
                'tagline': 'Personal developer project management — single user, dark-mode first.',
                'status': 'Active',
                'stack': [
                    'React 18', 'Vite', 'TanStack Query', 'Axios', 'React Router',
                    'Django 6', 'DRF', 'SimpleJWT', 'psycopg2', 'python-dotenv',
                    'Neon Postgres', 'Radix UI',
                ],
                'vault_timeout': 15,
            },
        )
        self.stdout.write(self.style.SUCCESS(f'{"Created" if created else "Updated"} project: {project.name}'))

        # ── 2. Wipe existing content for idempotency ──
        DocPage.objects.filter(project=project).delete()
        DevLogEntry.objects.filter(project=project).delete()
        Snippet.objects.filter(project=project).delete()
        Task.objects.filter(project=project).delete()
        Sprint.objects.filter(project=project).delete()
        self.stdout.write('Cleared existing content for DevSpace project.')

        # ── 3. Sprints + Tasks ──
        for sprint_data in SPRINTS:
            tasks = sprint_data.pop('tasks')
            sprint = Sprint.objects.create(project=project, **sprint_data)
            for title, ttype, status, priority, points in tasks:
                Task.objects.create(
                    project=project, sprint=sprint,
                    title=title, type=ttype, status=status,
                    priority=priority, points=points,
                )
            self.stdout.write(f'  Sprint {sprint.num}: {sprint.name} ({len(tasks)} tasks)')

        # ── 4. Docs ──
        for doc in DOCS:
            DocPage.objects.create(project=project, **doc)
        self.stdout.write(f'Created {len(DOCS)} docs.')

        # ── 5. DevLog (with backdated created_at) ──
        now = timezone.now()
        for entry in DEVLOG:
            days_ago = entry.pop('days_ago')
            obj = DevLogEntry.objects.create(project=project, **entry)
            # created_at is auto_now_add, so we override after creation
            obj.created_at = now - timedelta(days=days_ago)
            obj.save(update_fields=['created_at'])
        self.stdout.write(f'Created {len(DEVLOG)} dev log entries.')

        # ── 6. Snippets ──
        for snippet in SNIPPETS:
            Snippet.objects.create(project=project, **snippet)
        self.stdout.write(f'Created {len(SNIPPETS)} snippets.')

        self.stdout.write(self.style.SUCCESS('DevSpace project populated successfully.'))
