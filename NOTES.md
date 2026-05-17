# DevSpace — Study Notes

Everything we built, explained in depth. Read this when you want to understand the *why* behind the code.

---

## 1. Django settings.py

### Why `os.environ.get()` and not hardcoded values?
Hardcoding secrets (SECRET_KEY, DATABASE_URL) in code means they end up in git. Anyone with repo access has your credentials. `python-dotenv` reads a `.env` file at startup and puts those values into the environment — `os.environ.get('KEY')` reads them from there. The `.env` file is git-ignored.

### Why `== 'True'` for the DEBUG cast?
Environment variables are always strings. `os.environ.get('DEBUG')` returns the string `"True"`, not Python's boolean `True`. If you just wrote `if os.environ.get('DEBUG')`, it would *always* be truthy because any non-empty string is truthy in Python — even `"False"`. So we compare explicitly: `os.environ.get('DEBUG', 'True') == 'True'`.

### Why does CORS middleware have to come before CommonMiddleware?
Django processes middleware top to bottom on requests. A browser sends a preflight `OPTIONS` request before any cross-origin `POST` or `PATCH`. If `CorsMiddleware` isn't first, Django's own middleware may reject or modify the request before CORS headers can be attached — so the browser never sees the permission it needs.

### Why `settings.AUTH_USER_MODEL` instead of importing `User` directly?
Django lets you swap the built-in `User` model for a custom one (common in production apps). If you import `from django.contrib.auth.models import User` directly, your FK is hardcoded to the built-in model. Using `settings.AUTH_USER_MODEL` makes the FK point to "whatever the user model is", so it survives model swaps without code changes.

---

## 2. Django Models

### What is a migration?
A migration is a Python file Django generates that describes a database schema change. When you run `makemigrations`, Django compares your current `models.py` to the last migration and writes the diff. When you run `migrate`, it executes that diff as SQL. You never write `CREATE TABLE` or `ALTER TABLE` — Django does it from your model classes.

### Why slug IDs instead of auto-incrementing integers for Project?
Integer PKs give you URLs like `/api/projects/4/`. Slug PKs give you `/api/projects/devspace/`. The slug is meaningful — you can read the URL and know what you're looking at. The tradeoff is that you're responsible for uniqueness, which we handle in `save()`.

### The `save()` override pattern
When you call `Model.objects.create()` or `instance.save()`, Django calls the model's `save()` method. By overriding it, you can inject logic before the DB write. The pattern:
```python
def save(self, *args, **kwargs):
    if not self.pk:          # only run on first save (creation), not updates
        self.pk = ...        # generate the ID
    super().save(*args, **kwargs)  # always call super — this does the actual DB write
```
Never forget `super().save()` — without it, nothing gets written to the DB.

### What does `on_delete=CASCADE` vs `SET_NULL` mean?
- `CASCADE`: if the parent is deleted, delete all children. Delete a project → all its sprints, tasks, docs are deleted.
- `SET_NULL`: if the parent is deleted, set the FK to NULL instead. Delete a sprint → its tasks stay, but their `sprint` field becomes null (they move to the backlog). Requires `null=True` on the field.

### What is `related_name`?
When you define `sprint = ForeignKey(Sprint, related_name='tasks')`, Django creates a reverse accessor: `sprint_instance.tasks.all()`. Without `related_name`, you'd write `sprint_instance.task_set.all()` — Django's default is `modelname_set`, which is ugly and easy to confuse.

### What is `JSONField`?
Stores a Python list or dict as JSON text in the database column. When you read it back, Django automatically parses the JSON back to a Python object. We use it for `stack`, `labels`, `acceptance`, `tags` — things that are lists but don't warrant a separate table.

---

## 3. Django REST Framework

### What is a serializer?

A serializer is the translation layer between your Django model (a Python object) and JSON (what the frontend speaks). Every API response and every incoming POST/PATCH body goes through one.

Here is our actual `TaskSerializer`:

```python
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'closed_at', 'created_at', 'updated_at']
```

`ModelSerializer` inspects the `Task` model's field definitions and auto-generates:
- **Validators**: `CharField(max_length=500)` on the model → serializer rejects strings >500 chars automatically
- **Type coercion**: `DateField` on the model → serializer validates that the value is a valid date string
- **Required/optional rules**: fields with `blank=True` on the model → optional in the serializer

**What `read_only_fields` does in practice:**

| Field | In GET response | In POST/PATCH body |
|---|---|---|
| `id` | ✅ returned | ❌ silently ignored |
| `closed_at` | ✅ returned | ❌ silently ignored |
| `title` | ✅ returned | ✅ accepted |
| `status` | ✅ returned | ✅ accepted |

`closed_at` is read-only because we set it server-side in `perform_update`. If the frontend sends `"closed_at": "2026-01-01"` in a PATCH body, the serializer strips it out before validation even runs.

---

### What is a ViewSet and what does ModelViewSet give you for free?

A ViewSet is a class that maps HTTP verbs to methods. `ModelViewSet` inherits from a chain of mixins that each implement one operation:

```
ModelViewSet
  ├── ListModelMixin        →  GET  /api/tasks/           → list()
  ├── CreateModelMixin      →  POST /api/tasks/           → create()
  ├── RetrieveModelMixin    →  GET  /api/tasks/DS-001/    → retrieve()
  ├── UpdateModelMixin      →  PATCH /api/tasks/DS-001/   → partial_update()
  └── DestroyModelMixin     →  DELETE /api/tasks/DS-001/  → destroy()
```

Our simplest ViewSet — `ProjectViewSet` — is 6 lines because all five operations run automatically:

