from decimal import Decimal
from django.conf import settings
from django.contrib import messages
from django.db import transaction
from django.utils import timezone

from HOME.models import Cajas, Historial_Caja, Tipo_Evento, Estados, Fondo_Pagos, Movimiento_Fondo, Empleados
# Importar el servicio de auditoría
from Auditoria.services import crear_registro


def _event(name: str) -> Tipo_Evento:
    ev, _ = Tipo_Evento.objects.get_or_create(nombre_evento=name)
    return ev

def _caja_abierta():
    # Mapeo: usamos Estados.ACTIVO como "ABIERTO"
    return Cajas.objects.filter(estado_caja=Estados.ACTIVO).order_by('-id_caja').first()

def _ultima_caja_cerrada():
    return Cajas.objects.filter(estado_caja=Estados.CERRADA).order_by('-id_caja').first()

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

def abrir_caja_service(monto_inicial: Decimal, desc_ajuste: str, empleado_actual: Empleados):
    # Validaciones de negocio (reutilizadas de la vista)
    estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
    tipo_evento_apertura = Tipo_Evento.objects.get(nombre_evento='APERTURA')

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
            cantidad_movida_hcaja=str(monto_inicial),
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
    estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
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
                fondo = Fondo_Pagos.objects.create(nombre_fp="Fondo de Pagos por Defecto", saldo_fp=Decimal('0.00'), estado_fp=Estados.objects.get(nombre_estado='ACTIVO')) # Asumiendo un estado ACTIVO
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
            cantidad_movida_hcaja=str(monto),
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
    estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
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
        Historial_Caja.objects.create(
            cantidad_movida_hcaja=str(monto),
            caja_hc=caja_activa,
            empleado_hc=empleado_actual,
            tipo_event_caja=tipo_evento_rendicion,
            fecha_movimiento_hcaja=timezone.now(),
            saldo_anterior_hcaja=saldo_anterior,
            nuevo_saldo_hcaja=caja_activa.monto_teorico_caja,
            descripcion_hcaja="Rendición Fondo"
        )
    return caja_activa

def cerrar_caja_service(monto_cierre_real: Decimal, observaciones_cierre: str, empleado_actual: Empleados):
    estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
    cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
    caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)

    with transaction.atomic():
        estado_cerrado = Estados.objects.get(nombre_estado='CERRADO')
        tipo_evento_cierre = Tipo_Evento.objects.get(nombre_evento='CIERRE')

        monto_teorico = caja_activa.monto_teorico_caja
        diferencia = monto_cierre_real - monto_teorico

        caja_activa.monto_cierre_caja = monto_cierre_real
        caja_activa.diferencia_caja = diferencia
        caja_activa.observaciones_caja = observaciones_cierre # Actualizar observaciones con las del cierre
        caja_activa.estado_caja = estado_cerrado
        caja_activa.save()

        Historial_Caja.objects.create(
            cantidad_movida_hcaja=str(monto_cierre_real),
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