from django.contrib import admin
from .models import Cajas, Tipo_Evento, Historial_Caja, Fondo_Pagos, Movimiento_Fondo, Historial_Movimientos_Financieros

# Register your models here.
@admin.register(Cajas)
class CajasAdmin(admin.ModelAdmin):
    list_display = (
        'id_caja', 'monto_apertura_caja', 'monto_cierre_caja', 'total_gastos_caja',
        'monto_teorico_caja', 'diferencia_caja', 'estado_caja', 'DELETE_Caja'
    )
    search_fields = ('estado_caja__nombre_estado',)
    list_filter = ('estado_caja',)

@admin.register(Tipo_Evento)
class Tipo_EventoAdmin(admin.ModelAdmin):
    list_display = ('id_evento', 'nombre_evento', 'DELETE_Event')
    search_fields = ('nombre_evento',)

@admin.register(Historial_Caja)
class Historial_CajaAdmin(admin.ModelAdmin):
    list_display = (
        'id_historial_caja', 'caja_hc', 'empleado_hc', 'tipo_event_caja',
        'destino_movimiento', 'fecha_movimiento_hcaja', 'saldo_anterior_hcaja',
        'nuevo_saldo_hcaja', 'DELETE_Hcaja'
    )
    search_fields = ('caja_hc__id_caja', 'empleado_hc__user_empleado__username', 'descripcion_hcaja')
    list_filter = ('tipo_event_caja', 'destino_movimiento')

@admin.register(Fondo_Pagos)
class Fondo_PagosAdmin(admin.ModelAdmin):
    list_display = ('id_fondo_fp', 'saldo_fp', 'estado_fp', 'DELETE_fp', 'fecha_fp')
    search_fields = ('estado_fp__nombre_estado',)
    list_filter = ('estado_fp',)

@admin.register(Movimiento_Fondo)
class Movimiento_FondoAdmin(admin.ModelAdmin):
    list_display = (
        'id_mov_fp', 'fondo_mov_fp', 'fecha_mov_fp', 'tipo_mov_fp',
        'monto_mov_fp', 'motivo_mov_fp', 'empleado_mov_fp', 'DELETE_Mov_Fp'
    )
    search_fields = ('fondo_mov_fp__id_fondo_fp', 'motivo_mov_fp', 'empleado_mov_fp__user_empleado__username')
    list_filter = ('tipo_mov_fp', 'empleado_mov_fp')

@admin.register(Historial_Movimientos_Financieros)
class Historial_Movimientos_FinancierosAdmin(admin.ModelAdmin):
    list_display = (
        'id_historial_mov_fin', 'fecha_mov_fin', 'monto_mov_fin', 'caja_mov_fin',
        'compra_mov_fin', 'venta_mov_fin', 'Historial_Caja', 'Movimiento_Fondo', 'DELETE_Hist_Mov_Fin'
    )
    search_fields = ('caja_mov_fin__id_caja',)
    list_filter = ('caja_mov_fin', 'compra_mov_fin', 'venta_mov_fin')