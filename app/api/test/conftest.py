from typing import Generator

import pytest
from data.models.concept import Concept
from django.conf import settings
from django.core.management import call_command
from django.db import connection
from pytest_django import DjangoDbBlocker


@pytest.fixture(scope="session")
def django_db_setup(
    django_db_blocker: DjangoDbBlocker,
    django_db_keepdb: bool,
) -> Generator[None, None, None]:
    """
    Override Pytest db setup, to create the "omop.Concept" table.

    This is necessary for the migrations to run succesfully in test,
    as the migrations depend on this schema/table existing.
    """
    # Set the default db to the test one for ease.
    db_name = settings.DATABASES["default"]["TEST"]["NAME"]

    # Manually create the test DB if it doesn't exist.
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
            db_exists = cursor.fetchone()

            if not db_exists:
                cursor.execute(f"CREATE DATABASE {db_name} TEMPLATE template0")

            connection.close()

    settings.DATABASES["default"]["NAME"] = db_name

    # Create the omop.Concept schema + table
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("CREATE SCHEMA IF NOT EXISTS omop")
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(Concept)

        # run the rest of the migrations
        call_command("migrate", "--noinput")

        yield

        # If not keeping the test db, drop it
        if not django_db_keepdb:
            with connection.cursor() as cursor:
                cursor.execute(f"DROP DATABASE {db_name}")
