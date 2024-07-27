"""
Django settings for api project.

Generated by 'django-admin startproject' using Django 3.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""

import os

from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATIC_DIR = os.path.join(BASE_DIR, "static")
STATICFILES_DIRS = [
    STATIC_DIR,
]
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG will only evaluate to True if 'True' or 1 is supplied
DEBUG = os.getenv("DEBUG", "False") in ["True", 1]

# Here we need to manipulate a string containing a Python list into a list of strings
ALLOWED_HOSTS = [
    x.strip()[1:-1] for x in os.environ.get("ALLOWED_HOSTS")[1:-1].split(",")
]
# We need this for Azure App Service
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "extra_views",
    "api",
    "mapping",
    "data",
    "rest_framework",
    "django_filters",
    "rest_framework.authtoken",
    "corsheaders",
    "test",
    "proxy",
    "revproxy",
    "shared",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.media",
                "config.react.react",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": os.getenv("COCONNECT_DB_ENGINE"),
        "HOST": os.getenv("COCONNECT_DB_HOST"),
        "PORT": os.getenv("COCONNECT_DB_PORT"),
        "NAME": os.getenv("COCONNECT_DB_NAME"),
        "USER": os.getenv("COCONNECT_DB_USER"),
        "PASSWORD": os.getenv("COCONNECT_DB_PASSWORD"),
        "TEST": {
            "NAME": "throwawaydb",
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

CORS_ORIGIN_ALLOW_ALL = True

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

STATIC_URL = "/static/"

LOGIN_REDIRECT_URL = "/scanreports/"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# NLP API KEY
NLP_API_KEY = os.getenv("NLP_API_KEY")

SESSION_COOKIE_AGE = 86400  # session length is 24 hours

# Frontend
NEXTJS_URL = os.environ.get("NEXTJS_URL", "http://localhost:3000")

# Azure Functions
AZ_URL = os.environ.get("AZ_URL", "http://localhost:7071")
AZ_RULES_NAME = os.environ.get("AZ_RULES_NAME", "RulesOrchestrator")
AZ_RULES_KEY = os.environ.get("AZ_RULES_KEY", "")
