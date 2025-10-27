# Django
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.utils.http import urlsafe_base64_encode


# Third-party
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token


# Local application
from .models import Empleados
from .serializers import UserRegisterSerializer, UserDataSerializer

# ==================================================================
# --- Vista para obtener datos del usuario ---
# ==================================================================
class UserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Devuelve los datos del usuario autenticado actualmente.
        """
        serializer = UserDataSerializer(request.user)
        return Response(serializer.data)

# ==================================================================
# --- VISTA DE LOGIN OPTIMIZADA ---
# ==================================================================
class CustomAuthToken(ObtainAuthToken):
    permission_classes = [] # No se necesita estar autenticado para hacer login
    authentication_classes = [] # No se necesita token para esta vista

    def post(self, request, *args, **kwargs):
        """
        Autentica a un usuario y devuelve el token junto con los datos completos del usuario.
        """
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        user_data = UserDataSerializer(user).data

        rol = user_data.get('perfil', {}).get('rol')
        empleado_data = user_data.get('empleado')
        empleado_id = empleado_data.get('id_empleado') if empleado_data else None

        return Response({
            'token': token.key,
            'user_id': user_data.get('id'),
            'email': user_data.get('email'),
            'rol': rol,
            'empleado_id': empleado_id,
            'user': user_data  # Keep the full user object for any other potential use
        })

# ==================================================================

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Invalida el token de autenticación del usuario.
        """
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    """
    Registra un nuevo usuario.
    """
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            user_data = UserDataSerializer(user).data

            return Response({
                'token': token.key,
                'user': user_data
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
        # This can be expanded with more password validation if needed
        return data

# --- VISTA PARA SOLICITAR EL RESETEO DE CONTRASEÑA ---
class RequestPasswordResetView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                
                token_generator = PasswordResetTokenGenerator()
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = token_generator.make_token(user)
                
                reset_url = f"{settings.FRONTEND_URL}/reset-password?uidb64={uidb64}&token={token}"
                
                send_mail(
                    'Restablecimiento de Contraseña',
                    f'Hola, haz clic en el siguiente enlace para restablecer tu contraseña: {reset_url}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )

            except User.DoesNotExist:
                pass

            return Response({'message': 'Si tu correo está en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- VISTA PARA CONFIRMAR Y ESTABLECER LA NUEVA CONTRASEÑA ---
class PasswordResetConfirmView(APIView):
    permission_classes = []

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