```python
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

The only reason we wrote any code at all here is:
1. `get_queryset` — to scope results to the logged-in user (security)
2. `perform_create` — to stamp `owner` from `request.user` (the frontend never sends this)

Everything else — serializing the response, deserializing the request body, validating, saving, returning the right status code — runs automatically from the inherited mixins.

---

### The three override hooks and when to use each

**`get_queryset(self)`** — override this to control *which rows are returned*. Runs on every request.

```python
# SprintViewSet — filter by project and scope to the logged-in user's data
def get_queryset(self):
    project_id = self.request.query_params.get('project')
    qs = Sprint.objects.filter(project__owner=self.request.user)
    if project_id:
        qs = qs.filter(project_id=project_id)
    return qs.order_by('num')
```

`self.request.query_params` is a dict of everything after the `?` in the URL.
`GET /api/sprints/?project=devspace` → `query_params.get('project')` returns `'devspace'`.

---

**`perform_create(self, serializer)`** — override this to inject server-side values on POST. The serializer has already validated the incoming data. You call `serializer.save(extra_field=value)` to merge your injected values with the validated data before the DB write.

```python
# ProjectViewSet — stamp the owner from the authenticated user
def perform_create(self, serializer):
    serializer.save(owner=self.request.user)
```

Without this override, `owner` would be required in the POST body (and the serializer would reject requests missing it). With it, `owner` is marked `read_only` in the serializer, ignored in the body, and injected here instead.

---

**`perform_update(self, serializer)`** — override this to inject server-side logic on PATCH/PUT. This is where our `closed_at` logic lives:

```python
# TaskViewSet — set/clear closed_at when status transitions to/from Done
def perform_update(self, serializer):
    new_status = serializer.validated_data.get('status', serializer.instance.status)

    if new_status == 'Done' and serializer.instance.status != 'Done':
        serializer.save(closed_at=timezone.now())   # transitioning IN to Done
    elif new_status != 'Done' and serializer.instance.status == 'Done':
        serializer.save(closed_at=None)             # transitioning OUT of Done
    else:
        serializer.save()                           # normal update, no transition
```

Breaking down each line:

```python
new_status = serializer.validated_data.get('status', serializer.instance.status)
```
- `serializer.validated_data` = what the PATCH body actually sent (already validated)
- `serializer.instance` = the Task row as it currently exists in the DB
- `.get('status', fallback)` = if `status` wasn't in the PATCH body, use the current DB value as fallback
- Without the fallback, patching `{"priority": "High"}` would give `new_status = None`, which would wrongly trigger the "moving away from Done" branch

```python
if new_status == 'Done' and serializer.instance.status != 'Done':
```
This is the transition check. Both conditions must be true:
- `new_status == 'Done'` → the incoming request wants Done
- `serializer.instance.status != 'Done'` → the task isn't already Done

If it's already Done and you PATCH with Done again, neither branch fires — just a normal save.

```python
serializer.save(closed_at=timezone.now())
```
`serializer.save()` merges `validated_data` with any kwargs you pass. So the DB write gets `status='Done'` (from the PATCH body) AND `closed_at=<now>` (injected here) in a single query. The frontend never knew it needed to send `closed_at`.

---

### The full request lifecycle for a PATCH

Here is exactly what happens when the frontend sends `PATCH /api/tasks/DS-001/ {"status": "Done"}`:

```
1. URL router matches /api/tasks/DS-001/ → TaskViewSet, action = partial_update

2. Authentication middleware runs:
   - Reads Authorization: Bearer <token> header
   - JWTAuthentication decodes and validates the token
   - Fetches the user from DB, sets request.user

3. IsAuthenticated permission check:
   - request.user is authenticated? ✅ → continue
   - request.user is AnonymousUser? ❌ → 401 response

4. TaskViewSet.get_queryset() runs:
   - Returns Task.objects.filter(project__owner=request.user)
   - DS-001 belongs to the logged-in user? ✅ → continue
   - DS-001 belongs to someone else? ❌ → 404 response

5. TaskViewSet.partial_update() runs (inherited from UpdateModelMixin):
   - Fetches the Task instance: Task.objects.get(pk='DS-001')
   - Creates a TaskSerializer with instance=<task>, data={"status": "Done"}, partial=True
   - Calls serializer.is_valid() — validates the incoming data
   - Calls TaskViewSet.perform_update(serializer)

6. TaskViewSet.perform_update() runs (our override):
   - new_status = "Done" (from validated_data)
   - serializer.instance.status = "In progress" (current DB value)
   - "Done" == "Done" AND "In progress" != "Done" → first branch fires
   - serializer.save(closed_at=timezone.now())

7. serializer.save() runs:
   - Merges validated_data {"status": "Done"} with kwargs {"closed_at": <now>}
   - Calls Task.save() → writes to DB

8. Response:
   - Serializer serializes the updated Task instance to JSON
   - Returns HTTP 200 with the full updated task including closed_at
```

---

### What is `get_queryset()` vs a static `queryset` attribute?

The simpler approach is to set `queryset` as a class attribute:

```python
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()  # evaluated ONCE when the server starts
    serializer_class = ProjectSerializer
```

The problem: `Project.objects.all()` runs at import time, before any request exists. You can't access `self.request` from a class attribute — there is no request yet.

`get_queryset()` is a method called on *every request*, so `self.request` is fully populated:

```python
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):             # called on every request
        return Project.objects.filter(
            owner=self.request.user     # self.request exists here
        )
