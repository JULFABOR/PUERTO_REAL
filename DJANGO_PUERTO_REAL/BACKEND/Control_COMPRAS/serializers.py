# Control_COMPRAS/serializers.py

from rest_framework import serializers
from django.db import transaction # Import transaction
from django.utils import timezone

# Import models from this app
from .models import Proveedores, Compras, Detalle_Compras, Compra_MetodoPago

# Import related models and serializers from other apps
from Abrir_Cerrar_CAJA.models import Metodos_Pago
from Config_PR.models import Estados, Alertas, Tipos_Movimientos # Ensure Estados is imported
from Config_PR.serializers import EstadoSerializer # Import if you created it
from Control_STOCK.models import Stocks, Historial_Stock, Productos

# Import services
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

# Using EstadoSerializer from Config_PR if available, otherwise define simply here or use StringRelatedField
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
    # Use the detailed serializer for reading state info
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
    # --- ESTA LÍNEA ES LA IMPORTANTE ---
    # Le dice a DRF que use el EstadoSerializer para mostrar los detalles del estado al LEER.
    estado_proveedor = EstadoSerializer(read_only=True)

    # --- Campo para ESCRIBIR el ID (al crear/editar) ---
    estado_proveedor_id = serializers.PrimaryKeyRelatedField(
        queryset=Estados.objects.all(),
        source='estado_proveedor', # Vincula con el campo del modelo
        write_only=True, # Solo se usa para POST/PUT/PATCH
        label="Estado (ID)"
    )

    class Meta:
        model = Proveedores
        # --- Incluye AMBOS campos ---
        fields = [
            'id_proveedor',
            'nombre_proveedor',
            'razon_social_proveedor',
            'cuit_proveedor',
            'telefono_proveedor',
            'correo_proveedor',
            'estado_proveedor',      # Objeto completo (solo lectura)
            'estado_proveedor_id', # ID (solo escritura)
            'DELETE_Prov',
        ]
        read_only_fields = ('id_proveedor',)

class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metodos_Pago
        fields = ('id_metodo', 'nombre_metodo')

class DetalleCompraWriteSerializer(serializers.ModelSerializer):
    # id_det_comp is read-only, used by update logic implicitly if needed
    id_det_comp = serializers.IntegerField(required=False, read_only=True)
    # Use PrimaryKeyRelatedField for writing product reference
    producto_dt_comp = serializers.PrimaryKeyRelatedField(queryset=Productos.objects.all())

    class Meta:
        model = Detalle_Compras
        # Exclude subtotal_det_comp as it's calculated in model save
        fields = ('id_det_comp', 'producto_dt_comp', 'cant_det_comp', 'precio_unidad_det_comp')

class CompraMetodoPagoSerializer(serializers.ModelSerializer):
    metodo_pago_comp_metpag = MetodoPagoSerializer(read_only=True)
    metodo_pago = serializers.PrimaryKeyRelatedField(
        queryset=Metodos_Pago.objects.all(),
        source='metodo_pago_comp_metpag',
        write_only=True
    )

    class Meta:
        model = Compra_MetodoPago
        fields = ('metodo_pago', 'monto_comp_metpag', 'metodo_pago_comp_metpag')


class CompraWriteSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraWriteSerializer(many=True)
    metodos_pago = CompraMetodoPagoSerializer(many=True, required=False)

    # --- 1. Fetch default 'Pendiente' state ---
    try:
        # Ensure 'Pendiente' matches the exact name in your Estados table
        estado_pendiente_default = Estados.objects.get(nombre_estado='Pendiente')
    except Estados.DoesNotExist:
        # Critical error if the default state doesn't exist. The application setup should ensure this.
        raise RuntimeError("Default purchase state 'Pendiente' not found in database. Please configure it.")

    # --- 2. Define estado_compra field with default ---
    estado_compra = serializers.PrimaryKeyRelatedField(
        queryset=Estados.objects.all(),
        default=estado_pendiente_default, # Apply default only on create if not provided
        required=False # Don't require it in the input payload for creation
    )

    # Use PrimaryKeyRelatedField for proveedor_compra when writing
    proveedor_compra = serializers.PrimaryKeyRelatedField(queryset=Proveedores.objects.all())

    class Meta:
        model = Compras
        fields = (
            'id_compra',
            'proveedor_compra', # Expects ID on write
            'fecha_compra',     # Read Only
            'fecha_limite',
            'total_compra',     # Read Only
            'estado_compra',    # Expects ID on write (but has default on create)
            'detalles',
            'metodos_pago'
        )
        read_only_fields = ('id_compra', 'fecha_compra', 'total_compra')

    def _get_empleado(self):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'empleado'):
            raise serializers.ValidationError({"detail": "User is not associated with an employee profile."}) # Use detail for consistency
        return request.user.empleado

    @transaction.atomic # Ensure all operations succeed or fail together
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        metodos_pago_data = validated_data.pop('metodos_pago', [])

        # --- 3. Ensure estado_compra is set ---
        # The 'default' on the field handles this automatically if 'estado_compra'
        # is not present in the initial request data passed to the serializer.
        # validated_data will contain the default state ID here.

        compra = Compras.objects.create(**validated_data)

        total_compra = 0
        detalles_log = [] # For audit log
        for detalle_data in detalles_data:
            detalle = Detalle_Compras.objects.create(compra_dt_comp=compra, **detalle_data)
            # The model save calculates subtotal_det_comp automatically
            total_compra += detalle.subtotal_det_comp
            detalles_log.append({
                'producto_id': detalle.producto_dt_comp_id,
                'cantidad': detalle.cant_det_comp,
                'precio': str(detalle.precio_unidad_det_comp)
            })

        compra.total_compra = total_compra
        compra.save(update_fields=['total_compra'])

        for metodo_pago_data in metodos_pago_data:
            metodo_pago_instance = metodo_pago_data.pop('metodo_pago_comp_metpag')
            Compra_MetodoPago.objects.create(
                compra_comp_metpag=compra,
                metodo_pago_comp_metpag=metodo_pago_instance,
                **metodo_pago_data
            )

        if compra.fecha_limite:
            Alertas.objects.create(
                nombre_alerta=f"Compra pendiente: #{compra.id_compra}",
                mensaje_alerta=(
                    f"La compra #{compra.id_compra} a "
                    f"{compra.proveedor_compra.nombre_proveedor if compra.proveedor_compra else 'N/A'} "
                    f"vence el {compra.fecha_limite.strftime('%d/%m/%Y')}. Revisar y cambiar estado."
                )
            )

        # Audit Log
        try:
             # Get user from context, default to system or handle appropriately
             user = self.context['request'].user if 'request' in self.context else None
             if user and user.is_authenticated:
                 crear_registro(
                     usuario=user,
                     accion='COMPRA_NUEVA',
                     detalles={
                         'compra_id': compra.id_compra,
                         'proveedor_id': compra.proveedor_compra_id,
                         'proveedor_nombre': compra.proveedor_compra.nombre_proveedor if compra.proveedor_compra else None,
                         'total': str(compra.total_compra),
                         'estado_id': compra.estado_compra_id,
                         'estado_nombre': compra.estado_compra.nombre_estado if compra.estado_compra else None,
                         'items_count': len(detalles_log),
                         'items': detalles_log
                     }
                 )
        except Exception as e:
             # Log error if audit fails but don't break the main operation
             print(f"Error creating audit log for new purchase {compra.id_compra}: {e}")


        return compra

    @transaction.atomic # Ensure atomicity
    def update(self, instance, validated_data):
        original_estado = instance.estado_compra
        nuevo_estado = validated_data.get('estado_compra', original_estado)

        # Time limit check for full edits
        is_status_change_only = 'estado_compra' in self.initial_data and len(self.initial_data) == 1 and isinstance(self.initial_data['estado_compra'], int)
        if not is_status_change_only:
            time_diff = timezone.now() - instance.fecha_compra
            if time_diff.total_seconds() > 1200: # 20 minutes
                raise serializers.ValidationError({
                    "detail": "La compra solo puede ser editada en su totalidad dentro de los 20 minutos de su creación. "
                              "Después de este tiempo, solo se permite cambiar su estado."
                })


        detalles_data = validated_data.pop('detalles', None)
        metodos_pago_data = validated_data.pop('metodos_pago', None)

        # Update Compra instance fields first
        # This handles changes to proveedor_compra, fecha_limite, estado_compra etc.
        instance = super().update(instance, validated_data)

        # Stock Adjustment Logic based on status change
        try:
            # Ensure 'RECIBIDA' matches the exact name in your Estados table
            estado_recibida = Estados.objects.get(nombre_estado='RECIBIDA')
        except Estados.DoesNotExist:
            raise serializers.ValidationError({"detail": "El estado 'RECIBIDA' no está configurado en el sistema."})

        was_recibida_before = original_estado == estado_recibida
        # We check instance.estado_compra because super().update() already updated it
        is_now_recibida = instance.estado_compra == estado_recibida

        empleado = self._get_empleado()

        # Call stock services based on status transition
        if is_now_recibida and not was_recibida_before:
            receive_purchase_stock(instance, empleado)

        # If details were changed *after* it was already received, adjust stock
        # This logic might need refinement based on exact requirements
        if was_recibida_before and detalles_data is not None and not is_status_change_only:
            adjust_stock_on_purchase_edit(instance, detalles_data, empleado)

        # --- Update nested details (Improved handling) ---
        if detalles_data is not None:
            instance.detalles.all().delete() # Simple: Delete old, create new
            new_total = 0
            detalles_log = [] # For audit log
            for detalle_data in detalles_data:
                # Ensure related objects are handled correctly (e.g., producto_dt_comp is instance)
                detalle = Detalle_Compras.objects.create(compra_dt_comp=instance, **detalle_data)
                new_total += detalle.subtotal_det_comp
                detalles_log.append({
                    'producto_id': detalle.producto_dt_comp_id,
                    'cantidad': detalle.cant_det_comp,
                    'precio': str(detalle.precio_unidad_det_comp)
                })
            # Recalculate and save total
            instance.total_compra = new_total
            instance.save(update_fields=['total_compra'])

        # --- Update nested payment methods ---
        if metodos_pago_data is not None:
            instance.metodos_pago.all().delete() # Simple: Delete old, create new
            for metodo_pago_data in metodos_pago_data:
                metodo_pago_instance = metodo_pago_data.pop('metodo_pago_comp_metpag')
                Compra_MetodoPago.objects.create(
                    compra_comp_metpag=instance,
                    metodo_pago_comp_metpag=metodo_pago_instance,
                    **metodo_pago_data
                )

        # Audit Log for Update
        try:
             user = self.context['request'].user if 'request' in self.context else None
             if user and user.is_authenticated:
                 crear_registro(
                     usuario=user,
                     accion='COMPRA_UPDATE',
                     detalles={
                         'compra_id': instance.id_compra,
                         'proveedor_id': instance.proveedor_compra_id,
                         'total': str(instance.total_compra),
                         'estado_anterior_id': original_estado.id_estado if original_estado else None,
                         'estado_anterior_nombre': original_estado.nombre_estado if original_estado else None,
                         'estado_nuevo_id': instance.estado_compra_id,
                         'estado_nuevo_nombre': instance.estado_compra.nombre_estado if instance.estado_compra else None,
                         'items_count': instance.detalles.count(),
                         # Include details if needed, similar to create log
                     }
                 )
        except Exception as e:
             print(f"Error creating audit log for updated purchase {instance.id_compra}: {e}")

        # Refresh instance from DB before returning to ensure all updates reflected
        instance.refresh_from_db()
        return instance