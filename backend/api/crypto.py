"""
Symmetric encryption helpers for storing secrets at rest.

Used for GitHub personal access tokens — never store the raw token in the DB.
The encryption key lives in the FERNET_KEY env var and never touches the database.

Generate a new key with:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import os

from cryptography.fernet import Fernet
from django.core.exceptions import ImproperlyConfigured


def _get_cipher() -> Fernet:
    key = os.environ.get('FERNET_KEY')
    if not key:
        raise ImproperlyConfigured(
            'FERNET_KEY is not set. Generate one with: '
            'python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
        )
    return Fernet(key.encode())


def encrypt(plaintext: str) -> str:
    return _get_cipher().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return _get_cipher().decrypt(ciphertext.encode()).decode()
