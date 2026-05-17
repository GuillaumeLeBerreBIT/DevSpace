"""
LangChain tools the DevSpace agent can call.

Two categories:

  READ tools — execute immediately, return data to the agent.
  WRITE tools — record the intended mutation in `pending_mutations`
                so the user can confirm before anything changes.

All tools are built lazily per request via `build_tools(project, user)` because
they close over project/user context — Groq sees them as normal functions, but
each invocation is scoped to the right project's data and the user's own
GitHub token.
"""
from typing import Any
from langchain_core.tools import tool

from ..models import GithubAccount, Project, Sprint, Task, DevLogEntry, Snippet, DocPage
from ..crypto import decrypt
from ..github_client import GithubClient, GithubError


def build_tools(project: Project, pending_sink: list[dict]) -> list:
    """Return the list of tools bound to this project. Write tools push to
    `pending_sink` instead of executing — the caller decides when (or whether)
    to apply them."""

    # ── GitHub helpers ──────────────────────────────────────────────────
    def _github_client() -> GithubClient | None:
        acct = GithubAccount.objects.filter(owner=project.owner).first()
        if not acct or not project.github_repo:
            return None
        return GithubClient(decrypt(acct.encrypted_token))

    # ── READ tools — execute immediately ────────────────────────────────

    @tool
    def list_repo_files(path: str = '') -> str:
        """List files and folders in the project's linked GitHub repo at the given path.
        Path is empty for the root, or a folder path like 'backend/api'.
        Returns one entry per line: '[type] name'."""
        client = _github_client()
        if not client:
            return 'No GitHub repo linked to this project.'
        try:
            entries = client.list_files(project.github_repo, path)
        except GithubError as e:
            return f'GitHub error: {e}'
        return '\n'.join(f"[{e['type']}] {e['name']}" for e in entries) or '(empty)'

    @tool
    def read_repo_file(path: str) -> str:
        """Read a single file from the project's linked GitHub repo.
        Provide the full path from the repo root (e.g. 'backend/api/views.py').
        Returns the file contents (truncated at 8000 chars)."""
        client = _github_client()
        if not client:
            return 'No GitHub repo linked to this project.'
        try:
            content = client.read_file(project.github_repo, path)
        except GithubError as e:
            return f'GitHub error: {e}'
        return content[:8000] + ('\n... [truncated]' if len(content) > 8000 else '')

    @tool
    def search_repo_code(query: str) -> str:
        """Search code inside the linked GitHub repo. Returns up to 10 matches as 'path: snippet'."""
        client = _github_client()
        if not client:
            return 'No GitHub repo linked to this project.'
        try:
            results = client.search_code(project.github_repo, query, per_page=10)
        except GithubError as e:
            return f'GitHub error: {e}'
        if not results:
            return f'No matches for: {query}'
        return '\n'.join(f"{r['path']}" for r in results)

    @tool
    def list_sprints() -> str:
        """List all sprints in this project with status and goal."""
        sprints = Sprint.objects.filter(project=project).order_by('num')
        if not sprints:
            return 'No sprints yet.'
        return '\n'.join(
            f"#{s.num} {s.name} [{s.status}] — {s.goal or '(no goal)'}"
            for s in sprints
        )

    @tool
    def list_tasks(sprint_id: str = '', status: str = '') -> str:
        """List tasks in the project. Optional: filter by sprint_id (e.g. 's-1') or status."""
        qs = Task.objects.filter(project=project)
        if sprint_id:
            qs = qs.filter(sprint_id=sprint_id)
        if status:
            qs = qs.filter(status=status)
        tasks = qs.order_by('-created_at')[:50]
        if not tasks:
            return 'No tasks match.'
        return '\n'.join(f"{t.id} [{t.status}] {t.type} — {t.title}" for t in tasks)

    @tool
    def list_devlog(limit: int = 10) -> str:
        """Show the most recent dev log entries for this project."""
        entries = DevLogEntry.objects.filter(project=project).order_by('-created_at')[:limit]
        if not entries:
            return 'No dev log entries.'
        return '\n\n'.join(f"{e.created_at:%Y-%m-%d} — {e.title}\n{e.body[:300]}" for e in entries)

    # ── WRITE tools — queue for confirmation ────────────────────────────

    def _queue(tool_name: str, args: dict, preview: str) -> str:
        pending_sink.append({'tool': tool_name, 'args': args, 'preview': preview})
        return f'QUEUED: {preview}'

    @tool
    def create_task(title: str, type: str = 'Feature', priority: str = 'Medium',
                    points: int = 1, sprint_id: str = '', description: str = '') -> str:
        """Queue creation of a new task. Type must be one of:
        Feature, Bug, Fix, Chore, Idea, Docs. Priority: Urgent/High/Medium/Low.
        Points are Fibonacci (1, 2, 3, 5, 8). Returns 'QUEUED: ...' on success."""
        return _queue('create_task', {
            'title': title, 'type': type, 'priority': priority,
            'points': points, 'sprint_id': sprint_id or None, 'description': description,
        }, f"Create {type} task: '{title}'")

    @tool
    def update_task(task_id: str, status: str = '', priority: str = '', title: str = '') -> str:
        """Queue update of an existing task. Pass any fields to change.
        Status must be one of: Backlog, To do, In progress, Blocked, In review, Done."""
        updates = {k: v for k, v in {'status': status, 'priority': priority, 'title': title}.items() if v}
        if not updates:
            return 'No fields provided to update.'
        return _queue('update_task', {'task_id': task_id, **updates},
                      f"Update {task_id}: {', '.join(f'{k}={v}' for k, v in updates.items())}")

    @tool
    def create_sprint(name: str, goal: str, num: int, start_date: str, end_date: str,
                      capacity: int = 20) -> str:
        """Queue creation of a new sprint. Dates must be YYYY-MM-DD.
        `num` is the sprint number (e.g. next number in sequence)."""
        return _queue('create_sprint', {
            'name': name, 'goal': goal, 'num': num,
            'start_date': start_date, 'end_date': end_date, 'capacity': capacity,
        }, f"Create sprint #{num} '{name}' ({start_date} → {end_date})")

    @tool
    def create_devlog_entry(title: str, body: str) -> str:
        """Queue creation of a new dev log entry."""
        return _queue('create_devlog_entry', {'title': title, 'body': body},
                      f"Add dev log entry: '{title}'")

    @tool
    def create_snippet(title: str, code: str, language: str = 'Other',
                       description: str = '') -> str:
        """Queue creation of a new code snippet. Language: JS, Python, TS, Bash, SQL, Other."""
        return _queue('create_snippet', {
            'title': title, 'code': code, 'language': language,
            'description': description, 'project_id': project.id,
        }, f"Add {language} snippet: '{title}'")

    @tool
    def create_doc_page(title: str, content: str) -> str:
        """Queue creation of a new documentation page in markdown."""
        return _queue('create_doc_page', {'title': title, 'content': content},
                      f"Add doc page: '{title}'")

    return [
        # Reads
        list_repo_files, read_repo_file, search_repo_code,
        list_sprints, list_tasks, list_devlog,
        # Writes (queued)
        create_task, update_task, create_sprint,
        create_devlog_entry, create_snippet, create_doc_page,
    ]


