from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from tables.models import Source, Mapping

# Simple view to pull all records from the dummy database for display on index.html
def index(locdb):

    # Pull in all entries in each database (model)
    mapping = Mapping.objects.all()
    source = Source.objects.all()

    # Create quick context dict
    context = {
        'source':source,
        'mapping':mapping,
    }

    return render(locdb, 'tables/index.html', context)
