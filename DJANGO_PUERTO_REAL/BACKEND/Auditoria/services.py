from .models import RegistroAuditoria

def crear_registro(usuario, accion, detalles=None):
    """
    Crea un nuevo registro de auditoría personalizado.

    Args:
        usuario (User): La instancia del usuario que realiza la acción.
                        Puede ser None si la acción es del sistema.
        accion (str): El código de la acción (ej. 'APERTURA_CAJA').
                      Debe coincidir con una de las opciones en ACCION_CHOICES.
        detalles (dict, optional): Un diccionario con datos JSON adicionales.
                                   Defaults to None.
    """
    try:
        # Asegurarse de que el usuario es el objeto de usuario y no el nombre de usuario
        user_instance = usuario if hasattr(usuario, 'is_authenticated') else None
        
        RegistroAuditoria.objects.create(
            usuario=user_instance,
            accion=accion,
            detalles=detalles or {}
        )
    except Exception as e:
        # En un sistema de producción, aquí podrías loggear el error
        # a un sistema de monitoreo para no interrumpir el flujo principal.
        print(f"Error al crear el registro de auditoría: {e}")
