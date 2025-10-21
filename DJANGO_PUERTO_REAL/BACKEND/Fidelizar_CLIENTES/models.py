from django.db import models


# Create your models here.
#Fidelizacion de Cliente
class Historial_Puntos(models.Model):
    id_historial_puntos = models.AutoField(primary_key=True)
    cliente_historial_puntos = models.ForeignKey('autenticacion.Clientes', on_delete=models.CASCADE)
    puntos_obtenidos_historial_puntos = models.IntegerField()
    puntos_redimidos_historial_puntos = models.IntegerField()
    fecha_historial_puntos = models.DateField(auto_now_add=True)
    descripcion_historial_puntos = models.CharField(max_length=300)
    DELETE_HP = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.cliente_historial_puntos} - {self.puntos_obtenidos_historial_puntos} puntos"
    
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
    cliente_promo_cli = models.ForeignKey('autenticacion.Clientes', on_delete=models.CASCADE)
    cupon_descuento_promo_cli = models.ForeignKey(Promociones_Descuento, on_delete=models.CASCADE)
    estado_promo_cli = models.ForeignKey('Config_PR.Estados', on_delete=models.CASCADE)
    DELETE_promo_Clie = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.cliente_promo_cli} - {self.cupon_descuento_promo_cli}"

class Transacciones_Puntos(models.Model):
    id_trans_puntos = models.BigAutoField(primary_key=True)
    cliente_trans_puntos = models.ForeignKey('autenticacion.Clientes', on_delete=models.CASCADE)
    puntos_trans_puntos = models.IntegerField()
    fecha_trans_puntos = models.DateField(auto_now_add=True)
    descripcion_trans_puntos = models.CharField(max_length=300)
    DELETE_Trans_Puntos = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.cliente_trans_puntos} - {self.puntos_trans_puntos} puntos"
# class Origen_Puntos(models.Model):
#     id_origen_puntos = models.AutoField(primary_key=True)
#     nombre_origen = models.CharField(max_length=50)
#     DELETE_OP = models.BooleanField(default=False)
#     def __str__(self):
#         return self.nombre_origen