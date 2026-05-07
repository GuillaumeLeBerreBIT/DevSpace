from rest_framework import serializers
from .models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        # '__all__' exposes every field on the model.
        # We'll override specific fields below where needed.
        fields = '__all__'
        # created_at and updated_at are set by the DB — the frontend should
        # never be able to send these values, so we mark them read-only.
        # id is auto-generated in Project.save() from the name field — frontend never sends it
        # owner is set server-side from request.user in perform_create — never from the frontend
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = '__all__'
        # id is auto-generated in Sprint.save() from the num field — frontend never sends it
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        # id: auto-generated in Task.save() as e.g. "DS-001"
        # closed_at: set server-side in the viewset on status → Done transition
        read_only_fields = ['id', 'closed_at', 'created_at', 'updated_at']


class DocPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocPage
        fields = '__all__'
        # id auto-generated in DocPage.save() from title e.g. "getting-started"
        read_only_fields = ['id', 'created_at', 'updated_at']


class DevLogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DevLogEntry
        fields = '__all__'
        read_only_fields = ['created_at']


class SnippetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snippet
        fields = '__all__'
        read_only_fields = ['created_at']
