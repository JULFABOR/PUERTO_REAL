import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tu_proyecto.settings')  # Cambia 'tu_proyecto'
django.setup()

from HOME.models import Tipos_Movimientos

def setup_stock():
    print("🚀 Configurando tipos de movimientos de stock...\n")
    
    # Crear tipo de movimiento para salida por venta
    mov_salida, created = Tipos_Movimientos.objects.get_or_create(
        nombre_movimiento='MOV_STOCK_SALIDA',
        defaults={
            'is_transfer': False,
            'DELETE_TM': False
        }
    )
    if created:
        print(f"✅ Tipo de movimiento MOV_STOCK_SALIDA creado - ID: {mov_salida.id_tipo_movimiento}")
    else:
        print(f"ℹ️  Tipo de movimiento MOV_STOCK_SALIDA ya existe - ID: {mov_salida.id_tipo_movimiento}")
    
    print("\n✅ Configuración de stock completada")

if __name__ == '__main__':
    setup_stock()
    