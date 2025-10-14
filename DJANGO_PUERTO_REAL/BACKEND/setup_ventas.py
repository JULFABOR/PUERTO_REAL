# setup_ventas.py
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tu_proyecto.settings')  # Cambia 'tu_proyecto' por el nombre de tu proyecto
django.setup()

from django.contrib.auth.models import User
from HOME.models import Clientes, Estados, Tipos_Estados, Cajas

def setup():
    print("🚀 Iniciando configuración del sistema de ventas...\n")
    
    # 1. Crear usuario genérico
    user_generico, created = User.objects.get_or_create(
        username='cliente_generico',
        defaults={
            'first_name': 'Cliente',
            'last_name': 'Genérico',
            'email': 'generico@sistema.com',
            'is_active': True
        }
    )
    if created:
        user_generico.set_password('sin_acceso_123')
        user_generico.save()
        print("✅ Usuario genérico creado")
    else:
        print("ℹ️  Usuario genérico ya existe")

    # 2. Crear cliente genérico
    cliente_generico, created = Clientes.objects.get_or_create(
        dni_cliente='00000000',
        defaults={
            'user_cliente': user_generico,
            'telefono_cliente': '0000000000',
            'DELETE_Cli': False
        }
    )
    if created:
        print(f"✅ Cliente genérico creado - ID: {cliente_generico.id_cliente}")
    else:
        print(f"ℹ️  Cliente genérico ya existe - ID: {cliente_generico.id_cliente}")

    # 3. Buscar o crear Tipo de Estado para Ventas
    tipo_estado_venta, created = Tipos_Estados.objects.get_or_create(
        nombre_tipo_estado='VENTA',
        defaults={'DELETE_TE': False}
    )
    if created:
        print("✅ Tipo de estado VENTA creado")
    else:
        print("ℹ️  Tipo de estado VENTA ya existe")

    # 4. Crear estado COMPLETADA
    estado_completada, created = Estados.objects.get_or_create(
        nombre_estado='COMPLETADA',
        defaults={
            'tipo_estado': tipo_estado_venta,
            'DELETE_Est': False
        }
    )
    if created:
        print(f"✅ Estado COMPLETADA creado - ID: {estado_completada.id_estado}")
    else:
        print(f"ℹ️  Estado COMPLETADA ya existe - ID: {estado_completada.id_estado}")

    # 5. Crear tipo de estado para cajas si no existe
    tipo_estado_caja, created = Tipos_Estados.objects.get_or_create(
        nombre_tipo_estado='CAJA',
        defaults={'DELETE_TE': False}
    )
    if created:
        print("✅ Tipo de estado CAJA creado")

    # 6. Crear estado ABIERTA para cajas
    estado_abierta, created = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={
            'tipo_estado': tipo_estado_caja,
            'DELETE_Est': False
        }
    )
    if created:
        print(f"✅ Estado ABIERTA creado - ID: {estado_abierta.id_estado}")

    # 7. Verificar que tienes al menos una caja
    cajas_abiertas = Cajas.objects.filter(estado_caja__nombre_estado='ABIERTA').count()
    if cajas_abiertas == 0:
        print("⚠️  ADVERTENCIA: No hay cajas abiertas. Debes abrir una caja antes de hacer ventas.")
    else:
        print(f"✅ Hay {cajas_abiertas} caja(s) abierta(s)")

    print("\n" + "="*50)
    print("🎉 ¡Configuración completada exitosamente!")
    print("="*50)
    print(f"\n📋 Resumen:")
    print(f"   • Cliente genérico ID: {cliente_generico.id_cliente}")
    print(f"   • Estado COMPLETADA ID: {estado_completada.id_estado}")
    print(f"   • Cajas abiertas: {cajas_abiertas}")
    print("\n💡 Ahora puedes usar el sistema de ventas POS")

if __name__ == '__main__':
    setup()