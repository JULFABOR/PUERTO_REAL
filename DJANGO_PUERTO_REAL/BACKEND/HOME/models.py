from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

#Eje central del sistema
class Tipos_Estados(models.Model):
    id_tipo_estado = models.AutoField(primary_key=True)
    nombre_tipo_estado = models.CharField(max_length=50)
    DELETE_TE = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_tipo_estado
class Estados(models.Model):
    id_estado = models.AutoField(primary_key=True)
    nombre_estado = models.CharField(max_length=50)
    tipo_estado = models.ForeignKey(Tipos_Estados, on_delete=models.CASCADE)
    DELETE_Est = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_estado
class Alertas(models.Model):
    id_alerta = models.AutoField(primary_key=True)
    nombre_alerta = models.CharField(max_length=100)
    mensaje_alerta = models.CharField(max_length=500)
    estado_alerta = models.ForeignKey(Estados, on_delete=models.CASCADE, default=23)
    DELETE_Alerta = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_alerta
    def msg_alerta(self):
        return f"{self.mensaje_alerta}"

class Categorias_Productos (models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=150)
    DELETE_CateP = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_categoria
# class Unidad_Medida_Productos (models.Model):
#     id_unidad_medida = models.AutoField(primary_key=True)
#     nombre_unidad_medida = models.CharField(max_length=150)
#     DELETE_UMP = models.BooleanField(default=False)
#     def __str__(self):
#         return self.nombre_unidad_medida
class Productos(models.Model):
    id_producto = models.BigAutoField(primary_key=True)
    fecha_registro_producto = models.DateTimeField(auto_now_add=True)
    descripcion_producto = models.CharField(max_length=500)
    nombre_producto = models.CharField(max_length=200)
    precio_unitario_compra_producto = models.DecimalField(max_digits=8, decimal_places=2)
    precio_unitario_venta_producto = models.DecimalField(max_digits=8, decimal_places=2)
    # unidad_medida_producto = models.ForeignKey(Unidad_Medida_Productos, on_delete=models.CASCADE)
    fecha_vencimiento_producto = models.DateTimeField(null=True, blank=True)
    categoria_producto = models.ForeignKey(Categorias_Productos, on_delete=models.CASCADE)
    estado_producto = models.ForeignKey(Estados, on_delete=models.CASCADE)
    low_stock_threshold = models.IntegerField(default=0) # Added field
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True) # New field for barcode
    DELETE_Prod = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_producto
class Clientes(models.Model):
    user_cliente = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cliente')
    id_cliente = models.BigAutoField(primary_key=True)
    dni_cliente = models.CharField(max_length=50)
    telefono_cliente = models.CharField(max_length=50)
    DELETE_Cli = models.BooleanField(default=False)
    def __str__(self):
        return self.user_cliente.get_full_name()
class Empleados(models.Model):
    user_empleado = models.OneToOneField(User, on_delete=models.CASCADE, related_name='empleado')
    id_empleado = models.BigAutoField(primary_key=True)
    dni_empleado = models.CharField(max_length=50)
    telefono_empleado = models.CharField(max_length=50)
    fecha_alta_empleado = models.DateTimeField(auto_now_add=True)
    fecha_baja_empleado = models.DateTimeField(null=True, blank=True)
    DELETE_Emple = models.BooleanField(default=False)
    def __str__(self):
        return self.user_empleado.get_full_name()
class Tipos_Movimientos(models.Model):
    id_tipo_movimiento = models.AutoField(primary_key=True)
    nombre_movimiento = models.CharField(max_length=50)
    is_transfer = models.BooleanField(default=False) # New field
    DELETE_TM = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_movimiento
#Control de Stocks 
class Stocks(models.Model):
    id_stock = models.BigAutoField(primary_key=True)
    cantidad_actual_stock = models.IntegerField()
    lote_stock = models.IntegerField()
    observaciones_stock = models.CharField(max_length=300)
    producto_en_stock = models.ForeignKey(Productos, on_delete=models.CASCADE)
    DELETE_Stock = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.producto_en_stock.nombre_producto} - Lote: {self.lote_stock} - Cantidad: {self.cantidad_actual_stock} - Vence: {self.producto_en_stock.fecha_vencimiento_producto.strftime('%Y-%m-%d') if self.producto_en_stock.fecha_vencimiento_producto else 'N/A'}"
