from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from HOME.models import Clientes, Empleados

class ClienteRegisterForm(UserCreationForm):
    dni_cliente = forms.CharField(max_length=50, label='DNI')
    telefono_cliente = forms.CharField(max_length=50, label='Teléfono')

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email',)

    def save(self, commit=True):
        user = super().save(commit=False)
        # Guardar los datos del formulario en el objeto de usuario
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
            # Crear el perfil de cliente asociado
            cliente, created = Clientes.objects.update_or_create(
                user_cliente=user,
                defaults={
                    'dni_cliente': self.cleaned_data['dni_cliente'],
                    'telefono_cliente': self.cleaned_data['telefono_cliente']
                }
            )
        return user

class EmpleadoRegisterForm(UserCreationForm):
    dni_empleado = forms.CharField(max_length=50, label='DNI')
    telefono_empleado = forms.CharField(max_length=50, label='Teléfono')

    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email',)

    def save(self, commit=True):
        user = super().save(commit=False)
        # Marcar al usuario como personal (staff)
        user.is_staff = True
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
            # Crear el perfil de empleado asociado
            empleado, created = Empleados.objects.update_or_create(
                user_empleado=user,
                defaults={
                    'dni_empleado': self.cleaned_data['dni_empleado'],
                    'telefono_empleado': self.cleaned_data['telefono_empleado']
                }
            )
        return user

class CustomLoginForm(AuthenticationForm):
    class Meta:
        model = User
        fields = ['username', 'password']
