from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.views import LoginView
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils.decorators import method_decorator
from django.views.generic.edit import CreateView
from django.urls import reverse_lazy

from .forms import ClienteRegisterForm, EmpleadoRegisterForm, CustomLoginForm

# --- Vistas de Registro ---

class ClienteRegisterView(CreateView):
    form_class = ClienteRegisterForm
    template_name = 'autenticacion/register_cliente.html'
    success_url = reverse_lazy('login') # Redirige al login después de un registro exitoso

    def form_valid(self, form):
        """Loguea al usuario después de que el formulario es validado y guardado."""
        response = super().form_valid(form)
        user = form.save()
        login(self.request, user)
        return response

@method_decorator(login_required, name='dispatch')
class EmpleadoClienteRegisterView(CreateView):
    """Vista para que un empleado registre un cliente."""
    form_class = ClienteRegisterForm
    template_name = 'autenticacion/register_cliente_por_empleado.html'
    success_url = reverse_lazy('home') # Redirige al home o a donde prefieras

    def form_valid(self, form):
        """Guarda el nuevo cliente pero no loguea al nuevo usuario."""
        form.save()
        return super().form_valid(form)

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

# --- Vistas de Login / Logout ---

class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'autenticacion/login.html'
    # Django se encarga del resto y redirige a LOGIN_REDIRECT_URL en settings.py
    # Si no está definido, redirige a /accounts/profile/ por defecto.


def user_logout(request):
    logout(request)
    return redirect('home') # Redirige a la página principal después del logout