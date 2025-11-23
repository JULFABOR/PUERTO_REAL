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

# Modelo Singleton para la Configuración de la Tienda
class ConfiguracionTienda(models.Model):
    nombre_tienda = models.CharField(max_length=100, default='Puerto Real')
    direccion = models.CharField(max_length=255, blank=True, null=True, help_text="Dirección física de la tienda.")
    telefono = models.CharField(max_length=50, blank=True, null=True, help_text="Teléfono de contacto.")
    email = models.EmailField(blank=True, null=True, help_text="Email de contacto público.")
    sitio_web = models.URLField(blank=True, null=True, help_text="Sitio web de la tienda.")

    def __str__(self):
        return self.nombre_tienda

    def save(self, *args, **kwargs):
        self.pk = 1
        super(ConfiguracionTienda, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Carga la única instancia, creándola si no existe.
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "Configuración de la Tienda"
        verbose_name_plural = "Configuración de la Tienda"

# Modelo Singleton para la Configuración de Puntos
class ConfiguracionPuntos(models.Model):
    puntos_por_compra = models.DecimalField(max_digits=10, decimal_places=2, default=1, help_text="Factor de conversión de dinero a puntos. E.g., 1 punto por cada $100.")
    valor_punto = models.DecimalField(max_digits=10, decimal_places=2, default=1, help_text="Valor de 1 punto en dinero para canje. E.g., 1 punto = $1.")
    puntos_por_referido = models.IntegerField(default=100, help_text="Puntos otorgados por cada cliente referido.")

    def __str__(self):
        return "Reglas de Puntos"

    def save(self, *args, **kwargs):
        self.pk = 1
        super(ConfiguracionPuntos, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "Configuración de Puntos"
        verbose_name_plural = "Configuración de Puntos"
