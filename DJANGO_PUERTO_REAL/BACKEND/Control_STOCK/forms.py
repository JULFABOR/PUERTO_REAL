from django import forms
from HOME.models import Productos

class ProductoForm(forms.ModelForm):
    class Meta:
        model = Productos
        fields = [
            'nombre_producto',
            'descripcion_producto',
            'precio_unitario_compra_producto',
            'precio_unitario_venta_producto',
            'fecha_vencimiento_producto',
            'categoria_producto',
            'estado_producto',
            'low_stock_threshold',
            'barcode',
        ]