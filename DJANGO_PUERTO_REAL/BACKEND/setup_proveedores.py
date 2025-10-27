import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DJANGO_PUERTO_REAL.settings')
django.setup()

from Config_PR.models import Tipos_Estados, Estados

def setup_proveedores():
    print("Configurando tipos de estado y estados para proveedores...")

    # Crear Tipo de Estado para Proveedores
    tipo_estado_proveedor, created = Tipos_Estados.objects.get_or_create(
        nombre_tipo_estado='PROVEEDOR',
        defaults={'DELETE_TE': False}
    )
    if created:
        print("Tipo de estado PROVEEDOR creado")
    else:
        print("Tipo de estado PROVEEDOR ya existe")

    # Crear estado ACTIVO para Proveedores
    estado_activo, created = Estados.objects.get_or_create(
        nombre_estado='ACTIVO',
        tipo_estado=tipo_estado_proveedor,
        defaults={'DELETE_Est': False}
    )
    if created:
        print(f"Estado ACTIVO para proveedores creado - ID: {estado_activo.id_estado}")
    else:
        print(f"Estado ACTIVO para proveedores ya existe - ID: {estado_activo.id_estado}")

    # Crear estado INACTIVO para Proveedores
    estado_inactivo, created = Estados.objects.get_or_create(
        nombre_estado='INACTIVO',
        tipo_estado=tipo_estado_proveedor,
        defaults={'DELETE_Est': False}
    )
    if created:
        print(f"Estado INACTIVO para proveedores creado - ID: {estado_inactivo.id_estado}")
    else:
        print(f"Estado INACTIVO para proveedores ya existe - ID: {estado_inactivo.id_estado}")

    print("Configuracion de proveedores completada.")

if __name__ == '__main__':
    setup_proveedores()
