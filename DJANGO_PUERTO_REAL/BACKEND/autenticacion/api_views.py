from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from .serializers import UserRegisterSerializer, UserDataSerializer
from HOME.models import Empleados

# ==================================================================
# --- Vista para obtener datos del usuario ---
# ==================================================================
class UserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDataSerializer(request.user)
        return Response(serializer.data)

# ==================================================================
# --- VISTA DE LOGIN CORREGIDA ---
# ==================================================================
class CustomAuthToken(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                                    context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # --- LÓGICA CORREGIDA ---
        # Obtenemos el rol y el ID del empleado si existe.
        rol = 'Cliente'
        empleado_id = None
        if hasattr(user, 'perfil'):
            rol = user.perfil.get_rol_display()
            # Si el usuario es un empleado, obtenemos su ID.
            if rol in ['JEFE', 'EMPLEADO']:
                try:
                    empleado_id = user.empleado.id_empleado
                except Empleados.DoesNotExist:
                    empleado_id = None # No debería pasar si el rol está bien asignado.

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'rol': rol,
            'empleado_id': empleado_id, # Devolvemos el ID del empleado
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
            # El perfil se crea automáticamente con la señal en models.py
            # Se puede asignar un rol específico si es necesario, por defecto es 'Cliente'
            # user.perfil.rol = 'EMPLEADO'
            # user.perfil.save()

            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Usuario registrado con éxito.',
                'token': token.key,
                'user_id': user.pk,
                'rol': user.perfil.get_rol_display(),
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
                reset_url = f"http://localhost:5173/reset-password?uidb64={uidb64}&token={token}"
                
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
            uidb64 = serializer.validated_data.get('uidb64')
            token = serializer.validated_data.get('token')
            password = serializer.validated_data.get('password')

            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
                token_generator = PasswordResetTokenGenerator()
                if not token_generator.check_token(user, token):
                    return Response({'error': 'El enlace de reseteo no es válido o ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)
                
                user.set_password(password)
                user.save()
                return Response({'message': 'Tu contraseña ha sido restablecida con éxito.'}, status=status.HTTP_200_OK)

            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({'error': 'El enlace de reseteo no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
