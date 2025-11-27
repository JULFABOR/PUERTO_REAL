# Django and Python standard library imports
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import render, redirect
from django.db.models.functions import TruncDate, Coalesce
from django.utils import timezone
from django.db.models import Sum, Q, DecimalField
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

# Third-party library imports
from rest_framework import status, generics, viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authentication import TokenAuthentication



# Local application imports
from .forms import AperturaCajaForm, RetiroEfectivoForm, RendirFondoForm
from .models import Cajas, Historial_Caja, Tipo_Evento, Fondo_Pagos, Movimiento_Fondo
from autenticacion.models import Empleados
from Config_PR.models import Estados, Tipos_Movimientos, Tipos_Estados
from .serializers import (
    AperturaCajaInputSerializer, CajasSerializer, HistorialCajaSerializer,
    RetiroInputSerializer, RendirFondoInputSerializer, CerrarCajaInputSerializer,
    MovimientoFondoInputSerializer, MovimientoFondoSerializer, AjusteCajaInputSerializer,
    MovimientoCajaManualInputSerializer  # --- IMPORT AÑADIDO ---
)
from . import services
from autenticacion.permissions import IsJefe, IsJefeOrEmpleado


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


# --- VISTA MODIFICADA ---
class HistorialCajaListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = HistorialCajaSerializer
    pagination_class = None # Devolver todo en una página

    def get_queryset(self, request, target_date):
        """
        Obtiene el queryset filtrado por fecha Y por permisos de usuario.
        """
        # 1. Obtener el queryset base por fecha
        base_queryset = Historial_Caja.objects.filter(
            fecha_movimiento_hcaja__date=target_date
        )

        # 2. Filtrar por empleado si no es Jefe
        user = request.user
        # (Asegúrate de que tu grupo de admin se llame 'Jefes')
        is_jefe = user.groups.filter(name='Jefes').exists() or user.is_staff
        empleado_actual = getattr(user, 'empleado', None)

        if not is_jefe and empleado_actual:
            # Si NO es jefe Y es un empleado, filtra por empleado
            return base_queryset.filter(empleado_hc=empleado_actual)
        elif is_jefe:
            # Si ES jefe, muestra todo lo de esa fecha
            return base_queryset
        else:
            # Si no es nada, no muestra nada
            return Historial_Caja.objects.none()

    def list(self, request, *args, **kwargs):
        # 1. Determinar la fecha
        date_str = self.request.query_params.get('date', None)
        target_date = timezone.now().date() # Default a hoy
        if date_str:
            try:
                target_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass # Usa la fecha de hoy si el formato es malo

        # 2. Obtener el queryset filtrado (por fecha Y empleado)
        queryset = self.get_queryset(request, target_date)
        serializer = self.get_serializer(queryset, many=True)
        movimientos_data = serializer.data

        # 3. Calcular el resumen para TODOS los movimientos de ESE DÍA
        #    (El resumen ignora el filtro de empleado, es de toda la caja)
        todos_movimientos_caja_hoy = Historial_Caja.objects.filter(
            fecha_movimiento_hcaja__date=target_date
        )

        agregados = todos_movimientos_caja_hoy.aggregate(
            apertura=Coalesce(Sum('cantidad_movida_hcaja', filter=Q(tipo_event_caja__nombre_evento='APERTURA')), Decimal(0), output_field=DecimalField()),
            ventas=Coalesce(Sum('cantidad_movida_hcaja', filter=Q(tipo_event_caja__nombre_evento='VENTA')), Decimal(0), output_field=DecimalField()),
            ingresos=Coalesce(Sum('cantidad_movida_hcaja', filter=Q(tipo_event_caja__nombre_evento__in=['INGRESO_MANUAL', 'RENDICION_FONDO', 'TRANSFERENCIA_DESDE_FONDO'])), Decimal(0), output_field=DecimalField()),
            egresos=Coalesce(Sum('cantidad_movida_hcaja', filter=Q(tipo_event_caja__nombre_evento__in=['EGRESO_MANUAL', 'RETIRO_CAJA', 'RETIRO_FONDO', 'TRANSFERENCIA_A_FONDO'])), Decimal(0), output_field=DecimalField())
        )
        resumen_data = {
            "apertura": agregados['apertura'], "ventas": agregados['ventas'],
            "ingresos": agregados['ingresos'], "egresos": agregados['egresos'],
        }

        response_data = {"movimientos": movimientos_data, "resumen": resumen_data}
        return Response(response_data, status=status.HTTP_200_OK)

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
    permission_classes = [IsJefeOrEmpleado]

    def get(self, request, *args, **kwargs):
        user = request.user
        is_jefe = user.groups.filter(name='Jefes').exists() or user.is_staff
        empleado_actual = getattr(user, 'empleado', None)
        caja_abierta = None

        try:
            # Usar la relación inversa para evitar la necesidad de importar Tipos_Estados
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTA', tipo_estado__nombre_tipo_estado='Caja')
        except Estados.DoesNotExist:
            return Response({'detail': "Error de configuración: El estado 'ABIERTA' para 'Caja' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if is_jefe:
            # El jefe ve la última caja abierta en el sistema para supervisión
            caja_abierta = Cajas.objects.filter(estado_caja=estado_abierto).order_by('-id_caja').first()
        elif empleado_actual:
            # Un empleado solo debe ver SU PROPIA caja abierta
            try:
                cajas_del_empleado_ids = Historial_Caja.objects.filter(
                    empleado_hc=empleado_actual
                ).values_list('caja_hc_id', flat=True).distinct()

                caja_abierta = Cajas.objects.get(
                    id_caja__in=cajas_del_empleado_ids,
                    estado_caja=estado_abierto
                )
            except Cajas.DoesNotExist:
                caja_abierta = None  # Es normal que no tenga una caja abierta
            except Cajas.MultipleObjectsReturned:
                # Esto es un estado de error que el frontend debe saber
                return Response({'detail': 'Error: Tienes múltiples cajas abiertas. Contacta a un administrador.'}, status=status.HTTP_400_BAD_REQUEST)

        if caja_abierta:
            # Si se encontró una caja (sea de jefe o de empleado), se serializa
            serializer = CajasSerializer(caja_abierta)
            return Response(serializer.data)
        else:
            # Si no hay ninguna caja abierta para este usuario, buscar la fecha del último cierre
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
        # Corregido: 'motivo_mov_fp' a 'motivo' y 'validated_' a 'validated_data'
        motivo = serializer.validated_data.get('motivo', '').strip() 
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

            try:
                tipo_mov_obj = Tipos_Movimientos.objects.get(nombre_movimiento=tipo)
            except Tipos_Movimientos.DoesNotExist:
                 return Response({'detail': f'Tipo de movimiento "{tipo}" no existe. Configurelo.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            Movimiento_Fondo.objects.create(
                fondo_mov_fp=fondo, 
                tipo_mov_fp=tipo_mov_obj, # Usamos el objeto
                monto_mov_fp=monto,
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

# ==============================================================================
# VIEWSET PARA LISTAR CAJAS (AQUÍ AÑADIMOS LA ACCIÓN)
# ==============================================================================

class CajaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para obtener una lista de Cajas y ver su detalle.
    
    Permite filtrar por estado, por ejemplo:
    /api/cajas/?estado_caja__nombre_estado=ABIERTA
    /api/cajas/?estado_caja=1
    
    --- ACCIONES PERSONALIZADAS ---
    POST /api/cajas/movimiento/ - Registra un ingreso/egreso manual.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    # Usamos el CajasSerializer que ya tienes (lo vi en tus imports)
    serializer_class = CajasSerializer
    
    # Optimizamos la consulta para incluir el estado
    queryset = Cajas.objects.select_related(
        'estado_caja',
    ).all().order_by('-id_caja')
    
    # --- ESTA ES LA LÍNEA CLAVE QUE CORRIGE TU ERROR 500 ---
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'estado_caja': ['exact'],
        'estado_caja__nombre_estado': ['exact'],
    }
    # Corregido: 'monto_final_caja' no existe, se usa 'monto_cierre_caja'
    ordering_fields = ['id_caja', 'monto_cierre_caja'] 
    
    
    # --- ACCIÓN AÑADIDA (CON TRY/EXCEPT CORREGIDO) ---
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='movimiento')
    def movimiento_manual(self, request):
        """
        Registra un INGRESO o EGRESO manual en la caja abierta.
        Espera: { "monto": 100.00, "motivo": "pago proveedor", "tipo": "EGRESO" }
        """
        serializer = MovimientoCajaManualInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        monto = validated_data['monto']  # Es un monto positivo
        motivo = validated_data['motivo']
        tipo_movimiento = validated_data['tipo'] # "INGRESO" o "EGRESO"

        # 1. Obtener empleado (BLOQUE CORREGIDO)
        try:
            # Intentamos acceder al empleado relacionado con el usuario
            empleado_actual = request.user.empleado 
            if not empleado_actual:
                 raise ObjectDoesNotExist # Forzar el error si es None pero no falló
                 
        except ObjectDoesNotExist: 
            # Esto captura si el 'related_name' es 'empleado' pero el objeto no existe
            return Response({'detail': 'Tu usuario está autenticado, pero no está asociado a un perfil de empleado (ObjectDoesNotExist).'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            # Esto captura si el 'related_name' en tu modelo Empleado NO se llama 'empleado'
            return Response({'detail': "Error de configuración: El modelo User no tiene un atributo '.empleado'. Revisa el related_name en autenticacion/models.py."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            # Captura cualquier otro error
             return Response({'detail': f'Error inesperado al buscar empleado: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        # 2. Encontrar la caja abierta
        try:
            estado_abierto = Estados.objects.get(nombre_estado='ABIERTA')
            caja_abierta = Cajas.objects.filter(estado_caja=estado_abierto).first()
            if not caja_abierta:
                raise Cajas.DoesNotExist
        except (Estados.DoesNotExist, Cajas.DoesNotExist):
            return Response({'detail': 'No se encontró ninguna caja abierta.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 3. Determinar montos y tipo de evento
                saldo_anterior = caja_abierta.monto_teorico_caja
                
                if tipo_movimiento == "EGRESO":
                    if monto > saldo_anterior:
                        return Response({'detail': 'Fondos insuficientes en la caja para este egreso.'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    cantidad_movida = -monto
                    nuevo_saldo = saldo_anterior - monto
                    tipo_evento_nombre = "EGRESO_MANUAL"
                
                else: # INGRESO
                    cantidad_movida = monto
                    nuevo_saldo = saldo_anterior + monto
                    tipo_evento_nombre = "INGRESO_MANUAL"

                # 4. Obtener el Tipo_Evento
                tipo_evento = Tipo_Evento.objects.get(nombre_evento=tipo_evento_nombre)
                
                # 5. Actualizar la caja
                caja_abierta.monto_teorico_caja = nuevo_saldo
                caja_abierta.save(update_fields=['monto_teorico_caja'])

                # 6. Crear el Historial_Caja
                Historial_Caja.objects.create(
                    caja_hc=caja_abierta,
                    empleado_hc=empleado_actual,
                    tipo_event_caja=tipo_evento,
                    cantidad_movida_hcaja=cantidad_movida, # Guardamos el monto con signo
                    saldo_anterior_hcaja=saldo_anterior,
                    nuevo_saldo_hcaja=nuevo_saldo,
                    descripcion_hcaja=motivo
                )
            
            # 7. Devolver la caja actualizada
            return Response(CajasSerializer(caja_abierta).data, status=status.HTTP_200_OK)

        except Tipo_Evento.DoesNotExist:
            return Response({'detail': f"Error de configuración: El tipo de evento '{tipo_evento_nombre}' no existe."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'detail': f'Ocurrió un error inesperado: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)