from django.contrib import admin
from .models import Ventas, Detalle_Ventas, Metodos_Pago, Venta_MetodoPago

# Register your models here.
@admin.register(Ventas)
class VentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_venta', 'fecha_venta', 'total_venta', 'cliente_venta',
        'empleado_venta', 'estado_venta', 'caja_venta', 'promo_aplicada', 'DELETE_Vent'
    )
    search_fields = ('cliente_venta__user_cliente__username', 'empleado_venta__user_empleado__username')
    list_filter = ('estado_venta', 'caja_venta', 'promo_aplicada')



@admin.register(Detalle_Ventas)
class Detalle_VentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_det_vent', 'venta_det_vent', 'producto_det_vent', 'cantidad_det_vent',
        'precio_unitario_det_vent', 'subtotal_det_vent', 'DELETE_Det_Vent'
    )
    search_fields = ('venta_det_vent__id_venta', 'producto_det_vent__nombre_producto')
    list_filter = ('venta_det_vent', 'producto_det_vent')

@admin.register(Metodos_Pago)
class Metodos_PagoAdmin(admin.ModelAdmin):
    list_display = ('id_metodo', 'nombre_metodo', 'DELETE_Met')
    search_fields = ('nombre_metodo',)

@admin.register(Venta_MetodoPago)
class Venta_MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ('metodopago_vent_metpag', 'venta_vent_metpag', 'DELETE_Vent_MetPag')
    search_fields = ('metodopago_vent_metpag__nombre_metodo', 'venta_vent_metpag__id_venta')
    list_filter = ('metodopago_vent_metpag',)

