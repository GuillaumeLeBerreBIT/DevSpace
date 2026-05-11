from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    # Identical to Django's built-in User today.
    # Extend here later — e.g. avatar, display_name, subscription_tier —
    # without ever needing to touch migrations again.
    pass
