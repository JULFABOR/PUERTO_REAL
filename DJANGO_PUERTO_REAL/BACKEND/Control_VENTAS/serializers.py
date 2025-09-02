from django.db import transaction
from django.conf import settings
from rest_framework import serializers
from HOME.models import (
    Ventas, Detalle_Ventas, Stocks, Historial_Stock, 
    Cajas, Historial_Caja, Tipos_Movimientos, Tipo_Evento, Productos,
    Cupones_Clientes, Estados, Historial_Puntos, Clientes, Cupones_Descuento
)
import math
from django.utils import timezone

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalle_Ventas
        fields = ('producto_det_vent', 'cantidad_det_vent', 'precio_unitario_det_vent')

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True)
    codigo_cupon = serializers.CharField(write_only=True, required=False) # New field for Mode 2

    class Meta:
        model = Ventas
        fields = (
            'id_venta',
            'cliente_venta',
            'empleado_venta',
            'caja_venta',
            'fecha_venta',
            'total_venta',
            'descuento_aplicado',
            'vuelto_entregado',
            'cupon_aplicado',
            'estado_venta',
            'detalles',
            'codigo_cupon' # Include new field
        )
        read_only_fields = ('fecha_venta', 'total_venta', 'descuento_aplicado')

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        cupon_cliente_id = validated_data.pop('cupon_aplicado', None) # Get ID for Mode 1
        codigo_cupon = validated_data.pop('codigo_cupon', None) # Get code for Mode 2
        cliente = validated_data.get('cliente_venta')

        # Ensure only one coupon mechanism is used
        if cupon_cliente_id and codigo_cupon:
            raise serializers.ValidationError("No se puede aplicar un cupon pre-existente y un codigo de cupon a la vez.")
        
        cupon_aplicado_instance = None
        descuento = 0

        # 1. Stock Validation
        for detalle_data in detalles_data:
            producto = detalle_data['producto_det_vent']
            cantidad_solicitada = detalle_data['cantidad_det_vent']
            try:
                stock = Stocks.objects.select_for_update().get(producto_en_stock=producto)
                if stock.cantidad_actual_stock < cantidad_solicitada:
                    raise serializers.ValidationError(f"Stock insuficiente para: {producto.nombre_producto}")
            except Stocks.DoesNotExist:
                raise serializers.ValidationError(f"No hay stock para: {producto.nombre_producto}")

        # 2. Calculate total
        total_venta = sum(
            (d.get('precio_unitario_det_vent', d['producto_det_vent'].precio_unitario_venta_producto) * d['cantidad_det_vent'])
            for d in detalles_data
        )
        validated_data['total_venta'] = total_venta

        # 3. Coupon Logic (Mode 1: Pre-existing Cupones_Clientes voucher)
        if cupon_cliente_id:
            try:
                cupon_aplicado_instance = Cupones_Clientes.objects.get(id_cupon_cli=cupon_cliente_id)
            except Cupones_Clientes.DoesNotExist:
                raise serializers.ValidationError("El cupon de cliente especificado no existe.")

            if cupon_aplicado_instance.cliente_cupon_cli != cliente:
                raise serializers.ValidationError("El cupon no pertenece al cliente.")
            if cupon_aplicado_instance.estado_cupon_cli.id_estado != 16: # 16: DISPONIBLE
                raise serializers.ValidationError(f"El cupon no esta disponible (estado: {cupon_aplicado_instance.estado_cupon_cli.nombre_estado}).")
            
            cupon_desc = cupon_aplicado_instance.cupon_descuento_cupon_cli
            if cupon_desc.descuento_monto_cupon_desc > 0:
                descuento = cupon_desc.descuento_monto_cupon_desc
            elif cupon_desc.descuento_porcentaje_cupon_desc > 0:
                descuento = (total_venta * cupon_desc.descuento_porcentaje_cupon_desc) / 100
            
            validated_data['descuento_aplicado'] = descuento
            validated_data['cupon_aplicado'] = cupon_aplicado_instance

        # 4. Coupon Logic (Mode 2: Instant redemption via code)
        elif codigo_cupon:
            try:
                cupon_desc = Cupones_Descuento.objects.get(nombre_cupon_desc=codigo_cupon)
            except Cupones_Descuento.DoesNotExist:
                raise serializers.ValidationError("El codigo de cupon no es valido.")
            
            # Validate coupon date
            if cupon_desc.fecha_vencimiento_cupon_desc and cupon_desc.fecha_vencimiento_cupon_desc < timezone.now().date():
                raise serializers.ValidationError("El cupon ha vencido.")

            # Validate points
            if cupon_desc.puntos_requeridos_cupon_desc > 0:
                if not cliente or cliente.puntos_actuales < cupon_desc.puntos_requeridos_cupon_desc:
                    raise serializers.ValidationError("Puntos insuficientes para canjear este cupon.")
                
                # Deduct points
                puntos_anteriores = cliente.puntos_actuales
                cliente.puntos_actuales -= cupon_desc.puntos_requeridos_cupon_desc
                cliente.save()
                Historial_Puntos.objects.create(
                    cliente=cliente, puntos_movidos=cupon_desc.puntos_requeridos_cupon_desc * -1,
                    puntos_anteriores=puntos_anteriores, puntos_nuevos=cliente.puntos_actuales,
                    tipo_movimiento='CANJEADOS'
                )
            
            # Create and mark new Cupones_Clientes instance as used
            estado_canjeado = Estados.objects.get(id_estado=17) # 17: CANJEADO
            cupon_aplicado_instance = Cupones_Clientes.objects.create(
                cliente_cupon_cli=cliente,
                cupon_descuento_cupon_cli=cupon_desc,
                estado_cupon_cli=estado_canjeado
            )
            validated_data['cupon_aplicado'] = cupon_aplicado_instance

            if cupon_desc.descuento_monto_cupon_desc > 0:
                descuento = cupon_desc.descuento_monto_cupon_desc
            elif cupon_desc.descuento_porcentaje_cupon_desc > 0:
                descuento = (total_venta * cupon_desc.descuento_porcentaje_cupon_desc) / 100
            
            validated_data['descuento_aplicado'] = descuento

        # 5. Create Sale and Details
        venta = Ventas.objects.create(**validated_data)
        for detalle_data in detalles_data:
            if 'precio_unitario_det_vent' not in detalle_data:
                detalle_data['precio_unitario_det_vent'] = detalle_data['producto_det_vent'].precio_unitario_venta_producto
            Detalle_Ventas.objects.create(venta_det_vent=venta, **detalle_data)

        # 6. Mark coupon as used (only for Mode 1, Mode 2 already marked)
        if cupon_cliente_id and cupon_aplicado_instance: # Check if it was Mode 1
            estado_canjeado = Estados.objects.get(id_estado=17) # 17: CANJEADO
            cupon_aplicado_instance.estado_cupon_cli = estado_canjeado
            cupon_aplicado_instance.save()

        # 7. Points Logic (for points earned)
        neto_pagado = venta.total_venta - venta.descuento_aplicado
        if neto_pagado > 0 and cliente:
            puntos_ganados = math.floor(neto_pagado / settings.PESOS_POR_PUNTO)
            if puntos_ganados > 0:
                puntos_anteriores = cliente.puntos_actuales
                cliente.puntos_actuales += puntos_ganados
                cliente.save()
                Historial_Puntos.objects.create(
                    cliente=cliente, venta_origen=venta, puntos_movidos=puntos_ganados,
                    puntos_anteriores=puntos_anteriores, puntos_nuevos=cliente.puntos_actuales,
                    tipo_movimiento='GANADOS'
                )

        # 8. Deduct Stock and create history
        tipo_movimiento_venta = Tipos_Movimientos.objects.get(id_tipo_movimiento=1) # VENTA
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

        # 9. Cash Register (Caja) Logic
        caja = venta.caja_venta
        saldo_anterior_caja = caja.monto_teorico_caja
        monto_ingreso = neto_pagado
        caja.monto_teorico_caja += monto_ingreso
        caja.save()
        tipo_evento_ingreso, _ = Tipo_Evento.objects.get_or_create(nombre_evento="INGRESO_VENTA")
        Historial_Caja.objects.create(
            caja_hc=caja, empleado_hc=venta.empleado_venta, tipo_event_caja=tipo_evento_ingreso,
            cantidad_movida_hcaja=monto_ingreso, saldo_anterior_hcaja=saldo_anterior_caja,
            nuevo_saldo_hcaja=caja.monto_teorico_caja, descripcion_hcaja=f"Ingreso por venta ID: {venta.id_venta}"
        )
        if venta.vuelto_entregado > 0:
            saldo_anterior_vuelto = caja.monto_teorico_caja
            caja.monto_teorico_caja -= venta.vuelto_entregado
            caja.save()
            tipo_evento_egreso, _ = Tipo_Evento.objects.get_or_create(nombre_evento="EGRESO_VUELTO")
            Historial_Caja.objects.create(
                caja_hc=caja, empleado_hc=venta.empleado_venta, tipo_event_caja=tipo_evento_egreso,
                cantidad_movida_hcaja=venta.vuelto_entregado * -1, saldo_anterior_hcaja=saldo_anterior_vuelto,
                nuevo_saldo_hcaja=caja.monto_teorico_caja, descripcion_hcaja=f"Vuelto por venta ID: {venta.id_venta}"
            )
            
        return venta