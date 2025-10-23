from decimal import Decimal
from django.conf import settings
from django.contrib import messages
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail

from HOME.models import Cajas, Historial_Caja, Tipo_Evento, Estados, Fondo_Pagos, Movimiento_Fondo, Empleados, Tipos_Estados
# Importar el servicio de auditoría
from Auditoria.services import crear_registro


def _event(name: str) -> Tipo_Evento:
    ev, _ = Tipo_Evento.objects.get_or_create(nombre_evento=name)
    return ev

def _caja_abierta():
    # Obtener el objeto Estado correspondiente a 'ABIERTA'
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_abierto, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    return Cajas.objects.filter(estado_caja=estado_abierto).order_by('-id_caja').first()

def _ultima_caja_cerrada():
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_cerrado, _ = Estados.objects.get_or_create(
        nombre_estado='CERRADA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    return Cajas.objects.filter(estado_caja=estado_cerrado).order_by('-id_caja').first()

def _saldo_final_de_ayer() -> Decimal:
    ult = _ultima_caja_cerrada()
    return ult.monto_cierre_caja if ult else Decimal('0.00')

def _notificar_retiro(monto, motivo, usuario, destino, aprobador=""):
    destinatarios = getattr(settings, "MANAGER_EMAILS", [])
    if not destinatarios:
        return
    subject = f"[Caja] Retiro de ${monto} ({destino})"
    cuerpo = (
        f"Fecha: {timezone.now()}\n"
        f"Empleado: {usuario.get_full_name()} ({usuario.username})\n"
        f"Motivo: {motivo}\n"
        f"Destino: {destino}\n"
        f"Aprobador: {aprobador or '—'}\n"
    )
    try:
        send_mail(subject, cuerpo, settings.DEFAULT_FROM_EMAIL, destinatarios, fail_silently=True)
    except Exception:
        pass


# ==============================================================================
# SERVICIOS DE CAJA
# ==============================================================================

def abrir_caja_service(monto_inicial: Decimal = None, desc_ajuste: str = '', empleado_actual: Empleados = None):
    if monto_inicial is None or monto_inicial == Decimal('0.00'):
        monto_inicial = _saldo_final_de_ayer()

    # Validaciones de negocio (reutilizadas de la vista)
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_abierto, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    # Usamos get_or_create para asegurar que el tipo de evento exista.
    # Esto evita un error 500 si el tipo de evento no ha sido creado previamente.
    tipo_evento_apertura, _ = Tipo_Evento.objects.get_or_create(nombre_evento='APERTURA')

    # Regla 1: Máximo 2 cajas abiertas en total.
    cajas_abiertas_count = Cajas.objects.filter(estado_caja=estado_abierto).count()
    if cajas_abiertas_count >= 2:
        raise ValueError("Límite alcanzado: Ya hay 2 cajas abiertas en el sistema.")

    # Regla 2: 1 caja abierta por empleado.
    cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
    if Cajas.objects.filter(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto).exists():
        raise ValueError(f"Ya tienes una caja abierta. No puedes abrir otra.")

    with transaction.atomic():
        nueva_caja = Cajas.objects.create(
            monto_apertura_caja=monto_inicial,
            estado_caja=estado_abierto,
            total_gastos_caja=Decimal('0.00'),
            monto_cierre_caja=Decimal('0.00'),
            monto_teorico_caja=monto_inicial,
            diferencia_caja=Decimal('0.00'),
            observaciones_caja=desc_ajuste
        )

        Historial_Caja.objects.create(
            cantidad_movida_hcaja=monto_inicial,
            caja_hc=nueva_caja,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_apertura,
            saldo_anterior_hcaja=Decimal('0.00'), # Asumiendo 0 antes de la apertura
            nuevo_saldo_hcaja=monto_inicial,
            descripcion_hcaja=desc_ajuste or 'Apertura de caja'
        )
        
        # --- REGISTRO DE AUDITORÍA ---
        crear_registro(
            usuario=getattr(empleado_actual, 'user_empleado', None),
            accion='APERTURA_CAJA',
            detalles={
                'caja_id': nueva_caja.id_caja,
                'monto_inicial': str(monto_inicial),
                'observaciones': desc_ajuste
            }
        )
        # --- FIN REGISTRO ---

    return nueva_caja

def retiro_service(monto: Decimal, motivo: str, destino: str, aprobador: str, empleado_actual: Empleados):
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_abierto, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
    caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)

    if monto > caja_activa.monto_teorico_caja:
        raise ValueError('Saldo insuficiente en caja.')

    with transaction.atomic():
        saldo_anterior = caja_activa.monto_teorico_caja
        caja_activa.monto_teorico_caja -= monto
        
        tipo_evento_retiro = None
        if destino == 'PARA_PAGOS_FONDO':
            tipo_evento_retiro = Tipo_Evento.objects.get(nombre_evento='TRANSFERENCIA_A_FONDO')
            fondo = Fondo_Pagos.objects.filter(estado_fp__nombre_estado='ACTIVO').first() # Asumiendo un estado ACTIVO para Fondo_Pagos
            if not fondo:
                fondo = Fondo_Pagos.objects.create(saldo_fp=Decimal('0.00'), estado_fp=Estados.objects.get(nombre_estado='ACTIVO')) # Asumiendo un estado ACTIVO
            fondo.saldo_fp += monto
            fondo.save(update_fields=['saldo_fp'])
            Movimiento_Fondo.objects.create(
                fondo_mov_fp=fondo, tipo_mov_fp="ENTRADA", monto_mov_fp=monto,
                motivo_mov_fp=motivo, empleado_mov_fp=empleado_actual
            )
        else: # DEPOSITAR_OTROS o OTRO
            tipo_evento_retiro = Tipo_Evento.objects.get(nombre_evento='RETIRO_EFECTIVO')
            caja_activa.total_gastos_caja += monto # Esto sí cuenta como gasto operativo
        
        caja_activa.save(update_fields=['monto_teorico_caja', 'total_gastos_caja'] if destino != 'PARA_PAGOS_FONDO' else ['monto_teorico_caja'])

        Historial_Caja.objects.create(
            cantidad_movida_hcaja=monto,
            caja_hc=caja_activa,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_retiro,
            fecha_movimiento_hcaja=timezone.now(),
            saldo_anterior_hcaja=saldo_anterior,
            nuevo_saldo_hcaja=caja_activa.monto_teorico_caja,
            descripcion_hcaja=motivo,
            destino_movimiento=destino
        )

        # --- REGISTRO DE AUDITORÍA ---
        crear_registro(
            usuario=getattr(empleado_actual, 'user_empleado', None),
            accion='RETIRO_CAJA',
            detalles={
                'caja_id': caja_activa.id_caja,
                'monto': str(monto),
                'motivo': motivo,
                'destino': destino,
                'aprobador': aprobador
            }
        )
        # --- FIN REGISTRO ---

    _notificar_retiro(monto, motivo, empleado_actual.user_empleado, destino, aprobador) # Notificar con el usuario del empleado
    return caja_activa

