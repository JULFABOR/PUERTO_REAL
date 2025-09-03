from django.db import models
from django.conf import settings

class RegistroAuditoria(models.Model):
    """
    Modelo para registrar eventos de auditoría personalizados en la aplicación.
    """
    # Usamos CharField para la acción para tener control sobre los tipos de eventos
    ACCION_CHOICES = [
        ('APERTURA_CAJA', 'Apertura de Caja'),
        ('CIERRE_CAJA', 'Cierre de Caja'),
        ('RETIRO_CAJA', 'Retiro de Caja'),
        ('VENTA_NUEVA', 'Venta Nueva'),
        ('COMPRA_NUEVA', 'Compra Nueva'),
        ('ANULACION_VENTA', 'Anulación de Venta'),
        ('AJUSTE_STOCK_MANUAL', 'Ajuste Manual de Stock'),
        ('COMPRA_RECIBIDA', 'Compra Marcada como Recibida'),
        ('AJUSTE_PUNTOS_MANUAL', 'Ajuste Manual de Puntos'),
        ('LOGIN_FALLIDO', 'Intento de Login Fallido'),
        # Agrega más acciones según sea necesario
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Usuario que realizó la acción."
    )
    accion = models.CharField(
        max_length=50,
        choices=ACCION_CHOICES,
        help_text="Tipo de acción realizada."
    )
    detalles = models.JSONField(
        null=True,
        blank=True,
        help_text="Datos adicionales en formato JSON sobre el evento."
    )
    fecha_hora = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora en que se registró el evento."
    )

    def __str__(self):
        return f'{self.fecha_hora.strftime("%Y-%m-%d %H:%M")} - {self.get_accion_display()} por {self.usuario.username if self.usuario else "Sistema"}'

    class Meta:
        verbose_name = "Registro de Auditoría"
        verbose_name_plural = "Registros de Auditoría"
        ordering = ['-fecha_hora']
