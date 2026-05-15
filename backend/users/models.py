from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    display_name = models.CharField(max_length=80, blank=True)
    role = models.CharField(max_length=80, blank=True, default='Solo dev')

    def get_display_name(self):
        # Fall back to first_name, then username if display_name not set
        return self.display_name or self.first_name or self.username
