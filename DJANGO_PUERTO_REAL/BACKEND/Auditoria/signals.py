from django.contrib.auth.signals import user_login_failed
from django.dispatch import receiver
from .services import crear_registro

def get_client_ip(request):
    """Obtiene la dirección IP del cliente desde la petición."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """
    Registra un intento de inicio de sesión fallido en la auditoría.
    """
    username = credentials.get('username', None)
    ip_address = get_client_ip(request)
    
    crear_registro(
        usuario=None,  # No hay un usuario autenticado en un login fallido
        accion='LOGIN_FALLIDO',
        detalles={
            'username_intentado': username,
            'ip_address': ip_address,
            'user_agent': request.META.get('HTTP_USER_AGENT')
        }
    )
