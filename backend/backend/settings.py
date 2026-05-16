import os
from pathlib import Path
from datetime import timedelta

import dj_database_url
from dotenv import load_dotenv

from urllib.parse import urlparse, parse_qsl

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend/ directory (one level above this file)
load_dotenv(BASE_DIR / '.env.backend')

# --- Core settings -----------------------------------------------------------

# In production RENDER_EXTERNAL_HOSTNAME is always set — use that to detect the environment.
# Locally it's absent, so DEBUG defaults to True and the insecure key is fine.
_in_production = bool(os.environ.get('RENDER_EXTERNAL_HOSTNAME'))

DEBUG = not _in_production

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-only-change-in-production')
if _in_production and SECRET_KEY.startswith('django-insecure'):
    raise RuntimeError('SECRET_KEY must be set to a real value in production.')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Render injects RENDER_EXTERNAL_HOSTNAME automatically — add it if present
_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if _render_host:
    ALLOWED_HOSTS.append(_render_host)


# --- Installed apps ----------------------------------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',       # Django REST Framework — serializers, viewsets, browsable API
    'corsheaders',          # Adds Access-Control-* headers so React (port 5173) can call this API
    'users',                # Custom user model — must come before 'api' so FK references resolve
    'api',                  # Our app — models, serializers, views live here
]

# Tell Django to use our custom user model instead of the built-in one.
# This must be set before the first migration and never changed after real data exists.
AUTH_USER_MODEL = 'users.CustomUser'

# --- Middleware ---------------------------------------------------------------
# corsheaders.CorsMiddleware MUST come before CommonMiddleware.
# It needs to intercept requests (including preflight OPTIONS) before Django processes them.

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',            # ← must be here, before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# --- Database ----------------------------------------------------------------
# dj_database_url.config() reads DATABASE_URL from the environment and returns
# the dict Django expects (ENGINE, NAME, USER, PASSWORD, HOST, PORT).
# The fallback keeps SQLite working if you run without a .env (e.g. in CI).

# DATABASES = {
#     'default': dj_database_url.config(
#         default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
#         conn_max_age=600,       # reuse DB connections for up to 10 min (important for serverless Neon)
#     )
# }

# Replace the DATABASES section of your settings.py with this
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))

# parse_qsl splits the query string into key/value pairs.
# channel_binding is a Neon-specific hint not supported by psycopg2 — strip it
# or it will cause password auth failures during the SSL handshake.
_db_options = {k: v for k, v in parse_qsl(tmpPostgres.query) if k != 'channel_binding'}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': tmpPostgres.path.replace('/', ''),
        'USER': tmpPostgres.username,
        'PASSWORD': tmpPostgres.password,
        'HOST': tmpPostgres.hostname,
        'PORT': 5432,
        'OPTIONS': _db_options,
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'


# --- Django REST Framework ---------------------------------------------------
# DEFAULT_AUTHENTICATION_CLASSES: tells DRF how to identify the user on each request.
# JWTAuthentication reads the Authorization: Bearer <token> header and validates it.
# SessionAuthentication is kept for the browsable API in the browser during dev.
#
# DEFAULT_PERMISSION_CLASSES: IsAuthenticated means every endpoint requires a valid
# token by default. You can override this per-view if needed.

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


# --- JWT (simplejwt) ---------------------------------------------------------
# ACCESS_TOKEN_LIFETIME: how long before the frontend must refresh. 1 day is
# generous for a single-user dev tool — you won't be logged out mid-session.
# REFRESH_TOKEN_LIFETIME: how long the refresh token lasts before full re-login.

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,  # issue a new refresh token on every refresh call
}


# --- CORS --------------------------------------------------------------------
# In development, allow any localhost port so Vite port changes (5173, 5174…)
# never break the login flow. In production, set CORS_ALLOWED_ORIGINS in .env.

if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [r'^http://localhost:\d+$']
else:
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
