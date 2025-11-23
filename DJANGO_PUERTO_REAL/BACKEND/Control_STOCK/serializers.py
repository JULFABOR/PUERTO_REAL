from rest_framework import serializers
from .models import Productos, Categorias_Productos, Stocks, Historial_Stock
from autenticacion.models import Empleados
from Config_PR.models import Estados
from django.utils import timezone
from datetime import timedelta

class EstadoProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estados
        fields = ['id_estado', 'nombre_estado']

class CategoriaProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorias_Productos
        fields = ['id_categoria', 'nombre_categoria']

class ProductoWriteSerializer(serializers.ModelSerializer):
    stock_adquirido = serializers.IntegerField(write_only=True, required=False, default=0)
    stock_actual = serializers.IntegerField(write_only=True, required=False, default=0)
    # Hacemos los campos opcionales para que coincidan con el modelo
    descripcion_producto = serializers.CharField(required=False, allow_blank=True)
    low_stock_threshold = serializers.IntegerField(required=False, default=0)
    barcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    fecha_vencimiento_producto = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Productos
        fields = [
            'nombre_producto',
            'descripcion_producto',
            'precio_unitario_compra_producto',
            'precio_unitario_venta_producto',
            'categoria_producto',
            'estado_producto',
            'low_stock_threshold',
            'barcode',
            'fecha_vencimiento_producto',
            'stock_adquirido',
            'stock_actual'
        ]

class ProductoSerializer(serializers.ModelSerializer):
    categoria_producto = CategoriaProductoSerializer(read_only=True)
    total_stock = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Productos
        fields = [
            'id_producto', 'nombre_producto', 'descripcion_producto',
            'precio_unitario_compra_producto', 'precio_unitario_venta_producto',
            'categoria_producto', 'estado_producto', 'low_stock_threshold', 'barcode', 'total_stock',
        ]

class StockSerializer(serializers.ModelSerializer):
    producto_en_stock = ProductoSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()
    days_until_expiration = serializers.SerializerMethodField()

    class Meta:
        model = Stocks
        fields = [
            'id_stock', 'cantidad_actual_stock', 'lote_stock',
            'observaciones_stock', 'producto_en_stock',
            'is_expired', 'days_until_expiration'
        ]

    def get_is_expired(self, obj):
        if obj.producto_en_stock.fecha_vencimiento_producto:
            return obj.producto_en_stock.fecha_vencimiento_producto < timezone.now()
        return False

    def get_days_until_expiration(self, obj):
        if obj.producto_en_stock.fecha_vencimiento_producto:
            time_difference = obj.producto_en_stock.fecha_vencimiento_producto - timezone.now()
            return time_difference.days
        return None

class HistorialStockSerializer(serializers.ModelSerializer):
    stock_hs = StockSerializer(read_only=True)
    empleado_hs = serializers.StringRelatedField(read_only=True) 
    tipo_movimiento_hs = serializers.StringRelatedField(read_only=True) 
    class Meta:
        model = Historial_Stock
        fields = '__all__'

class StockUpdateSerializer(serializers.Serializer):
    # Use product_id or barcode for identification
    product_id = serializers.IntegerField(required=False)
    barcode = serializers.CharField(max_length=100, required=False)
    quantity = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    employee = serializers.PrimaryKeyRelatedField(queryset=Empleados.objects.all()) 

    def validate(self, data):
        if not data.get('product_id') and not data.get('barcode'):
            raise serializers.ValidationError("Either 'product_id' or 'barcode' must be provided.")
        return data

class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False)
    barcode = serializers.CharField(max_length=100, required=False)
    quantity = serializers.IntegerField() # Can be positive or negative for adjustment
    movement_type = serializers.ChoiceField(choices=['MOV_STOCK_AJUSTE']) # Only 'MOV_STOCK_AJUSTE' allowed here
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    employee = serializers.PrimaryKeyRelatedField(queryset=Empleados.objects.all(), required=False) # <-- CAMBIO AQUÍ

    def validate(self, data):
        if not data.get('product_id') and not data.get('barcode'):
            raise serializers.ValidationError("Either 'product_id' or 'barcode' must be provided.")
        return data
