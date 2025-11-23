from django.db import models

class ReporteDiario(models.Model):
    fecha = models.DateField(unique=True)
    ingresos_totales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    egresos_totales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Reporte Diario {self.fecha}"

class ReporteProducto(models.Model):
    producto_id = models.BigIntegerField()
    nombre_producto = models.CharField(max_length=200)
    cantidad_vendida = models.IntegerField(default=0)
    total_ventas = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_reporte = models.DateField()

    class Meta:
        unique_together = ('producto_id', 'fecha_reporte')

    def __str__(self):
        return f"Reporte Producto {self.nombre_producto} - {self.fecha_reporte}"

class ReporteEmpleado(models.Model):
    empleado_id = models.BigIntegerField()
    nombre_empleado = models.CharField(max_length=200)
    total_ventas_empleado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cantidad_ventas_empleado = models.IntegerField(default=0)
    fecha_reporte = models.DateField()

    class Meta:
        unique_together = ('empleado_id', 'fecha_reporte')

    def __str__(self):
        return f"Reporte Empleado {self.nombre_empleado} - {self.fecha_reporte}"
