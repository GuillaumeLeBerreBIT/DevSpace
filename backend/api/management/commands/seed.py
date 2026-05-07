from datetime import date, datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import DevLogEntry, DocPage, Project, Snippet, Sprint, Task


class Command(BaseCommand):
    help = 'Seed the database with sample data and assign it to the berre user'

    def handle(self, *args, **options):
        User = get_user_model()

        try:
            user = User.objects.get(username='berre')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                'User "berre" not found. Run: python manage.py createsuperuser first.'
            ))
            return

        # Wipe this user's existing data so the command is safe to re-run
        Project.objects.filter(owner=user).delete()
        Snippet.objects.filter(project__isnull=True).delete()
        self.stdout.write('Cleared existing data.')

        # ------------------------------------------------------------------ #
        # Projects                                                             #
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating projects...')

        devspace = Project.objects.create(
            owner=user, name='DevSpace', key='DS', color='#7F77DD',
            tagline='The app you are looking at', status='Active',
            stack=['React', 'Django', 'SQLite'],
        )
        kettle = Project.objects.create(
            owner=user, name='kettle-cli', key='KT', color='#46a758',
            tagline='Local-first task runner', status='Active',
            stack=['Rust', 'Tokio', 'Clap'],
        )
        Project.objects.create(
            owner=user, name='Fieldnotes', key='FN', color='#ffb224',
            tagline='Personal writing app', status='Stalled',
            stack=['Swift', 'SwiftUI', 'CloudKit'],
        )
        Project.objects.create(
            owner=user, name='Inkwell', key='IN', color='#4d9aff',
            tagline='Markdown blog engine', status='Shipped',
            stack=['Astro', 'MDX'],
        )
        self.stdout.write(f'  Created 4 projects')

        # ------------------------------------------------------------------ #
        # Sprints (DevSpace only — other projects have none in the sample data)#
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating sprints...')

        sprints_data = [
            dict(num=10, name='Bug tracker', date_range='Mar 25 – Apr 7',
                 start_date=date(2026, 3, 25), end_date=date(2026, 4, 7),
                 goal='Build dedicated bug tracker view with severity grouping.',
                 status='completed', capacity=24, velocity=22, completion=100, carryover=0),
            dict(num=11, name='Sprint planning rework', date_range='Apr 8 – Apr 21',
                 start_date=date(2026, 4, 8), end_date=date(2026, 4, 21),
                 goal='Replace the old sprint flow with the new metric cards and burndown.',
                 status='completed', capacity=28, velocity=26, completion=100, carryover=2),
            dict(num=12, name='Polish & Ship', date_range='Apr 22 – May 5',
                 start_date=date(2026, 4, 22), end_date=date(2026, 5, 5),
                 goal='Ship the v0.4 release: stabilize the Kanban DnD, finish the sprint retrospective UI, and clean up empty states across the app.',
                 status='active', capacity=32, velocity=18, completion=56, carryover=3),
            dict(num=13, name='Mobile parity', date_range='May 6 – May 19',
                 start_date=date(2026, 5, 6), end_date=date(2026, 5, 19),
                 goal='', status='planned', capacity=30, velocity=0, completion=0, carryover=0),
        ]
        for data in sprints_data:
            Sprint.objects.create(project=devspace, **data)
        self.stdout.write(f'  Created {len(sprints_data)} sprints')

        s12 = Sprint.objects.get(pk='s-12')

        # ------------------------------------------------------------------ #
        # Tasks (DevSpace only)                                                #
        # Note: IDs are auto-generated as DS-001, DS-002... not the original  #
        # DS-042 etc. from data.js — that's expected.                         #
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating tasks...')

        def make_dt(month, day, hour=12, minute=0):
            return timezone.make_aware(datetime(2026, month, day, hour, minute))

        tasks_data = [
            # --- Sprint 12 active tasks ---
            dict(title='Drag-and-drop on Kanban board', type='Feature', status='In progress',
                 priority='High', points=5, sprint=s12, labels=['frontend', 'kanban'],
                 branch='feat/kanban-dnd', due_date=date(2026, 5, 2),
                 acceptance=[
                     {'text': 'Cards drag smoothly with no flicker', 'done': True},
                     {'text': 'Drop zones highlight on hover', 'done': True},
                     {'text': 'Order persists to server', 'done': False},
                     {'text': 'Works on touch devices', 'done': False},
                 ],
                 description='Replace the placeholder click-to-move with a real DnD implementation. Use react-dnd for now — can revisit dnd-kit if perf becomes an issue.\n\nThe column should accept drops and reorder optimistically. Roll back on server error.'),
            dict(title='DnD touch support broken on iPad', type='Bug', status='Blocked',
                 priority='High', points=2, sprint=s12, labels=['frontend', 'mobile'],
                 severity='Major',
                 steps='1. Open board on iPad Safari\n2. Long-press a card\n3. Drag to new column\n\nExpected: card moves\nActual: page scrolls instead',
                 description='react-dnd HTML5 backend doesnt fire on touch. Need to swap in TouchBackend or move to dnd-kit.'),
            dict(title='Sprint retrospective section', type='Feature', status='In progress',
                 priority='Medium', points=3, sprint=s12, labels=['frontend', 'sprints'],
                 branch='feat/retro',
                 acceptance=[
                     {'text': 'Three text fields: went well, didnt, adjustments', 'done': True},
                     {'text': 'Auto-saves on blur', 'done': False},
                     {'text': 'Collapsible by default after sprint ends', 'done': False},
                 ],
                 description='Add a retro section below the sprint board. Should feel calm — three stacked textareas, no submit button, just save on blur.'),
            dict(title='Empty state for new projects', type='Feature', status='To do',
                 priority='Medium', points=2, sprint=s12, labels=['frontend', 'onboarding'],
                 acceptance=[
                     {'text': 'Friendly illustration or pattern', 'done': False},
                     {'text': 'CTA to create first task', 'done': False},
                 ],
                 description='When you open a brand-new project, the board is empty and lifeless. Add a calm empty state with a single CTA.'),
            dict(title='Markdown editor: keyboard shortcuts', type='Chore', status='To do',
                 priority='Low', points=1, sprint=s12, labels=['editor'],
                 description='Bind Cmd+B, Cmd+I, Cmd+K (link). Use the existing toolbar handlers.'),
            dict(title='Autosave indicator flickers', type='Bug', status='To do',
                 priority='Low', points=1, sprint=s12, labels=['editor'],
                 severity='Minor',
                 steps='Type fast in the docs editor — the "Saved" indicator briefly flashes "Saving..." between every keystroke.',
                 description='Debounce the indicator state, not just the save call.'),
            dict(title='Refactor sprint store into Zustand slice', type='Chore', status='In review',
                 priority='Medium', points=3, sprint=s12, labels=['refactor', 'state'],
                 branch='chore/sprint-slice',
                 description='The sprint state is scattered across three contexts. Consolidate into a single Zustand slice.'),
            # --- Sprint 12 done tasks (closed_at set) ---
            dict(title='Metric cards on sprint overview', type='Feature', status='Done',
                 priority='High', points=3, sprint=s12, labels=['frontend', 'sprints'],
                 branch='feat/sprint-metrics',
                 acceptance=[
                     {'text': 'Capacity / Velocity / Completion / Carryover', 'done': True},
                     {'text': 'Progress ring for completion', 'done': True},
                 ],
                 description='Four metric cards at the top of the sprint overview screen.',
                 closed_at=make_dt(4, 26, 16, 24)),
            dict(title='Carryover badge on rolled-over tasks', type='Feature', status='Done',
                 priority='Medium', points=1, sprint=s12, labels=['frontend', 'sprints'],
                 description='Small "↻" badge on cards that rolled over from the previous sprint.',
                 closed_at=make_dt(4, 26, 11, 8)),
            dict(title='Fix dark mode flicker on first paint', type='Fix', status='Done',
                 priority='Medium', points=1, sprint=s12, labels=['frontend', 'theme'],
                 branch='fix/theme-flicker',
                 description='Inline a tiny script in <head> that sets the theme class before React boots.',
                 closed_at=make_dt(4, 25, 9, 41)),
            # --- Backlog (no sprint) ---
            dict(title='Rich link previews in dev log', type='Feature', status='Backlog',
                 priority='Medium', points=5, sprint=None, labels=['editor', 'devlog'],
                 description='Paste a URL → fetch OG metadata → render a card.'),
            dict(title='Idea: AI summary of last sprint', type='Idea', status='Backlog',
                 priority='Low', points=3, sprint=None, labels=['ai', 'sprints'],
                 description='At the end of a sprint, Claude could summarize what shipped, link the dev log entries, and surface unfinished items.'),
            dict(title='Bug: timezone on due dates', type='Bug', status='Backlog',
                 priority='Medium', points=2, sprint=None, labels=['dates'],
                 severity='Minor',
                 steps='Set a due date in PST. Switch system to UTC. Date is off by one day.',
                 description='Store dates as ISO with TZ, render in user TZ. Currently storing as YYYY-MM-DD.'),
            dict(title='Document the keyboard shortcuts', type='Docs', status='Backlog',
                 priority='Low', points=1, sprint=None, labels=['docs'],
                 description='Compile the existing shortcuts and put them in a Help page.'),
            dict(title='Chore: upgrade to React 19', type='Chore', status='Backlog',
                 priority='Low', points=2, sprint=None, labels=['deps'],
                 description='Test compat, especially with react-dnd.'),
            dict(title='Crash on empty sprint goal', type='Bug', status='Backlog',
                 priority='Urgent', points=1, sprint=None, labels=['sprints'],
                 severity='Critical',
                 steps='Create a sprint with no goal. Click into overview. Crash.',
                 description='Null-check the goal field in SprintHeader.'),
            dict(title='Idea: weekly streak indicator', type='Idea', status='Backlog',
                 priority='Low', points=2, sprint=None, labels=['gamification'],
                 description='Show a streak counter on the dashboard for consecutive days with at least one closed task.'),
        ]

        for data in tasks_data:
            # closed_at is read-only on the serializer but we can set it directly on the model
            closed_at = data.pop('closed_at', None)
            task = Task.objects.create(project=devspace, **data)
            if closed_at:
                Task.objects.filter(pk=task.pk).update(closed_at=closed_at)

        self.stdout.write(f'  Created {len(tasks_data)} tasks')

        # ------------------------------------------------------------------ #
        # Doc pages (DevSpace only — no content yet, just structure)          #
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating doc pages...')

        doc_pages_data = [
            dict(title='Overview', order=0),
            dict(title='Architecture', order=1),
            dict(title='Stack & env', order=2),
            dict(title='API reference', order=3),
            dict(title='Decision log', order=4),
            dict(title='Keyboard shortcuts', order=5),
        ]
        for data in doc_pages_data:
            DocPage.objects.create(project=devspace, **data)
        self.stdout.write(f'  Created {len(doc_pages_data)} doc pages')

        # ------------------------------------------------------------------ #
        # Dev log (DevSpace only)                                             #
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating dev log entries...')

        devlog_data = [
            dict(title='DnD: settled on react-dnd, will revisit',
                 body='Tried dnd-kit first — beautiful API, but the drop animation lagged on lists >50. react-dnd is older but the HTML5 backend is rock solid. Touch is a known gap; addressing in DS-051.\n\nNote to self: do NOT abstract this behind a wrapper yet. Premature.'),
            dict(title='Sprint metric ring math',
                 body='Spent an embarrassing amount of time getting the SVG progress ring to look right. Stroke-dasharray is the trick. Tomorrow: animate it.'),
            dict(title='Decision: keep markdown, skip rich-text',
                 body='Considered switching the editor to TipTap. Decided against — the whole point is that this is a developer tool, and markdown is the format devs already think in. Stay simple.'),
            dict(title='Fieldnotes is officially stalled',
                 body='Marked as Stalled. The Swift learning curve + CloudKit auth issues killed momentum. Coming back to it after DevSpace v0.4 ships.'),
            dict(title='Sprint 12 kicked off',
                 body='Goal: ship v0.4. Pulled in 32 points across 9 tasks. Carryover: 3 from last sprint (DnD, retro, autosave fix).'),
        ]
        for data in devlog_data:
            DevLogEntry.objects.create(project=devspace, **data)
        self.stdout.write(f'  Created {len(devlog_data)} dev log entries')

        # ------------------------------------------------------------------ #
        # Snippets (global — no project)                                      #
        # ------------------------------------------------------------------ #
        self.stdout.write('Creating snippets...')

        snippets_data = [
            dict(title='Django: soft-delete model mixin',
                 description='Drop-in abstract base for soft deletion + manager.',
                 language='Python', tags=['django', 'orm', 'mixin'],
                 code='class SoftDeleteQuerySet(models.QuerySet):\n    def alive(self):\n        return self.filter(deleted_at__isnull=True)\n\nclass SoftDeleteModel(models.Model):\n    deleted_at = models.DateTimeField(null=True, blank=True)\n    objects = SoftDeleteQuerySet.as_manager()\n\n    class Meta:\n        abstract = True\n\n    def delete(self, using=None, keep_parents=False):\n        self.deleted_at = timezone.now()\n        self.save(update_fields=[\'deleted_at\'])'),
            dict(title='useDebouncedValue hook',
                 description='Returns a value that updates only after `delay` ms of quiet.',
                 language='TS', tags=['react', 'hook', 'perf'],
                 code="import { useEffect, useState } from 'react';\n\nexport function useDebouncedValue<T>(value: T, delay = 200): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(t);\n  }, [value, delay]);\n  return debounced;\n}"),
            dict(title='Postgres: latest row per group',
                 description='Window-function pattern for "newest item per user".',
                 language='SQL', tags=['postgres', 'window'],
                 code='SELECT *\nFROM (\n  SELECT\n    e.*,\n    ROW_NUMBER() OVER (\n      PARTITION BY e.user_id\n      ORDER BY e.created_at DESC\n    ) AS rn\n  FROM events e\n) ranked\nWHERE rn = 1;'),
            dict(title='Deploy: tag, push, restart',
                 description='Tag the current commit and trigger a Fly restart.',
                 language='Bash', tags=['deploy', 'fly'],
                 code='#!/usr/bin/env bash\nset -euo pipefail\n\nTAG="v$(date +%Y.%m.%d)-$(git rev-parse --short HEAD)"\ngit tag -a "$TAG" -m "release $TAG"\ngit push origin "$TAG"\n\nflyctl deploy --strategy rolling --app devspace\nflyctl status --app devspace'),
            dict(title='React: portal-based toast',
                 description='Imperative toast() call, no provider needed.',
                 language='JS', tags=['react', 'ui'],
                 code="let host;\nexport function toast(message, ms = 2000) {\n  if (!host) {\n    host = document.createElement('div');\n    host.className = 'toast-host';\n    document.body.appendChild(host);\n  }\n  const el = document.createElement('div');\n  el.className = 'toast';\n  el.textContent = message;\n  host.appendChild(el);\n  setTimeout(() => el.remove(), ms);\n}"),
            dict(title='DRF: custom permission class',
                 description='Allow safe methods to anyone, writes only to the owner.',
                 language='Python', tags=['django', 'drf', 'auth'],
                 code='from rest_framework import permissions\n\nclass IsOwnerOrReadOnly(permissions.BasePermission):\n    def has_object_permission(self, request, view, obj):\n        if request.method in permissions.SAFE_METHODS:\n            return True\n        return obj.owner_id == request.user.id'),
        ]
        for data in snippets_data:
            Snippet.objects.create(project=None, **data)
        self.stdout.write(f'  Created {len(snippets_data)} snippets')

        self.stdout.write(self.style.SUCCESS(
            '\nDone. Database seeded and assigned to user "berre".'
        ))
