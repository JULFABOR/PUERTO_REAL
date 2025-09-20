from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Perfil(models.Model):
    class Rol(models.TextChoices):
        JEFE = 'JEFE', 'Jefe'
        EMPLEADO = 'EMPLEADO', 'Empleado'
        CLIENTE = 'CLIENTE', 'Cliente'

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(
        max_length=10,
        choices=Rol.choices,
        default=Rol.CLIENTE
    )

    def __str__(self):
        return f'{self.usuario.username} - {self.get_rol_display()}'

# Esta señal asegura que se cree un Perfil cada vez que se cree un User
@receiver(post_save, sender=User)
def crear_o_actualizar_perfil_de_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(usuario=instance)
    instance.perfil.save()