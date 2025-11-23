from django.contrib import admin
from .models import Promociones_Descuento, Promos_Clientes, Historial_Puntos, Transacciones_Puntos

# Register your models here.
@admin.register(Promociones_Descuento)
class Promociones_DescuentoAdmin(admin.ModelAdmin):
    list_display = (
        'id_promo_desc', 'nombre_promo_desc', 'descuento_porcentaje_promo_desc',
        'descuento_monto_promo_desc', 'puntos_requeridos_promo_desc',
        'fecha_inicio_promo_desc', 'fecha_vencimiento_promo_desc', 'DELETE_Promo_Desc'
    )
    search_fields = ('nombre_promo_desc', 'descripcion_promo_desc')

@admin.register(Promos_Clientes)
class Promos_ClientesAdmin(admin.ModelAdmin):
    list_display = ('id_promo_cli', 'cliente_promo_cli', 'cupon_descuento_promo_cli', 'estado_promo_cli', 'DELETE_promo_Clie')
    search_fields = ('cliente_promo_cli__user_cliente__username', 'cupon_descuento_promo_cli__nombre_promo_desc')
    list_filter = ('estado_promo_cli', 'cupon_descuento_promo_cli')


@admin.register(Historial_Puntos)
class Historial_PuntosAdmin(admin.ModelAdmin):
    # --- CORREGIDO ---
    # Estos son los campos que SÍ existen en tu models.py
    list_display = (
        'id_historial_puntos', 
        'cliente_historial_puntos', 
        'puntos_obtenidos_historial_puntos', 
        'puntos_redimidos_historial_puntos', 
        'fecha_historial_puntos', 
        'descripcion_historial_puntos', 
        'DELETE_HP'
    )
    search_fields = ('cliente_historial_puntos__user_cliente__username', 'descripcion_historial_puntos')
    list_filter = ('cliente_historial_puntos', 'fecha_historial_puntos')

@admin.register(Transacciones_Puntos)
class Transacciones_PuntosAdmin(admin.ModelAdmin):
    # --- CORREGIDO ---
    # Estos son los campos que SÍ existen en tu models.py
    list_display = (
        'id_trans_puntos', 
        'cliente_trans_puntos', 
        'fecha_trans_puntos',
        'puntos_trans_puntos',  # <-- Este era el campo incorrecto
        'descripcion_trans_puntos', 
        'DELETE_Trans_Puntos'
    )
    search_fields = ('cliente_trans_puntos__user_cliente__username', 'descripcion_trans_puntos')
    list_filter = ('cliente_trans_puntos', 'fecha_trans_puntos')