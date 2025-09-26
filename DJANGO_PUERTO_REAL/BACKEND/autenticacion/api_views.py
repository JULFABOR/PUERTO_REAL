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
from django.utils.encoding import force_bytes, force_str
from django.conf import settings

# --- Tu vista de Login que ya tenías ---
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # --- LÓGICA MEJORADA PARA OBTENER EL ROL ---
        rol = None
        if user.groups.exists():
            rol = user.groups.first().name
        elif hasattr(user, 'empleado'):
            rol = 'EMPLEADO'
        elif hasattr(user, 'cliente'):
            rol = 'CLIENTE'
        elif user.is_superuser or user.is_staff:
            rol = 'JEFE'
        
        # También obtenemos el id del empleado si existe
        employee_id = user.empleado.id_empleado if hasattr(user, 'empleado') else None
        # --- FIN DE LA LÓGICA MEJORADA ---

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'rol': rol,  # <-- AÑADIDO: Enviamos el rol en la respuesta
            'employee_id': employee_id # <-- AÑADIDO: Enviamos el ID del empleado
        })

# --- Vista de Logout ---
class LogoutView(APIView):
    """
    Invalida el token de autenticación del usuario que realiza la petición.
    """
    permission_classes = [IsAuthenticated] # Solo usuarios autenticados pueden hacer logout

    def post(self, request):
        # request.auth es el token object gracias a TokenAuthentication
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- Serializadores para el reseteo de contraseña ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError('El enlace de reseteo es inválido.')

        if not PasswordResetTokenGenerator().check_token(user, data['token']):
            raise serializers.ValidationError('El enlace de reseteo es inválido o ha expirado.')

        data['user'] = user
        return data

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
            user = serializer.validated_data['user']
            password = serializer.validated_data['password']
            
            # Establecer la nueva contraseña
            user.set_password(password)
            user.save()
            
            return Response({'message': 'Tu contraseña ha sido restablecida con éxito.'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
