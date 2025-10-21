from django.contrib import admin
from .models import Proveedores, Compras, Proveedores_Productos, Detalle_Compras, Compra_MetodoPago

# Register your models here.
@admin.register(Proveedores)
class ProveedoresAdmin(admin.ModelAdmin):
    list_display = (
        'id_proveedor', 'nombre_proveedor', 'razon_social_proveedor',
        'telefono_proveedor', 'cuit_proveedor', 'correo_proveedor', 'estado_proveedor', 'DELETE_Prov'
    )
    search_fields = ('nombre_proveedor', 'cuit_proveedor', 'correo_proveedor')
    list_filter = ('estado_proveedor',)

@admin.register(Compras)
class ComprasAdmin(admin.ModelAdmin):
    list_display = (
        'id_compra', 'fecha_compra', 'fecha_limite', 'total_compra',
        'proveedor_compra', 'estado_compra', 'DELETE_Comp'
    )
    search_fields = ('proveedor_compra__nombre_proveedor',)
    list_filter = ('estado_compra', 'proveedor_compra')

@admin.register(Proveedores_Productos)
class Proveedores_ProductosAdmin(admin.ModelAdmin):
    list_display = ('id_prov_x_prod', 'proveedor_prov_x_prod', 'producto_prov_x_prod', 'precio_unitario_prov_x_prod', 'DELETE_Prov_X_Prod')
    search_fields = ('proveedor_prov_x_prod__nombre_proveedor', 'producto_prov_x_prod__nombre_producto')
    list_filter = ('proveedor_prov_x_prod', 'producto_prov_x_prod')

@admin.register(Detalle_Compras)
class Detalle_ComprasAdmin(admin.ModelAdmin):
    list_display = (
        'id_det_comp', 'compra_dt_comp', 'producto_dt_comp', 'cant_det_comp',
        'precio_unidad_det_comp', 'subtotal_det_comp', 'DELETE_Det_Comp'
    )
    search_fields = ('compra_dt_comp__id_compra', 'producto_dt_comp__nombre_producto')
    list_filter = ('compra_dt_comp', 'producto_dt_comp')

@admin.register(Compra_MetodoPago)
class Compra_MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ('id_comp_metpag', 'compra_comp_metpag', 'metodo_pago_comp_metpag', 'monto_comp_metpag', 'DELETE_Comp_MetPag')
    search_fields = ('compra_comp_metpag__id_compra', 'metodo_pago_comp_metpag__nombre_metodo')
    list_filter = ('metodo_pago_comp_metpag',)