```

Rule of thumb: if your queryset is always the same regardless of who's asking or what URL params they sent, use the `queryset` attribute. If it changes based on the request (user scoping, query params), use `get_queryset()`.

---

### What does `__` (double underscore) mean in ORM filters?

It traverses a foreign key relationship in a filter. `Sprint` has no `owner` field, but it has `project`, and `Project` has `owner`. The double underscore tells Django to follow the FK:

```python
Sprint.objects.filter(project__owner=request.user)
```

Django translates this to:
```sql
SELECT api_sprint.*
FROM api_sprint
INNER JOIN api_project ON api_sprint.project_id = api_project.id
WHERE api_project.owner_id = <user_id>
```

You never write the JOIN — the `__` does it. You can chain as deep as needed:
```python
Sprint.objects.filter(project__owner__email='dev@example.com')
# api_sprint → api_project → auth_user → email column
```

---

### What is a `Q` object?

`Q` lets you write OR conditions in ORM filters. Normal filter chaining is always AND:

```python
Snippet.objects.filter(language='Python', tags__contains='django')
# WHERE language='Python' AND tags LIKE '%django%'
```

With `Q`, you can use `|` for OR and `&` for AND:

```python
from django.db import models

Snippet.objects.filter(
    models.Q(project__isnull=True) | models.Q(project__owner=user)
)
# WHERE project_id IS NULL OR project.owner_id = <user_id>
```

We use this for Snippets because they can be global (no project, `project_id IS NULL`) or scoped to a project. Without `Q`, you couldn't express this OR in a single queryset.

---

### What is a Django Router?

Without a router, you'd manually write a `path()` for every URL pattern:

```python
# Without a router — tedious
urlpatterns = [
    path('projects/', ProjectViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('projects/<pk>/', ProjectViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    # repeat for every resource...
]
```

With a router, one `register()` generates all of those automatically:

```python
router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'sprints',  views.SprintViewSet,  basename='sprint')
router.register(r'tasks',    views.TaskViewSet,    basename='task')
# ...

urlpatterns = [path('', include(router.urls))]
```

`register(prefix, viewset, basename)`:
- `prefix` → the URL path: `'projects'` becomes `/api/projects/`
- `viewset` → which class handles requests
- `basename` → internal name DRF uses to generate named URL patterns like `project-list`, `project-detail`

### What is `include()` in urls.py?

`include('api.urls')` tells Django: "for any URL starting with `api/`, hand routing to `api/urls.py`." This keeps each app's routing self-contained:

```python
# backend/urls.py — the project root
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),   # everything under /api/ is handled by api/urls.py
]

# api/urls.py — the app
router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
# ...
urlpatterns = [path('', include(router.urls))]
```

The result: a request to `/api/projects/` is routed by `backend/urls.py` to `api/urls.py` which hands it to `ProjectViewSet`.

---

## 4. JWT Authentication

### What is JWT?
JSON Web Token. When you POST credentials to `/api/token/`, Django returns two tokens:
- **Access token**: short-lived (1 day). Sent as `Authorization: Bearer <token>` on every API request.
- **Refresh token**: long-lived (30 days). Used to get a new access token without re-entering credentials.

The access token is a signed JSON payload containing the user ID and expiry. Django can verify it without a DB lookup — it just checks the signature using `SECRET_KEY`.

### How does `request.user` get populated?
1. `AuthenticationMiddleware` in Django's middleware chain reads the `Authorization` header.
2. `JWTAuthentication` (configured in `REST_FRAMEWORK` settings) decodes the Bearer token, validates the signature, checks expiry, and fetches the user from the DB.
3. `IsAuthenticated` permission class checks that `request.user` is a real authenticated user — not `AnonymousUser`.
4. Your ViewSet code runs — `request.user` is fully loaded.

If any step fails, the request is rejected with a 401 before your code runs.

---

## 5. Rate Limiting & Throttling

### What is throttling and why does DevSpace need it?

Throttling means: "this client has made too many requests in a given window — return 429 and tell them to slow down." Without it:

- A bug in the React app could loop and POST to `/api/conversations/:id/messages/` thousands of times, burning your entire Groq API quota in minutes.
- A brute-force script could hammer `/api/token/` with credential guesses.

DRF has throttling built in — no external service needed.

---

### How DRF throttling works

Every throttle class does two things:

1. **`get_cache_key(request, view)`** — generates a string that identifies "who" is being throttled. The key is looked up in the cache.
2. **`allow_request(request, view)`** — reads the request history for that key, checks it against the rate, and returns `True` (allow) or `False` (block with 429).

The two base classes differ only in how they build the cache key:

| Class | Cache key | Requires auth |
|---|---|---|
| `UserRateThrottle` | `throttle_user_<user_id>` | Yes |
| `AnonRateThrottle` | `throttle_anon_<ip_address>` | No |

When a limit is hit, DRF automatically returns `HTTP 429 Too Many Requests` with a `Retry-After` header — no extra code needed in the view.

---

### The three throttle scopes in DevSpace

```python
# backend/backend/settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'user':          os.environ.get('THROTTLE_USER', '2000/day'),
        'agent_message': os.environ.get('THROTTLE_AGENT_MESSAGE', '20/minute'),
        'login':         os.environ.get('THROTTLE_LOGIN', '5/minute'),
    },
}
```

The `scope` attribute on a throttle class is the key that maps to `DEFAULT_THROTTLE_RATES`:

```python
# backend/api/throttles.py

class AgentMessageThrottle(UserRateThrottle):
    scope = 'agent_message'   # → looks up 'agent_message' in DEFAULT_THROTTLE_RATES

class LoginThrottle(AnonRateThrottle):
    scope = 'login'           # → looks up 'login' in DEFAULT_THROTTLE_RATES
