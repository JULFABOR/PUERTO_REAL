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

from . import services # Importamos el módulo de servicios


# ====== 1) Apertura de Caja ======

@login_required
def abrir_caja(request):
    if services._caja_abierta():
        messages.error(request, "Ya existe una caja abierta.")
        return redirect("panel_caja")

    monto_sugerido = services._saldo_final_de_ayer()
    form = AperturaCajaForm(request.POST or None, monto_sugerido=monto_sugerido)

    if request.method == "POST" and form.is_valid():
        monto_inicial = form.cleaned_data["monto_inicial"]
        desc_ajuste = (form.cleaned_data.get("desc_ajuste") or "").strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "Tu usuario no está asociado a un empleado.")
            return render(request, 'caja/abrir.html', {"form": form, "monto_sugerido": monto_sugerido})

        try:
            services.abrir_caja_service(monto_inicial, desc_ajuste, empleado_actual)
            messages.success(request, f"Caja abierta con ${monto_inicial}.")
            return redirect("panel_caja")
        except ValueError as e:
            messages.error(request, str(e))
            return render(request, "caja/abrir.html", {"form": form, "monto_sugerido": monto_sugerido})

    return render(request, "caja/abrir.html", {"form": form, "monto_sugerido": monto_sugerido})


# ====== 2) Retiro a Medio Turno (normal o a Fondo) ======

@login_required
def retiro_medio_turno(request):
    caja = services._caja_abierta()
    if not caja:
        messages.error(request, "No hay caja abierta.")
        return redirect("panel_caja")

    form = RetiroEfectivoForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        monto = form.cleaned_data["monto_retiro"]
        motivo = form.cleaned_data["motivo"]
        destino = form.cleaned_data["destino"]  # 'deposito' o 'fondo'
        aprobador = (form.cleaned_data.get("aprobador") or "").strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "Tu usuario no está asociado a un empleado.")
            return render(request, 'caja/retiro.html', {"form": form, "caja": caja})

        try:
            services.retiro_service(monto, motivo, destino, aprobador, empleado_actual)
            messages.success(request, f"Retiro registrado por ${monto}.")
            return redirect("panel_caja")
        except ValueError as e:
            form.add_error("monto_retiro", str(e)) # Añadir error al campo monto_retiro
            return render(request, "caja/retiro.html", {"form": form, "caja": caja})

    return render(request, "caja/retiro.html", {"form": form, "caja": caja})


# ====== 3) Rendir Fondo de Pagos ======

@login_required
def rendir_fondo(request):
    caja = services._caja_abierta()
    if not caja:
        messages.error(request, "No hay caja abierta.")
        return redirect("panel_caja")

    fondo = services.Fondo_Pagos.objects.filter(estado_fp__nombre_estado='ACTIVO').first() # Asumiendo un estado ACTIVO para Fondo_Pagos
    if not fondo:
        messages.error(request, "No existe un Fondo de Pagos activo.")
        return redirect("panel_caja")

    form = RendirFondoForm(request.POST or None, saldo_fondo=fondo.saldo_fp)

    if request.method == "POST" and form.is_valid():
        monto = form.cleaned_data["monto_a_devolver"]

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "Tu usuario no está asociado a un empleado.")
            return render(request, 'caja/rendir_fondo.html', {"form": form, "fondo": fondo})

        try:
            services.rendir_fondo_service(monto, empleado_actual)
            messages.success(request, f"Rendido ${monto} a Caja.")
            return redirect("panel_caja")
        except ValueError as e:
            form.add_error("monto_a_devolver", str(e))
            return render(request, "caja/rendir_fondo.html", {"form": form, "fondo": fondo})

    return render(request, "caja/rendir_fondo.html", {"form": form, "fondo": fondo})


# ==============================================================================
# API VIEWS
# ==============================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import Serializer, DecimalField, CharField, ChoiceField
from django.db import transaction

from HOME.models import Cajas, Historial_Caja, Tipo_Evento, Estados, Fondo_Pagos, Movimiento_Fondo, Empleados
from .serializers import AperturaCajaInputSerializer, CajasSerializer, HistorialCajaSerializer, RetiroInputSerializer, RendirFondoInputSerializer, CerrarCajaInputSerializer, MovimientoFondoInputSerializer, MovimientoFondoSerializer


class AbrirCajaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AperturaCajaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto_inicial = serializer.validated_data['monto_inicial']
        desc_ajuste = serializer.validated_data.get('desc_ajuste', '').strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            nueva_caja = services.abrir_caja_service(monto_inicial, desc_ajuste, empleado_actual)
            return Response(CajasSerializer(nueva_caja).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTO' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Tipo_Evento.DoesNotExist:
            return Response({'detail': "Error de configuración: El tipo de evento 'APERTURA' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistorialCajaListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = HistorialCajaSerializer

    def get_queryset(self):
        # Filtra el historial por la caja abierta del empleado actual
        try:
            empleado_actual = self.request.user.empleado
        except Empleados.DoesNotExist:
            return Historial_Caja.objects.none() # O lanzar una excepción si se prefiere

        try:
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
            cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
            caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)
            return Historial_Caja.objects.filter(caja_hc=caja_activa).order_by('-fecha_movimiento_hcaja')
        except Cajas.DoesNotExist:
            return Historial_Caja.objects.none() # No hay caja abierta, no hay historial para mostrar
        except Estados.DoesNotExist:
            # Esto debería ser manejado por un error de configuración en el inicio de la app
            return Historial_Caja.objects.none()


class RetiroAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = RetiroInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto = serializer.validated_data['monto_retiro']
        motivo = serializer.validated_data['motivo']
        destino = serializer.validated_data['destino']
        aprobador = serializer.validated_data.get('aprobador', '').strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            services.retiro_service(monto, motivo, destino, aprobador, empleado_actual)
            return Response({'detail': f'Retiro de ${monto} registrado exitosamente.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTO' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Tipo_Evento.DoesNotExist:
            return Response({'detail': "Error de configuración: El tipo de evento para retiro no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class RendirFondoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = RendirFondoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto = serializer.validated_data['monto_a_devolver']

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            services.rendir_fondo_service(monto, empleado_actual)
            return Response({'detail': f'Rendido ${monto} a Caja exitosamente.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTO' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Tipo_Evento.DoesNotExist:
            return Response({'detail': "Error de configuración: El tipo de evento para rendición no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class CerrarCajaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = CerrarCajaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto_cierre_real = serializer.validated_data['monto_cierre_real']
        observaciones_cierre = serializer.validated_data.get('observaciones_cierre', '').strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            services.cerrar_caja_service(monto_cierre_real, observaciones_cierre, empleado_actual)
            return Response({'detail': 'Caja cerrada exitosamente.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTO' o 'CERRADO' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Tipo_Evento.DoesNotExist:
            return Response({'detail': "Error de configuración: El tipo de evento para cierre no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CajaEstadoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTO')
            cajas_del_empleado_ids = Historial_Caja.objects.filter(empleado_hc=empleado_actual).values_list('caja_hc_id', flat=True)
            caja_activa = Cajas.objects.get(id_caja__in=cajas_del_empleado_ids, estado_caja=estado_abierto)
            return Response(CajasSerializer(caja_activa).data, status=status.HTTP_200_OK)
        except Cajas.DoesNotExist:
            return Response({'detail': 'No hay caja abierta para este empleado.'}, status=status.HTTP_404_NOT_FOUND)
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTO' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





class MovimientoFondoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MovimientoFondoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto = serializer.validated_data['monto']
        motivo = serializer.validated_data.get('motivo', '').strip()
        tipo = serializer.validated_data['tipo']

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        fondo = Fondo_Pagos.objects.filter(estado_fp__nombre_estado='ACTIVO').first() # Asumiendo un estado ACTIVO para Fondo_Pagos
        if not fondo:
            return Response({'detail': 'No existe un Fondo de Pagos activo.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if tipo == 'SALIDA':
                if monto > fondo.saldo_fp:
                    return Response({'monto': ['Saldo insuficiente en el Fondo de Pagos para este retiro.']}, status=status.HTTP_400_BAD_REQUEST)
                fondo.saldo_fp -= monto
            else: # ENTRADA
                fondo.saldo_fp += monto
            fondo.save(update_fields=['saldo_fp'])

            Movimiento_Fondo.objects.create(
                fondo=fondo, tipo_mov_fp=tipo, monto_mov_fp=monto,
                motivo_mov_fp=motivo,
                empleado_mov_fp=empleado_actual
            )

            return Response({'detail': f'Movimiento de ${monto} ({tipo}) en Fondo de Pagos registrado exitosamente.', 'saldo_actual_fondo': fondo.saldo_fp}, status=status.HTTP_200_OK)


class MovimientoFondoListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MovimientoFondoSerializer

    def get_queryset(self):
        # Filtra los movimientos por el fondo de pagos activo
        fondo = Fondo_Pagos.objects.filter(estado_fp__nombre_estado='ACTIVO').first()
        if not fondo:
            return Movimiento_Fondo.objects.none() # No hay fondo activo, no hay movimientos
        return Movimiento_Fondo.objects.filter(fondo_mov_fp=fondo).order_by('-fecha_mov_fp')