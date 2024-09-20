from django.contrib.auth.views import LoginView
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from rest_framework_simplejwt.tokens import RefreshToken


class CustomLoginView(LoginView):
    def form_valid(self, form):
        super().form_valid(form)

        # Generate JWT token
        user = self.request.user
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Set JWT token as a cookie
        response = HttpResponseRedirect(self.get_success_url())
        response.set_cookie(
            "jwt_token", access_token, httponly=True
        )  # Set httponly for security
        return response

    def get_success_url(self):
        return reverse_lazy("home")