```

**`user` (global, 2000/day)** — the default `UserRateThrottle` applied to all authenticated endpoints. A safety net for runaway clients. Almost never hit in real use.

**`agent_message` (20/minute)** — applied only to POST on `/api/conversations/:id/messages/`. Each POST triggers a LangGraph agent that can make up to 12 LLM hops. 20 per minute = 240 LLM calls per minute max. Protects the Groq quota.

**`login` (5/minute, IP-keyed)** — applied to POST on `/api/token/`. 5 attempts per minute stops brute-force. Uses IP instead of user ID because the user isn't authenticated yet — there's no user ID to key on.

---

### Why IP-keyed throttling is fine for login here

`AnonRateThrottle` keys on the client's IP address. The weakness: all users behind the same NAT (office, VPN) share one bucket — one person's brute-force exhausts the allowance for everyone else.

For a **single-user personal tool**, this doesn't apply. There's one legitimate user. IP-keyed is the correct approach because user-keyed simply can't work here — `request.user` is `AnonymousUser` at `/api/token/`.

If you ever went multi-user, you'd add a username-keyed variant:

```python
class LoginThrottle(AnonRateThrottle):
    def get_cache_key(self, request, view):
        username = request.data.get('username', '')
        return f'login_{username}_{self.get_ident(request)}'
        # keyed on: username + IP combined
        # → brute-forcing account A doesn't block account B
```

---

### Applying throttles: class attribute vs `get_throttles()`

**Class attribute** — applies the same throttle to every HTTP method on the view:

```python
class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]
    # Every POST to /api/token/ is throttled — there are no other methods here
```

**`get_throttles()` override** — lets you throttle selectively by HTTP method:

```python
class MessagesView(APIView):
    def get_throttles(self):
        if self.request.method == 'POST':
            return [AgentMessageThrottle()]
        return []
        # GET /messages/ (read history) — unthrottled
        # POST /messages/ (trigger LLM agent) — throttled at 20/minute
```

Use `get_throttles()` when different verbs on the same endpoint should have different limits. Reading message history is free — triggering an LLM call costs money.

---

### The cache backend for throttle counters

DRF throttling stores request timestamps in the cache. `LocMemCache` is Django's in-process memory cache — no Redis, no external service needed:

```python
# backend/backend/settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

**Tradeoff:** the cache resets on every redeploy (no state persists across restarts). For a single-user tool on a single Render instance this is fine. If you ever run multiple processes or workers, you'd need Redis (`django.core.cache.backends.redis.RedisCache`) so all processes share the same counter.

---

### Configuring limits via environment variables

All three rates are read from env vars with hardcoded defaults:

```python
'DEFAULT_THROTTLE_RATES': {
    'user':          os.environ.get('THROTTLE_USER', '2000/day'),
    'agent_message': os.environ.get('THROTTLE_AGENT_MESSAGE', '20/minute'),
    'login':         os.environ.get('THROTTLE_LOGIN', '5/minute'),
},
```

The format DRF expects is `"<count>/<period>"` where period is `second`, `minute`, `hour`, or `day`.

To override locally — uncomment in `.env.backend`:
```bash
# THROTTLE_USER=2000/day
# THROTTLE_AGENT_MESSAGE=20/minute
# THROTTLE_LOGIN=5/minute
```

To override on Render — add the var in the dashboard Environment tab and redeploy. No code change needed.

---

## 6. Management Commands

A management command is a Python script you run via `python manage.py <name>`. Django discovers them by convention: the file must live at `app/management/commands/<name>.py` and the class must extend `BaseCommand` and implement `handle()`. No registration needed.

We use the `seed` command to populate the database with sample data. It's idempotent — running it twice gives the same result because it deletes all of the user's data first.

---

## 7. TanStack Query

### Why TanStack Query instead of axios + useEffect?
With plain `useEffect`:
```js
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
useEffect(() => {
  axios.get('/api/projects/').then(r => setData(r.data)).catch(setError).finally(() => setLoading(false))
}, [])
```
That's 6 lines of boilerplate per data fetch, no caching, no background refresh.

With TanStack Query:
```js
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.get('/api/projects/').then(r => r.data)
})
```
One line of logic, plus automatic caching, background refetching, and loading/error states.

### What is a queryKey?
A unique identifier for a cached result. TanStack Query stores every result by its key. `['projects']` caches all projects. `['tasks', 'devspace', 's-12']` caches tasks for a specific project and sprint. If you fetch the same key twice, you get the cached result instantly — no second network request.

When you mutate data (create/update/delete a task), you call `queryClient.invalidateQueries({ queryKey: ['tasks', ...] })` to tell the cache "this data is stale, refetch it next time someone asks."

### What is a mutation?
`useMutation` handles writes (POST/PATCH/DELETE). Unlike `useQuery` which runs automatically, a mutation runs when you explicitly call it. It has `onSuccess` and `onError` callbacks where you typically invalidate related queries.

### staleTime explained
`staleTime: 1000 * 60 * 3` means data is considered "fresh" for 3 minutes. Within that window, switching to another component that needs the same data uses the cache instantly — no network request. After 3 minutes it's "stale" and TanStack Query will refetch in the background next time that data is needed.

---

### The hooks pattern — `useQuery` vs `useMutation`

We split every resource into two types of hooks:

**`useQuery` — reading data (GET)**

```js
export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.get('/sprints/', { params: { project: projectId } }).then(res => res.data),
    enabled: !!projectId,
  });
}
```

- Runs **automatically** when the component mounts
- Re-runs when `projectId` changes (TanStack detects the key changed)
- `enabled: !!projectId` — don't fetch if `projectId` is undefined/null. Without this you'd get a request to `/api/sprints/?project=undefined` on first render.
- Returns `{ data, isLoading, error }` which the component consumes directly

**`useMutation` — writing data (POST/PATCH/DELETE)**

