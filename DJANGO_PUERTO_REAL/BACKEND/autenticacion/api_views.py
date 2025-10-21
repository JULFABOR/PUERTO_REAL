# Django
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

# Third-party
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Local application
from .models import Empleados
from .serializers import UserRegisterSerializer

# ==================================================================
# --- VISTA DE LOGIN CORREGIDA ---
# ==================================================================
class CustomAuthToken(ObtainAuthToken):
    permission_classes = [] # No se necesita estar autenticado para hacer login
    authentication_classes = [] # No se necesita token para esta vista

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                                    context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # --- LÓGICA CORREGIDA PARA OBTENER EMPLEADO Y ROL ---
        empleado_id = None
        rol = "Empleado" # Rol por defecto

        try:
            # Buscamos en la tabla Empleados un registro asociado a este user
            empleado = Empleados.objects.get(user_empleado=user)
            empleado_id = empleado.id_empleado
        except Empleados.DoesNotExist:
            # Si un usuario (como un superadmin) no tiene un perfil de empleado
            empleado_id = None

        # Determinamos el rol basado en los grupos de Django
        if user.groups.filter(name='Jefe').exists():
            rol = 'Jefe'
        elif user.is_superuser:
            rol = 'Jefe' # Asignamos rol de Jefe a los superusuarios también
        
        # Construimos la respuesta final
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'rol': rol,
            'empleado_id': empleado_id # <-- Enviamos el ID del empleado
        })

# ==================================================================

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            empleado_id = None
            try:
                new_empleado = Empleados.objects.create(
                    user=user,
                    nombre_empleado=user.first_name,
                    apellido_empleado=user.last_name,
                )
                empleado_id = new_empleado.id_empleado
            except Exception as e:
                print(f"No se pudo crear el perfil de empleado para {user.username}: {e}")

            return Response({
                'message': 'Usuario registrado con éxito.',
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'rol': 'Empleado', # Asignamos un rol por defecto al registrar
                'empleado_id': empleado_id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- VISTAS Y SERIALIZERS PARA RESETEO DE CONTRASEÑA ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    def validate(self, data):
        # ... (lógica sin cambios)
        pass

# --- VISTA PARA SOLICITAR EL RESETEO DE CONTRASEÑA ---
class RequestPasswordResetView(APIView):
    permission_classes = [] # No se necesita estar autenticado

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                
                # Generar token y uid
                token_generator = PasswordResetTokenGenerator()
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = token_generator.make_token(user)
                
                # Construir la URL de reseteo para el frontend
                reset_url = f"{settings.FRONTEND_URL}/reset-password?uidb64={uidb64}&token={token}"
                
                # Enviar el correo (se imprimirá en la consola de Django)
                send_mail(
                    'Restablecimiento de Contraseña',
                    f'Hola, haz clic en el siguiente enlace para restablecer tu contraseña: {reset_url}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )

            except User.DoesNotExist:
                # No hacemos nada si el usuario no existe, por seguridad
                pass

            # Siempre devolvemos una respuesta exitosa para no revelar si un email existe
            return Response({'message': 'Si tu correo está en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- VISTA PARA CONFIRMAR Y ESTABLECER LA NUEVA CONTRASEÑA ---
class PasswordResetConfirmView(APIView):
    permission_classes = [] # No se necesita estar autenticado

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            password = serializer.validated_data['password']
            
            # Establecer la nueva contraseña
            user.set_password(password)
            user.save()
            
            return Response({'message': 'Tu contraseña ha sido restablecida con éxito.'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)