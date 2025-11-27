from rest_framework import serializers
from .models import Productos, Categorias_Productos, Stocks, Historial_Stock
from autenticacion.models import Empleados
from Config_PR.models import Estados
from django.utils import timezone
from datetime import timedelta
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

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
    descripcion_producto = serializers.CharField(required=False, allow_blank=True)
    low_stock_threshold = serializers.IntegerField(required=False, default=0)
    barcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    fecha_vencimiento_producto = serializers.DateTimeField(required=False, allow_null=True)
    imagen_producto = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Productos
        fields = [
            'nombre_producto',
            'descripcion_producto',
            'precio_unitario_compra_producto',
            'precio_unitario_venta_producto',
            'imagen_producto',
            'categoria_producto',
            'estado_producto',
            'low_stock_threshold',
            'barcode',
            'fecha_vencimiento_producto',
            'stock_adquirido',
            'stock_actual'
        ]

    def validate_imagen_producto(self, value):
        """
        Procesa y optimiza la imagen con Pillow antes de guardarla
        """
        if value:
            try:
                # Abrir la imagen con Pillow
                img = Image.open(value)
                
                # Convertir RGBA a RGB si es necesario (para JPG)
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = rgb_img
                
                # Redimensionar si es muy grande (máximo 1200x1200)
                max_size = (1200, 1200)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Guardar la imagen optimizada en memoria
                output = BytesIO()
                img.save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                
                # Crear un nuevo archivo con la imagen optimizada
                return InMemoryUploadedFile(
                    output, 
                    'ImageField',
                    f"{value.name.split('.')[0]}.jpg",
                    'image/jpeg',
                    sys.getsizeof(output),
                    None
                )
            except Exception as e:
                raise serializers.ValidationError(f"Error al procesar la imagen: {str(e)}")
        
        return value

class ProductoSerializer(serializers.ModelSerializer):
    categoria_producto = CategoriaProductoSerializer(read_only=True)
    total_stock = serializers.IntegerField(read_only=True, default=0)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Productos
        fields = [
            'id_producto', 'nombre_producto', 'descripcion_producto',
            'precio_unitario_compra_producto', 'precio_unitario_venta_producto',
            'categoria_producto', 'estado_producto', 'low_stock_threshold', 
            'barcode', 'total_stock', 'imagen_producto', 'imagen_url',
            'fecha_vencimiento_producto'
        ]

    def get_imagen_url(self, obj):
        """
        Devuelve la URL de la imagen a través del endpoint de API
        """
        if obj.imagen_producto:
            # Usar el nuevo endpoint de imagen: /api/stock/imagen/<ruta>/
            return f"/api/stock/imagen/{obj.imagen_producto.name}/"
        return None

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
    quantity = serializers.IntegerField()
    movement_type = serializers.ChoiceField(choices=['MOV_STOCK_AJUSTE'])
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    employee = serializers.PrimaryKeyRelatedField(queryset=Empleados.objects.all(), required=False)

    def validate(self, data):
        if not data.get('product_id') and not data.get('barcode'):
            raise serializers.ValidationError("Either 'product_id' or 'barcode' must be provided.")
        return data