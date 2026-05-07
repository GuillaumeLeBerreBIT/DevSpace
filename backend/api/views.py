from django.db import models
from django.utils import timezone
from rest_framework import viewsets
from .models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet
from .serializers import ProjectSerializer, SprintSerializer, TaskSerializer, DocPageSerializer, DevLogEntrySerializer, SnippetSerializer


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
