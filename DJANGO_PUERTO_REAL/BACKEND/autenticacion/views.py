from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.views import LoginView
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils.decorators import method_decorator
from django.views.generic.edit import CreateView
from django.views.generic import TemplateView
from django.urls import reverse_lazy

from .forms import ClienteRegisterForm, EmpleadoRegisterForm, CustomLoginForm

# --- Vistas de Registro ---

class CustomRegisterView(CreateView):
    form_class = ClienteRegisterForm
    template_name = 'autenticacion/Login-register.html'
    success_url = reverse_lazy('login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['register'] = True
        return context

    def form_valid(self, form):
        response = super().form_valid(form)
        user = form.save()
        login(self.request, user)
        return response

def is_staff(user):
    return user.is_staff

@method_decorator(user_passes_test(is_staff), name='dispatch')
class EmpleadoRegisterView(CreateView):
    """Vista para que un miembro del staff registre un empleado."""
    form_class = EmpleadoRegisterForm
    template_name = 'autenticacion/register_empleado.html'
    success_url = reverse_lazy('home') # O a una lista de empleados

    def form_valid(self, form):
        """Guarda el nuevo empleado pero no inicia sesión como él."""
        form.save()
        return super().form_valid(form)

@method_decorator(user_passes_test(is_staff), name='dispatch')
class ClienteRegisterByEmpleadoView(CreateView):
    """Vista para que un miembro del staff registre un cliente."""
    form_class = ClienteRegisterForm
    template_name = 'autenticacion/register_cliente_by_empleado.html'
    success_url = reverse_lazy('home') # O a una lista de clientes

    def form_valid(self, form):
        """Guarda el nuevo cliente pero no inicia sesión como él."""
        form.save()
        return super().form_valid(form)


# --- Vistas de Login / Logout ---

class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'autenticacion/Login-register.html'
    # Django se encarga del resto y redirige a LOGIN_REDIRECT_URL en settings.py
    # Si no está definido, redirige a /accounts/profile/ por defecto.


def user_logout(request):
    logout(request)
    return redirect('home') # Redirige a la página principal después del logout

class ForgotPasswordView(TemplateView):
    template_name = 'autenticacion/Forgot-Password.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Recuperar Contraseña"
        return context