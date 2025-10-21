from django.contrib import admin
from .models import Categorias_Productos, Productos, Stocks, Historial_Stock

# Register your models here.
@admin.register(Categorias_Productos)
class Categorias_ProductosAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'nombre_categoria', 'DELETE_CateP')
    search_fields = ('nombre_categoria',)

@admin.register(Productos)
class ProductosAdmin(admin.ModelAdmin):
    list_display = (
        'id_producto', 'nombre_producto', 'precio_unitario_venta_producto',
        'categoria_producto', 'estado_producto', 'low_stock_threshold', 'barcode', 'DELETE_Prod'
    )
    search_fields = ('nombre_producto', 'barcode')
    list_filter = ('categoria_producto', 'estado_producto')

@admin.register(Stocks)
class StocksAdmin(admin.ModelAdmin):
    list_display = ('id_stock', 'producto_en_stock', 'cantidad_actual_stock', 'lote_stock', 'DELETE_Stock')
    search_fields = ('producto_en_stock__nombre_producto', 'lote_stock')
    list_filter = ('producto_en_stock',)

@admin.register(Historial_Stock)
class Historial_StockAdmin(admin.ModelAdmin):
    list_display = (
        'id_historial_stock', 'stock_hs', 'empleado_hs', 'tipo_movimiento_hs',
        'fecha_movimiento_hstock', 'stock_anterior_hstock', 'stock_nuevo_hstock', 'DELETE_Hstock'
    )
    search_fields = ('stock_hs__producto_en_stock__nombre_producto', 'empleado_hs__user_empleado__username')
    list_filter = ('tipo_movimiento_hs', 'empleado_hs')