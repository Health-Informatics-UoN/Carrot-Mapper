import pytest
from django.conf import settings
from django.core.management import call_command
from django.db import connection


@pytest.fixture(scope="session")
def django_db_setup(django_db_blocker):

    settings.DATABASES["default"]["NAME"] = "test-db"
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS omop")
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS omop.CONCEPT (concept_id integer NOT NULL primary key)"
            )
        call_command("migrate", "--noinput")
