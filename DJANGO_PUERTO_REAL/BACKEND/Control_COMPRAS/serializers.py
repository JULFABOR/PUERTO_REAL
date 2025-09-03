from rest_framework import serializers
from HOME.models import ( 
    Compras, Detalle_Compras, Compra_MetodoPago, Productos, Metodos_Pago, 
    Proveedores, Stocks, Historial_Stock, Tipos_Movimientos, Alertas
)
from Auditoria.services import crear_registro

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedores
        fields = '__all__'

class DetalleCompraSerializer(serializers.ModelSerializer):
    id_det_comp = serializers.IntegerField(required=False)
    class Meta:
        model = Detalle_Compras
        fields = ('id_det_comp', 'producto_dt_comp', 'cant_det_comp', 'precio_unidad_det_comp')

class CompraMetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra_MetodoPago
        fields = ('metodo_pago', 'monto')

class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True)
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
            'es_credito', 
            'detalles',
            'metodos_pago'
        )
        read_only_fields = ('fecha_compra', 'total_compra')

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
            Compra_MetodoPago.objects.create(compra=compra, **metodo_pago_data)

        # Crear una alerta si hay una fecha límite
        if compra.fecha_limite:
            Alertas.objects.create(
                nombre_alerta=f"Compra pendiente: #{compra.id_compra}",
                mensaje_alerta=f"La compra #{compra.id_compra} a {compra.proveedor_compra.nombre_proveedor} vence el {compra.fecha_limite.strftime('%d/%m/%Y')}. Revisar y cambiar estado."
                # estado_alerta usará el valor por defecto del modelo
            )
        
        # --- REGISTRO DE AUDITORÍA ---
        crear_registro(
            usuario=self.context['request'].user,
            accion='COMPRA_NUEVA',
            detalles={
                'compra_id': compra.id_compra,
                'proveedor': compra.proveedor_compra.nombre_proveedor if compra.proveedor_compra else None,
                'total': str(compra.total_compra),
                'es_credito': compra.es_credito,
                'items': compra.detalles.count()
            }
        )
        # --- FIN REGISTRO ---

        return compra

    def update(self, instance, validated_data):
        is_recibida_antes = instance.estado_compra.id_estado == 7
        
        detalles_data = validated_data.pop('detalles', None)
        metodos_pago_data = validated_data.pop('metodos_pago', None)

        # Actualizar campos de Compra
        instance = super().update(instance, validated_data)

        if detalles_data is not None:
            existing_detalles = {str(d.id_det_comp): d for d in instance.detalles.all()}
            new_total_compra = 0

            for detalle_data in detalles_data:
                detalle_id = str(detalle_data.get('id_det_comp'))
                if detalle_id in existing_detalles:
                    detalle = existing_detalles.pop(detalle_id)
                    original_cantidad = detalle.cant_det_comp
                    
                    detalle.cant_det_comp = detalle_data.get('cant_det_comp', detalle.cant_det_comp)
                    detalle.precio_unidad_det_comp = detalle_data.get('precio_unidad_det_comp', detalle.precio_unidad_det_comp)
                    detalle.save() # Recalcula el subtotal

                    if is_recibida_antes:
                        cantidad_diff = detalle.cant_det_comp - original_cantidad
                        if cantidad_diff != 0:
                            try:
                                stock = Stocks.objects.get(producto_en_stock=detalle.producto_dt_comp)
                                stock_anterior = stock.cantidad_actual_stock
                                stock.cantidad_actual_stock += cantidad_diff
                                stock.save()

                                tipo_movimiento = Tipos_Movimientos.objects.get(id_tipo_movimiento=12) # MOV_STOCK_AJUSTE
                                empleado = self.context['request'].user.empleado

                                Historial_Stock.objects.create(
                                    stock_hs=stock, cantidad_hstock=cantidad_diff,
                                    stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
                                    tipo_movimiento_hs=tipo_movimiento, empleado_hs=empleado,
                                    observaciones_hstock=f"Ajuste por edicion de compra ID: {instance.id_compra}"
                                )
                            except Stocks.DoesNotExist:
                                # Manejar caso donde el registro de stock no existe si es necesario
                                pass
                else:
                    # Nuevo detalle
                    Detalle_Compras.objects.create(compra_dt_comp=instance, **detalle_data)
            
            # Manejar detalles eliminados
            for detalle_id, detalle in existing_detalles.items():
                if is_recibida_antes:
                     # Ajustar stock para ítems eliminados
                    try:
                        stock = Stocks.objects.get(producto_en_stock=detalle.producto_dt_comp)
                        stock.cantidad_actual_stock -= detalle.cant_det_comp
                        stock.save()
                        # ... crear registro de historial para eliminación ...
                    except Stocks.DoesNotExist:
                        pass
                detalle.delete()

            # Recalcular total
            instance.refresh_from_db()
            new_total = sum(d.subtotal_det_comp for d in instance.detalles.all())
            instance.total_compra = new_total
            instance.save()

        if metodos_pago_data is not None:
            instance.metodos_pago.all().delete()
            for metodo_pago_data in metodos_pago_data:
                Compra_MetodoPago.objects.create(compra=instance, **metodo_pago_data)

        return instance