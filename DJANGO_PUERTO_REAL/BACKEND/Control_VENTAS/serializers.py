import uuid
from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Ventas, Detalle_Ventas
from Control_STOCK.models import Stocks, Historial_Stock
from Config_PR.models import Tipos_Movimientos, Estados
from Control_STOCK.models import Productos
from autenticacion.models import Empleados, Clientes



# ==================================================================
# --- SERIALIZERS DE LECTURA (para el Frontend) ---
# ==================================================================

class ProductoVentaSerializer(serializers.ModelSerializer):
    """Serializer simple para mostrar info del producto en el detalle de venta."""
    class Meta:
        model = Productos
        fields = ('id_producto', 'nombre_producto', 'barcode')

class ClienteReadSerializer(serializers.ModelSerializer):
    """Serializer simple para la info del cliente en una venta."""
    nombre_completo = serializers.CharField(source='user_cliente.get_full_name', read_only=True)
    class Meta:
        model = Clientes
        fields = ('id_cliente', 'nombre_completo')

class EmpleadoReadSerializer(serializers.ModelSerializer):
    """Serializer simple para la info del empleado en una venta."""
    username = serializers.CharField(source='user_empleado.username', read_only=True)
    class Meta:
        model = Empleados
        fields = ('id_empleado', 'username')

class EstadoVentaReadSerializer(serializers.ModelSerializer):
    """Serializer simple para el estado de una venta."""
    class Meta:
        model = Estados
        fields = ('id_estado', 'nombre_estado')

class DetalleVentaReadSerializer(serializers.ModelSerializer):
    """Serializer para leer los detalles de una venta, incluyendo el producto."""
    producto_det_vent = ProductoVentaSerializer(read_only=True)

    class Meta:
        model = Detalle_Ventas
        fields = ('id_det_vent', 'producto_det_vent', 'cantidad_det_vent', 'precio_unitario_det_vent', 'subtotal_det_vent')

class VentaReadSerializer(serializers.ModelSerializer):
    """Serializer para leer una venta con todos sus detalles anidados."""
    detalles = DetalleVentaReadSerializer(many=True, read_only=True)
    cliente_venta = ClienteReadSerializer(read_only=True)
    empleado_venta = EmpleadoReadSerializer(read_only=True)
    estado_venta = EstadoVentaReadSerializer(read_only=True)

    class Meta:
        model = Ventas
        fields = (
            'id_venta', 'cliente_venta', 'empleado_venta', 'caja_venta', 
            'fecha_venta', 'total_venta', 'metodo_pago', 'estado_venta', 
            'observaciones_venta', 'detalles', 'qr_token'
        )

# ==================================================================
# --- SERIALIZERS DE ESCRITURA (para crear ventas) ---
# ==================================================================

class DetalleVentaWriteSerializer(serializers.ModelSerializer):
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


class VentaWriteSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaWriteSerializer(many=True, write_only=True)
    qr_token = serializers.CharField(read_only=True)

    class Meta:
        model = Ventas
        fields = (
            'id_venta', 'cliente_venta', 'empleado_venta', 'caja_venta', 
            'fecha_venta', 'total_venta', 'metodo_pago', 'estado_venta', 
            'observaciones_venta', 'detalles', 'qr_token'
        )
        read_only_fields = ('id_venta', 'fecha_venta', 'qr_token')
    
    def validate_caja_venta(self, caja):
        """
        Valida que la caja (que es una instancia del modelo Cajas)
        exista y tenga el estado 'ABIERTA'.
        """
        if not caja.estado_caja or caja.estado_caja.nombre_estado != 'ABIERTA': 
            raise serializers.ValidationError(
                f"La caja seleccionada (ID: {caja.id_caja}) no está abierta."
            )
        return caja

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
            # Usamos get_or_create para asegurar que el tipo de movimiento exista.
            # Esto evita un error 500 si el tipo de movimiento no ha sido creado previamente.
            tipo_movimiento_salida, _ = Tipos_Movimientos.objects.get_or_create(
                nombre_movimiento='MOV_STOCK_SALIDA')
            
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
                        cantidad_hstock=cantidad_a_descontar,
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

            # Registrar ingreso en caja si la venta fue en efectivo
            metodo_pago_venta = validated_data.get('metodo_pago') or getattr(venta, 'metodo_pago', None)
            try:
                if metodo_pago_venta and 'efect' in metodo_pago_venta.lower():
                    # Importar el servicio localmente para evitar importaciones circulares
                    from Abrir_Cerrar_CAJA.services import registrar_ingreso_venta_service
                    caja_obj = validated_data.get('caja_venta') or venta.caja_venta
                    registrar_ingreso_venta_service(caja_obj, venta.empleado_venta, venta.total_venta, venta.id_venta)
            except Exception as e:
                # Si por alguna razón la caja no puede actualizarse, fallamos la creación de la venta
                # para mantener consistencia financiera.
                raise serializers.ValidationError(str(e))

            except Exception as e:
                # Si por alguna razón la caja no puede actualizarse, fallamos la creación de la venta
                # para mantener consistencia financiera.
                raise serializers.ValidationError(str(e))

        return venta

class ProductSalesPerformanceSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(source='producto_det_vent__id_producto')
    product_name = serializers.CharField(source='producto_det_vent__nombre_producto')
    total_quantity_sold = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
