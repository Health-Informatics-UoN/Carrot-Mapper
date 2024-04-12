import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
import django

django.setup()

from shared.services import rules


def test_plus():
    assert 1 == 1
