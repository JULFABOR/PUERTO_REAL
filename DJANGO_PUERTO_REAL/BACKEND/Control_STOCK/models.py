from django.db import models

from decimal import Decimal



# Create your models here.
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
    descripcion_producto = models.CharField(max_length=500, blank=True, null=True)
    nombre_producto = models.CharField(max_length=200)
    precio_unitario_compra_producto = models.DecimalField(max_digits=8, decimal_places=2)
    precio_unitario_venta_producto = models.DecimalField(max_digits=8, decimal_places=2)
    # unidad_medida_producto = models.ForeignKey(Unidad_Medida_Productos, on_delete=models.CASCADE)
    fecha_vencimiento_producto = models.DateTimeField(null=True, blank=True)
    categoria_producto = models.ForeignKey(Categorias_Productos, on_delete=models.CASCADE)
    estado_producto = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    low_stock_threshold = models.IntegerField(default=0) # Added field
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True, default=None) # New field for barcode
    DELETE_Prod = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_producto

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
    empleado_hs = models.ForeignKey('autenticacion.Empleados', on_delete=models.CASCADE)
    tipo_movimiento_hs = models.ForeignKey('Config_PR.Tipos_Movimientos', on_delete=models.CASCADE)
    fecha_movimiento_hstock = models.DateTimeField(auto_now_add=True)
    stock_anterior_hstock = models.IntegerField()
    stock_nuevo_hstock = models.IntegerField()
    observaciones_hstock = models.CharField(max_length=300)
    DELETE_Hstock = models.BooleanField(default=False)
    def __str__(self):
        return self.fecha_movimiento_hstock.strftime("%Y-%m-%d %H:%M:%S")