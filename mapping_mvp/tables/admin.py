from django.contrib import admin
from .models import localDB, controlledVocab, omopMapping

admin.site.register(localDB)
admin.site.register(controlledVocab)
admin.site.register(omopMapping)
