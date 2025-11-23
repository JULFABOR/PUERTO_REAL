from django.contrib import admin
from .models import Perfil
from .models import Clientes, Empleados, Provincias, Ciudades, Barrios, Calles, Direcciones     

# Register your models here.
admin.site.register(Perfil)
@admin.register(Clientes)
class ClientesAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'user_cliente', 'dni_cliente', 'telefono_cliente', 'DELETE_Cli')
    search_fields = ('user_cliente__username', 'dni_cliente')

@admin.register(Empleados)
class EmpleadosAdmin(admin.ModelAdmin):
    list_display = ('id_empleado', 'user_empleado', 'dni_empleado', 'telefono_empleado', 'DELETE_Emple')
    search_fields = ('user_empleado__username', 'dni_empleado')

@admin.register(Provincias)
class ProvinciasAdmin(admin.ModelAdmin):
    list_display = ('id_provin', 'nombre_provincia', 'DELETE_Provin')
    search_fields = ('nombre_provincia',)

@admin.register(Ciudades)
class CiudadesAdmin(admin.ModelAdmin):
    list_display = ('id_ciudad', 'nombre_ciudad', 'provincia_ciudad', 'DELETE_Ciud')
    search_fields = ('nombre_ciudad',)
    list_filter = ('provincia_ciudad',)

@admin.register(Barrios)
class BarriosAdmin(admin.ModelAdmin):
    list_display = ('id_barrio', 'nombre_barrio', 'ciudad_barrio', 'DELETE_Barrio')
    search_fields = ('nombre_barrio',)
    list_filter = ('ciudad_barrio',)

@admin.register(Calles)
class CallesAdmin(admin.ModelAdmin):
    list_display = ('id_calle', 'nombre_calle', 'barrio_calle', 'DELETE_Calle')
    search_fields = ('nombre_calle',)
    list_filter = ('barrio_calle',)

@admin.register(Direcciones)
class DireccionesAdmin(admin.ModelAdmin):
    list_display = (
        'id_direccion', 'nombre_direccion', 'departamento_direccion',
        'referecia_direccion', 'calle_direccion', 'usuario_direccion', 'DELETE_Dir'
    )
    search_fields = ('nombre_direccion', 'usuario_direccion__username')
    list_filter = ('calle_direccion', 'usuario_direccion')