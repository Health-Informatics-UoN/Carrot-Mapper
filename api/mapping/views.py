import csv
import tempfile

from django.shortcuts import render,redirect
from django.urls import reverse_lazy
from django.views.generic import ListView
from django.views.generic.edit import FormView
from xlsx2csv import Xlsx2csv
from django.views import generic
from django.contrib.auth.decorators import login_required


from django.http import HttpResponse
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import send_mail, BadHeaderError
from django.db.models.query_utils import Q


from .forms import ScanReportForm,UserCreateForm
from .models import Mapping, Source, ScanReport, ScanReportField, \
    ScanReportTable


# We probably need to deprecate this function
from .services import process_scan_report
from .tasks import process_scan_report_task


@login_required
def index(request):

    # Pull in all entries in each database (model)
    mapping = Mapping.objects.all()
    source = Source.objects.all()

    # Create quick context dict
    context = {
        'source': source,
        'mapping': mapping,
    }

    return render(request, 'mapping/index.html', context)

def password_reset_request(request):
	if request.method == "POST":
		password_reset_form = PasswordResetForm(request.POST)
		if password_reset_form.is_valid():
			data = password_reset_form.cleaned_data['email']
			associated_users = User.objects.filter(Q(email=data))
			if associated_users.exists():
				for user in associated_users:
					subject = "Password Reset Requested"
					email_template_name = "/registration/password_reset_email.txt"
					c = {
					"email":user.email,
					'domain':'0.0.0.0:8000',
					'site_name': 'Website',
					"uid": urlsafe_base64_encode(force_bytes(user.pk)),
					"user": user,
					'token': default_token_generator.make_token(user),
					'protocol': 'http',
					}
					email = render_to_string(email_template_name, c)
					try:
						send_mail(subject, email, 'admin@example.com' , [user.email], fail_silently=False)
					except BadHeaderError:
						return HttpResponse('Invalid header found.')
					return redirect ("/password_reset_done/")
	password_reset_form = PasswordResetForm()
	return render(request=request, template_name="/registration/password_reset.html", context={"password_reset_form":password_reset_form})
class ScanReportTableListView(ListView):
    model = ScanReportTable

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search_term = self.request.GET.get('search', None)
        if search_term is not None:
            qs = qs.filter(scan_report__id=search_term)
        return qs


class ScanReportFieldListView(ListView):
    model = ScanReportField

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search_term = self.request.GET.get('search', None)
        if search_term is not None:
            qs = qs.filter(scan_report_table__id=search_term)
        return qs


class ScanReportListView(ListView):
    model = ScanReport


class ScanReportFormView(FormView):  # When is it best to use FormView?

    form_class = ScanReportForm
    template_name = 'mapping/upload_scan_report.html'
    success_url = reverse_lazy('scan-report-list')

    def form_valid(self, form):

        # Create an entry in ScanReport for the uploaded Scan Report
        scan_report = ScanReport.objects.create(
            data_partner=form.cleaned_data['data_partner'],
            dataset=form.cleaned_data['dataset'],
            file=form.cleaned_data['scan_report_file'],

            # Does this save the entire file to the database (as a legit .xlsx file)?
        )
        scan_report.author=self.request.user
        # Save all form data to model ScanReport
        scan_report.save()

        process_scan_report_task.delay(scan_report.id)

        return super().form_valid(form)

class SignUpView(generic.CreateView):
    form_class = UserCreateForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

