# setup_ventas.py
import os
import django
import logging

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DJANGO_PUERTO_REAL.settings')
django.setup()

from django.contrib.auth.models import User
from Config_PR.models import Tipos_Estados, Estados
from Abrir_Cerrar_CAJA.models import Cajas
from autenticacion.models import Clientes

# Logger para salida controlada
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def setup():
    logger.info("Iniciando configuracion del sistema de ventas...")
    
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
        logger.info("Usuario generico creado")
    else:
        logger.info("Usuario generico ya existe")

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
        logger.info("Cliente generico creado - ID: %s", cliente_generico.id_cliente)
    else:
        logger.info("Cliente generico ya existe - ID: %s", cliente_generico.id_cliente)

    # 3. Buscar o crear Tipo de Estado para Ventas
    tipo_estado_venta, created = Tipos_Estados.objects.get_or_create(
        nombre_tipo_estado='VENTA',
        defaults={'DELETE_TE': False}
    )
    if created:
        logger.info("Tipo de estado VENTA creado")
    else:
        logger.info("Tipo de estado VENTA ya existe")

    # 4. Crear estado COMPLETADA
    estado_completada, created = Estados.objects.get_or_create(
        nombre_estado='COMPLETADA',
        defaults={
            'tipo_estado': tipo_estado_venta,
            'DELETE_Est': False
        }
    )
    if created:
        logger.info("Estado COMPLETADA creado - ID: %s", estado_completada.id_estado)
    else:
        logger.info("Estado COMPLETADA ya existe - ID: %s", estado_completada.id_estado)

    # 5. Crear tipo de estado para cajas si no existe
    tipo_estado_caja, created = Tipos_Estados.objects.get_or_create(
        nombre_tipo_estado='CAJA',
        defaults={'DELETE_TE': False}
    )
    if created:
        logger.info("Tipo de estado CAJA creado")

    # 6. Crear estado ABIERTA para cajas
    estado_abierta, created = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={
            'tipo_estado': tipo_estado_caja,
            'DELETE_Est': False
        }
    )
    if created:
        logger.info("Estado ABIERTA creado - ID: %s", estado_abierta.id_estado)

    # 6.1 Crear estado CERRADA para cajas
    estado_cerrada, created = Estados.objects.get_or_create(
        nombre_estado='CERRADA',
        defaults={
            'tipo_estado': tipo_estado_caja,
            'DELETE_Est': False
        }
    )
    if created:
        logger.info("Estado CERRADA creado - ID: %s", estado_cerrada.id_estado)

    # 7. Verificar que tienes al menos una caja
    cajas_abiertas = Cajas.objects.filter(estado_caja__nombre_estado='ABIERTA').count()
    if cajas_abiertas == 0:
        logger.warning("ADVERTENCIA: No hay cajas abiertas. Debes abrir una caja antes de hacer ventas.")
    else:
        logger.info("Hay %s caja(s) abierta(s)", cajas_abiertas)

    logger.info("%s", "="*50)
    logger.info("¡Configuracion completada exitosamente!")
    logger.info("%s", "="*50)
    logger.info("Resumen:")
    logger.info("   - Cliente generico ID: %s", cliente_generico.id_cliente)
    logger.info("   - Estado COMPLETADA ID: %s", estado_completada.id_estado)
    logger.info("   - Cajas abiertas: %s", cajas_abiertas)
    logger.info("Ahora puedes usar el sistema de ventas POS")

if __name__ == '__main__':
    setup()
