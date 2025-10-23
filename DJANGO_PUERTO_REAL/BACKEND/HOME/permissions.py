from rest_framework.permissions import BasePermission
from rest_framework.exceptions import APIException
from django.utils.translation import gettext_lazy as _

from .models import Cajas, Empleados, Historial_Caja, Estados

class CajaAbiertaRequired(BasePermission):
    """
    Permiso de DRF que verifica si el usuario (empleado) tiene una caja en estado 'ABIERTO'.
    """
    message = 'No tienes una caja abierta. Por favor, abre una para continuar.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            empleado = request.user.empleado
        except Empleados.DoesNotExist:
            # Si el usuario no es un empleado, no puede tener caja.
            # Lanzamos una excepción para dar un mensaje más claro que el genérico.
            raise APIException(
                detail='El usuario actual no es un empleado registrado y no puede realizar esta operación.',
                code='not_an_employee'
            )

        # Usamos select_related para optimizar la consulta y evitar joins adicionales más adelante.
        caja_abierta = Cajas.objects.filter(
            estado_caja__nombre_estado='ABIERTA',
            historial_caja__empleado_hc=empleado
        ).select_related('estado_caja').first()

        if not caja_abierta:
            # El empleado no tiene ninguna caja abierta.
            # El `message` de la clase se usará en la respuesta de error 403.
            return False

        # Verificamos si hay más de una caja abierta para este empleado, lo cual es un error de datos.
        if Cajas.objects.filter(estado_caja__nombre_estado='ABIERTA', historial_caja__empleado_hc=empleado).count() > 1:
            raise APIException(detail='Error de consistencia de datos: Tienes más de una caja abierta.', code='multiple_open_cajas')

        # Adjuntamos la caja activa al request para que pueda ser usada en la vista.
        request.caja_activa = caja_abierta
        return True