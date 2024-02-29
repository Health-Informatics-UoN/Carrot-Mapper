def pytest_sessionstart():
    from django.apps import apps

    unmanaged_models = [m for m in apps.get_models() if not m._meta.managed]
    for m in unmanaged_models:
        m._meta.managed = True