def rendir_fondo_service(monto: Decimal, empleado_actual: Empleados):
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_abierto, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
    caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)

    fondo = Fondo_Pagos.objects.filter(estado_fp__nombre_estado='ACTIVO').first()
    if not fondo:
        raise ValueError('No existe un Fondo de Pagos activo.')

    if monto > fondo.saldo_fp:
        raise ValueError('Saldo insuficiente en el Fondo de Pagos.')

    with transaction.atomic():
        # ↓ Fondo
        fondo.saldo_fp -= monto
        fondo.save(update_fields=['saldo_fp'])
        Movimiento_Fondo.objects.create(
            fondo_mov_fp=fondo, tipo_mov_fp="SALIDA", monto_mov_fp=monto,
            motivo_mov_fp="Rendición a Caja", empleado_mov_fp=empleado_actual
        )

        # ↓ Caja
        saldo_anterior = caja_activa.monto_teorico_caja
        caja_activa.monto_teorico_caja += monto
        caja_activa.save(update_fields=['monto_teorico_caja'])

        tipo_evento_rendicion = Tipo_Evento.objects.get(nombre_evento='TRANSFERENCIA_DESDE_FONDO')
        Historial_Caja.objects.create( # This was already correct, but I'll make sure it's consistent
            cantidad_movida_hcaja=monto,
            caja_hc=caja_activa,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_rendicion,
            fecha_movimiento_hcaja=timezone.now(),
            saldo_anterior_hcaja=saldo_anterior,
            nuevo_saldo_hcaja=caja_activa.monto_teorico_caja,
            descripcion_hcaja="Rendición Fondo"
        )
    return caja_activa

# En Abrir_Cerrar_CAJA/services.py
# (Reemplaza la función original por esta)

