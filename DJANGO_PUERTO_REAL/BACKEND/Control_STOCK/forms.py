from django import forms
from HOME.models import Productos, Categorias_Productos, Estados

class ProductoForm(forms.ModelForm):
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
        ]
        widgets = {
            'nombre_producto': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion_producto': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'marca_producto': forms.TextInput(attrs={'class': 'form-control'}),
            'precio_unitario_compra_producto': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'precio_unitario_venta_producto': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'categoria_producto': forms.Select(attrs={'class': 'form-control'}),
            'estado_producto': forms.Select(attrs={'class': 'form-control'}),
            'low_stock_threshold': forms.NumberInput(attrs={'class': 'form-control'}),
            'barcode': forms.TextInput(attrs={'class': 'form-control'}),
        }
