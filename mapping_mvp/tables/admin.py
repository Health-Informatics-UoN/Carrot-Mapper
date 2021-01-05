from django.contrib import admin
from .models import LocalDB, ControlledVocab, OmopMapping

admin.site.register(LocalDB)
admin.site.register(ControlledVocab)
admin.site.register(OmopMapping)
