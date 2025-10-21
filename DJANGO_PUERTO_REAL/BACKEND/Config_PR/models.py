from django.db import models

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

class Tipos_Movimientos(models.Model):
    id_tipo_movimiento = models.AutoField(primary_key=True)
    nombre_movimiento = models.CharField(max_length=100)
    is_transfer = models.BooleanField(default=False)
    DELETE_TM = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_movimiento
