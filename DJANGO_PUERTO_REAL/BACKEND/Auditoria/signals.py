from django.contrib.auth.signals import user_login_failed
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.apps import apps
from django.db import transaction

from .services import crear_registro
from .models import RegistroAuditoria

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

# Lista de modelos a auditar de la app 'HOME'
# Excluir RegistroAuditoria para evitar bucles infinitos
MODELS_TO_AUDIT = [
    model for model in apps.get_app_config('HOME').get_models()
    if model != RegistroAuditoria
]

@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    """
    Registra la creación o actualización de una instancia de modelo.
    """
    if sender in MODELS_TO_AUDIT:
        with transaction.atomic():
            accion = 'MODELO_CREADO' if created else 'MODELO_ACTUALIZADO'
            detalles = {
                'model_name': sender.__name__,
                'instance_id': str(instance.pk),
            }
            if not created:
                detalles['message'] = f'{sender.__name__} con ID {instance.pk} actualizado.'
            else:
                detalles['message'] = f'{sender.__name__} con ID {instance.pk} creado.'
            
            crear_registro(
                usuario=None, # Se puede mejorar para obtener el usuario de la request
                accion=accion,
                detalles=detalles
            )

@receiver(post_delete)
def audit_post_delete(sender, instance, **kwargs):
    """
    Registra la eliminación de una instancia de modelo.
    """
    if sender in MODELS_TO_AUDIT:
        with transaction.atomic():
            crear_registro(
                usuario=None, # Se puede mejorar para obtener el usuario de la request
                accion='MODELO_ELIMINADO',
                detalles={
                    'model_name': sender.__name__,
                    'instance_id': str(instance.pk),
                    'message': f'{sender.__name__} con ID {instance.pk} eliminado.'
                }
            )