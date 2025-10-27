from rest_framework import serializers
from django.contrib.auth.models import User
from autenticacion.models import Empleados
from Config_PR.models import Estados

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estados
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class EmpleadoSerializer(serializers.ModelSerializer):
    user_empleado = UserSerializer()

    class Meta:
        model = Empleados
        fields = ['id_empleado', 'dni_empleado', 'telefono_empleado', 'fecha_alta_empleado', 'user_empleado']
