from django.shortcuts import render

# Create your views here.
from decimal import Decimal
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import render, redirect
from django.utils import timezone

from .forms import AperturaCajaForm, RetiroEfectivoForm, RendirFondoForm
from HOME.models import Cajas, Historial_Caja, Tipo_Evento, Estados, Fondo_Pagos, Movimiento_Fondo, Empleados


# ====== Helpers ======

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


# ====== 1) Apertura de Caja ======

@login_required
def abrir_caja(request):
    if _caja_abierta():
        messages.error(request, "Ya existe una caja abierta.")
        return redirect("panel_caja")

    monto_sugerido = _saldo_final_de_ayer()
    form = AperturaCajaForm(request.POST or None, monto_sugerido=monto_sugerido)

    if request.method == "POST" and form.is_valid():
        monto_inicial = form.cleaned_data["monto_inicial"]
        desc_ajuste = (form.cleaned_data.get("desc_ajuste") or "").strip()

        with transaction.atomic():
            caja = Cajas.objects.create(
                total_gastos_caja=Decimal('0.00'),
                total_ventas_caja=Decimal('0.00'),
                monto_apertura_caja=monto_inicial,
                monto_cierre_caja=Decimal('0.00'),
                monto_teorico_caja=monto_inicial,   # usamos como saldo_actual
                diferencia_caja=Decimal('0.00'),
                observaciones_caja=desc_ajuste,
                estado_caja=Estados.ACTIVO
            )

            if monto_inicial != (monto_sugerido or Decimal('0.00')):
                Historial_Caja.objects.create(
                    cantidad_hcaja=str(monto_inicial),
                    caja_hc=caja,
                    empleado_hc=request.user.empleado,
                    tipo_event_caja=_event("AJUSTE_MONTO_INICIAL"),
                    # Tus modelos son IntegerField; casteo a int
                    saldo_anterior_hcaja=int(monto_sugerido or 0),
                    nuevo_saldo_hcaja=int(monto_inicial),
                    descripcion_hcaja=desc_ajuste or "Ajuste manual del monto inicial"
                )

        messages.success(request, f"Caja abierta con ${monto_inicial}.")
        return redirect("panel_caja")

    return render(request, "caja/abrir.html", {"form": form, "monto_sugerido": monto_sugerido})


# ====== 2) Retiro a Medio Turno (normal o a Fondo) ======

@login_required
def retiro_medio_turno(request):
    caja = _caja_abierta()
    if not caja:
        messages.error(request, "No hay caja abierta.")
        return redirect("panel_caja")

    form = RetiroEfectivoForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        monto = form.cleaned_data["monto_retiro"]
        motivo = form.cleaned_data["motivo"]
        destino = form.cleaned_data["destino"]  # 'deposito' o 'fondo'
        aprobador = (form.cleaned_data.get("aprobador") or "").strip()

        if monto > caja.monto_teorico_caja:
            form.add_error("monto_retiro", "Saldo insuficiente en caja.")
        else:
            if destino == "fondo":
                fondo = Fondo_Pagos.objects.filter(activo=True).order_by('-id').first()
                if not fondo:
                    fondo = Fondo_Pagos.objects.create(nombre=f"Fondo Proveedores - {timezone.localdate()}")

                with transaction.atomic():
                    saldo_anterior = caja.monto_teorico_caja
                    caja.monto_teorico_caja = (caja.monto_teorico_caja - monto)
                    caja.save(update_fields=["monto_teorico_caja"])

                    Historial_Caja.objects.create(
                        cantidad_hcaja=str(monto),
                        caja_hc=caja,
                        empleado_hc=request.user.empleado,
                        tipo_event_caja=_event("TRANSFERENCIA_A_FONDO"),
                        saldo_anterior_hcaja=int(saldo_anterior),
                        nuevo_saldo_hcaja=int(caja.monto_teorico_caja),
                        descripcion_hcaja=motivo
                    )

                    fondo.saldo = (fondo.saldo + monto)
                    fondo.save(update_fields=["saldo"])

                    Movimiento_Fondo.objects.create(
                        fondo=fondo, tipo="ENTRADA", monto=monto,
                        motivo="Transferencia desde Caja",
                        referencia_id=None, empleado=request.user.empleado
                    )

                messages.success(request, f"Transferidos ${monto} al Fondo de Pagos.")
                _notificar_retiro(monto, motivo, request.user, destino="Fondo", aprobador=aprobador)
                return redirect("panel_caja")

            # --- Destino: Depositar/otros (egreso 'real') ---
            with transaction.atomic():
                saldo_anterior = caja.monto_teorico_caja
                caja.monto_teorico_caja = (caja.monto_teorico_caja - monto)
                caja.total_gastos_caja = (caja.total_gastos_caja + monto)
                caja.save(update_fields=["monto_teorico_caja", "total_gastos_caja"])

                Historial_Caja.objects.create(
                    cantidad_hcaja=str(monto),
                    caja_hc=caja,
                    empleado_hc=request.user.empleado,
                    tipo_event_caja=_event("RETIRO_EFECTIVO"),
                    saldo_anterior_hcaja=int(saldo_anterior),
                    nuevo_saldo_hcaja=int(caja.monto_teorico_caja),
                    descripcion_hcaja=motivo
                )

            messages.success(request, f"Retiro registrado por ${monto}.")
            _notificar_retiro(monto, motivo, request.user, destino="Depositar/otros", aprobador=aprobador)
            return redirect("panel_caja")

    return render(request, "caja/retiro.html", {"form": form, "caja": caja})


# ====== 3) Rendir Fondo de Pagos ======

@login_required
def rendir_fondo(request):
    caja = _caja_abierta()
    if not caja:
        messages.error(request, "No hay caja abierta.")
        return redirect("panel_caja")

    fondo = Fondo_Pagos.objects.filter(activo=True).order_by('-id').first()
    if not fondo:
        messages.error(request, "No existe un Fondo de Pagos activo.")
        return redirect("panel_caja")

    form = RendirFondoForm(request.POST or None, saldo_fondo=fondo.saldo)

    if request.method == "POST" and form.is_valid():
        monto = form.cleaned_data["monto_a_devolver"]

        with transaction.atomic():
            # ↓ Fondo
            fondo.saldo = (fondo.saldo - monto)
            fondo.save(update_fields=["saldo"])
            Movimiento_Fondo.objects.create(
                fondo=fondo, tipo="SALIDA", monto=monto,
                motivo="Rendición a Caja", referencia_id=None,
                empleado=request.user.empleado
            )

            # ↓ Caja
            saldo_anterior = caja.monto_teorico_caja
            caja.monto_teorico_caja = (caja.monto_teorico_caja + monto)
            caja.save(update_fields=["monto_teorico_caja"])

            Historial_Caja.objects.create(
                cantidad_hcaja=str(monto),
                caja_hc=caja,
                empleado_hc=request.user.empleado,
                tipo_event_caja=_event("TRANSFERENCIA_DESDE_FONDO"),
                saldo_anterior_hcaja=int(saldo_anterior),
                nuevo_saldo_hcaja=int(caja.monto_teorico_caja),
                descripcion_hcaja="Rendición Fondo"
            )

        messages.success(request, f"Rendido ${monto} a Caja.")
        return redirect("panel_caja")

    return render(request, "caja/rendir_fondo.html", {"form": form, "fondo": fondo})