class Historial_Stock(models.Model):
    id_historial_stock = models.BigAutoField(primary_key=True)
    cantidad_hstock = models.CharField(max_length=100)
    stock_hs = models.ForeignKey(Stocks, on_delete=models.CASCADE)
    empleado_hs = models.ForeignKey(Empleados,on_delete=models.CASCADE)
    tipo_movimiento_hs = models.ForeignKey(Tipos_Movimientos, on_delete=models.CASCADE)
    fecha_movimiento_hstock = models.DateTimeField(auto_now_add=True)
    stock_anterior_hstock = models.IntegerField()
    stock_nuevo_hstock = models.IntegerField()
    observaciones_hstock = models.CharField(max_length=300)
    DELETE_Hstock = models.BooleanField(default=False)
    def __str__(self):
        return self.fecha_movimiento_hstock
#Apertura/Cierre de Caja
class Cajas(models.Model):
    id_caja = models.AutoField(primary_key=True)
    total_gastos_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_apertura_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_cierre_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_teorico_caja = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia_caja = models.DecimalField(max_digits=10, decimal_places=2)
    observaciones_caja = models.CharField(max_length=200)
    estado_caja = models.ForeignKey(Estados, on_delete=models.CASCADE)
    DELETE_Caja = models.BooleanField(default=False)
    def __str__(self):
        return self.monto_apertura_caja
class Tipo_Evento(models.Model):
    id_evento = models.AutoField(primary_key=True)
    nombre_evento = models.CharField(max_length=50)
    DELETE_Event = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_evento
class Historial_Caja(models.Model):    
    id_historial_caja = models.BigAutoField(primary_key=True)
    cantidad_movida_hcaja = models.DecimalField(max_digits=10, decimal_places=2)
    caja_hc = models.ForeignKey(Cajas, on_delete=models.CASCADE)
    empleado_hc = models.ForeignKey(Empleados,on_delete=models.CASCADE)
    tipo_event_caja = models.ForeignKey(Tipo_Evento, on_delete=models.CASCADE)
    DESTINO_CHOICES = [
        ('DEPOSITAR_OTROS', 'Depositar/Otros'),
        ('PARA_PAGOS_FONDO', 'Para pagos (Fondo)'),
        ('OTRO', 'Otro')
    ]
    destino_movimiento = models.CharField(max_length=50, choices=DESTINO_CHOICES, null=True, blank=True)
    fecha_movimiento_hcaja = models.DateTimeField(auto_now_add=True)
    saldo_anterior_hcaja = models.DecimalField(max_digits=20, decimal_places=2)
    nuevo_saldo_hcaja = models.DecimalField(max_digits=20, decimal_places=2)
    descripcion_hcaja = models.CharField(max_length=300)
    DELETE_Hcaja = models.BooleanField(default=False)
class Fondo_Pagos(models.Model):
    id_fondo_fp = models.BigAutoField(primary_key=True)
    saldo_fp = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    estado_fp = models.ForeignKey(Estados, on_delete=models.CASCADE)
    DELETE_fp = models.BooleanField(default=True)
    fecha_fp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Fondo de Pagos #{self.id_fondo_fp} (${self.saldo_fp})"
class Movimiento_Fondo(models.Model):
    id_mov_fp = models.BigAutoField(primary_key=True)
    TIPO_mov = (("ENTRADA", "Entrada"), ("SALIDA", "Salida"))
    fondo_mov_fp = models.ForeignKey(Fondo_Pagos, on_delete=models.CASCADE, related_name="movimientos")
    fecha_mov_fp = models.DateTimeField(auto_now_add=True)
    tipo_mov_fp = models.ForeignKey(Tipos_Movimientos, on_delete=models.CASCADE)
    monto_mov_fp = models.DecimalField(max_digits=12, decimal_places=2)
    motivo_mov_fp = models.CharField(max_length=200, blank=True)
    empleado_mov_fp = models.ForeignKey(Empleados, on_delete=models.PROTECT)
    DELETE_Mov_Fp = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.fecha_mov_fp} {self.tipo_mov_fp} ${self.monto_mov_fp}"
