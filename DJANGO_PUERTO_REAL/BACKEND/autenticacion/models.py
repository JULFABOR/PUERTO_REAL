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
def crear_perfil_de_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(usuario=instance)
    instance.perfil.save()

class Clientes(models.Model):
    user_cliente = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cliente')
    id_cliente = models.BigAutoField(primary_key=True)
    dni_cliente = models.CharField(max_length=50)
    telefono_cliente = models.CharField(max_length=50)
    DELETE_Cli = models.BooleanField(default=False)
    def __str__(self):
        return self.user_cliente.get_full_name()

class Empleados(models.Model):
    user_empleado = models.OneToOneField(User, on_delete=models.CASCADE, related_name='empleado')
    id_empleado = models.BigAutoField(primary_key=True)
    dni_empleado = models.CharField(max_length=50)
    telefono_empleado = models.CharField(max_length=50)
    fecha_alta_empleado = models.DateTimeField(auto_now_add=True)
    fecha_baja_empleado = models.DateTimeField(null=True, blank=True)
    DELETE_Emple = models.BooleanField(default=False)
    def __str__(self):
        return self.user_empleado.get_full_name()

class Provincias(models.Model):
    id_provin = models.AutoField(primary_key=True)
    nombre_provincia = models.CharField(max_length=100)
    DELETE_Provin = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_provincia

class Ciudades(models.Model):
    id_ciudad = models.AutoField(primary_key=True) 
    nombre_ciudad = models.CharField(max_length=100)
    provincia_ciudad = models.ForeignKey(Provincias, on_delete=models.CASCADE)
    DELETE_Ciud = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_ciudad

class Barrios(models.Model):
    id_barrio = models.AutoField(primary_key=True)
    nombre_barrio= models.CharField(max_length=100)
    ciudad_barrio = models.ForeignKey(Ciudades, on_delete=models.CASCADE)
    DELETE_Barrio = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_barrio

class Calles(models.Model):
    id_calle = models.AutoField(primary_key=True)
    nombre_calle = models.CharField(max_length=100)
    barrio_calle = models.ForeignKey(Barrios, on_delete=models.CASCADE)
    DELETE_Calle = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_calle

class Direcciones (models.Model):
    id_direccion = models.AutoField(primary_key=True)
    nombre_direccion = models.CharField(max_length=100)
    departamento_direccion = models.CharField(max_length=100)
    referecia_direccion = models.CharField(max_length=100)
    calle_direccion = models.ForeignKey(Calles, on_delete=models.CASCADE)
    usuario_direccion = models.ForeignKey(User, on_delete=models.CASCADE)
    DELETE_Dir = models.BooleanField(default=False)
    def __str__(self):
        return self.nombre_direccion

class Telefonos_Usuarios(models.Model):
    id_telefono = models.AutoField(primary_key=True)
    numero_telefono = models.CharField(max_length=20)
    usuario_telefono = models.ForeignKey(User, on_delete=models.CASCADE)
    DELETE_Tel_U = models.BooleanField(default=False)
    def __str__(self):
        return self.numero_telefono