import uuid
from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from HOME.models import (
    Ventas, Detalle_Ventas, Stocks, Historial_Stock, 
    Tipos_Movimientos, Productos, Clientes, Empleados
)

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto = serializers.PrimaryKeyRelatedField(
        queryset=Productos.objects.all(), 
        source='producto_det_vent'
    )
    cantidad = serializers.IntegerField(source='cantidad_det_vent')
    precio_unitario = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        source='precio_unitario_det_vent'
    )

    class Meta:
        model = Detalle_Ventas
        fields = ('producto', 'cantidad', 'precio_unitario')


class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, write_only=True)
    qr_token = serializers.CharField(read_only=True)

    class Meta:
        model = Ventas
        fields = (
            'id_venta', 'cliente_venta', 'empleado_venta', 'caja_venta', 
            'fecha_venta', 'total_venta', 'metodo_pago', 'estado_venta', 
            'observaciones_venta', 'detalles', 'qr_token'
        )
        read_only_fields = ('id_venta', 'fecha_venta', 'qr_token')

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        
        with transaction.atomic():
            # 1. Verificar stock
            for item_data in detalles_data:
                producto = item_data['producto_det_vent']
                cantidad_a_vender = item_data['cantidad_det_vent']
                
                stock_agg = Stocks.objects.filter(producto_en_stock=producto).aggregate(total=Sum('cantidad_actual_stock'))
                stock_disponible = stock_agg['total'] or 0

                if stock_disponible < cantidad_a_vender:
                    raise serializers.ValidationError(
                        f"Stock insuficiente para '{producto.nombre_producto}'. Disponible: {stock_disponible}"
                    )

            # 2. Crear la venta
            venta = Ventas.objects.create(**validated_data)

            # 3. Descontar stock y crear detalles
            tipo_movimiento_salida = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA')
            
            for detalle_data in detalles_data:
                # Calcular subtotal
                subtotal = detalle_data['cantidad_det_vent'] * detalle_data['precio_unitario_det_vent']
                
                # Crear detalle con todos los campos requeridos
                Detalle_Ventas.objects.create(
                    venta_det_vent=venta,
                    producto_det_vent=detalle_data['producto_det_vent'],
                    cantidad_det_vent=detalle_data['cantidad_det_vent'],
                    precio_unitario_det_vent=detalle_data['precio_unitario_det_vent'],
                    subtotal_det_vent=subtotal,
                    descripcion_det_vent=f"Venta de {detalle_data['producto_det_vent'].nombre_producto}"
                )
                
                producto = detalle_data['producto_det_vent']
                cantidad_vendida = detalle_data['cantidad_det_vent']
                
                # Descontar del stock
                stocks = Stocks.objects.filter(
                    producto_en_stock=producto, 
                    cantidad_actual_stock__gt=0
                ).order_by('id_stock')
                
                cantidad_restante = cantidad_vendida
                for stock_entry in stocks:
                    if cantidad_restante <= 0:
                        break
                    
                    stock_anterior = stock_entry.cantidad_actual_stock
                    cantidad_a_descontar = min(stock_entry.cantidad_actual_stock, cantidad_restante)
                    
                    stock_entry.cantidad_actual_stock -= cantidad_a_descontar
                    stock_entry.save()
                    
                    # Registrar en historial
                    Historial_Stock.objects.create(
                        stock_hs=stock_entry,
                        cantidad_hstock=str(cantidad_a_descontar),
                        tipo_movimiento_hs=tipo_movimiento_salida,
                        empleado_hs=venta.empleado_venta,
                        stock_anterior_hstock=stock_anterior,
                        stock_nuevo_hstock=stock_entry.cantidad_actual_stock,
                        observaciones_hstock=f"Venta #{venta.id_venta}"
                    )
                    
                    cantidad_restante -= cantidad_a_descontar
            
            # 4. Generar y guardar el token QR
            venta.qr_token = uuid.uuid4().hex
            venta.save(update_fields=['qr_token'])

        return venta