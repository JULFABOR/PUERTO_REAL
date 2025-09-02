from rest_framework import serializers
from HOME.models import Productos, Stocks, Categorias_Productos, Historial_Stock, Tipos_Movimientos, Empleados
from django.utils import timezone
from datetime import timedelta

class CategoriaProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorias_Productos
        fields = ['id_categoria', 'nombre_categoria']

class ProductoSerializer(serializers.ModelSerializer):
    categoria_producto = CategoriaProductoSerializer(read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Productos
        fields = [
            'id_producto', 'nombre_producto', 'descripcion_producto',
            'marca_producto', 'precio_unitario_venta_producto',
            'categoria_producto', 'low_stock_threshold', 'barcode',
            'is_low_stock'
        ]

    def get_is_low_stock(self, obj):
        # Calculate current total stock for the product
        total_stock = Stocks.objects.filter(producto_en_stock=obj).aggregate(total=serializers.Sum('cantidad_actual_stock'))['total'] or 0
        return total_stock <= obj.low_stock_threshold

class StockSerializer(serializers.ModelSerializer):
    producto_en_stock = ProductoSerializer(read_only=True)
    is_expired = serializers.SerializerMethodField()
    days_until_expiration = serializers.SerializerMethodField()

    class Meta:
        model = Stocks
        fields = [
            'id_stock', 'cantidad_actual_stock', 'lote_stock',
            'fecha_vencimiento', 'observaciones_stock', 'producto_en_stock',
            'is_expired', 'days_until_expiration'
        ]

    def get_is_expired(self, obj):
        return obj.fecha_vencimiento < timezone.now()

    def get_days_until_expiration(self, obj):
        if obj.fecha_vencimiento:
            time_difference = obj.fecha_vencimiento - timezone.now()
            return time_difference.days
        return None

class HistorialStockSerializer(serializers.ModelSerializer):
    stock_hs = StockSerializer(read_only=True)
    empleado_hs = serializers.StringRelatedField(read_only=True) # Assuming Empleados has a good __str__
    tipo_movimiento_hs = serializers.StringRelatedField(read_only=True) # Assuming Tipos_Movimientos has a good __str__

    class Meta:
        model = Historial_Stock
        fields = '__all__'

class StockUpdateSerializer(serializers.Serializer):
    # Use product_id or barcode for identification
    product_id = serializers.IntegerField(required=False)
    barcode = serializers.CharField(max_length=100, required=False)
    quantity = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    employee_id = serializers.IntegerField() # Assuming employee ID is passed

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
    employee_id = serializers.IntegerField()

    def validate(self, data):
        if not data.get('product_id') and not data.get('barcode'):
            raise serializers.ValidationError("Either 'product_id' or 'barcode' must be provided.")
        return data