#Compras
class Proveedores(models.Model):
    id_proveedor = models.BigAutoField(primary_key=True)
    nombre_proveedor = models.CharField(max_length=100)
    razon_social_proveedor = models.CharField(max_length=100)
    telefono_proveedor = models.CharField(max_length=20)
    cuit_proveedor = models.CharField(max_length=100)
    correo_proveedor = models.EmailField(max_length=100)
    estado_proveedor = models.ForeignKey(Estados, on_delete=models.CASCADE)
    DELETE_Prov = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_proveedor
class Compras(models.Model):
    id_compra = models.BigAutoField(primary_key =True)
    fecha_compra = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateTimeField(null=True, blank=True) # Para compras pendientes
    total_compra = models.DecimalField(max_digits=10, decimal_places=2)
    proveedor_compra = models.ForeignKey(Proveedores, on_delete=models.PROTECT)
    estado_compra = models.ForeignKey(Estados, on_delete=models.CASCADE)
    DELETE_Comp = models.BooleanField(default=False)
    def __str__(self):
        return f"Compra #{self.id_compra} - {self.fecha_compra.strftime('%Y-%m-%d %H:%M:%S')} - {self.proveedor_compra.nombre_proveedor}"
class Proveedores_Productos(models.Model):
    id_prov_x_prod = models.BigAutoField(primary_key=True)
    precio_unitario_prov_x_prod = models.IntegerField()
    proveedor_prov_x_prod = models.ForeignKey(Proveedores, on_delete=models.CASCADE)
    producto_prov_x_prod = models.ForeignKey(Productos, on_delete=models.CASCADE)
    DELETE_Prov_X_Prod = models.BooleanField(default=False)
    def __str__(self):
        return self.precio_unitario_prov_x_prod
class Detalle_Compras(models.Model):
    id_det_comp = models.BigAutoField(primary_key=True)
    precio_unidad_det_comp = models.DecimalField(max_digits=10, decimal_places=2)
    cant_det_comp = models.PositiveIntegerField()
    subtotal_det_comp = models.DecimalField(max_digits=10, decimal_places=2)
    producto_dt_comp = models.ForeignKey(Productos, on_delete=models.PROTECT)
    compra_dt_comp = models.ForeignKey(Compras, on_delete=models.CASCADE, related_name='detalles')
    DELETE_Det_Comp = models.BooleanField(default=False)
    def save(self, *args, **kwargs):
        self.subtotal_det_comp = self.precio_unidad_det_comp * self.cant_det_comp
        super().save(*args, **kwargs)
    def __str__(self):
        return f"Detalle Compra #{self.id_det_comp} - Producto: {self.producto_dt_comp.nombre_producto} - Cantidad: {self.cant_det_comp} - Subtotal: {self.subtotal_det_comp}"

class Compra_MetodoPago(models.Model):
    id_comp_metpag = models.BigAutoField(primary_key=True)
    compra_comp_metpag = models.ForeignKey(Compras, on_delete=models.CASCADE, related_name='metodos_pago')
    metodo_pago_comp_metpag = models.ForeignKey('Metodos_Pago', on_delete=models.CASCADE)
    monto_comp_metpag = models.DecimalField(max_digits=10, decimal_places=2)
    DELETE_Comp_MetPag = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.compra_comp_metpag} - {self.metodo_pago_comp_metpag}: {self.monto_comp_metpag}"
