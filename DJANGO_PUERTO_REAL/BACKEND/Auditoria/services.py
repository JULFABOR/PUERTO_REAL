from .models import RegistroAuditoria
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def _resolve_user(obj):
    """Try to resolve different types of actor objects into a Django User instance.

    Accepts:
    - Django User instance -> returned as-is
    - Request-like objects with `.user`
    - Empleados-like objects with `.user_empleado`
    - Integer primary key -> lookup User by pk
    - String -> try username then email
    - None -> returns None
    """
    if obj is None:
        return None

    # Already a User instance
    try:
        if isinstance(obj, User):
            return obj
    except Exception:
        # In some rare circular import scenarios, isinstance may fail
        pass

    # Request-like object (has .user)
    if hasattr(obj, 'user') and hasattr(obj.user, 'is_authenticated'):
        return obj.user if obj.user.is_authenticated else None

    # Empleados-like object (has .user_empleado)
    if hasattr(obj, 'user_empleado'):
        ue = getattr(obj, 'user_empleado')
        if isinstance(ue, User):
            return ue

    # If obj is an int, try pk lookup
    if isinstance(obj, int):
        try:
            return User.objects.get(pk=obj)
        except User.DoesNotExist:
            return None
        except Exception:
            return None

    # If obj is a str, try username then email
    if isinstance(obj, str):
        try:
            return User.objects.get(username=obj)
        except User.DoesNotExist:
            try:
                return User.objects.get(email=obj)
            except User.DoesNotExist:
                return None
        except Exception:
            return None

    return None


def crear_registro(usuario, accion, detalles=None):
    """
    Crea un nuevo registro de auditoría personalizado.

    This function is tolerant about the `usuario` parameter: it attempts to
    resolve Empleados instances, request objects, user ids or username/email
    strings to a Django User. If resolution fails the record is created with
    `usuario=None` but we add a textual `actor_repr` to `detalles` so the
    entry still carries some context.
    """
    try:
        detalles = detalles.copy() if detalles else {}

        resolved_user = _resolve_user(usuario)

        if resolved_user is None and usuario is not None:
            # Keep a human-readable representation when we cannot resolve FK
            try:
                detalles.setdefault('actor_repr', str(usuario))
            except Exception:
                detalles.setdefault('actor_repr', 'sistema')

        RegistroAuditoria.objects.create(
            usuario=resolved_user,
            accion=accion,
            detalles=detalles or {}
        )
    except Exception as e:
        # Log exception but don't interrupt primary flow
        logger.exception("Error al crear el registro de auditoría: %s", e)
