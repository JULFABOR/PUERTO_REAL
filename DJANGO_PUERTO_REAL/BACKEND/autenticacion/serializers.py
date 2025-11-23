from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Empleados
from .models import Perfil
from django.contrib.auth import authenticate


class AuthEmailOrUsernameSerializer(serializers.Serializer):
    username = serializers.CharField(label="Username or Email")
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = None
        # Obtain request from context (may be present when called from views)
        request = self.context.get('request') if hasattr(self, 'context') else None

        # Try authenticate directly (username). Pass request when available so
        # authentication backends that expect it don't receive None.
        if username and password:
            if request is not None:
                user = authenticate(request=request, username=username, password=password)
            else:
                user = authenticate(username=username, password=password)

        # If direct auth failed and input looks like an email, try to find by email
        if user is None and username and '@' in username:
            try:
                u = User.objects.get(email__iexact=username)
                if request is not None:
                    user = authenticate(request=request, username=u.username, password=password)
                else:
                    user = authenticate(username=u.username, password=password)
            except User.DoesNotExist:
                user = None

        if user is None:
            raise serializers.ValidationError('Credenciales inválidas para username/email y contraseña.')

        attrs['user'] = user
        return attrs

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': False}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        attrs['username'] = attrs['email']
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        return user

# --- Serializers para obtener datos del usuario ---

class EmpleadoDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleados
        fields = ('id_empleado', 'dni_empleado', 'telefono_empleado', 'fecha_alta_empleado')

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ('rol',)

class UserDataSerializer(serializers.ModelSerializer):

    perfil = PerfilSerializer(read_only=True)

    empleado = EmpleadoDetailsSerializer(read_only=True)



    class Meta:

        model = User

        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'perfil', 'empleado')



class ChangePasswordSerializer(serializers.Serializer):

    """

    Serializer for password change endpoint.

    """

    old_password = serializers.CharField(required=True)

    new_password1 = serializers.CharField(required=True)

    new_password2 = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                'Tu contraseña antigua no es correcta. Por favor, inténtalo de nuevo.'
            )
        return value



    def validate(self, data):

        if data['new_password1'] != data['new_password2']:

            raise serializers.ValidationError({"new_password2": "Las nuevas contraseñas no coinciden."})

        validate_password(data['new_password1'])

        return data