# class Facturas_Compras(models.Model):
#     id_factura_compra = models.BigAutoField(primary_key=True)
#     fecha_orden_compra = models.DateTimeField(auto_now_add=True)
#     proveedor_orden_compra = models.ForeignKey(Proveedores, on_delete=models.CASCADE)
#     empleado_orden_compra = models.ForeignKey(Empleados, on_delete=models.CASCADE)    
#     DELETE_Orden_Comp = models.BooleanField(default=False)
#     def __str__(self):
#         return self.fecha_orden_compra
# class Detalle_Pedidos(models.Model):
#     id_det_pedi = models.BigAutoField(primary_key=True)
#     cantidad_det_pedi = models.IntegerField()
#     precio_unitario_det_pedi = models.DecimalField(max_digits=10, decimal_places=2)
#     provxprod_det_pedi = models.ForeignKey(Proveedores_Productos,on_delete=models.CASCADE)
#     orden_compra_det_pedi = models.ForeignKey(Ordenes_Compras,on_delete=models.CASCADE)
#     DELETE_Det_Pedi = models.BooleanField(default=False)
#     def __str__(self):
#         return f"{self.producto} x{self.cantidad}"
# class Historial_Precio_Producto(models.Model):
#     id_histo_precio_prod = models.BigIntegerField(primary_key=True)
#     producto_histo_precio_prod = models.ForeignKey(Productos, on_delete=models.CASCADE)
#     fecha_histo_precio_prod = models.DateTimeField(auto_now_add=True)
#     precio_anterior_histo_precio_prod = models.DecimalField(max_digits=10, decimal_places=2)
#     precio_nuevo_histo_precio_prod = models.DecimalField(max_digits=10, decimal_places=2)
#     empleado_histo_precio_prod = models.ForeignKey(Empleados,on_delete=models.CASCADE)    
#     DELETE_Histo_Precio_Prod = models.BooleanField(default=False)
#     def __str__(self):
#         return f"{self.producto_histo_precio_prod} - {self.fecha_histo_precio_prod}"
# class Historial_Cajas_Compras(models.Model):
#     id_histo_caja_compras = models.BigAutoField(primary_key=True)
#     compra_histo_caja_comp = models.ForeignKey(Compras,on_delete=models.CASCADE)
#     caja_histo_caja_comp = models.ForeignKey(Cajas,on_delete=models.CASCADE)
#     empleado_histo_caja_comp = models.ForeignKey(Empleados,on_delete=models.CASCADE)    
#     DELETE_Histo_Caja_Comp = models.BooleanField(default=False)
#     def __str__(self):
#         return f"{self.compra_histo_caja_comp} - {self.caja_histo_caja_comp} - {self.empleado_histo_caja_comp}"

#Fidelizacion de Cliente
class Promociones_Descuento(models.Model):
    id_promo_desc = models.BigAutoField(primary_key=True)
    descuento_porcentaje_promo_desc = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_monto_promo_desc = models.DecimalField(max_digits=10, decimal_places=2)
    puntos_requeridos_promo_desc = models.IntegerField()
    nombre_promo_desc = models.CharField(max_length=100)
    descripcion_promo_desc = models.CharField(max_length=300)
    fecha_inicio_promo_desc = models.DateField()
    fecha_vencimiento_promo_desc = models.DateField()
    DELETE_Promo_Desc = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.nombre_promo_desc} ({self.descuento_porcentaje_promo_desc}%)"
class Promos_Clientes (models.Model):
    id_promo_cli = models.BigAutoField(primary_key=True)
    cliente_promo_cli = models.ForeignKey(Clientes, on_delete=models.CASCADE)
    cupon_descuento_promo_cli = models.ForeignKey(Promociones_Descuento, on_delete=models.CASCADE)
    estado_promo_cli = models.ForeignKey(Estados, on_delete=models.CASCADE)
    DELETE_promo_Clie = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.cliente_promo_cli} - {self.cupon_descuento_promo_cli}"
# class Origen_Puntos(models.Model):
#     id_origen_puntos = models.AutoField(primary_key=True)
#     nombre_origen = models.CharField(max_length=50)
#     DELETE_OP = models.BooleanField(default=False)
#     def __str__(self):
#         return self.nombre_origen

