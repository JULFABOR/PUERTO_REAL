from django.contrib import admin
from .models import Tipos_Estados, Estados, Alertas, Tipos_Movimientos

# Register your models here.
@admin.register(Tipos_Estados)
class Tipos_EstadosAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_estado', 'nombre_tipo_estado', 'DELETE_TE')
    search_fields = ('nombre_tipo_estado',)

@admin.register(Estados)
class EstadosAdmin(admin.ModelAdmin):
    list_display = ('id_estado', 'nombre_estado', 'tipo_estado', 'DELETE_Est')
    search_fields = ('nombre_estado',)
    list_filter = ('tipo_estado',)

@admin.register(Alertas)
class AlertasAdmin(admin.ModelAdmin):
    list_display = ('id_alerta', 'nombre_alerta', 'mensaje_alerta', 'estado_alerta', 'DELETE_Alerta')
    search_fields = ('nombre_alerta', 'mensaje_alerta')
    list_filter = ('estado_alerta',)

@admin.register(Tipos_Movimientos)
class Tipos_MovimientosAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_movimiento', 'nombre_movimiento', 'is_transfer', 'DELETE_TM')
    search_fields = ('nombre_movimiento',)
