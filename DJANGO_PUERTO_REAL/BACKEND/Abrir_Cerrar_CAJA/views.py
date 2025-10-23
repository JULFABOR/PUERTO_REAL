# Django and Python standard library imports
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import render, redirect
from django.db.models.functions import TruncDate
from django.utils import timezone

# Third-party library imports
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

# Local application imports
from .forms import AperturaCajaForm, RetiroEfectivoForm, RendirFondoForm
from .models import Cajas, Historial_Caja, Tipo_Evento, Fondo_Pagos, Movimiento_Fondo
from .serializers import (
    AperturaCajaInputSerializer, CajasSerializer, HistorialCajaSerializer,
    RetiroInputSerializer, RendirFondoInputSerializer, CerrarCajaInputSerializer,
    MovimientoFondoInputSerializer, MovimientoFondoSerializer, AjusteCajaInputSerializer
)
from . import services
from autenticacion.models import Empleados
from Config_PR.models import Estados


# ====== 1) Apertura de Caja ======

@login_required
def panel_caja(request):
    caja = services._caja_abierta()

    if caja:
        # Si la caja está abierta, simplemente mostramos el panel
        return render(request, "Abrir_Cerrar_CAJA/Caja.html", {"caja_abierta": True, "caja": caja})

    # Si la caja está cerrada, manejamos la apertura
    monto_sugerido = services._saldo_final_de_ayer()
    form = AperturaCajaForm(request.POST or None, monto_sugerido=monto_sugerido)

    if request.method == "POST" and form.is_valid():
        monto_inicial = form.cleaned_data["monto_inicial"]
        desc_ajuste = (form.cleaned_data.get("desc_ajuste") or "").strip()

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            messages.error(request, "Tu usuario no está asociado a un empleado.")
            # Re-render the form with the error
            return render(request, "Abrir_Cerrar_CAJA/Caja.html", {
                "caja_abierta": False,
                "form": form,
                "monto_sugerido": monto_sugerido
            })

        try:
            services.abrir_caja_service(monto_inicial, desc_ajuste, empleado_actual)
            messages.success(request, f"Caja abierta con ${monto_inicial}.")
            return redirect("panel_caja")
        except ValueError as e:
            messages.error(request, str(e))
            # Re-render the form with the error
            return render(request, "Abrir_Cerrar_CAJA/Caja.html", {
                "caja_abierta": False,
                "form": form,
                "monto_sugerido": monto_sugerido
            })

    # Si es GET o el formulario no es válido, mostramos la vista de caja cerrada con el formulario
    return render(request, "Abrir_Cerrar_CAJA/Caja.html", {
        "caja_abierta": False,
        "form": form,
        "monto_sugerido": monto_sugerido
    })


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

    estado_activo = Estados.objects.get(nombre_estado='ACTIVO')
    fondo = services.Fondo_Pagos.objects.filter(estado_fp=estado_activo).first()
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
        empleado_actual = getattr(self.request.user, 'empleado', None)
        if not empleado_actual:
            return Historial_Caja.objects.none()

        date_str = self.request.query_params.get('date', None)
        
        if date_str:
            try:
                target_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                target_date = timezone.now().date() # Fallback a hoy si el formato es incorrecto
        else:
            target_date = timezone.now().date()

        return Historial_Caja.objects.filter(
            empleado_hc=empleado_actual,
            fecha_movimiento_hcaja__date=target_date
        ).order_by('-fecha_movimiento_hcaja')

class DistinctHistoryDatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        empleado_actual = getattr(request.user, 'empleado', None)
        if not empleado_actual:
            return Response([], status=status.HTTP_200_OK)

        dates = Historial_Caja.objects.filter(
            empleado_hc=empleado_actual
        ).annotate(
            date=TruncDate('fecha_movimiento_hcaja')
        ).values_list('date', flat=True).distinct().order_by('-date')
        
        return Response(dates)

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
        except Exception as e:
            return Response({'detail': f'Ocurrió un error inesperado al cerrar la caja: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AjustarCajaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AjusteCajaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto_ajuste = serializer.validated_data['monto_ajuste']
        motivo_ajuste = serializer.validated_data['motivo_ajuste']

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            services.ajustar_caja_service(monto_ajuste, motivo_ajuste, empleado_actual)
            return Response({'detail': 'Ajuste de caja registrado exitosamente.'}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CajaEstadoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Intenta obtener el perfil de empleado del usuario.
        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            # Si el usuario no tiene un perfil de empleado, no puede tener una caja.
            # Devuelve un estado de caja cerrada.
            return Response({'caja_abierta': False, 'detail': 'Usuario no es un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        # Busca una caja que esté en estado 'ABIERTO'.
        caja_abierta = Cajas.objects.filter(estado_caja__nombre_estado='ABIERTA').first()

        if caja_abierta:
            # Si se encuentra una caja abierta, serializa sus datos y los devuelve.
            # El serializador se encarga de calcular el saldo actual y otros detalles.
            serializer = CajasSerializer(caja_abierta)
            return Response(serializer.data)
        else:
            # Si no hay ninguna caja abierta, buscar la fecha del último cierre.
            ultimo_evento_cierre = Historial_Caja.objects.filter(
                tipo_event_caja__nombre_evento='CIERRE'
            ).order_by('-fecha_movimiento_hcaja').first()
            
            ultimo_cierre_fecha = None
            if ultimo_evento_cierre:
                ultimo_cierre_fecha = ultimo_evento_cierre.fecha_movimiento_hcaja

            return Response({
                'caja_abierta': False,
                'ultimo_cierre': ultimo_cierre_fecha
            })





class MovimientoFondoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MovimientoFondoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto = serializer.validated_data['monto']
        motivo = serializer.validated_.get('motivo', '').strip()
        tipo = serializer.validated_data['tipo']

        try:
            empleado_actual = request.user.empleado
        except Empleados.DoesNotExist:
            return Response({'detail': 'Tu usuario no está asociado a un empleado.'}, status=status.HTTP_403_FORBIDDEN)

        estado_activo = Estados.objects.get(nombre_estado='ACTIVO')
        fondo = Fondo_Pagos.objects.filter(estado_fp=estado_activo).first()
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
        estado_activo = Estados.objects.get(nombre_estado='ACTIVO')
        fondo = Fondo_Pagos.objects.filter(estado_fp=estado_activo).first()
        if not fondo:
            return Movimiento_Fondo.objects.none() # No hay fondo activo, no hay movimientos
        
        # Usamos select_related para optimizar y evitar N+1 queries
        return Movimiento_Fondo.objects.filter(fondo_mov_fp=fondo).select_related(
            'fondo_mov_fp__estado_fp',
            'empleado_mov_fp__user_empleado',
            'tipo_mov_fp'
        ).order_by('-fecha_mov_fp')

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

# ==============================================================================
# VIEWSET PARA LISTAR CAJAS (ESTO ES LO QUE TE FALTA)
# ==============================================================================

class CajaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para obtener una lista de Cajas y ver su detalle.
    
    Permite filtrar por estado, por ejemplo:
    /api/cajas/?estado_caja__nombre_estado=ABIERTA
    /api/cajas/?estado_caja=1
    """
    permission_classes = [IsAuthenticated]
    
    # Usamos el CajasSerializer que ya tienes (lo vi en tus imports)
    serializer_class = CajasSerializer
    
    # Optimizamos la consulta para incluir el estado y el empleado
    queryset = Cajas.objects.select_related(
        'estado_caja',
        # 'empleado_apertura_caja__user_empleado', # Estos campos no existen en el modelo Cajas
        # 'empleado_cierre_caja__user_empleado'    # Estos campos no existen en el modelo Cajas
    ).all().order_by('-id_caja')
    
    # --- ESTA ES LA LÍNEA CLAVE QUE CORRIGE TU ERROR 500 ---
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'estado_caja': ['exact'],
        'estado_caja__nombre_estado': ['exact'],
    }
    ordering_fields = ['id_caja', 'monto_cierre_caja'] # 'monto_final_caja' no existe, se usa 'monto_cierre_caja'