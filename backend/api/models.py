from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Project(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Stalled', 'Stalled'),
        ('Shipped', 'Shipped'),
        ('Archived', 'Archived'),
    ]

    # slug ID (e.g. "devspace") — we use this as the PK instead of an auto int
    # so URLs look like /api/projects/devspace/ rather than /api/projects/1/
    id = models.SlugField(primary_key=True, max_length=100)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
    )
    name = models.CharField(max_length=200)
    key = models.CharField(max_length=10, unique=True)   # e.g. "DS" — prefix for task IDs
    color = models.CharField(max_length=7)               # hex color e.g. "#6366f1"
    tagline = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    stack = models.JSONField(default=list)               # e.g. ["React", "Django", "Postgres"]
    vault_password_hash = models.CharField(max_length=255, blank=True)
    vault_timeout = models.IntegerField(default=15)      # minutes before vault re-locks
    # GitHub repo this project is linked to, e.g. "owner/repo". Empty = not linked.
    # The user-level GithubAccount holds the actual token.
    github_repo = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            base = slugify(self.name)
            slug, counter = base, 1
            # Keep incrementing until we find a slug not already taken
            while Project.objects.filter(pk=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.pk = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class EnvVariable(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='env_vars')
    key = models.CharField(max_length=200)
    value = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return f"{self.project.key} / {self.key}"


class Sprint(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    # slug ID e.g. "s-12"
    id = models.SlugField(primary_key=True, max_length=100)
    num = models.IntegerField()
    name = models.CharField(max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    date_range = models.CharField(max_length=100, blank=True)  # display string e.g. "Apr 1 – Apr 14"
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    goal = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    capacity = models.IntegerField(default=0)
    velocity = models.IntegerField(default=0)
    completion = models.IntegerField(default=0)          # percentage 0–100
    carryover = models.IntegerField(default=0)           # count of tasks carried over

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate the slug ID on first save using the sprint number.
        # num must be set before save() is called (it comes from the POST body).
        if not self.pk:
            self.pk = f"s-{self.num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.key} Sprint {self.num} — {self.name}"


class Task(models.Model):
    TYPE_CHOICES = [
        ('Feature', 'Feature'),
        ('Bug', 'Bug'),
        ('Fix', 'Fix'),
        ('Chore', 'Chore'),
        ('Idea', 'Idea'),
        ('Docs', 'Docs'),
    ]
    STATUS_CHOICES = [
        ('Backlog', 'Backlog'),
        ('To do', 'To do'),
        ('In progress', 'In progress'),
        ('Blocked', 'Blocked'),
        ('In review', 'In review'),
        ('Done', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('Urgent', 'Urgent'),
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]

    # String PK e.g. "DS-001" — generated server-side in save(), never from the frontend
    id = models.CharField(primary_key=True, max_length=20)
    title = models.CharField(max_length=500)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Backlog')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    points = models.IntegerField(default=1)              # Fibonacci story points
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    # null sprint = task lives in the backlog
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    labels = models.JSONField(default=list)
    description = models.TextField(blank=True)
    branch = models.CharField(max_length=200, blank=True)
    pr_url = models.URLField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Set server-side when status → Done; cleared when status moves away from Done.
    # Never trust the frontend to send this — it drives velocity/burndown calculations.
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Feature-only fields
    acceptance = models.JSONField(default=list, blank=True)  # acceptance criteria list
    # Bug-only fields
    severity = models.CharField(max_length=50, blank=True)
    steps = models.TextField(blank=True)                     # steps to reproduce

    def save(self, *args, **kwargs):
        # Auto-generate the string ID on first save only.
        # Use max(existing num)+1 then loop in case of races/deletions —
        # count()+1 is unreliable because any prior deletion creates collisions.
        if not self.pk:
            existing = Task.objects.filter(
                project=self.project, id__startswith=f"{self.project.key}-"
            ).values_list('id', flat=True)
            highest = 0
            for tid in existing:
                try:
                    highest = max(highest, int(tid.rsplit('-', 1)[-1]))
                except (ValueError, IndexError):
                    continue
            n = highest + 1
            while Task.objects.filter(pk=f"{self.project.key}-{str(n).zfill(3)}").exists():
                n += 1
            self.pk = f"{self.project.key}-{str(n).zfill(3)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.pk} — {self.title}"


class DocPage(models.Model):
    # slug ID e.g. "getting-started"
    id = models.SlugField(primary_key=True, max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='docs')
    title = models.CharField(max_length=300)
    content = models.TextField(blank=True)               # markdown
    order = models.IntegerField(default=0)               # display order within a project
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']                             # default sort by order field

    def save(self, *args, **kwargs):
        if not self.pk:
            base = slugify(self.title)
            slug, counter = base, 1
            # Slugs must be unique within the same project, not globally
            while DocPage.objects.filter(project=self.project, pk=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.pk = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.key} / {self.title}"


class DevLogEntry(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='devlog')
    title = models.CharField(max_length=300)
    body = models.TextField(blank=True)                  # markdown
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']                       # newest first

    def __str__(self):
        return f"{self.project.key} — {self.title}"


class Snippet(models.Model):
    LANGUAGE_CHOICES = [
        ('JS', 'JavaScript'),
        ('Python', 'Python'),
        ('TS', 'TypeScript'),
        ('Bash', 'Bash'),
        ('SQL', 'SQL'),
        ('Other', 'Other'),
    ]

    # Nullable FK — a snippet can belong to a project or be global
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='snippets')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    code = models.TextField()
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Conversation(models.Model):
    """A chat session within a project. A project can have many conversations,
    like ChatGPT chats — create, rename, delete independently."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=200, default='New chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.project.key} — {self.title}"


class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('tool', 'Tool'),   # reserved for Phase 3 when the agent uses tools
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    # Tools the agent already called (read tools that ran live)
    tool_calls = models.JSONField(default=list, blank=True)
    # Write tools the agent wants to call but is waiting for user confirmation.
    # Shape: [{"tool": "create_task", "args": {...}, "preview": "..."}, ...]
    # Cleared (set to []) once the user applies or discards.
    pending_mutations = models.JSONField(default=list, blank=True)
    applied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"


class GithubAccount(models.Model):
    """One per user. Holds the user's encrypted GitHub PAT.

    The token is encrypted at rest with Fernet (see api/crypto.py).
    `github_username` is cached after the first successful API call so we can
    display it in the UI without re-hitting the GitHub API.
    """
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='github_account',
    )
    encrypted_token = models.TextField()
    github_username = models.CharField(max_length=200, blank=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_validated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"GitHub: {self.github_username or self.owner.username}"
