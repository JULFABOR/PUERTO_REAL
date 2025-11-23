from django.db import models
from decimal import Decimal


# Create your models here.
#Compras
class Proveedores(models.Model):
    id_proveedor = models.BigAutoField(primary_key=True)
    nombre_proveedor = models.CharField(max_length=100)
    razon_social_proveedor = models.CharField(max_length=100)
    telefono_proveedor = models.CharField(max_length=20)
    cuit_proveedor = models.CharField(max_length=100)
    correo_proveedor = models.EmailField(max_length=100)
    estado_proveedor = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    DELETE_Prov = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_proveedor
class Compras(models.Model):
    id_compra = models.BigAutoField(primary_key =True)
    fecha_compra = models.DateTimeField(auto_now_add=True)
    fecha_limite = models.DateTimeField(null=True, blank=True) # Para compras pendientes
    total_compra = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    proveedor_compra = models.ForeignKey(Proveedores, on_delete=models.PROTECT)
    estado_compra = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    DELETE_Comp = models.BooleanField(default=False)
    def __str__(self):
        return f"Compra #{self.id_compra} - {self.fecha_compra.strftime('%Y-%m-%d %H:%M:%S')} - {self.proveedor_compra.nombre_proveedor}"
class Proveedores_Productos(models.Model):
    id_prov_x_prod = models.BigAutoField(primary_key=True)
    precio_unitario_prov_x_prod = models.IntegerField()
    proveedor_prov_x_prod = models.ForeignKey(Proveedores, on_delete=models.CASCADE)
    producto_prov_x_prod = models.ForeignKey('Control_STOCK.Productos', on_delete=models.CASCADE)
    DELETE_Prov_X_Prod = models.BooleanField(default=False)
    def __str__(self):
        return self.precio_unitario_prov_x_prod
class Detalle_Compras(models.Model):
    id_det_comp = models.BigAutoField(primary_key=True)
    precio_unidad_det_comp = models.DecimalField(max_digits=10, decimal_places=2)
    cant_det_comp = models.PositiveIntegerField()
    subtotal_det_comp = models.DecimalField(max_digits=10, decimal_places=2)
    producto_dt_comp = models.ForeignKey('Control_STOCK.Productos', on_delete=models.PROTECT)
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
    metodo_pago_comp_metpag = models.ForeignKey('Abrir_Cerrar_CAJA.Metodos_Pago', on_delete=models.CASCADE)
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
