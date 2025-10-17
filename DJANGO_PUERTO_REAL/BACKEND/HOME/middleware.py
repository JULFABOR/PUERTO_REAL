from django.shortcuts import redirect
from django.contrib import messages
from .models import Cajas, Empleados

def requiere_caja_abierta(view_func):
    """
    Decorador que verifica si el usuario (empleado) tiene una caja en estado 'ABIERTO'.
    Si no la tiene, lo redirige a otra página.
    """
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')

        try:
            empleado = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "El usuario actual no es un empleado registrado.")
            return redirect('home')

        # Buscar una caja abierta asociada a este empleado de forma eficiente.
        cajas_abiertas = Cajas.objects.filter(
            estado_caja__nombre_estado='ABIERTO',
            historial_caja__empleado_hc=empleado
        ).distinct()

        caja_activa = cajas_abiertas.first()

        if not caja_activa:
            messages.error(request, "No tienes una caja abierta. Por favor, abre una para continuar.")
            return redirect('abrir_caja')

        if cajas_abiertas.count() > 1:
            messages.error(request, "Error de consistencia de datos: Tienes más de una caja abierta.")
            return redirect('home')

        request.caja_activa = caja_activa
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view