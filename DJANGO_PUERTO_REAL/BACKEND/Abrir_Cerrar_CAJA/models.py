from django.db import models

from decimal import Decimal

# Create your models here.
#Apertura/Cierre de Caja


class Cajas(models.Model):
    id_caja = models.AutoField(primary_key=True)
    total_gastos_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_apertura_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_cierre_caja = models.DecimalField(max_digits=10, decimal_places=2)
    monto_teorico_caja = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia_caja = models.DecimalField(max_digits=10, decimal_places=2)
    observaciones_caja = models.CharField(max_length=200)
    estado_caja = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
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
    empleado_hc = models.ForeignKey('autenticacion.Empleados',on_delete=models.CASCADE)
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
    estado_fp = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    DELETE_fp = models.BooleanField(default=True)
    fecha_fp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Fondo de Pagos #{self.id_fondo_fp} (${self.saldo_fp})"
class Movimiento_Fondo(models.Model):
    id_mov_fp = models.BigAutoField(primary_key=True)
    TIPO_mov = (("ENTRADA", "Entrada"), ("SALIDA", "Salida"))
    fondo_mov_fp = models.ForeignKey(Fondo_Pagos, on_delete=models.CASCADE, related_name="movimientos")
    fecha_mov_fp = models.DateTimeField(auto_now_add=True)
    tipo_mov_fp = models.ForeignKey('Config_PR.Tipos_Movimientos', on_delete=models.CASCADE)
    monto_mov_fp = models.DecimalField(max_digits=12, decimal_places=2)
    motivo_mov_fp = models.CharField(max_length=200, blank=True)
    empleado_mov_fp = models.ForeignKey('autenticacion.Empleados', on_delete=models.PROTECT)
    DELETE_Mov_Fp = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.fecha_mov_fp} {self.tipo_mov_fp} ${self.monto_mov_fp}"
    
class Historial_Movimientos_Financieros(models.Model):
    id_historial_mov_fin = models.BigAutoField(primary_key=True)
    compra_mov_fin = models.ForeignKey('Control_COMPRAS.Compras', on_delete=models.CASCADE, null=True, blank=True)
    venta_mov_fin = models.ForeignKey('Control_VENTAS.Ventas', on_delete=models.CASCADE, null=True, blank=True)
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

class Metodos_Pago(models.Model):
    id_metodo = models.AutoField(primary_key=True)
    nombre_metodo = models.CharField(max_length=200)
    DELETE_Met = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_metodo