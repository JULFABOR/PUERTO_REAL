import math
from rest_framework import viewsets, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.core import signing
from django.db import models
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

# Local application
from Auditoria.services import crear_registro
from Config_PR.models import Estados, Tipos_Movimientos
from Control_VENTAS.models import Ventas
from autenticacion.models import Clientes
from .models import (
    Historial_Puntos,
    Promociones_Descuento,
    Promos_Clientes,
    Transacciones_Puntos,
)
from .serializers import (
    AjustePuntosSerializer,
    ClienteSerializer,
    HistorialPuntosSerializer,
    PromocionesClientesSerializer,
    PromocionesDescuentoSerializer,
)
# --- Vistas de Template ---

@method_decorator(login_required, name='dispatch')
class FidelizacionDashboardView(TemplateView):
    template_name = 'HOME/FidelizacionCliente.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Dashboard de Fidelización"
        context['ultimos_movimientos'] = Historial_Puntos.objects.order_by('-fecha_mov_hist_puntos')[:10]
        return context

@method_decorator(login_required, name='dispatch')
class ClientePerfilView(TemplateView):
    template_name = 'HOME/Cliente-Perfil.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cliente_id = kwargs.get('cliente_id')
        cliente = get_object_or_404(Clientes, id_cliente=cliente_id)
        
        context['cliente'] = cliente
        context['page_title'] = f"Perfil de {cliente.user_cliente.get_full_name()}"
        context['historial_compras'] = Ventas.objects.filter(cliente_venta=cliente).order_by('-fecha_venta')[:10]
        return context

@method_decorator(login_required, name='dispatch')
class ClienteListView(TemplateView):
    template_name = 'HOME/Clientes.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['clientes'] = Clientes.objects.all()
        context['page_title'] = "Gestión de Clientes"
        return context

def get_puntos_cliente(cliente):
    """
    Calcula y devuelve el total de puntos para un cliente.
    """
    return Transacciones_Puntos.objects.filter(cliente_trans_puntos=cliente).aggregate(
        total_puntos=models.Sum('puntos_transaccion')
    )['total_puntos'] or 0

# --- Vistas de API (Para React) ---


class CuponesDescuentoViewSet(viewsets.ModelViewSet):
    queryset = Promociones_Descuento.objects.all()
    serializer_class = PromocionesDescuentoSerializer

