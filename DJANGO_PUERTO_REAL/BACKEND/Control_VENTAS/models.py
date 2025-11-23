from django.db import models
from decimal import Decimal


# Create your models here.
#Ventas
class Ventas(models.Model):
    id_venta = models.BigAutoField(primary_key = True)
    total_venta = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_venta = models.DateTimeField(auto_now_add=True)
    observaciones_venta = models.CharField(max_length=200)
    cliente_venta = models.ForeignKey('autenticacion.Clientes', on_delete= models.CASCADE)
    empleado_venta = models.ForeignKey('autenticacion.Empleados', on_delete=models.CASCADE)
    estado_venta = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    caja_venta = models.ForeignKey('Abrir_Cerrar_CAJA.Cajas', on_delete=models.CASCADE)
    promo_aplicada = models.ForeignKey('Fidelizar_CLIENTES.Promos_Clientes', on_delete=models.SET_NULL, null=True, blank=True)
    descuento_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    vuelto_entregado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    qr_token = models.CharField(max_length=32, blank=True, null=True, unique=True)
    metodo_pago = models.CharField(max_length=50, blank=True, null=True)

    DELETE_Vent = models.BooleanField(default=False)
    def __str__(self):
        return f"Venta #{self.id_venta} - {self.estado_venta.value} - {self.fecha_venta.strftime('%Y-%m-%d %H:%M:%S')} - Total: {self.total_venta}"

    def __str__(self):
        return f"{self.fecha_movimiento.strftime('%Y-%m-%d')} - {self.cliente}: {self.puntos_movidos} puntos ({self.tipo_movimiento})"
class Detalle_Ventas(models.Model):
    id_det_vent = models.BigAutoField(primary_key=True)
    precio_unitario_det_vent = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_det_vent = models.IntegerField()
    subtotal_det_vent = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion_det_vent = models.CharField(max_length=200)
    producto_det_vent = models.ForeignKey('Control_STOCK.Productos', on_delete=models.CASCADE)
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
