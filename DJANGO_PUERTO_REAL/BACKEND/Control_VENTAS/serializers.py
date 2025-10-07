import uuid
from django.db import transaction
from django.conf import settings
from rest_framework import serializers
from HOME.models import (
    Ventas, Detalle_Ventas, Stocks, Historial_Stock, 
    Cajas, Historial_Caja, Tipos_Movimientos, Tipo_Evento, Productos,
    Promos_Clientes, Estados, Historial_Puntos, Clientes, Promociones_Descuento
)
import math
from django.utils import timezone
from Auditoria.services import crear_registro

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalle_Ventas
        fields = ('producto_det_vent', 'cantidad_det_vent', 'precio_unitario_det_vent')

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    codigo_cupon = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Ventas
        fields = (
            'id_venta',
            'cliente_venta',
            'empleado_venta',
            'caja_venta',
            'fecha_venta',
            'total_venta',
            'promo_aplicada',
            'estado_venta',
            'detalles',
            'codigo_cupon',
            'qr_token',
        )
        read_only_fields = ('fecha_venta', 'total_venta', 'qr_token')

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        promo_aplicada_id = validated_data.pop('promo_aplicada', None)
        codigo_cupon = validated_data.pop('codigo_cupon', None)
        # El cliente es opcional, no se requiere para la venta en TPV
        cliente = validated_data.get('cliente_venta', None)

        if promo_aplicada_id and codigo_cupon:
            raise serializers.ValidationError("No se puede aplicar un cupón pre-existente y un código de cupón a la vez.")
        
        promo_aplicada_instance = None
        descuento = 0

        for detalle_data in detalles_data:
            producto = detalle_data['producto_det_vent']
            cantidad_solicitada = detalle_data['cantidad_det_vent']
            try:
                stock = Stocks.objects.select_for_update().get(producto_en_stock=producto)
                if stock.cantidad_actual_stock < cantidad_solicitada:
                    raise serializers.ValidationError(f"Stock insuficiente para: {producto.nombre_producto}")
            except Stocks.DoesNotExist:
                raise serializers.ValidationError(f"No hay stock para: {producto.nombre_producto}")

        total_venta = sum(
            (d.get('precio_unitario_det_vent', d['producto_det_vent'].precio_unitario_venta_producto) * d['cantidad_det_vent'])
            for d in detalles_data
        )
        validated_data['total_venta'] = total_venta

        if promo_aplicada_id:
            # ... (lógica de cupón existente)
            pass

        elif codigo_cupon:
            # ... (lógica de cupón existente)
            pass

        # Se establece cliente_venta a None si no se proporciona
        if 'cliente_venta' not in validated_data:
            validated_data['cliente_venta'] = None

        venta = Ventas.objects.create(**validated_data)
        venta.descuento_aplicado = descuento
        venta.save()

        for detalle_data in detalles_data:
            if 'precio_unitario_det_vent' not in detalle_data:
                detalle_data['precio_unitario_det_vent'] = detalle_data['producto_det_vent'].precio_unitario_venta_producto
            Detalle_Ventas.objects.create(venta_det_vent=venta, **detalle_data)

        if promo_aplicada_id and promo_aplicada_instance:
            # ... (lógica de estado de cupón existente)
            pass

        try:
            tipo_movimiento_venta = Tipos_Movimientos.objects.get(nombre_movimiento='VENTA')
        except Tipos_Movimientos.DoesNotExist:
            raise serializers.ValidationError("Tipo de movimiento 'VENTA' no encontrado.")

        for detalle in venta.detalles.all():
            stock = Stocks.objects.get(producto_en_stock=detalle.producto_det_vent)
            stock_anterior = stock.cantidad_actual_stock
            stock.cantidad_actual_stock -= detalle.cantidad_det_vent
            stock.save()
            Historial_Stock.objects.create(
                stock_hs=stock, cantidad_hstock=detalle.cantidad_det_vent * -1,
                stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
                tipo_movimiento_hs=tipo_movimiento_venta, empleado_hs=venta.empleado_venta,
                observaciones_hstock=f"Salida por venta ID: {venta.id_venta}"
            )

        caja = venta.caja_venta
        saldo_anterior_caja = caja.monto_teorico_caja
        monto_ingreso = venta.total_venta
        caja.monto_teorico_caja += monto_ingreso
        caja.save()
        tipo_evento_ingreso, _ = Tipo_Evento.objects.get_or_create(nombre_evento="INGRESO_VENTA")
        Historial_Caja.objects.create(
            caja_hc=caja, empleado_hc=venta.empleado_venta, tipo_event_caja=tipo_evento_ingreso,
            cantidad_movida_hcaja=monto_ingreso, saldo_anterior_hcaja=saldo_anterior_caja,
            nuevo_saldo_hcaja=caja.monto_teorico_caja, descripcion_hcaja=f"Ingreso por venta ID: {venta.id_venta}"
        )
        
        crear_registro(
            usuario=self.context['request'].user,
            accion='VENTA_NUEVA',
            detalles={
                'venta_id': venta.id_venta,
                'cliente': venta.cliente_venta.id_cliente if venta.cliente_venta else None,
                'total': str(venta.total_venta),
                'descuento': str(descuento),
                'items': venta.detalles.count()
            }
        )

        # Generar y guardar el token QR
        venta.qr_token = uuid.uuid4().hex
        venta.save(update_fields=['qr_token'])

        return venta
