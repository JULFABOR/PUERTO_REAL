from rest_framework import serializers
from django.utils import timezone
from HOME.models import ( 
    Compras, Detalle_Compras, Compra_MetodoPago, Productos, Metodos_Pago, 
    Proveedores, Stocks, Historial_Stock, Tipos_Movimientos, Alertas, Estados
)
from Auditoria.services import crear_registro
from .services import receive_purchase_stock, adjust_stock_on_purchase_edit

# ==================================================================
# --- SERIALIZERS DE LECTURA (para el Frontend) ---
# ==================================================================

class ProductoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = ('id_producto', 'nombre_producto', 'barcode')

class ProveedorSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedores
        fields = ('id_proveedor', 'nombre_proveedor')

class EstadoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estados
        fields = ('id_estado', 'nombre_estado')

class DetalleCompraReadSerializer(serializers.ModelSerializer):
    producto_dt_comp = ProductoCompraSerializer(read_only=True)

    class Meta:
        model = Detalle_Compras
        fields = ('id_det_comp', 'producto_dt_comp', 'cant_det_comp', 'precio_unidad_det_comp', 'subtotal_det_comp')

class CompraReadSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraReadSerializer(many=True, read_only=True)
    proveedor_compra = ProveedorSimpleSerializer(read_only=True)
    estado_compra = EstadoSimpleSerializer(read_only=True)

    class Meta:
        model = Compras
        fields = (
            'id_compra', 
            'proveedor_compra', 
            'fecha_compra', 
            'fecha_limite', 
            'total_compra', 
            'estado_compra', 
            'detalles'
        )

# ==================================================================
# --- SERIALIZERS DE ESCRITURA (para crear/actualizar compras) ---
# ==================================================================

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedores
        fields = '__all__'

class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metodos_Pago
        fields = ('id_metodo', 'nombre_metodo')

class DetalleCompraWriteSerializer(serializers.ModelSerializer):
    id_det_comp = serializers.IntegerField(required=False)
    class Meta:
        model = Detalle_Compras
        fields = ('id_det_comp', 'producto_dt_comp', 'cant_det_comp', 'precio_unidad_det_comp')

class CompraMetodoPagoSerializer(serializers.ModelSerializer):
    metodo_pago_comp_metpag = MetodoPagoSerializer(read_only=True)
    metodo_pago = serializers.PrimaryKeyRelatedField(queryset=Metodos_Pago.objects.all(), source='metodo_pago_comp_metpag', write_only=True)

    class Meta:
        model = Compra_MetodoPago
        fields = ('metodo_pago', 'monto_comp_metpag', 'metodo_pago_comp_metpag')

class CompraWriteSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraWriteSerializer(many=True)
    metodos_pago = CompraMetodoPagoSerializer(many=True, required=False)

    class Meta:
        model = Compras
        fields = (
            'id_compra', 
            'proveedor_compra', 
            'fecha_compra', 
            'fecha_limite', 
            'total_compra', 
            'estado_compra', 
            'detalles',
            'metodos_pago'
        )
        read_only_fields = ('fecha_compra', 'total_compra')

    def _get_empleado(self):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'empleado'):
            raise serializers.ValidationError({"error": "Solo los empleados pueden realizar esta acción."})
        return request.user.empleado

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        metodos_pago_data = validated_data.pop('metodos_pago', [])
        
        compra = Compras.objects.create(**validated_data)
        
        total_compra = 0
        for detalle_data in detalles_data:
            detalle = Detalle_Compras.objects.create(compra_dt_comp=compra, **detalle_data)
            total_compra += detalle.subtotal_det_comp
            
        compra.total_compra = total_compra
        compra.save()
        
        for metodo_pago_data in metodos_pago_data:
            metodo_pago_instance = metodo_pago_data.pop('metodo_pago_comp_metpag')
            Compra_MetodoPago.objects.create(compra_comp_metpag=compra, metodo_pago_comp_metpag=metodo_pago_instance, **metodo_pago_data)

        if compra.fecha_limite:
            Alertas.objects.create(
                nombre_alerta=f"Compra pendiente: #{compra.id_compra}",
                mensaje_alerta=f"La compra #{compra.id_compra} a {compra.proveedor_compra.nombre_proveedor} vence el {compra.fecha_limite.strftime('%d/%m/%Y')}. Revisar y cambiar estado."
            )
        
        crear_registro(
            usuario=self.context['request'].user,
            accion='COMPRA_NUEVA',
            detalles={
                'compra_id': compra.id_compra,
                'proveedor': compra.proveedor_compra.nombre_proveedor if compra.proveedor_compra else None,
                'total': str(compra.total_compra),
                'items': compra.detalles.count()
            }
        )

        return compra

    def update(self, instance, validated_data):
        original_estado = instance.estado_compra
        nuevo_estado = validated_data.get('estado_compra', original_estado)
        
        is_status_change_only = 'estado_compra' in self.initial_data and len(self.initial_data) == 1
        if not is_status_change_only:
            time_diff = timezone.now() - instance.fecha_compra
            if time_diff.total_seconds() > 1200:
                raise serializers.ValidationError(
                    "La compra solo puede ser editada en su totalidad dentro de los 20 minutos de su creación. "
                    "Después de este tiempo, solo se permite cambiar su estado."
                )

        detalles_data = validated_data.pop('detalles', None)
        metodos_pago_data = validated_data.pop('metodos_pago', None)

        # Update the main instance fields
        instance = super().update(instance, validated_data)

        try:
            estado_recibida = Estados.objects.get(nombre_estado='RECIBIDA')
        except Estados.DoesNotExist:
            raise serializers.ValidationError({"error": "El estado 'RECIBIDA' no está configurado en el sistema."})

        was_recibida_before = original_estado == estado_recibida
        is_now_recibida = nuevo_estado == estado_recibida
        
        empleado = self._get_empleado()

        if is_now_recibida and not was_recibida_before:
            receive_purchase_stock(instance, empleado)
        
        if was_recibida_before and detalles_data is not None:
            adjust_stock_on_purchase_edit(instance, detalles_data, empleado)

        # Update details if provided
        if detalles_data is not None:
            existing_detalles_ids = {str(d.id_det_comp) for d in instance.detalles.all()}
            
            for detalle_data in detalles_data:
                detalle_id = str(detalle_data.get('id_det_comp'))
                if detalle_id != 'None' and detalle_id in existing_detalles_ids:
                    # Update existing detail
                    Detalle_Compras.objects.filter(id_det_comp=detalle_id).update(**detalle_data)
                    existing_detalles_ids.remove(detalle_id)
                else:
                    # Create new detail
                    Detalle_Compras.objects.create(compra_dt_comp=instance, **detalle_data)
            
            # Delete details that were removed
            if existing_detalles_ids:
                Detalle_Compras.objects.filter(id_det_comp__in=existing_detalles_ids).delete()

        # Update payment methods if provided
        if metodos_pago_data is not None:
            instance.metodos_pago.all().delete()
            for metodo_pago_data in metodos_pago_data:
                metodo_pago_instance = metodo_pago_data.pop('metodo_pago_comp_metpag')
                Compra_MetodoPago.objects.create(compra_comp_metpag=instance, metodo_pago_comp_metpag=metodo_pago_instance, **metodo_pago_data)

        # Recalculate total and save
        instance.refresh_from_db()
        new_total = sum(d.subtotal_det_comp for d in instance.detalles.all())
        instance.total_compra = new_total
        instance.save(update_fields=['total_compra'])

        return instance