```js
export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/sprints/', data).then(res => res.data),
    onSuccess: (newSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', newSprint.project] });
    },
  });
}
```

- Does **nothing** until you explicitly call it
- In a component: `const createSprint = useCreateSprint()` then `createSprint.mutate({ name: 'Sprint 4', project: 'devspace' })`
- `onSuccess` fires automatically when `mutationFn` resolves — you never call it manually
- The argument to `onSuccess` is whatever `mutationFn` resolved to (the API response)

---

### How TanStack deduplicates requests

The QueryClient holds a global cache (the instance from `queryClient.js`). When a component calls `useQuery({ queryKey: ['projects'] })`:

1. TanStack looks up `['projects']` in the cache
2. If fresh data exists → return it immediately, **no network call**
3. If a request for that key is already in flight → **subscribe to the same promise**, don't fire another request
4. Only if nothing exists → fire the HTTP request

So if two components both call `useProjects()`, the first to mount fires the GET. The second, mounting milliseconds later, gets the same cached result. **One network call, two consumers.**

This only works when the data is actually the same. `['sprints', 'devspace']` and `['sprints', 'my-app']` are different keys → separate cache entries → separate requests.

---

### The cache is a key→value map

```
['projects']                    → { data: [...projects], status: 'success' }
['sprints', 'devspace']         → { data: [...sprints],  status: 'success' }
['tasks', 'devspace', 's-1']    → { data: [...tasks],    status: 'success' }
['tasks', 'devspace', 'backlog']→ { data: [...tasks],    status: 'loading' }
```

The key is the address. The full API response is stored at that address. `invalidateQueries` marks an address as stale — TanStack will re-fetch it next time a component needs it.

---

### `queryFn` return value = `data`

Whatever your `queryFn` resolves to becomes the value of `data` in the component. That's why we always chain `.then(res => res.data)` — without it, `data` would be the full axios response object `{ status: 200, headers: {...}, data: [...] }` and you'd have to write `data.data` in your component.

```js
// queryFn resolves to an array → data is an array ✅
queryFn: () => api.get('/tasks/').then(res => res.data)

// queryFn resolves to the full axios response → data.data is the array ❌
queryFn: () => api.get('/tasks/')
```

Same rule applies to `mutationFn` — the `.then(res => res.data)` there determines what `onSuccess` receives as its argument.

---

### Prefix matching in `invalidateQueries`

When you invalidate with a partial key, TanStack marks stale **every cache entry whose key starts with** that prefix:

```js
queryClient.invalidateQueries({ queryKey: ['tasks', 'devspace'] })
```

```
['tasks', 'devspace', 's-1']       ✅ invalidated
['tasks', 'devspace', 'backlog']   ✅ invalidated
['tasks', 'devspace', 's-2']       ✅ invalidated
['tasks', 'my-app', 's-1']         ❌ not touched
['sprints', 'devspace']            ❌ not touched
```

This is why mutations invalidate with just `['tasks', projectId]` — one call clears the sprint view, the backlog view, and every other task query for that project.

---

### Three ways to write `queryFn` / `mutationFn`

```js
// Option 1 — inline chain (best for simple fetches)
queryFn: () => api.get('/tasks/').then(res => res.data),

// Option 2 — async/await (better when you need to transform the response)
queryFn: async () => {
  const res = await api.get('/tasks/');
  return res.data;
},

// Option 3 — named function (best when the logic is complex or reused)
async function fetchTasks(projectId) {
  const res = await api.get('/tasks/', { params: { project: projectId } });
  return res.data;
}
queryFn: () => fetchTasks(projectId),
```

All three are equivalent. Use Option 1 for straightforward fetches (which is everything in this project). Use Option 2 when you need to do something with the response before returning. Use Option 3 when the same fetch is needed in more than one place.

---

### The full mutation cycle

```
User submits form
  → createSprint.mutate(data)
    → POST /api/sprints/
      → onSuccess(newSprint): invalidate ['sprints', newSprint.project]
        → useSprints sees its cache is stale
          → GET /api/sprints/?project=:id re-fires automatically
            → component re-renders with updated list
```

You never manually update state after a mutation. You just invalidate the right cache key and TanStack handles the re-fetch and re-render.

---

### The six hook files we built

Every resource gets its own file in `src/hooks/`. Each file exports a `useQuery` hook for reading and one or more `useMutation` hooks for writing.

**`useProjects.js`**
```js
useProjects()          // GET /api/projects/  — all projects for the logged-in user
useCreateProject()     // POST /api/projects/
```
Key is just `['projects']` — no extra scope needed because the Django viewset already filters by `owner=request.user`. There is only one projects list per session.

---

**`useSprints.js`**
```js
useSprints(projectId)  // GET /api/sprints/?project=:id
useCreateSprint()      // POST /api/sprints/
```
Key is `['sprints', projectId]` — sprints for different projects are different cache entries. `enabled: !!projectId` prevents a fetch when no project is selected yet.

---

**`useTasks.js`**
```js
useTasks(projectId, sprintId)  // GET /api/tasks/?project=:id&sprint=:id  — kanban board
useBacklog(projectId)          // GET /api/tasks/?project=:id&sprint=null  — backlog view
useCreateTask()                // POST /api/tasks/
useUpdateTask()                // PATCH /api/tasks/:id/
```
Two read hooks because the kanban and backlog hit the same endpoint with different params — they need different cache keys so they don't share stale data.

`useBacklog` uses the string `'backlog'` in the key (`['tasks', projectId, 'backlog']`) to distinguish it from a sprint-scoped query. Without it, `['tasks', projectId, undefined]` and `['tasks', projectId, 'backlog']` could collide.

