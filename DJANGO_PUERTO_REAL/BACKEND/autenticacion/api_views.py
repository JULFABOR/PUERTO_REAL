# Django
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
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
from .serializers import UserRegisterSerializer, UserDataSerializer, ChangePasswordSerializer

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
    
    def put(self, request):
        """
        Permite al usuario autenticado actualizar su perfil (username, email, password).
        """
        user = request.user
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Validaciones básicas
        sensitive_change = False
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                return Response({'detail': 'El email ya está en uso.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

            sensitive_change = True

        if username and username != user.username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'detail': 'El nombre de usuario ya está en uso.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
            sensitive_change = True

        if password:
            try:
                user.set_password(password)
                sensitive_change = True
            except Exception:
                return Response({'detail': 'Error al establecer la contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.save()
            # Si hubo cambio sensible (password/email/username), invalidamos tokens para forzar relogin
            if sensitive_change:
                try:
                    Token.objects.filter(user=user).delete()
                except Exception:
                    pass

            # Devolver los datos actualizados e indicar al frontend que fuerce relogin si aplica
            serializer = UserDataSerializer(user)
            resp = serializer.data
            if sensitive_change:
                return Response({**resp, 'force_logout': True, 'detail': 'Perfil actualizado. Por seguridad, inicia sesión de nuevo.'})
            return Response(resp)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================================================================
# --- Vista para cambiar la contraseña de un usuario logueado ---
# ==================================================================
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password1'])
            user.save()
            return Response({'detail': 'Contraseña actualizada con éxito.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==================================================================
# --- VISTA DE LOGIN OPTIMIZADA ---
# ==================================================================
class CustomAuthToken(ObtainAuthToken):
    permission_classes = [] # No se necesita estar autenticado para hacer login
    authentication_classes = [] # No se necesita token para esta vista
    # Use our serializer that accepts username or email
    from .serializers import AuthEmailOrUsernameSerializer
    serializer_class = AuthEmailOrUsernameSerializer

    def post(self, request, *args, **kwargs):
        """
        Autentica a un usuario (por username o email) y devuelve el token junto con los datos completos del usuario.
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
                
                # URL del frontend
                reset_url = f"{settings.FRONTEND_URL}/reset-password?uidb64={uidb64}&token={token}"
                
                # --- CONFIGURACIÓN DEL EMAIL ---
                site_name = "Puerto Real"
                support_email = "cruzleandroabraham.slt@gmail.com"
                
                # HTML INCORPORADO (Dark Mode)
                html_message = f"""
                <!doctype html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Restablece tu contraseña</title>
                </head>
                <body style="font-family: 'Arial', sans-serif; background-color: #111827; color: #E5E7EB; margin: 0; padding: 0;">
                  
                  <div style="max-width:600px; margin:40px auto; background-color:#1F2937; border-radius:12px; padding:30px; box-shadow:0 4px 24px rgba(0,0,0,0.3); border: 1px solid #374151;">
                    
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom: 25px;">
                      <div style="width:40px; height:40px; border-radius:8px; background-color:#FACC15; display:inline-block;"></div>
                      <strong style="font-size: 20px; color: #FACC15; vertical-align: middle; display: inline-block; margin-left: 10px;">{site_name}</strong>
                    </div>

                    <h1 style="font-size:24px; margin:0 0 15px; color: #FFFFFF;">Un paso más para cambiar tu contraseña</h1>

                    <p style="color:#D1D5DB; line-height:1.6; font-size: 16px;">Hola,</p>

                    <p style="color:#D1D5DB; line-height:1.6; font-size: 16px;">Recibimos tu solicitud para cambiar la contraseña de tu cuenta. Haz clic en el siguiente botón para continuar:</p>

                    <p style="text-align:center; margin:30px 0;">
                      <a href="{reset_url}" style="display:inline-block; background-color:#FACC15; color:#111827; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold; font-size: 16px;">Restablecer contraseña</a>
                    </p>

                    <p style="color:#9CA3AF; font-size:14px; margin-top: 30px;">Si el botón no funciona, copia y pega este enlace:</p>
                    <div style="background-color:#111827; padding:15px; border-radius:6px; border:1px solid #374151; margin:10px 0; word-break: break-all;">
                        <a href="{reset_url}" style="color:#60A5FA; text-decoration:none; font-size: 13px;">{reset_url}</a>
                    </div>

                    <p style="color:#9CA3AF; font-size:13px; margin-top: 30px; border-top: 1px solid #374151; padding-top: 20px;">
                        Si no solicitaste este cambio, puedes ignorar este correo. Si sospechas que alguien está intentando acceder a tu cuenta, contacta a soporte: 
                        <a href="mailto:{support_email}" style="color:#FACC15;">{support_email}</a>
                    </p>

                    <div style="margin-top:20px; font-size:12px; color:#6B7280; text-align: center;">
                        Saludos,<br>{site_name} — Equipo de Soporte<br>
                        Salta, Capital
                    </div>
                  </div>
                </body>
                </html>
                """

                # Enviar el correo
                send_mail(
                    subject=f"Restablecimiento de contraseña - {site_name}",
                    message=f"Usa este enlace para resetear tu password: {reset_url}", # Versión texto plano
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                    html_message=html_message # <--- AQUÍ SE INYECTA EL HTML
                )

            except User.DoesNotExist:
                # Por seguridad, no decimos si el usuario existe o no
                pass
            except Exception as e:
                print('Error sending password reset email:', e)

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


# ==================================================================
# Admin users management (list/create/delete) - used by JefeSettings
# Only accessible to staff or users with Perfil.rol == 'JEFE'
# ==================================================================
class UsersAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def _is_jefe_or_staff(self, user):
        try:
            perfil_rol = getattr(user, 'perfil', None)
            if perfil_rol and getattr(perfil_rol, 'rol', None) == 'JEFE':
                return True
        except Exception:
            pass
        return user.is_staff

    def get(self, request):
        if not self._is_jefe_or_staff(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all()
        serializer = UserDataSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not self._is_jefe_or_staff(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        # Permitimos creación desde el panel de administración con un payload mínimo.
        # Campos esperados (mínimos): email, password. Opcionales: username, first_name, last_name, role
        data = request.data
        email = data.get('email')
        password = data.get('password')
        username = data.get('username') or email
        first_name = data.get('first_name') or ''
        last_name = data.get('last_name') or ''
        role = data.get('role')

        if not email or not password:
            return Response({'detail': 'Se requieren email y password'}, status=status.HTTP_400_BAD_REQUEST)

        # Evitar emails duplicados (mejor para identificar usuarios por email)
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'El email ya está en uso por otro usuario.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Garantizar username único: si choca, generamos sufijos numéricos
            base_username = username.split('@')[0] if '@' in username else username
            candidate = base_username
            counter = 1
            while User.objects.filter(username=candidate).exists():
                candidate = f"{base_username}{counter}"
                counter += 1

            user = User.objects.create_user(username=candidate, email=email, password=password,
                                            first_name=first_name, last_name=last_name)

            # Ajustar rol en perfil si existe
            try:
                perfil = getattr(user, 'perfil', None)
                if perfil and role:
                    # Normalizamos a mayúsculas para coincidir con choices
                    perfil.rol = role.upper()
                    perfil.save()
            except Exception:
                pass

            serialized = UserDataSerializer(user).data
            return Response(serialized, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk=None):
        if not self._is_jefe_or_staff(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        
        if pk is None:
            return Response({'detail': 'ID de usuario requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        email = data.get('email')
        username = data.get('username')
        role = data.get('role')

        # Actualizar email con validación de unicidad
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                return Response({'detail': f"El email '{email}' ya está en uso."}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

        # Actualizar username con validación de unicidad
        if username and username != user.username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'detail': f"El nombre de usuario '{username}' ya está en uso."}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
        
        user.save()

        # Actualizar el rol en el perfil
        if role:
            try:
                perfil = getattr(user, 'perfil', None)
                if perfil:
                    perfil.rol = role.upper()
                    perfil.save()
            except Exception as e:
                # No romper si falla la actualización del perfil, pero registrarlo
                print(f"Advertencia: No se pudo actualizar el rol para el usuario {user.id}: {e}")

        serialized = UserDataSerializer(user).data
        return Response(serialized, status=status.HTTP_200_OK)

    def delete(self, request, pk=None):
        if not self._is_jefe_or_staff(request.user):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)