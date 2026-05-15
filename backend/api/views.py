import hashlib
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet, EnvVariable
from .serializers import ProjectSerializer, SprintSerializer, TaskSerializer, DocPageSerializer, DevLogEntrySerializer, SnippetSerializer, EnvVariableSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        # Stamp the owner from the authenticated user — frontend never sends this
        serializer.save(owner=self.request.user)


class SprintViewSet(viewsets.ModelViewSet):
    serializer_class = SprintSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        # project__owner scoping ensures a user can never reach another user's sprints
        qs = Sprint.objects.filter(project__owner=self.request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by('num')


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        params = self.request.query_params
        project_id = params.get('project')
        sprint_param = params.get('sprint')  # may be a sprint ID string, or the literal "null"

        qs = Task.objects.filter(project__owner=self.request.user)

        if project_id:
            qs = qs.filter(project_id=project_id)

        if sprint_param == 'null':
            qs = qs.filter(sprint__isnull=True)
        elif sprint_param:
            qs = qs.filter(sprint_id=sprint_param)

        return qs.order_by('created_at')

    def perform_update(self, serializer):
        # Read the incoming status from validated data.
        # .get() with a fallback means: if status wasn't sent in the PATCH body,
        # keep the existing value on the instance rather than treating it as None.
        new_status = serializer.validated_data.get('status', serializer.instance.status)
        # The short version: serializer.instance is what's in the DB, serializer.validated_data is what was sent. 
        # Compare them to detect a transition, inject extra fields into serializer.save() to override what the frontend sent.
        if new_status == 'Done' and serializer.instance.status != 'Done':
            # Task is transitioning into Done — stamp the closed time
            serializer.save(closed_at=timezone.now())
        elif new_status != 'Done' and serializer.instance.status == 'Done':
            # Task is moving away from Done — clear the closed time
            serializer.save(closed_at=None)
        else:
            serializer.save()


class DocPageViewSet(viewsets.ModelViewSet):
    serializer_class = DocPageSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        qs = DocPage.objects.filter(project__owner=self.request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class DevLogEntryViewSet(viewsets.ModelViewSet):
    serializer_class = DevLogEntrySerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        qs = DevLogEntry.objects.filter(project__owner=self.request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class SnippetViewSet(viewsets.ModelViewSet):
    serializer_class = SnippetSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        # Global snippets (no project) are owned by the user who created them.
        # Filter: project is null OR project belongs to this user.
        qs = Snippet.objects.filter(
            models.Q(project__isnull=True) | models.Q(project__owner=self.request.user)
        )
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class EnvVariableViewSet(viewsets.ModelViewSet):
    serializer_class = EnvVariableSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        qs = EnvVariable.objects.filter(project__owner=self.request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class VaultUnlockView(APIView):
    """Verify the vault password for a project. Returns success + timeout minutes."""
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        password = request.data.get('password', '')
        if not project.vault_password_hash:
            # No password set yet — treat vault as open
            return Response({'success': True, 'timeout': project.vault_timeout})

        # Compare SHA-256 hash — good enough for a local-use personal tool
        incoming_hash = hashlib.sha256(password.encode()).hexdigest()
        if incoming_hash == project.vault_password_hash:
            return Response({'success': True, 'timeout': project.vault_timeout})
        return Response({'success': False, 'detail': 'Wrong password.'}, status=status.HTTP_403_FORBIDDEN)


class VaultSetPasswordView(APIView):
    """Set or change the vault password for a project."""
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        password = request.data.get('password', '')
        if not password:
            return Response({'detail': 'Password required.'}, status=status.HTTP_400_BAD_REQUEST)

        project.vault_password_hash = hashlib.sha256(password.encode()).hexdigest()
        project.save(update_fields=['vault_password_hash'])
        return Response({'success': True})


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'tasks': [], 'docs': [], 'snippets': [], 'devlog': [], 'projects': []})

        user = request.user
        # Cap each category at 8 results — enough to be useful, not overwhelming
        LIMIT = 8

        tasks = Task.objects.filter(
            project__owner=user
        ).filter(
            models.Q(title__icontains=q) | models.Q(description__icontains=q) | models.Q(id__icontains=q)
        ).values('id', 'title', 'status', 'type', 'priority', 'project_id')[:LIMIT]

        docs = DocPage.objects.filter(
            project__owner=user
        ).filter(
            models.Q(title__icontains=q) | models.Q(content__icontains=q)
        ).values('id', 'title', 'project_id')[:LIMIT]

        snippets = Snippet.objects.filter(
            models.Q(project__isnull=True) | models.Q(project__owner=user)
        ).filter(
            models.Q(title__icontains=q) | models.Q(description__icontains=q) | models.Q(code__icontains=q)
        ).values('id', 'title', 'language', 'project_id')[:LIMIT]

        devlog = DevLogEntry.objects.filter(
            project__owner=user
        ).filter(
            models.Q(title__icontains=q) | models.Q(body__icontains=q)
        ).values('id', 'title', 'project_id', 'created_at')[:LIMIT]

        projects = Project.objects.filter(
            owner=user
        ).filter(
            models.Q(name__icontains=q) | models.Q(tagline__icontains=q)
        ).values('id', 'name', 'status', 'color')[:LIMIT]

        return Response({
            'tasks': list(tasks),
            'docs': list(docs),
            'snippets': list(snippets),
            'devlog': list(devlog),
            'projects': list(projects),
        })


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from datetime import date, timedelta
        user = request.user
        today = date.today()

        # Active sprints across all projects — include project context for display
        active_sprints = []
        for sprint in Sprint.objects.filter(project__owner=user, status='active').select_related('project'):
            sprint_tasks = Task.objects.filter(sprint=sprint)
            total = sprint_tasks.count()
            done = sprint_tasks.filter(status='Done').count()
            completion = round((done / total * 100)) if total > 0 else 0

            days_remaining = None
            if sprint.end_date:
                days_remaining = (sprint.end_date - today).days

            active_sprints.append({
                'id': sprint.id,
                'num': sprint.num,
                'name': sprint.name,
                'project_id': sprint.project_id,
                'project_name': sprint.project.name,
                'project_color': sprint.project.color,
                'days_remaining': days_remaining,
                'completion': completion,
                'open_tasks': total - done,
                'total_tasks': total,
            })

        # Open bugs across all projects (not Done), most severe first
        SEVERITY_RANK = {'Critical': 0, 'Major': 1, 'Minor': 2}
        open_bugs = []
        for bug in Task.objects.filter(
            project__owner=user, type='Bug'
        ).exclude(status='Done').select_related('project').order_by('created_at')[:8]:
            open_bugs.append({
                'id': bug.id,
                'title': bug.title,
                'severity': bug.severity,
                'status': bug.status,
                'project_id': bug.project_id,
                'project_color': bug.project.color,
            })
        open_bugs.sort(key=lambda b: SEVERITY_RANK.get(b['severity'] or '', 99))

        # Recent dev log entries across all projects
        recent_devlog = []
        for entry in DevLogEntry.objects.filter(
            project__owner=user
        ).select_related('project').order_by('-created_at')[:5]:
            recent_devlog.append({
                'id': entry.id,
                'title': entry.title,
                'body': entry.body,
                'created_at': entry.created_at,
                'project_id': entry.project_id,
                'project_name': entry.project.name,
                'project_color': entry.project.color,
            })

        # Aggregate stats across all tasks
        all_tasks = Task.objects.filter(project__owner=user)
        week_ago = timezone.now() - timedelta(days=7)
        stats = {
            'total_tasks': all_tasks.count(),
            'in_progress': all_tasks.filter(status='In progress').count(),
            'done_this_week': all_tasks.filter(status='Done', closed_at__gte=week_ago).count(),
            'open_bugs': all_tasks.filter(type='Bug').exclude(status='Done').count(),
        }

        return Response({
            'active_sprints': active_sprints,
            'open_bugs': open_bugs,
            'recent_devlog': recent_devlog,
            'stats': stats,
        })
