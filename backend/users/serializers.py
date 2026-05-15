from rest_framework import serializers
from .models import CustomUser


class UserProfileSerializer(serializers.ModelSerializer):
    # username is derived from AbstractUser — expose it read-only so the
    # frontend can display it but can't change it via this endpoint.
    username = serializers.CharField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'display_name', 'role']