class PromosClientesViewSet(viewsets.ModelViewSet):
    queryset = Promos_Clientes.objects.all()
    serializer_class = PromocionesClientesSerializer

    @action(detail=True, methods=['post'])
    def canjear(self, request, pk=None):
        promo_cliente = self.get_object()
        cliente = promo_cliente.cliente_promo_cli

        if promo_cliente.estado_promo_cli.id_estado != 16: # 16: DISPONIBLE
            return Response({"error": "El cupón no está disponible para canje."}, status=status.HTTP_400_BAD_REQUEST)
        
        puntos_requeridos = promo_cliente.cupon_descuento_promo_cli.puntos_requeridos_promo_desc
        puntos_actuales = get_puntos_cliente(cliente)

        if puntos_actuales < puntos_requeridos:
            return Response({"error": "Puntos insuficientes para canjear este cupón."}, status=status.HTTP_400_BAD_REQUEST)
        
        if promo_cliente.cupon_descuento_promo_cli.fecha_vencimiento_promo_desc and \
           promo_cliente.cupon_descuento_promo_cli.fecha_vencimiento_promo_desc < timezone.now().date():
            return Response({"error": "El cupón ha vencido."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            tipo_movimiento_canje = Tipos_Movimientos.objects.get(nombre_movimiento='CANJE_CUPON')
            
            transaccion = Transacciones_Puntos.objects.create(
                cliente_trans_puntos=cliente,
                puntos_transaccion=puntos_requeridos * -1,
                descripcion_trans_puntos=f"Canje de cupón: {promo_cliente.cupon_descuento_promo_cli.nombre_promo_desc}"
            )

            Historial_Puntos.objects.create(
                trans_hist_puntos=transaccion,
                promo_usada_hist_puntos=promo_cliente,
                puntos_movidos=puntos_requeridos * -1,
                puntos_anteriores=puntos_actuales,
                puntos_nuevos=puntos_actuales - puntos_requeridos,
                tipo_mov_hist_puntos=tipo_movimiento_canje
            )

            estado_canjeado = Estados.objects.get(id_estado=17) # 17: CANJEADO
            promo_cliente.estado_promo_cli = estado_canjeado
            promo_cliente.save()
        
        return Response({"message": "Cupón canjeado exitosamente."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def mis_cupones(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Autenticación requerida."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            cliente = request.user.cliente
        except Clientes.DoesNotExist:
            return Response({"error": "Cliente no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        cupones = Promos_Clientes.objects.filter(cliente_promo_cli=cliente)
        serializer = self.get_serializer(cupones, many=True)
        return Response(serializer.data)

class HistorialPuntosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Historial_Puntos.objects.select_related(
        'trans_hist_puntos__cliente_trans_puntos__user_cliente',
        'trans_hist_puntos__venta_origen',
        'promo_usada_hist_puntos__cupon_descuento_promo_cli'
    ).order_by('-fecha_historial_puntos')
    serializer_class = HistorialPuntosSerializer

from django.db.models import Sum

class ClientesViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['dni_cliente']
    search_fields = ['dni_cliente', 'user_cliente__first_name', 'user_cliente__last_name']

    def get_queryset(self):
        """
        Optimized queryset that annotates the total points for each client
        and selects the related user to avoid N+1 queries.
        """
        return Clientes.objects.select_related('user_cliente').annotate(
            puntos=Sum('historial_transacciones__puntos_trans_puntos', default=0) 
        ).order_by('-puntos')

    @action(detail=True, methods=['get'])
    def mis_puntos(self, request, pk=None):
        cliente = self.get_object() # This object has the 'puntos' annotation
        if not request.user.is_authenticated or not hasattr(request.user, 'cliente') or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({"puntos_actuales": cliente.puntos})

    @action(detail=True, methods=['get'])
    def cupones_canjeables(self, request, pk=None):
        cliente = self.get_object() # This object has the 'puntos' annotation
        if not request.user.is_authenticated or not hasattr(request.user, 'cliente') or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        puntos_actuales = cliente.puntos
        
        cupones_disponibles = Promociones_Descuento.objects.filter(
            puntos_requeridos_promo_desc__lte=puntos_actuales,
            fecha_vencimiento_promo_desc__gte=timezone.now().date()
        )
        serializer = PromocionesDescuentoSerializer(cupones_disponibles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def ajustar_puntos(self, request, pk=None):
        cliente = self.get_object()
        serializer = AjustePuntosSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        cantidad = serializer.validated_data['cantidad']
        motivo = serializer.validated_data['motivo']

        with transaction.atomic():
            puntos_anteriores = get_puntos_cliente(cliente)
            nuevo_saldo = puntos_anteriores + cantidad

            if nuevo_saldo < 0:
                return Response({"error": "El cliente no puede tener un saldo de puntos negativo."}, status=status.HTTP_400_BAD_REQUEST)

            tipo_movimiento_ajuste = Tipos_Movimientos.objects.get(nombre_movimiento='AJUSTE_MANUAL')
            
            transaccion = Transacciones_Puntos.objects.create(
                cliente_trans_puntos=cliente,
                puntos_transaccion=cantidad,
                descripcion_trans_puntos=f"Ajuste manual: {motivo}"
            )

            Historial_Puntos.objects.create(
                trans_hist_puntos=transaccion,
                puntos_movidos=cantidad,
                puntos_anteriores=puntos_anteriores,
                puntos_nuevos=nuevo_saldo,
                tipo_mov_hist_puntos=tipo_movimiento_ajuste
            )

            crear_registro(
                usuario=request.user,
                accion='AJUSTE_PUNTOS_MANUAL',
                detalles={
                    'cliente_id': cliente.id_cliente,
                    'cliente_dni': cliente.dni_cliente,
                    'puntos_ajustados': cantidad,
                    'puntos_anteriores': puntos_anteriores,
                    'puntos_nuevos': nuevo_saldo,
                    'motivo': motivo
                }
            )

        return Response({"message": f"Puntos ajustados exitosamente. Nuevo saldo: {nuevo_saldo}"}, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
def load_points_qr(request):
    """
    Endpoint para canjear puntos desde un token QR.

    Acepta:
    - GET ?token=...  -> devuelve HTML simple (útil para escanear con el móvil)
    - POST { token: '...' } -> devuelve JSON (útil para llamadas AJAX desde la app)

    El token puede ser:
    - un token firmado por `signing.dumps({'venta_id': ...})`
    - o el `qr_token` (UUID) que se guarda en `Ventas.qr_token`.
    """
    # soportar GET y POST
    token = request.GET.get('token') if request.method == 'GET' else request.data.get('token')
    if not token:
        if request.method == 'GET':
            return HttpResponse('<h3>Token no proporcionado.</h3>', status=400)
        return Response({"error": "Token no proporcionado."}, status=status.HTTP_400_BAD_REQUEST)

    venta = None
    venta_id = None

    # Intentar carga firmada primero
    try:
        data = signing.loads(token, max_age=60 * 60 * 24)  # permitir token válidos hasta 24h por defecto
        venta_id = data.get('venta_id')
    except Exception:
        venta_id = None

    try:
        if venta_id:
            venta = Ventas.objects.get(id_venta=venta_id)
        else:
            # Intentar buscar por qr_token (token crudo)
            venta = Ventas.objects.get(qr_token=token)
    except Ventas.DoesNotExist:
        if request.method == 'GET':
            return HttpResponse('<h3>Venta no encontrada o QR inválido.</h3>', status=404)
        return Response({"error": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if venta.estado_venta.nombre_estado.upper() == 'ANULADA':
        if request.method == 'GET':
            return HttpResponse('<h3>La venta ha sido anulada.</h3>', status=400)
        return Response({"error": "La venta ha sido anulada."}, status=status.HTTP_400_BAD_REQUEST)

    cliente = venta.cliente_venta
    if not cliente:
        if request.method == 'GET':
            return HttpResponse('<h3>La venta no está asociada a un cliente.</h3>', status=400)
        return Response({"error": "La venta no está asociada a un cliente."}, status=status.HTTP_400_BAD_REQUEST)

    # Calculo de puntos: configurable via settings.PESOS_POR_PUNTO (default 10)
    from django.conf import settings
    pesos_por_punto = getattr(settings, 'PESOS_POR_PUNTO', 10)
    try:
        pesos_por_punto = float(pesos_por_punto)
        if pesos_por_punto <= 0:
            pesos_por_punto = 10.0
    except Exception:
        pesos_por_punto = 10.0

    puntos_ganados = math.floor(float(venta.total_venta) / pesos_por_punto)

    if puntos_ganados <= 0:
        if request.method == 'GET':
            return HttpResponse('<h3>Esta venta no genera puntos.</h3>', status=400)
        return Response({"error": "Esta venta no genera puntos."}, status=status.HTTP_400_BAD_REQUEST)

    # Verificar si ya fue canjeada: si el qr_token ya fue consumido, lo consideramos canjeado
    if not venta.qr_token:
        if request.method == 'GET':
            return HttpResponse('<h3>Los puntos de esta venta ya fueron cargados.</h3>', status=400)
        return Response({"error": "Los puntos de esta venta ya han sido cargados."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        puntos_anteriores = get_puntos_cliente(cliente)
        tipo_movimiento_ganados = Tipos_Movimientos.objects.get_or_create(nombre_movimiento='ACUMULACION_COMPRA')[0]

        transaccion = Transacciones_Puntos.objects.create(
            cliente_trans_puntos=cliente,
            puntos_trans_puntos=puntos_ganados,
            descripcion_trans_puntos=f"Puntos por venta #{venta.id_venta}"
        )

        Historial_Puntos.objects.create(
            cliente_historial_puntos=cliente,
            puntos_obtenidos_historial_puntos=puntos_ganados,
            puntos_redimidos_historial_puntos=0,
            descripcion_historial_puntos=f"Puntos por venta #{venta.id_venta}"
        )

        # Consumir el token para evitar reutilización
        venta.qr_token = None
        venta.save(update_fields=['qr_token'])

    if request.method == 'GET':
        # Responder con HTML simple para mostrar al cliente tras escanear
        return HttpResponse(f'<h3>Puntos cargados: {puntos_ganados}</h3><p>Gracias por su compra.</p>')

    return Response({"message": f"Puntos cargados exitosamente. {puntos_ganados} puntos añadidos."}, status=status.HTTP_200_OK)