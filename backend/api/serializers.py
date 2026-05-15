from rest_framework import serializers
from .models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet, EnvVariable


class ProjectSerializer(serializers.ModelSerializer):
    # Expose a boolean so the frontend knows if vault is password-protected,
    # without ever sending the actual hash over the wire.
    has_vault_password = serializers.SerializerMethodField()

    def get_has_vault_password(self, obj):
        return bool(obj.vault_password_hash)

    class Meta:
        model = Project
        # Exclude the raw hash; expose has_vault_password + vault_timeout instead
        exclude = ['vault_password_hash']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class EnvVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvVariable
        fields = '__all__'
        read_only_fields = ['created_at']


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