def cerrar_caja_service(monto_cierre_real: Decimal, observaciones_cierre: str, empleado_actual: Empleados):
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='Caja')
    estado_abierto, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    

    try:
        cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
        caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)
    except Cajas.DoesNotExist:
        raise ValueError("No se encontró una caja abierta activa para este empleado.")
    except Cajas.MultipleObjectsReturned:
        raise ValueError("Error: Este empleado tiene múltiples cajas abiertas. Contacte a un administrador.")
    # --- FIN CORRECCIÓN 1 ---

    with transaction.atomic():
        estado_cerrado, _ = Estados.objects.get_or_create(
            nombre_estado='CERRADA',
            defaults={'tipo_estado': tipo_estado_caja}
        )
        tipo_evento_cierre, _ = Tipo_Evento.objects.get_or_create(nombre_evento='CIERRE')

        monto_teorico = caja_activa.monto_teorico_caja
        diferencia = monto_cierre_real - monto_teorico

        caja_activa.monto_cierre_caja = monto_cierre_real
        caja_activa.diferencia_caja = diferencia
        caja_activa.observaciones_caja = observaciones_cierre
        caja_activa.estado_caja = estado_cerrado
        
        # --- CORRECCIÓN 2: Asignar el empleado de cierre ---
        # (Asumo que el campo se llama 'empleado_cierre_caja')
        if hasattr(caja_activa, 'empleado_cierre_caja'):
            caja_activa.empleado_cierre_caja = empleado_actual
        # --- FIN CORRECCIÓN 2 ---
        
        # Especificamos los campos a guardar (es una mejor práctica)
        # Asegúrate de que 'empleado_cierre_caja' esté en tu modelo Cajas
        update_fields_list = [
            'monto_cierre_caja', 
            'diferencia_caja', 
            'observaciones_caja', 
            'estado_caja',
        ]
        
        # Añadimos el campo de empleado_cierre solo si existe en el modelo
        if hasattr(caja_activa, 'empleado_cierre_caja'):
            update_fields_list.append('empleado_cierre_caja')
            
        caja_activa.save(update_fields=update_fields_list)

        Historial_Caja.objects.create(
            cantidad_movida_hcaja=monto_cierre_real,
            caja_hc=caja_activa,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_cierre,
            fecha_movimiento_hcaja=timezone.now(),
            saldo_anterior_hcaja=monto_teorico,
            nuevo_saldo_hcaja=monto_cierre_real,
            descripcion_hcaja=observaciones_cierre or 'Cierre de caja'
        )
        
        # --- REGISTRO DE AUDITORÍA ---
        crear_registro(
            usuario=getattr(empleado_actual, 'user_empleado', None),
            accion='CIERRE_CAJA',
            detalles={
                'caja_id': caja_activa.id_caja,
                'monto_teorico': str(monto_teorico),
                'monto_real': str(monto_cierre_real),
                'diferencia': str(diferencia),
                'observaciones': observaciones_cierre
            }
        )
        # --- FIN REGISTRO ---
    return caja_activa
def ajustar_caja_service(monto_ajuste: Decimal, motivo_ajuste: str, empleado_actual: Empleados):
    """
    Ajusta el saldo de la caja activa registrando un movimiento de ajuste.
    """
    caja_activa = _caja_abierta()
    if not caja_activa:
        raise ValueError("No hay una caja abierta para ajustar.")

    with transaction.atomic():
        saldo_anterior = caja_activa.monto_teorico_caja
        nuevo_saldo = saldo_anterior + monto_ajuste

        caja_activa.monto_teorico_caja = nuevo_saldo
        caja_activa.save(update_fields=['monto_teorico_caja'])

        tipo_evento_ajuste, _ = Tipo_Evento.objects.get_or_create(nombre_evento='AJUSTE')

        Historial_Caja.objects.create(
            cantidad_movida_hcaja=monto_ajuste,
            caja_hc=caja_activa,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_ajuste,
            fecha_movimiento_hcaja=timezone.now(),
            saldo_anterior_hcaja=saldo_anterior,
            nuevo_saldo_hcaja=nuevo_saldo,
            descripcion_hcaja=motivo_ajuste
        )

        # --- REGISTRO DE AUDITORÍA ---
        crear_registro(
            usuario=getattr(empleado_actual, 'user_empleado', None),
            accion='AJUSTE_CAJA',
            detalles={
                'caja_id': caja_activa.id_caja,
                'monto_ajuste': str(monto_ajuste),
                'motivo': motivo_ajuste,
                'saldo_anterior': str(saldo_anterior),
                'nuevo_saldo': str(nuevo_saldo)
            }
        )
        # --- FIN REGISTRO ---

    return caja_activa
