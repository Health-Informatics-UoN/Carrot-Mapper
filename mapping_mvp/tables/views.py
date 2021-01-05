from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from tables.models import LocalDB, ControlledVocab, OmopMapping

# Simple view to pull all records from the dummy database for display on index.html
def index(locdb):

    # Pull in all entries in each database (model)
    loc = LocalDB.objects.all()
    vocab = ControlledVocab.objects.all()
    omop = OmopMapping.objects.all()

    # Create quick context dict
    context = {
        'loc':loc,
        'vocab':vocab,
        'omop':omop
    }

    return render(locdb, 'tables/index.html', context)