`useUpdateTask` destructures `id` out of the payload to build the URL, then spreads the rest as the body:
```js
mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}/`, data)
// mutate({ id: 'DS-001', status: 'Done' })
// → PATCH /api/tasks/DS-001/  body: { status: 'Done' }
```

Both mutations invalidate with just `['tasks', projectId]` — prefix matching means this wipes the sprint view, backlog, and any other task cache for that project at once.

---

**`useDocs.js`**
```js
useDocs(projectId)    // GET /api/docs/?project=:id
useCreateDoc()        // POST /api/docs/
useUpdateDoc()        // PATCH /api/docs/:id/
useDeleteDoc()        // DELETE /api/docs/:id/
```
Full CRUD. `useDeleteDoc` has a special pattern because DELETE returns no response body — we can't read `projectId` from the server response. Instead we pass it in with the variables and read it from the second argument of `onSuccess`:
```js
mutationFn: ({ id, projectId }) => api.delete(`/docs/${id}/`),
onSuccess: (_, variables) => {
  // _ is the empty response body, variables is what we passed to mutate()
  queryClient.invalidateQueries({ queryKey: ['docs', variables.projectId] });
}
```

---

**`useDevLog.js`**
```js
useDevLog(projectId)        // GET /api/devlog/?project=:id
useCreateDevLogEntry()      // POST /api/devlog/
```
Read + create only. Dev log entries are append-only by design — you write entries, you don't edit or delete them.

---

**`useSnippets.js`**
```js
useSnippets(projectId?)     // GET /api/snippets/ or /api/snippets/?project=:id
useCreateSnippet()          // POST /api/snippets/
useDeleteSnippet()          // DELETE /api/snippets/:id/
```
Snippets are the only resource that can be global (no project) or project-scoped. `projectId` is optional. The key uses `projectId ?? 'all'` so that when no project is passed, the cache entry is `['snippets', 'all']` instead of `['snippets', undefined]` — a cleaner, more readable key.

Both mutations invalidate the entire `['snippets']` prefix to refresh both the global list and any project-scoped list at the same time.

---

## 8. Token in Memory (Security)

### Why not localStorage?
`localStorage` is accessible by any JavaScript running on the page. If there is ever an XSS vulnerability (injected script tag, malicious dependency), the attacker can run `localStorage.getItem('token')` and steal your session.

### Why a module-level variable?
```js
// token.js
let _token = null;
export const getToken = () => _token;
export const setToken = (t) => { _token = t; };
```
JavaScript modules are singletons. Every file that imports `token.js` gets the same instance — reading and writing the same `_token` variable. It lives in the JS engine's memory, not in the DOM. A script can't access another module's private variables.

Downside: the token is gone on page refresh — the user must log in again. For a personal dev tool, that's an acceptable tradeoff.

### The axios interceptor
The request interceptor runs before every axios request:
```js
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
You set the token once at login and every subsequent request automatically carries it. You never have to manually add the header anywhere in your query functions.

---

## 9. React Context for Auth

`createContext` + `Provider` is React's built-in dependency injection. Instead of passing `isLoggedIn` and `login()` as props through every component (prop drilling), you wrap the whole app in `<AuthProvider>` once and any component can call `useAuth()` to get them.

The flow:
1. `main.jsx` wraps the app in `<AuthProvider>`
2. `AuthProvider` holds `isLoggedIn` state
3. `App.jsx` calls `useAuth()` — if `!isLoggedIn`, renders `<LoginScreen />`
4. `LoginScreen` calls `login(username, password)` → POSTs to `/api/token/` → stores token → sets `isLoggedIn = true`
5. `App` re-renders with `isLoggedIn = true` → shows the full app

`queryClient.clear()` on logout wipes the entire cache so a future user can't see the previous user's data after re-login on the same machine.

---

## 10. Infrastructure — How DevSpace Is Built and Linked

### The full system at a glance

```
Browser (React SPA)
    │
    │  HTTP/JSON  (axios, JWT Bearer header)
    ▼
Django + DRF  (port 8000)
    │
    │  psycopg2 / DATABASE_URL
    ▼
Neon (serverless Postgres)
```

Three processes in development:
- `npm run dev` → Vite dev server on port 5173 (serves React)
- `python manage.py runserver` → Django on port 8000 (serves API)
- Neon → always-on cloud Postgres (no local DB process needed)

In production (Render):
- Django → Render web service (gunicorn) on `https://your-app.onrender.com`
- React → Render static site (or Vercel) on `https://your-frontend.onrender.com`
- Neon → same cloud Postgres, just pointed at from the production `DATABASE_URL`

---

### How a request travels end to end

