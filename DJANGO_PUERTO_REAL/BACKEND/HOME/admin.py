from django.contrib import admin
from .models import (
    Tipos_Estados, Estados, Alertas, Categorias_Productos, Productos, Clientes,
    Empleados, Tipos_Movimientos, Stocks, Historial_Stock, Cajas, Tipo_Evento,
    Historial_Caja, Fondo_Pagos, Movimiento_Fondo, Proveedores, Compras,
    Proveedores_Productos, Detalle_Compras, Compra_MetodoPago, Promociones_Descuento,
    Promos_Clientes, Ventas, Transacciones_Puntos, Historial_Puntos, Detalle_Ventas,
    Metodos_Pago, Venta_MetodoPago, Provincias, Ciudades, Barrios, Calles, Direcciones,
    Historial_Movimientos_Financieros
)

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

@admin.register(Clientes)
class ClientesAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'user_cliente', 'dni_cliente', 'telefono_cliente', 'DELETE_Cli')
    search_fields = ('user_cliente__username', 'dni_cliente')

@admin.register(Empleados)
class EmpleadosAdmin(admin.ModelAdmin):
    list_display = ('id_empleado', 'user_empleado', 'dni_empleado', 'telefono_empleado', 'DELETE_Emple')
    search_fields = ('user_empleado__username', 'dni_empleado')

@admin.register(Tipos_Movimientos)
class Tipos_MovimientosAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_movimiento', 'nombre_movimiento', 'is_transfer', 'DELETE_TM')
    search_fields = ('nombre_movimiento',)

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

@admin.register(Ventas)
class VentasAdmin(admin.ModelAdmin):
    list_display = (
        'id_venta', 'fecha_venta', 'total_venta', 'cliente_venta',
        'empleado_venta', 'estado_venta', 'caja_venta', 'promo_aplicada', 'DELETE_Vent'
    )
    search_fields = ('cliente_venta__user_cliente__username', 'empleado_venta__user_empleado__username')
    list_filter = ('estado_venta', 'caja_venta', 'promo_aplicada')

@admin.register(Transacciones_Puntos)
class Transacciones_PuntosAdmin(admin.ModelAdmin):
    list_display = (
        'id_trans_puntos', 'cliente_trans_puntos', 'fecha_trans_puntos',
        'puntos_transaccion', 'descripcion_trans_puntos', 'DELETE_Trans_Puntos'
    )
    search_fields = ('cliente_trans_puntos__user_cliente__username', 'descripcion_trans_puntos')
    list_filter = ('cliente_trans_puntos',)

@admin.register(Historial_Puntos)
class Historial_PuntosAdmin(admin.ModelAdmin):
    list_display = (
        'id_historial_puntos', 'trans_hist_puntos', 'promo_usada_hist_puntos',
        'puntos_movidos', 'puntos_anteriores', 'puntos_nuevos',
        'fecha_mov_hist_puntos', 'tipo_mov_hist_puntos', 'DELETE_Hist_Puntos'
    )
    search_fields = ('trans_hist_puntos__cliente_trans_puntos__user_cliente__username',)
    list_filter = ('tipo_mov_hist_puntos', 'promo_usada_hist_puntos')

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

@admin.register(Provincias)
class ProvinciasAdmin(admin.ModelAdmin):
    list_display = ('id_provin', 'nombre_provincia', 'DELETE_Provin')
    search_fields = ('nombre_provincia',)

@admin.register(Ciudades)
class CiudadesAdmin(admin.ModelAdmin):
    list_display = ('id_ciudad', 'nombre_ciudad', 'provincia_ciudad', 'DELETE_Ciud')
    search_fields = ('nombre_ciudad',)
    list_filter = ('provincia_ciudad',)

@admin.register(Barrios)
class BarriosAdmin(admin.ModelAdmin):
    list_display = ('id_barrio', 'nombre_barrio', 'ciudad_barrio', 'DELETE_Barrio')
    search_fields = ('nombre_barrio',)
    list_filter = ('ciudad_barrio',)

@admin.register(Calles)
class CallesAdmin(admin.ModelAdmin):
    list_display = ('id_calle', 'nombre_calle', 'barrio_calle', 'DELETE_Calle')
    search_fields = ('nombre_calle',)
    list_filter = ('barrio_calle',)

@admin.register(Direcciones)
class DireccionesAdmin(admin.ModelAdmin):
    list_display = (
        'id_direccion', 'nombre_direccion', 'departamento_direccion',
        'referecia_direccion', 'calle_direccion', 'usuario_direccion', 'DELETE_Dir'
    )
    search_fields = ('nombre_direccion', 'usuario_direccion__username')
    list_filter = ('calle_direccion', 'usuario_direccion')

@admin.register(Historial_Movimientos_Financieros)
class Historial_Movimientos_FinancierosAdmin(admin.ModelAdmin):
    list_display = (
        'id_historial_mov_fin', 'fecha_mov_fin', 'monto_mov_fin', 'caja_mov_fin',
        'compra_mov_fin', 'venta_mov_fin', 'Historial_Caja', 'Movimiento_Fondo', 'DELETE_Hist_Mov_Fin'
    )
    search_fields = ('caja_mov_fin__id_caja',)
    list_filter = ('caja_mov_fin', 'compra_mov_fin', 'venta_mov_fin')