#Ventas
class Ventas(models.Model):
    id_venta = models.BigAutoField(primary_key = True)
    total_venta = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_venta = models.DateTimeField(auto_now_add=True)
    observaciones_venta = models.CharField(max_length=200)
    cliente_venta = models.ForeignKey(Clientes, on_delete= models.CASCADE)
    empleado_venta = models.ForeignKey(Empleados, on_delete=models.CASCADE)
    estado_venta = models.ForeignKey(Estados, on_delete=models.CASCADE)
    caja_venta = models.ForeignKey(Cajas,on_delete=models.CASCADE)
    promo_aplicada = models.ForeignKey(Promos_Clientes, on_delete=models.SET_NULL, null=True, blank=True)
    descuento_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    vuelto_entregado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    DELETE_Vent = models.BooleanField(default=False)
    def __str__(self):
        return f"Venta #{self.id_venta} - {self.estado_venta.value} - {self.fecha_venta.strftime('%Y-%m-%d %H:%M:%S')} - Total: {self.total_venta}"

class Transacciones_Puntos(models.Model):
    id_trans_puntos = models.BigAutoField(primary_key=True)
    cliente_trans_puntos = models.ForeignKey(Clientes, on_delete=models.CASCADE)
    fecha_trans_puntos = models.DateTimeField(auto_now_add=True)
    puntos_transaccion = models.IntegerField()
    descripcion_trans_puntos = models.CharField(max_length=200)
    DELETE_Trans_Puntos = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.cliente_trans_puntos} - {self.fecha_trans_puntos} - {self.puntos_transaccion} puntos"
class Historial_Puntos(models.Model):
    id_historial_puntos = models.AutoField(primary_key=True)
    trans_hist_puntos = models.ForeignKey(Transacciones_Puntos, on_delete=models.CASCADE, related_name='historial_puntos', null=True)
    promo_usada_hist_puntos  = models.ForeignKey(Promos_Clientes, on_delete=models.SET_NULL, null=True, blank=True)
    puntos_movidos = models.IntegerField()
    puntos_anteriores = models.IntegerField()
    puntos_nuevos = models.IntegerField()
    fecha_mov_hist_puntos = models.DateTimeField(auto_now_add=True)
    tipo_mov_hist_puntos = models.ForeignKey(Tipos_Movimientos, on_delete=models.CASCADE, null=True)
    DELETE_Hist_Puntos = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.fecha_movimiento.strftime('%Y-%m-%d')} - {self.cliente}: {self.puntos_movidos} puntos ({self.tipo_movimiento})"
class Detalle_Ventas(models.Model):
    id_det_vent = models.BigAutoField(primary_key=True)
    precio_unitario_det_vent = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_det_vent = models.IntegerField()
    subtotal_det_vent = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion_det_vent = models.CharField(max_length=200)
    producto_det_vent = models.ForeignKey(Productos, on_delete=models.CASCADE)
    venta_det_vent = models.ForeignKey(Ventas, on_delete=models.CASCADE, related_name='detalles')
    DELETE_Det_Vent = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.producto_det_vent.nombre_producto} x {self.cantidad_det_vent}"
class Metodos_Pago(models.Model):
    id_metodo = models.AutoField(primary_key=True)
    nombre_metodo = models.CharField(max_length=200)
    DELETE_Met = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_metodo
class Venta_MetodoPago(models.Model):
    metodopago_vent_metpag = models.ForeignKey(Metodos_Pago, on_delete=models.CASCADE)
    venta_vent_metpag = models.ForeignKey(Ventas, on_delete=models.CASCADE)
    DELETE_Vent_MetPag = models.BooleanField(default=False)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['metodopago_vent_metpag', 'venta_vent_metpag'], name='unique_venta_metodopago_combinacion')
        ]
    def __str__(self):
        return self.metodopago_vent_metpag