```
1. User types in the React UI
   ↓
2. React component calls a TanStack mutation:
   createTask.mutate({ title: 'Fix login', project: 'devspace', sprint: 's-1' })
   ↓
3. useMutation's mutationFn runs:
   api.post('/tasks/', data)   ← api is the configured axios instance
   ↓
4. axios request interceptor runs:
   Reads token from memory → appends Authorization: Bearer <jwt>
   ↓
5. HTTP POST → http://localhost:8000/api/tasks/
   ↓
6. Django middleware runs (in order):
   SecurityMiddleware → SessionMiddleware → CorsMiddleware → ...
   CorsMiddleware: is Origin: http://localhost:5173 in CORS_ALLOWED_ORIGINS? ✅
   ↓
7. JWT authentication:
   JWTAuthentication reads Authorization header
   Decodes token → gets user_id → fetches User from DB
   Sets request.user = <User: berre>
   ↓
8. URL router matches /api/tasks/ → TaskViewSet, action = create
   ↓
9. IsAuthenticated permission check:
   request.user is authenticated? ✅
   ↓
10. TaskViewSet.get_queryset() runs — scopes to request.user's projects
    (create still calls this for ownership validation)
    ↓
11. TaskSerializer validates the POST body:
    - title: required CharField ✅
    - project: FK to Project, must exist and belong to this user ✅
    - id, closed_at: read_only, silently ignored if sent
    ↓
12. TaskViewSet.perform_create() or perform_update() runs — injects server-side values
    ↓
13. Task.save() runs:
    - First save? Auto-generates id = "DS-001"
    - Calls super().save() → SQL INSERT
    ↓
14. Django returns HTTP 201 with the serialized task JSON
    ↓
15. axios response interceptor: 401? → clearToken + reload. Otherwise pass through.
    ↓
16. TanStack onSuccess fires:
    queryClient.invalidateQueries({ queryKey: ['tasks', 'devspace'] })
    ↓
17. All components subscribed to ['tasks', 'devspace', *] see their data as stale
    ↓
18. TanStack refetches → GET /api/tasks/?project=devspace&sprint=s-1
    ↓
19. Components re-render with the new task in the list
```

---

### Directory map — where everything lives

```
DevSpace/
├── backend/
│   ├── backend/               ← Django project config
│   │   ├── settings.py        ← DB, CORS, JWT, DRF, installed apps
│   │   └── urls.py            ← root router: /admin/, /api/me/, /api/
│   ├── api/                   ← the main Django app
│   │   ├── models.py          ← Project, Sprint, Task, DocPage, DevLogEntry, Snippet, EnvVariable
│   │   ├── serializers.py     ← one ModelSerializer per model
│   │   ├── views.py           ← one ModelViewSet per model + SearchView + DashboardView + vault views
│   │   ├── urls.py            ← DefaultRouter + manual paths for search/dashboard/vault
│   │   └── migrations/        ← auto-generated schema history
│   ├── users/                 ← custom user app
│   │   ├── models.py          ← CustomUser (extends AbstractUser, adds display_name + role)
│   │   ├── serializers.py     ← UserProfileSerializer
│   │   └── views.py           ← MeView (GET/PATCH /api/me/)
│   └── manage.py
│
└── frontend/
    └── src/
        ├── main.jsx           ← mounts React, wraps in QueryClientProvider + AuthProvider
        ├── App.jsx            ← shell: Rail, Sidebar, routing between projects/views, Cmd+K
        ├── lib/
        │   ├── api.js         ← axios instance + request/response interceptors
        │   └── token.js       ← in-memory JWT storage (module-level variable)
        ├── context/
        │   └── AuthContext.jsx← isLoggedIn state, login(), logout()
        ├── hooks/             ← one file per resource
        │   ├── useProjects.js
        │   ├── useSprints.js
        │   ├── useTasks.js
        │   ├── useDocs.js
        │   ├── useDevLog.js
        │   ├── useSnippets.js
        │   ├── useEnvVars.js  ← env vars + vault unlock/set-password
        │   ├── useSearch.js   ← global search with useDebounce
        │   ├── useDashboard.js
        │   └── useMe.js
        ├── components/
        │   ├── Dashboard.jsx  ← overview: sprint banners, bug list, devlog, stat strip
        │   ├── Kanban.jsx     ← board view for active sprint
        │   ├── TaskPanel.jsx  ← slide-in detail panel, inline editing, sprint move, delete
        │   ├── CreateTaskModal.jsx
        │   ├── CreateSprintModal.jsx
        │   ├── EditSprintModal.jsx
        │   ├── ProjectSettingsModal.jsx ← name/tagline/color/status/stack/vault timeout
        │   ├── UserSettingsModal.jsx    ← display_name + role
        │   ├── SearchModal.jsx          ← Cmd+K global search, keyboard nav
        │   ├── Icon.jsx                 ← all SVG icons as a lookup table
        │   └── views/                   ← one component per sidebar view
        │       ├── SprintOverview.jsx
        │       ├── BacklogView.jsx
        │       ├── BugTrackerView.jsx
        │       ├── DocsView.jsx
        │       ├── DevLogView.jsx
        │       ├── SnippetVaultView.jsx
        │       └── StackView.jsx        ← tech stack + env var vault
        └── index.css          ← design system: CSS variables, tokens, global styles
```

---

### How Django models relate to each other

```
CustomUser (auth)
    │
    │ owner (CASCADE)
    ▼
Project ──────────────────────────────────────────┐
    │                                             │
    │ project (CASCADE)    project (CASCADE)      │ project (SET_NULL, nullable)
    ▼                      ▼                      ▼
Sprint              DocPage               Snippet (global or scoped)
    │               DevLogEntry
    │ sprint (SET_NULL, nullable)
    ▼
Task

Project
    │ project (CASCADE)
    ▼
EnvVariable
```

Key rules:
- Delete a **Project** → cascades to all Sprints, Tasks, DocPages, DevLogEntries, EnvVariables
- Delete a **Sprint** → Tasks become backlog (sprint = NULL), not deleted
- Delete a **User** → cascades to all their Projects (and transitively everything else)
- **Snippet** can exist without a project (global snippet) — FK is nullable

---

### How authentication works

```
Login:
  POST /api/token/  { username, password }
  → DRF SimpleJWT verifies credentials
  → Returns { access: "eyJ...", refresh: "eyJ..." }
  → Frontend stores access token in memory (token.js module variable)
  → Frontend ignores refresh token (user re-logs on page refresh — acceptable for solo tool)

Every API request:
  axios interceptor reads getToken() → appends Authorization: Bearer <token>

Token expiry:
  Response interceptor watches for 401
  If 401 from non-token endpoint → clearToken() + window.location.reload()
  If 401 from /token/ endpoint itself → let it through (login error, not session expiry)

Logout:
  clearToken() → queryClient.clear() → setIsLoggedIn(false)
```

