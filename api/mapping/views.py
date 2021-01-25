from django.shortcuts import render

from .models import Mapping, Source


def index(request):

    # Pull in all entries in each database (model)
    mapping = Mapping.objects.all()
    source = Source.objects.all()

    # Create quick context dict
    context = {
        'source':source,
        'mapping':mapping,
    }

    return render(request, 'mapping/index.html', context)