# ── Mutation appliers — called when the user confirms ─────────────────────────

def apply_mutation(project: Project, mutation: dict) -> dict[str, Any]:
    """Execute one queued mutation. Returns {ok: bool, ...}."""
    tool_name = mutation['tool']
    args = mutation['args']

    try:
        if tool_name == 'create_task':
            t = Task.objects.create(
                project=project,
                title=args['title'],
                type=args.get('type', 'Feature'),
                priority=args.get('priority', 'Medium'),
                points=int(args.get('points', 1)),
                sprint_id=args.get('sprint_id') or None,
                description=args.get('description', ''),
                status='To do',
            )
            return {'ok': True, 'id': t.id, 'kind': 'task'}

        if tool_name == 'update_task':
            t = Task.objects.get(pk=args['task_id'], project=project)
            for f in ('status', 'priority', 'title'):
                if f in args and args[f]:
                    setattr(t, f, args[f])
            t.save()
            return {'ok': True, 'id': t.id, 'kind': 'task'}

        if tool_name == 'create_sprint':
            s = Sprint.objects.create(
                project=project,
                num=int(args['num']),
                name=args['name'],
                goal=args.get('goal', ''),
                start_date=args['start_date'],
                end_date=args['end_date'],
                date_range=f"{args['start_date']} → {args['end_date']}",
                capacity=int(args.get('capacity', 20)),
                status='planned',
            )
            return {'ok': True, 'id': s.id, 'kind': 'sprint'}

        if tool_name == 'create_devlog_entry':
            e = DevLogEntry.objects.create(project=project, title=args['title'], body=args['body'])
            return {'ok': True, 'id': e.id, 'kind': 'devlog'}

        if tool_name == 'create_snippet':
            s = Snippet.objects.create(
                project=project,
                title=args['title'],
                code=args['code'],
                language=args.get('language', 'Other'),
                description=args.get('description', ''),
            )
            return {'ok': True, 'id': s.id, 'kind': 'snippet'}

        if tool_name == 'create_doc_page':
            d = DocPage.objects.create(project=project, title=args['title'], content=args['content'], order=0)
            return {'ok': True, 'id': d.id, 'kind': 'doc'}

        return {'ok': False, 'error': f'Unknown tool: {tool_name}'}

    except Exception as e:
        return {'ok': False, 'error': str(e)}
