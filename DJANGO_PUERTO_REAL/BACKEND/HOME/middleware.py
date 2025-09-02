from django.shortcuts import redirect
from django.contrib import messages
from .models import Cajas, Empleados, Historial_Caja, Estados

def requiere_caja_abierta(view_func):
    """
    Decorador que verifica si el usuario (empleado) tiene una caja en estado 'ABIERTO'.
    Si no la tiene, lo redirige a otra página.
    """
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            # Si el usuario no está logueado, redirigir al login.
            return redirect('login')

        try:
            # 1. Obtener el empleado a partir del usuario.
            empleado = request.user.empleado
        except Empleados.DoesNotExist:
            # Si el usuario no es un empleado, no puede operar cajas.
            messages.error(request, "El usuario actual no es un empleado registrado.")
            return redirect('home') # Redirigir a una página principal o de error.

        # 2. Encontrar las cajas asociadas a este empleado a través del historial.
        cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado).values_list('caja_hc_id', flat=True)

        # 3. Buscar si alguna de esas cajas está en estado 'ABIERTO'.
        try:
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
            caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)
            
            # 4. Adjuntar la caja activa al request para usarla en la vista.
            request.caja_activa = caja_activa

        except Estados.DoesNotExist:
            # Error de configuración: El estado 'ABIERTO' no existe en la BD.
            messages.error(request, "Error de configuración: El estado de caja 'ABIERTO' no está definido.")
            return redirect('home')
        except Cajas.DoesNotExist:
            # El empleado no tiene ninguna caja abierta.
            messages.error(request, "No tienes una caja abierta. Por favor, abre una para continuar.")
            return redirect('abrir_caja') # Asume que tienes una URL llamada 'abrir_caja'.
        except Cajas.MultipleObjectsReturned:
            # Error de datos: El empleado tiene más de una caja abierta, lo cual no debería ocurrir.
            messages.error(request, "Error de consistencia de datos: Tienes más de una caja abierta.")
            return redirect('home')

        # 5. Si todo está bien, ejecutar la vista original.
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view