#Devolucion
# class Devoluciones(models.Model):
#     id_devolucion = models.BigAutoField(primary_key=True)
#     fecha_devolucion = models.DateTimeField(auto_now_add=True)
#     DELETE_Devo = models.BooleanField(default=False)
#     def __str__(self):
#         return self.fecha_devolucion
# class Detalle_Devoluciones(models.Model):
#      id_det_devo = models.BigAutoField(primary_key=True)
#      subtotal_det_devo = models.DecimalField(max_digits=10, decimal_places=2)
#      descripcion_det_devo = models.CharField(max_length=200)
#      producto_det_devo = models.ForeignKey(Productos, on_delete=models.CASCADE)
#      devolucion_det_devo = models.ForeignKey(Devoluciones, on_delete=models.CASCADE)
#      DELETE_Det_Devo = models.BooleanField(default=False)

#class ConfiguracionFidelizacion(models.Model):
#    id_config = models.AutoField(primary_key=True)
#    habilitado = models.BooleanField(default=True)

#    class Meta:
#        verbose_name = "Configuracion de Fidelizacion"
#        verbose_name_plural = "Configuraciones de Fidelizacion"

#    def __str__(self):
#        return "Configuracion de Fidelizacion"

#Direcciones
class Provincias(models.Model):
    id_provin = models.AutoField(primary_key=True)
    nombre_provincia = models.CharField(max_length=100)
    DELETE_Provin = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_provincia
class Ciudades(models.Model):
    id_ciudad = models.AutoField(primary_key=True) 
    nombre_ciudad = models.CharField(max_length=100)
    provincia_ciudad = models.ForeignKey(Provincias, on_delete=models.CASCADE)
    DELETE_Ciud = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_ciudad
class Barrios(models.Model):
    id_barrio = models.AutoField(primary_key=True)
    nombre_barrio= models.CharField(max_length=100)
    ciudad_barrio = models.ForeignKey(Ciudades, on_delete=models.CASCADE)
    DELETE_Barrio = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_barrio
class Calles(models.Model):
    id_calle = models.AutoField(primary_key=True)
    nombre_calle = models.CharField(max_length=100)
    barrio_calle = models.ForeignKey(Barrios, on_delete=models.CASCADE)
    DELETE_Calle = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_calle
class Direcciones (models.Model):
    id_direccion = models.AutoField(primary_key=True)
    nombre_direccion = models.CharField(max_length=100)
    departamento_direccion = models.CharField(max_length=100)
    referecia_direccion = models.CharField(max_length=100)
    calle_direccion = models.ForeignKey(Calles, on_delete=models.CASCADE)
    usuario_direccion = models.ForeignKey(User, on_delete=models.CASCADE)
    DELETE_Dir = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_direccion


class Historial_Movimientos_Financieros(models.Model):
    id_historial_mov_fin = models.BigAutoField(primary_key=True)
    compra_mov_fin = models.ForeignKey(Compras, on_delete=models.CASCADE, null=True, blank=True)
    venta_mov_fin = models.ForeignKey(Ventas, on_delete=models.CASCADE, null=True, blank=True)
    fecha_mov_fin = models.DateTimeField(auto_now_add=True)
    monto_mov_fin = models.DecimalField(max_digits=10, decimal_places=2)
    caja_mov_fin = models.ForeignKey(Cajas, on_delete=models.CASCADE)
    Historial_Caja = models.ForeignKey(Historial_Caja, on_delete=models.CASCADE, null=True, blank=True)
    Movimiento_Fondo = models.ForeignKey(Movimiento_Fondo, on_delete=models.CASCADE, null=True, blank=True)
    DELETE_Hist_Mov_Fin = models.BooleanField(default=False)
    def __str__(self):
        if self.compra_mov_fin:
            return f"Compra #{self.compra_mov_fin.id_compra} - ${self.monto_mov_fin}"
        elif self.venta_mov_fin:
            return f"Venta #{self.venta_mov_fin.id_venta} - ${self.monto_mov_fin}"
        else:
            return f"Movimiento Financiero #{self.id_historial_mov_fin} - ${self.monto_mov_fin}"