---

### How TanStack Query connects components to the API

The `QueryClientProvider` in `main.jsx` creates a global cache shared by all components. Hooks read from and write to this cache. Components never call axios directly.

```
main.jsx
└── QueryClientProvider (global cache)
    └── AuthProvider
        └── App.jsx
            ├── Rail (logo/nav)
            ├── Sidebar (project list)
            └── ProjectView
                ├── SprintOverview  → useSprints(projectId)   ──► GET /api/sprints/
                ├── BacklogView     → useBacklog(projectId)    ──► GET /api/tasks/?sprint=null
                ├── TaskPanel       → useUpdateTask()           ──► PATCH /api/tasks/:id/
                ├── DevLogView      → useDevLog(projectId)      ──► GET /api/devlog/
                ├── StackView       → useEnvVars(projectId)     ──► GET /api/env-vars/
                └── ...
```

The `key` prop on `<ProjectView key={activeProject.id}>` causes a full remount when you switch projects — resetting all local state and re-running all hooks with the new `projectId`.

---

### The vault security model

```
Set password:
  User types password → POST /api/projects/:id/set-vault-password/
  Django: SHA-256 hash → stored in project.vault_password_hash
  API response: ProjectSerializer NEVER sends vault_password_hash
  Instead exposes: has_vault_password: bool (SerializerMethodField)

Unlock:
  User enters password → POST /api/projects/:id/unlock-vault/
  Django: SHA-256(input) == stored hash? → { success: true, timeout: 15 }
  Frontend: stores unlockedUntil = Date.now() + timeout * 60_000 in React state (memory only)
  setTimeout auto-clears unlockedUntil after timeout

Values visible:
  Only while unlockedUntil > Date.now()
  Page refresh = locked (state is gone)
  Tab close = locked
  Never written to localStorage
```

SHA-256 is used (not bcrypt) because this is a personal single-user tool. For a multi-user product you'd upgrade to bcrypt/argon2 with a salt.

---

## 11. Planned Features — Architecture Notes

### 11.1 Teams / Multi-user

**What changes:** Currently every viewset filters by `project__owner=request.user`. With teams, access is via a membership table.

```python
# New model
class Membership(models.Model):
    ROLE_CHOICES = [('owner', 'Owner'), ('editor', 'Editor'), ('viewer', 'Viewer')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'project')]
```

**What every viewset changes to:**
```python
# Before (single user)
def get_queryset(self):
    return Sprint.objects.filter(project__owner=self.request.user)

# After (teams)
def get_queryset(self):
    accessible_projects = Project.objects.filter(memberships__user=self.request.user)
    return Sprint.objects.filter(project__in=accessible_projects)
```

**Invite flow:** Generate a UUID invite token, store on Membership with `accepted=False`. Send an email with a link. When clicked, set `accepted=True` and assign the user.

**Why build this first:** The queryset change touches every viewset. Building AI or GitHub integration before teams means you'd have to retrofit multi-user scoping onto those too.

---

### 11.2 GitHub Integration

**New field on Project:**
```python
github_repo = models.CharField(max_length=300, blank=True)  # e.g. "guillaumeleberre/devspace"
```

**New field on CustomUser:**
```python
github_token = models.CharField(max_length=200, blank=True)  # personal access token, store encrypted
```

**GitHub API calls from Django:**
```python
import requests

def get_repo_files(repo, token):
    headers = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github.v3+json'}
    url = f'https://api.github.com/repos/{repo}/git/trees/HEAD?recursive=1'
    return requests.get(url, headers=headers).json()
```

**What you can surface:**
- File tree on the Stack page
- Open PRs alongside tasks
- Recent commits in the dev log
- Code files as context for the AI agent

**Start simple:** One field (`github_repo`), one endpoint (`GET /api/projects/:id/github-summary/`), display in Stack view. Add OAuth later when the basics work.

---

### 11.3 AI Agent (Claude API)

**Setup:**
```bash
pip install anthropic
```

**Backend endpoint:**
```python
# views.py
import anthropic

class ProjectChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id, owner=request.user)
        user_message = request.data.get('message', '')

        # Build context from project data
        tasks = Task.objects.filter(project=project, status='In progress').values('id', 'title', 'type', 'priority')
        devlog = DevLogEntry.objects.filter(project=project).order_by('-created_at')[:5].values('title', 'body')

        context = f"""
Project: {project.name}
Status: {project.status}
Stack: {', '.join(project.stack)}

Active tasks:
{chr(10).join(f"- [{t['id']}] {t['title']} ({t['priority']})" for t in tasks)}

Recent dev log:
{chr(10).join(f"- {e['title']}: {e['body'][:200]}" for e in devlog)}
"""
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1024,
            system=f"You are a helpful assistant for the project '{project.name}'. Use the project context to give specific, actionable answers.\n\n{context}",
            messages=[{'role': 'user', 'content': user_message}]
        )

        return Response({'reply': message.content[0].text})
```

**Add to settings.py:**
```python
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
```

**Frontend hook:**
```js
export function useProjectChat(projectId) {
  return useMutation({
    mutationFn: ({ message }) =>
      api.post(`/projects/${projectId}/chat/`, { message }).then(res => res.data),
  });
}
```

**Why Claude Sonnet 4.6:**
- Fast enough for interactive chat (2–5s response)
- Handles long context windows well (important for full project context)
- ~$0.01–0.05 per call at typical project context sizes
- You're already in the Claude Code environment — same API, same billing account
