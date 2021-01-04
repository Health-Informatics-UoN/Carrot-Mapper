from django.contrib import admin
from .models import localDB, vocab, omopMapping

admin.site.register(localDB)
admin.site.register(vocab)
admin.site.register(omopMapping)
