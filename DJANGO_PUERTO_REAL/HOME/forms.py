from django import forms


class StaffLoginForm(forms.Form):
    usuario = forms.CharField(label="Usuario o email")
    password = forms.CharField(widget=forms.PasswordInput, label="Contraseña")


class ClienteLoginForm(forms.Form):
    dni_o_email = forms.CharField(label="DNI o email")
    pin_o_password = forms.CharField(widget=forms.PasswordInput, label="PIN o contraseña")


class ClienteRegistroForm(forms.Form):
    nombre = forms.CharField()
    apellido = forms.CharField()
    dni = forms.CharField()
    email = forms.EmailField(required=False)
    direccion = forms.CharField(required=False)
    pin = forms.CharField(min_length=4, widget=forms.PasswordInput)