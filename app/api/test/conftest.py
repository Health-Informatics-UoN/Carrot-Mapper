import pytest
from data.models.concept import Concept
from django.conf import settings
from django.core.management import call_command
from django.db import connection


@pytest.fixture(scope="session")
def django_db_setup(django_db_blocker):
    """
    Override Pytest db setup, to create the "omop.Concept" table.

    This is necessary for the migrations to run succesfully in test,
    as the migrations depend on this schema/table existing.
    """

    settings.DATABASES["default"]["NAME"] = "test-db"
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS omop")
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(Concept)
        call_command("migrate", "--noinput")
