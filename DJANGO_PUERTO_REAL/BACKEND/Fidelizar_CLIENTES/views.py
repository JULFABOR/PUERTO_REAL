from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction, models
from django.core import signing
from django.conf import settings
import math
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from HOME.models import (
    Promociones_Descuento, Promos_Clientes, Historial_Puntos, Clientes, 
    Estados, Ventas, Transacciones_Puntos, Tipos_Movimientos
)
from .serializers import (
    PromocionesDescuentoSerializer,PromocionesClientesSerializer, HistorialPuntosSerializer, 
    ClienteSerializer, AjustePuntosSerializer
)
from Auditoria.services import crear_registro

def get_puntos_cliente(cliente):
    """
    Calcula y devuelve el total de puntos para un cliente.
    """
    return Transacciones_Puntos.objects.filter(cliente_trans_puntos=cliente).aggregate(
        total_puntos=models.Sum('puntos_transaccion')
    )['total_puntos'] or 0

# --- Vistas de Template ---

@method_decorator(login_required, name='dispatch')
class FidelizacionDashboardView(TemplateView):
    template_name = 'Fidelizar_CLIENTES/fidelizacion_dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Dashboard de Fidelización"
        context['ultimos_movimientos'] = Historial_Puntos.objects.order_by('-fecha_mov_hist_puntos')[:10]
        return context

@method_decorator(login_required, name='dispatch')
class ClientePerfilView(TemplateView):
    template_name = 'Fidelizar_CLIENTES/Cliente-Perfil.html'

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
    template_name = 'Fidelizar_CLIENTES/Clientes.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['clientes'] = Clientes.objects.all()
        context['page_title'] = "Gestión de Clientes"
        return context

# --- Vistas de API ---

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
    queryset = Historial_Puntos.objects.all().order_by('-fecha_mov_hist_puntos')
    serializer_class = HistorialPuntosSerializer

class ClientesViewSet(viewsets.ModelViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClienteSerializer

    @action(detail=True, methods=['get'])
    def mis_puntos(self, request, pk=None):
        cliente = self.get_object()
        if not request.user.is_authenticated or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        puntos = get_puntos_cliente(cliente)
        return Response({"puntos_actuales": puntos})

    @action(detail=True, methods=['get'])
    def cupones_canjeables(self, request, pk=None):
        cliente = self.get_object()
        if not request.user.is_authenticated or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        puntos_actuales = get_puntos_cliente(cliente)
        
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

@api_view(['POST'])
def load_points_qr(request):
    token = request.data.get('token')
    if not token:
        return Response({"error": "Token no proporcionado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = signing.loads(token, max_age=300)
        venta_id = data.get('venta_id')
    except (signing.SignatureExpired, signing.BadSignature):
        return Response({"error": "QR inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        venta = Ventas.objects.get(id_venta=venta_id)
    except Ventas.DoesNotExist:
        return Response({"error": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if venta.estado_venta.nombre_estado == 'ANULADA':
        return Response({"error": "La venta ha sido anulada."}, status=status.HTTP_400_BAD_REQUEST)
    
    if venta.puntos_cargados_qr:
        return Response({"error": "Los puntos de esta venta ya han sido cargados."}, status=status.HTTP_400_BAD_REQUEST)

    cliente = venta.cliente_venta
    if not cliente:
        return Response({"error": "La venta no está asociada a un cliente."}, status=status.HTTP_400_BAD_REQUEST)

    puntos_ganados = math.floor(venta.total_venta / settings.PESOS_POR_PUNTO)

    if puntos_ganados <= 0:
        return Response({"error": "Esta venta no genera puntos."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        puntos_anteriores = get_puntos_cliente(cliente)
        
        tipo_movimiento_ganados = Tipos_Movimientos.objects.get(nombre_movimiento='ACUMULACION_COMPRA')

        transaccion = Transacciones_Puntos.objects.create(
            cliente_trans_puntos=cliente,
            puntos_transaccion=puntos_ganados,
            descripcion_trans_puntos=f"Puntos por venta #{venta.id_venta}"
        )

        Historial_Puntos.objects.create(
            trans_hist_puntos=transaccion,
            puntos_movidos=puntos_ganados,
            puntos_anteriores=puntos_anteriores,
            puntos_nuevos=puntos_anteriores + puntos_ganados,
            tipo_mov_hist_puntos=tipo_movimiento_ganados
        )
        
        venta.puntos_cargados_qr = True
        venta.save()

    return Response({"message": f"Puntos cargados exitosamente. {puntos_ganados} puntos añadidos."}, status=status.HTTP_200_OK)