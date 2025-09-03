from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.core import signing
from django.conf import settings
import math

from HOME.models import ConfiguracionFidelizacion, Cupones_Descuento, Cupones_Clientes, Historial_Puntos, Clientes, Estados, Ventas
from .serializers import ConfiguracionFidelizacionSerializer, CuponesDescuentoSerializer, CuponesClientesSerializer, HistorialPuntosSerializer, ClienteSerializer, AjustePuntosSerializer
from Auditoria.services import crear_registro

class ConfiguracionFidelizacionViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionFidelizacion.objects.all()
    serializer_class = ConfiguracionFidelizacionSerializer

    def get_object(self):
        obj, created = ConfiguracionFidelizacion.objects.get_or_create(pk=1)
        return obj

    def get_queryset(self):
        return ConfiguracionFidelizacion.objects.filter(pk=1)

class CuponesDescuentoViewSet(viewsets.ModelViewSet):
    queryset = Cupones_Descuento.objects.all()
    serializer_class = CuponesDescuentoSerializer

class CuponesClientesViewSet(viewsets.ModelViewSet):
    queryset = Cupones_Clientes.objects.all()
    serializer_class = CuponesClientesSerializer

    @action(detail=True, methods=['post'])
    def canjear(self, request, pk=None):
        cupon_cliente = self.get_object()
        cliente = cupon_cliente.cliente_cupon_cli

        config = ConfiguracionFidelizacion.objects.get_or_create(pk=1)[0]
        if not config.habilitado:
            return Response({"error": "El programa de fidelizacion no esta habilitado."}, status=status.HTTP_400_BAD_REQUEST)

        if cupon_cliente.estado_cupon_cli.id_estado != 16: # 16: DISPONIBLE
            return Response({"error": "El cupon no esta disponible para canje."}, status=status.HTTP_400_BAD_REQUEST)
        
        puntos_requeridos = cupon_cliente.cupon_descuento_cupon_cli.puntos_requeridos_cupon_desc
        if cliente.puntos_actuales < puntos_requeridos:
            return Response({"error": "Puntos insuficientes para canjear este cupon."}, status=status.HTTP_400_BAD_REQUEST)
        
        if cupon_cliente.cupon_descuento_cupon_cli.fecha_vencimiento_cupon_desc and \
           cupon_cliente.cupon_descuento_cupon_cli.fecha_vencimiento_cupon_desc < timezone.now().date():
            return Response({"error": "El cupon ha vencido."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            puntos_anteriores = cliente.puntos_actuales
            cliente.puntos_actuales -= puntos_requeridos
            cliente.save()

            Historial_Puntos.objects.create(
                cliente=cliente,
                cupon_canjeado=cupon_cliente,
                puntos_movidos=puntos_requeridos * -1,
                puntos_anteriores=puntos_anteriores,
                puntos_nuevos=cliente.puntos_actuales,
                tipo_movimiento='CANJEADOS'
            )

            estado_canjeado = Estados.objects.get(id_estado=17) # 17: CANJEADO
            cupon_cliente.estado_cupon_cli = estado_canjeado
            cupon_cliente.save()
        
        return Response({"message": "Cupon canjeado exitosamente."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def mis_cupones(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Autenticacion requerida."}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            cliente = request.user.cliente
        except Clientes.DoesNotExist:
            return Response({"error": "Cliente no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        cupones = Cupones_Clientes.objects.filter(cliente_cupon_cli=cliente)
        serializer = self.get_serializer(cupones, many=True)
        return Response(serializer.data)


class HistorialPuntosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Historial_Puntos.objects.all().order_by('-fecha_movimiento')
    serializer_class = HistorialPuntosSerializer

class ClientesViewSet(viewsets.ModelViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClienteSerializer

    @action(detail=True, methods=['get'])
    def mis_puntos(self, request, pk=None):
        cliente = self.get_object()
        if not request.user.is_authenticated or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(cliente)
        return Response({"puntos_actuales": serializer.data['puntos_actuales']})

    @action(detail=True, methods=['get'])
    def cupones_canjeables(self, request, pk=None):
        cliente = self.get_object()
        if not request.user.is_authenticated or request.user.cliente != cliente:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
        
        cupones_disponibles = Cupones_Clientes.objects.filter(
            cliente_cupon_cli=cliente,
            estado_cupon_cli__id_estado=16, # 16: DISPONIBLE
            cupon_descuento_cupon_cli__puntos_requeridos_cupon_desc__lte=cliente.puntos_actuales,
            cupon_descuento_cupon_cli__fecha_vencimiento_cupon_desc__gte=timezone.now().date()
        )
        serializer = CuponesClientesSerializer(cupones_disponibles, many=True)
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
            puntos_anteriores = cliente.puntos_actuales
            nuevo_saldo = puntos_anteriores + cantidad

            if nuevo_saldo < 0:
                return Response({"error": "El cliente no puede tener un saldo de puntos negativo."}, status=status.HTTP_400_BAD_REQUEST)

            cliente.puntos_actuales = nuevo_saldo
            cliente.save()

            Historial_Puntos.objects.create(
                cliente=cliente,
                puntos_movidos=cantidad,
                puntos_anteriores=puntos_anteriores,
                puntos_nuevos=nuevo_saldo,
                tipo_movimiento='AJUSTE',
                motivo_ajuste=motivo
            )

            # --- REGISTRO DE AUDITORÍA ---
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
            # --- FIN REGISTRO ---

        return Response({"message": f"Puntos ajustados exitosamente. Nuevo saldo: {nuevo_saldo}"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def load_points_qr(request):
    token = request.data.get('token')
    if not token:
        return Response({"error": "Token no proporcionado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = signing.loads(token, max_age=300) # 5 minutos de validez
        venta_id = data.get('venta_id')
        venta_fecha = data.get('venta_fecha')
    except signing.SignatureExpired:
        return Response({"error": "El QR ha expirado (mas de 5 minutos)."}, status=status.HTTP_400_BAD_REQUEST)
    except signing.BadSignature:
        return Response({"error": "QR invalido."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        venta = Ventas.objects.get(id_venta=venta_id, fecha_venta=venta_fecha)
    except Ventas.DoesNotExist:
        return Response({"error": "Venta no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if venta.estado_venta.id_estado == 4: # 4: ANULADA
        return Response({"error": "La venta ha sido anulada."}, status=status.HTTP_400_BAD_REQUEST)
    
    if venta.puntos_cargados_qr:
        return Response({"error": "Los puntos de esta venta ya han sido cargados."}, status=status.HTTP_400_BAD_REQUEST)

    config = ConfiguracionFidelizacion.objects.get_or_create(pk=1)[0]
    if not config.habilitado:
        return Response({"error": "El programa de fidelizacion no esta habilitado."}, status=status.HTTP_400_BAD_REQUEST)

    cliente = venta.cliente_venta
    if not cliente:
        return Response({"error": "La venta no esta asociada a un cliente."}, status=status.HTTP_400_BAD_REQUEST)

    neto_pagado = venta.total_venta - venta.descuento_aplicado
    puntos_ganados = math.floor(neto_pagado / settings.PESOS_POR_PUNTO)

    if puntos_ganados <= 0:
        return Response({"error": "Esta venta no genera puntos."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        puntos_anteriores = cliente.puntos_actuales
        cliente.puntos_actuales += puntos_ganados
        cliente.save()

        Historial_Puntos.objects.create(
            cliente=cliente,
            venta_origen=venta,
            puntos_movidos=puntos_ganados,
            puntos_anteriores=puntos_anteriores,
            puntos_nuevos=cliente.puntos_actuales,
            tipo_movimiento='GANADOS'
        )
        
        venta.puntos_cargados_qr = True
        venta.save()

    return Response({"message": f"Puntos cargados exitosamente. {puntos_ganados} puntos anadidos."}, status=status.HTTP_200_OK)
