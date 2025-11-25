# BACKEND/populate_database.py
import os
import django
import random
from datetime import datetime, timedelta

# --- INSTRUCCIONES ---
# 1. Asegúrate de que tu entorno virtual esté activado.
# 2. Instala Faker si aún no lo has hecho:
#    pip install Faker
# 3. Ejecuta este script desde la carpeta BACKEND:
#    python populate_database.py
# ---------------------

print('🚀 Iniciando script de población de base de datos...')
print('Configurando entorno de Django...')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DJANGO_PUERTO_REAL.settings')
django.setup()

# --- IMPORTACIONES DE MODELOS Y FAKER ---
from faker import Faker
from django.contrib.auth.models import User
from Control_STOCK.models import Categorias_Productos, Productos, Stocks
from autenticacion.models import Clientes, Empleados, Provincias, Ciudades, Barrios, Calles, Direcciones, Telefonos_Usuarios
from Control_VENTAS.models import Ventas, Detalle_Ventas, Venta_MetodoPago
from Abrir_Cerrar_CAJA.models import Cajas, Historial_Caja, Tipo_Evento, Metodos_Pago
from Config_PR.models import Estados, Tipos_Estados, Tipos_Movimientos, ConfiguracionTienda, ConfiguracionPuntos
from Control_COMPRAS.models import Proveedores, Compras, Detalle_Compras

# --- CONFIGURACIÓN INICIAL ---
fake = Faker('es_AR')

# --- DATOS PERSONALIZADOS PARA VINERÍA/DRUGSTORE ---

PRODUCTOS_POR_CATEGORIA = {
    'Vinos Tintos': ['Malbec Reserva', 'Cabernet Sauvignon', 'Merlot Clásico', 'Syrah Roble', 'Pinot Noir Patagonia'],
    'Vinos Blancos': ['Chardonnay', 'Sauvignon Blanc', 'Torrontés', 'Pinot Grigio', 'Vino Blanco Dulce'],
    'Cervezas': ['IPA Artesanal', 'Lager Clásica', 'Stout de Café', 'Cerveza Roja', 'Pilsener'],
    'Licores y Destilados': ['Fernet', 'Gin', 'Vodka', 'Ron Añejo', 'Whisky Escocés', 'Aperitivo'],
    'Bebidas sin Alcohol': ['Agua Mineral s/ Gas 500ml', 'Gaseosa Cola 1.5L', 'Jugo de Naranja 1L', 'Agua Saborizada', 'Tónica'],
    'Snacks y Golosinas': ['Papas Fritas', 'Maní Salado', 'Tableta de Chocolate', 'Alfajor de Maicena', 'Galletas de Agua'],
    'Farmacia y Perfumería': ['Analgésico x10', 'Vendas Adhesivas', 'Jabón de Tocador', 'Shampoo Anticaspa', 'Desodorante Roll-on'],
    'Cigarrillos y Tabaco': ['Marlboro Box 20', 'Camel Común', 'Tabaco para armar 50g', 'Papelillos OCB', 'Filtros x100'],
}

# --- FUNCIONES DE CREACIÓN ---

def obtener_recursos_esenciales():
    """Asegura que existan los estados y cajas necesarios para las ventas."""
    print('\n--- Verificando recursos esenciales (Caja, Estados, Empleado) ---')
    
    # Estado de producto 'ACTIVO'
    tipo_estado_producto, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='PRODUCTO')
    estado_activo, created = Estados.objects.get_or_create(
        nombre_estado='ACTIVO',
        defaults={'tipo_estado': tipo_estado_producto}
    )
    if created: print('✅ Estado \'ACTIVO\' para productos creado.')
    else: print('ℹ️ Estado \'ACTIVO\' ya existe.')

    # Estado de venta 'COMPLETADA'
    tipo_estado_venta, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='VENTA')
    estado_completada, created = Estados.objects.get_or_create(
        nombre_estado='COMPLETADA',
        defaults={'tipo_estado': tipo_estado_venta}
    )
    if created: print('✅ Estado \'COMPLETADA\' para ventas creado.')
    else: print('ℹ️ Estado \'COMPLETADA\' ya existe.')

    # Caja 'ABIERTA'
    tipo_estado_caja, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='CAJA')
    estado_abierta, _ = Estados.objects.get_or_create(
        nombre_estado='ABIERTA',
        defaults={'tipo_estado': tipo_estado_caja}
    )
    
    caja_abierta = Cajas.objects.filter(estado_caja=estado_abierta).first()
    
    if not caja_abierta:
        print('⚠️ No se encontró una caja abierta. Creando una caja principal...')
        caja_abierta, created = Cajas.objects.get_or_create(
            observaciones_caja='Caja Principal (generada por script)',
            defaults={
                'estado_caja': estado_abierta,
                'monto_apertura_caja': 1000.00,
                'total_gastos_caja': 0.00,
                'monto_cierre_caja': 0.00,
                'monto_teorico_caja': 0.00,
                'diferencia_caja': 0.00,
            }
        )
        if created: print(f'✅ Caja \'{caja_abierta.observaciones_caja}\' creada y abierta.')
        else: 
            caja_abierta.estado_caja = estado_abierta
            caja_abierta.save()
            print(f'ℹ️ Caja \'{caja_abierta.observaciones_caja}\' encontrada, se ha puesto en estado \'ABIERTA\'.')
    else:
        print(f'ℹ️ Usando caja abierta existente: \'{caja_abierta.observaciones_caja}\'.')

    # Empleado por defecto para transacciones
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print('⚠️ No se encontró un superusuario. Creando usuario \'admin\'...')
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Principal',
                'email': 'admin@puertoreal.com',
                'is_staff': True,
                'is_active': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print('✅ Superusuario \'admin\' creado con contraseña \'admin123\'.')

    empleado, created = Empleados.objects.get_or_create(
        user_empleado=admin_user,
        defaults={
            'dni_empleado': '12345678',
            'telefono_empleado': '1122334455'
        }
    )
    if created: print(f'✅ Empleado de sistema \'{empleado.user_empleado.username}\' creado.')
    else: print(f'ℹ️ Empleado de sistema \'{empleado.user_empleado.username}\' ya existe.')

    # Tipo de movimiento para el historial de stock
    tipo_mov_inicial, _ = Tipos_Movimientos.objects.get_or_create(nombre_movimiento='CARGA INICIAL')

    # Tipo de evento para historial de caja
    tipo_evento_venta, _ = Tipo_Evento.objects.get_or_create(nombre_evento='INGRESO POR VENTA')
        
    return caja_abierta, estado_completada, estado_activo, empleado, tipo_mov_inicial, tipo_evento_venta


def crear_categorias():
    print('\n--- Creando Categorías para Vinería/Drugstore ---')
    for nombre in PRODUCTOS_POR_CATEGORIA.keys():
        cat, created = Categorias_Productos.objects.get_or_create(nombre_categoria=nombre)
        if created:
            print(f'✅ Categoría \'{cat.nombre_categoria}\' creada.')
        else:
            print(f'ℹ️ Categoría \'{cat.nombre_categoria}\' ya existía.')
    return Categorias_Productos.objects.all()

def crear_productos(categorias, estado_activo, empleado, tipo_mov_inicial, cantidad_total=100):
    print(f'\n--- Creando ~{cantidad_total} Productos y su Stock Inicial ---')
    productos_creados = 0
    for categoria in categorias:
        if categoria.nombre_categoria in PRODUCTOS_POR_CATEGORIA:
            for nombre_base in PRODUCTOS_POR_CATEGORIA[categoria.nombre_categoria]:
                marca = fake.company().split(' ')[0].replace(',', '')
                nombre_producto = f'{nombre_base} {marca}'
                
                precio_venta = round(random.uniform(2.5, 120.0), 2)
                precio_compra = round(precio_venta * random.uniform(0.6, 0.8), 2)
                stock_inicial = random.randint(10, 200)

                prod, created = Productos.objects.get_or_create(
                    nombre_producto=nombre_producto,
                    categoria_producto=categoria,
                    defaults={
                        'descripcion_producto': f'Un {nombre_base} de alta calidad, producido por {marca}.',
                        'precio_unitario_compra_producto': precio_compra,
                        'precio_unitario_venta_producto': precio_venta,
                        'estado_producto': estado_activo,
                        'barcode': fake.ean(length=13),
                        'low_stock_threshold': random.randint(5, 20)
                    }
                )
                if created:
                    productos_creados += 1
                    print(f'  -> Producto \'{prod.nombre_producto}\' creado en \'{categoria.nombre_categoria}\'.')
                    
                    # Crear el lote de stock inicial para el nuevo producto
                    stock, stock_created = Stocks.objects.get_or_create(
                        producto_en_stock=prod,
                        lote_stock=1, # Lote inicial
                        defaults={
                           'cantidad_actual_stock': stock_inicial,
                           'observaciones_stock': 'Carga inicial del script de población.'
                        }
                    )
                    if stock_created:
                        print(f'     -> Stock inicial de {stock.cantidad_actual_stock} unidades creado.')
                        # Registrar en el historial
                        from Control_STOCK.models import Historial_Stock
                        Historial_Stock.objects.create(
                            stock_hs=stock,
                            empleado_hs=empleado,
                            tipo_movimiento_hs=tipo_mov_inicial,
                            cantidad_hstock=stock_inicial,
                            stock_anterior_hstock=0,
                            stock_nuevo_hstock=stock_inicial,
                            observaciones_hstock='Carga inicial automática.'
                        )

    print(f'✅ {productos_creados} productos nuevos creados con su stock.')
    return Productos.objects.all()


def crear_clientes(cantidad=30):
    print(f'\n--- Creando {cantidad} Clientes ---')
    clientes_creados = 0
    for _ in range(cantidad):
        first_name = fake.first_name()
        last_name = fake.last_name()
        username = f'{first_name.lower()}.{last_name.lower()}{random.randint(1,999)}'
        
        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'email': fake.email()
            }
        )
        if user_created:
            user.set_password('password123')
            user.save()

        dni = str(fake.unique.random_number(digits=8, fix_len=True))
        cliente, cliente_created = Clientes.objects.get_or_create(
            dni_cliente=dni,
            defaults={
                'user_cliente': user,
                'telefono_cliente': fake.phone_number()[:15]
            }
        )
        if cliente_created:
            clientes_creados += 1
            print(f'  -> Cliente \'{user.get_full_name()}\' creado con DNI {dni}.')
    print(f'✅ {clientes_creados} clientes nuevos creados.')
    return Clientes.objects.all()

def crear_geolocalizacion_base():
    """Crea un conjunto básico de datos geográficos para Argentina."""
    print('\n--- Creando Datos Geográficos Base (Provincias, Ciudades, etc.) ---')
    
    # Provincias
    prov_ba, _ = Provincias.objects.get_or_create(nombre_provincia='Buenos Aires')
    prov_cba, _ = Provincias.objects.get_or_create(nombre_provincia='Córdoba')
    print(f'✅ Provincias creadas/verificadas.')

    # Ciudades
    city_caba, _ = Ciudades.objects.get_or_create(nombre_ciudad='Ciudad Autónoma de Buenos Aires', provincia_ciudad=prov_ba)
    city_cordoba, _ = Ciudades.objects.get_or_create(nombre_ciudad='Córdoba Capital', provincia_ciudad=prov_cba)
    print(f'✅ Ciudades creadas/verificadas.')

    # Barrios
    barrio_palermo, _ = Barrios.objects.get_or_create(nombre_barrio='Palermo', ciudad_barrio=city_caba)
    barrio_belgrano, _ = Barrios.objects.get_or_create(nombre_barrio='Belgrano', ciudad_barrio=city_caba)
    barrio_centro_cba, _ = Barrios.objects.get_or_create(nombre_barrio='Centro', ciudad_barrio=city_cordoba)
    print(f'✅ Barrios creados/verificados.')

    # Calles
    calle_santafe, _ = Calles.objects.get_or_create(nombre_calle='Av. Santa Fe', barrio_calle=barrio_palermo)
    calle_cabildo, _ = Calles.objects.get_or_create(nombre_calle='Av. Cabildo', barrio_calle=barrio_belgrano)
    calle_colon, _ = Calles.objects.get_or_create(nombre_calle='Av. Colón', barrio_calle=barrio_centro_cba)
    print(f'✅ Calles creadas/verificadas.')
    
    return [calle_santafe, calle_cabildo, calle_colon]

def crear_direcciones_y_telefonos(clientes, calles):
    """Asigna direcciones y teléfonos adicionales a los clientes."""
    print(f'\n--- Asignando Direcciones y Teléfonos a {clientes.count()} Clientes ---')
    if not calles:
        print('⚠️ No hay calles para asignar direcciones. Saltando.')
        return

    clientes_list = list(clientes)
    for cliente in clientes_list:
        # Asignar una dirección
        Direcciones.objects.get_or_create(
            usuario_direccion=cliente.user_cliente,
            calle_direccion=random.choice(calles),
            defaults={
                'nombre_direccion': f'Casa de {cliente.user_cliente.first_name}',
                'departamento_direccion': f'{random.choice(["A", "B", "C"])}-{random.randint(1, 10)}',
                'referecia_direccion': f'Cerca de la plaza, portón {fake.color_name()}'
            }
        )

        # Asignar un teléfono adicional
        Telefonos_Usuarios.objects.get_or_create(
            usuario_telefono=cliente.user_cliente,
            numero_telefono=fake.phone_number()[:20]
        )
    print('✅ Direcciones y teléfonos asignados.')


def crear_configuracion_base():
    """Crea métodos de pago y carga la configuración singleton."""
    print('\n--- Creando Configuración Base (Métodos de Pago, Opciones de Tienda) ---')
    
    # Métodos de Pago
    metodo_efectivo, _ = Metodos_Pago.objects.get_or_create(nombre_metodo='Efectivo')
    metodo_tarjeta, _ = Metodos_Pago.objects.get_or_create(nombre_metodo='Tarjeta de Crédito/Débito')
    metodo_mp, _ = Metodos_Pago.objects.get_or_create(nombre_metodo='Mercado Pago QR')
    print('✅ Métodos de pago creados/verificados.')

    # Cargar/crear singletons de configuración
    ConfiguracionTienda.load()
    ConfiguracionPuntos.load()
    print('✅ Configuración de tienda y puntos cargada/verificada.')

    return [metodo_efectivo, metodo_tarjeta, metodo_mp]

def crear_proveedores(cantidad=15):
    """Crea proveedores de ejemplo."""
    print(f'\n--- Creando {cantidad} Proveedores ---')
    
    tipo_estado_proveedor, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='PROVEEDOR')
    estado_activo, _ = Estados.objects.get_or_create(
        nombre_estado='ACTIVO', 
        defaults={'tipo_estado': tipo_estado_proveedor}
    )

    proveedores_creados = 0
    for _ in range(cantidad):
        nombre = fake.company()
        proveedor, created = Proveedores.objects.get_or_create(
            cuit_proveedor=fake.unique.itin(), # Usamos itin como CUIT/CUITL falso
            defaults={
                'nombre_proveedor': nombre,
                'razon_social_proveedor': f"{nombre} S.A.",
                'telefono_proveedor': fake.phone_number()[:20],
                'correo_proveedor': fake.company_email(),
                'estado_proveedor': estado_activo
            }
        )
        if created:
            proveedores_creados += 1
            print(f'  -> Proveedor \'{nombre}\' creado.')
    
    print(f'✅ {proveedores_creados} proveedores nuevos creados.')
    return Proveedores.objects.all()

def crear_compras(proveedores, productos, empleado, metodos_pago, cantidad=50):
    """Crea compras de ejemplo a proveedores."""
    print(f'\n--- Creando {cantidad} Compras ---')
    if not proveedores.exists() or not productos.exists():
        print('❌ ADVERTENCIA: No se pueden crear compras sin proveedores y productos. Aborta.')
        return

    # Estados para compras
    tipo_estado_compra, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='COMPRA')
    estado_recibida, _ = Estados.objects.get_or_create(nombre_estado='RECIBIDA', defaults={'tipo_estado': tipo_estado_compra})
    estado_pendiente, _ = Estados.objects.get_or_create(nombre_estado='PENDIENTE', defaults={'tipo_estado': tipo_estado_compra})

    # Tipo de movimiento para historial
    tipo_mov_compra, _ = Tipos_Movimientos.objects.get_or_create(nombre_movimiento='ENTRADA POR COMPRA')

    compras_creadas = 0
    proveedores_list = list(proveedores)
    productos_list = list(productos)

    for _ in range(cantidad):
        proveedor = random.choice(proveedores_list)
        estado = random.choice([estado_recibida, estado_pendiente])
        fecha_compra = fake.date_time_between(start_date='-2y', end_date='now', tzinfo=None)
        
        compra = Compras.objects.create(
            proveedor_compra=proveedor,
            estado_compra=estado,
            fecha_compra=fecha_compra,
            total_compra=0 # Se actualizará después
        )

        total_compra = 0
        num_productos_en_compra = random.randint(1, 8)
        productos_a_comprar = random.sample(productos_list, num_productos_en_compra)
        
        for producto in productos_a_comprar:
            cantidad_item = random.randint(5, 50)
            precio_unidad = producto.precio_unitario_compra_producto
            subtotal = precio_unidad * cantidad_item
            total_compra += subtotal

            Detalle_Compras.objects.create(
                compra_dt_comp=compra,
                producto_dt_comp=producto,
                cant_det_comp=cantidad_item,
                precio_unidad_det_comp=precio_unidad,
                subtotal_det_comp=subtotal
            )

            # Si la compra está 'RECIBIDA', actualizamos el stock
            if estado == estado_recibida:
                stock, created = Stocks.objects.get_or_create(
                    producto_en_stock=producto,
                    lote_stock=compra.id_compra, # Usamos el ID de compra como lote
                    defaults={'cantidad_actual_stock': 0}
                )
                
                stock_anterior = stock.cantidad_actual_stock
                stock.cantidad_actual_stock += cantidad_item
                stock.save()
                
                # Registrar en el historial de stock
                from Control_STOCK.models import Historial_Stock
                Historial_Stock.objects.create(
                    stock_hs=stock,
                    empleado_hs=empleado,
                    tipo_movimiento_hs=tipo_mov_compra,
                    cantidad_hstock=cantidad_item,
                    stock_anterior_hstock=stock_anterior,
                    stock_nuevo_hstock=stock.cantidad_actual_stock,
                    observaciones_hstock=f'Entrada por compra #{compra.id_compra}'
                )

        compra.total_compra = round(total_compra, 2)
        compra.save()
        compras_creadas += 1
        print(f'  -> Compra #{compra.id_compra} creada para proveedor \'{proveedor.nombre_proveedor}\' por ${compra.total_compra}.')

    print(f'✅ {compras_creadas} compras nuevas creadas.')

def crear_promociones(cantidad=5):
    """Crea promociones de descuento de ejemplo."""
    print(f'\n--- Creando {cantidad} Promociones de Descuento ---')
    from Fidelizar_CLIENTES.models import Promociones_Descuento
    
    promos_creadas = 0
    for i in range(cantidad):
        porcentaje = (i + 1) * 5
        promo, created = Promociones_Descuento.objects.get_or_create(
            nombre_promo_desc=f'Descuento del {porcentaje}%',
            defaults={
                'descuento_porcentaje_promo_desc': porcentaje,
                'descuento_monto_promo_desc': 0, # Basado en porcentaje
                'puntos_requeridos_promo_desc': 50 * (i + 1),
                'descripcion_promo_desc': f'Obtén un {porcentaje}% de descuento en tu próxima compra.',
                'fecha_inicio_promo_desc': fake.date_this_year(before_today=True, after_today=False),
                'fecha_vencimiento_promo_desc': fake.date_this_year(before_today=False, after_today=True)
            }
        )
        if created:
            promos_creadas += 1
            print(f'  -> Promoción \'{promo.nombre_promo_desc}\' creada.')
            
    print(f'✅ {promos_creadas} promociones nuevas creadas.')
    return Promociones_Descuento.objects.all()

def crear_puntos_y_promos_clientes(clientes, promociones):
    """Asigna puntos iniciales y promociones a los clientes."""
    print(f'\n--- Asignando Puntos y Promociones a Clientes ---')
    from Fidelizar_CLIENTES.models import Transacciones_Puntos, Promos_Clientes, Historial_Puntos
    
    if not clientes.exists():
        print('⚠️ No hay clientes para asignar puntos. Saltando.')
        return

    # Estados para promociones de clientes
    tipo_estado_promo, _ = Tipos_Estados.objects.get_or_create(nombre_tipo_estado='PROMOCION_CLIENTE')
    estado_disponible, _ = Estados.objects.get_or_create(nombre_estado='DISPONIBLE', defaults={'tipo_estado': tipo_estado_promo})
    
    promociones_list = list(promociones)

    for cliente in clientes:
        # Asignar puntos iniciales
        puntos_iniciales = random.randint(50, 500)
        Transacciones_Puntos.objects.create(
            cliente_trans_puntos=cliente,
            puntos_trans_puntos=puntos_iniciales,
            descripcion_trans_puntos='Puntos de bienvenida generados por script.'
        )
        Historial_Puntos.objects.create(
            cliente_historial_puntos=cliente,
            puntos_obtenidos_historial_puntos=puntos_iniciales,
            puntos_redimidos_historial_puntos=0,
            descripcion_historial_puntos='Carga inicial de puntos.'
        )
        print(f'  -> {puntos_iniciales} puntos asignados a {cliente.user_cliente.get_full_name()}.')

        # Asignar una promoción aleatoria si hay disponibles
        if promociones_list:
            promo_asignada = random.choice(promociones_list)
            Promos_Clientes.objects.get_or_create(
                cliente_promo_cli=cliente,
                cupon_descuento_promo_cli=promo_asignada,
                defaults={'estado_promo_cli': estado_disponible}
            )
            print(f'    -> Promoción \'{promo_asignada.nombre_promo_desc}\' asignada a {cliente.user_cliente.get_full_name()}.')

    print('✅ Puntos y promociones asignados.')

def generar_reportes_analiticos():
    """Genera reportes analíticos basados en las ventas y compras existentes."""
    print('\n--- Generando Reportes Analíticos ---')
    from django.db.models import Sum, Count
    from django.db.models.functions import TruncDate
    from Analizar_INGRESOS_EGRESOS.models import ReporteDiario, ReporteProducto, ReporteEmpleado
    
    # Limpiar reportes antiguos
    ReporteDiario.objects.all().delete()
    ReporteProducto.objects.all().delete()
    ReporteEmpleado.objects.all().delete()

    # 1. Reporte Diario (Ingresos y Egresos)
    print('  -> Generando Reporte Diario...')
    ventas_por_dia = Ventas.objects.annotate(dia=TruncDate('fecha_venta')).values('dia').annotate(ingresos=Sum('total_venta')).order_by('dia')
    compras_por_dia = Compras.objects.annotate(dia=TruncDate('fecha_compra')).values('dia').annotate(egresos=Sum('total_compra')).order_by('dia')

    reportes_diarios = {}
    for venta in ventas_por_dia:
        dia = venta['dia']
        if dia not in reportes_diarios:
            reportes_diarios[dia] = {'ingresos': 0, 'egresos': 0}
        reportes_diarios[dia]['ingresos'] += venta['ingresos']
    
    for compra in compras_por_dia:
        dia = compra['dia']
        if dia not in reportes_diarios:
            reportes_diarios[dia] = {'ingresos': 0, 'egresos': 0}
        reportes_diarios[dia]['egresos'] += compra['egresos']

    for dia, data in reportes_diarios.items():
        ReporteDiario.objects.create(
            fecha=dia,
            ingresos_totales=data['ingresos'],
            egresos_totales=data['egresos'],
            neto=data['ingresos'] - data['egresos']
        )
    print(f'✅ {len(reportes_diarios)} reportes diarios creados/actualizados.')
    
    # 2. Reporte de Productos
    print('  -> Generando Reporte de Productos...')
    ventas_productos = Detalle_Ventas.objects.values('producto_det_vent__id_producto', 'producto_det_vent__nombre_producto', fecha_reporte=TruncDate('venta_det_vent__fecha_venta')).annotate(
        cantidad_vendida=Sum('cantidad_det_vent'),
        total_ventas=Sum('subtotal_det_vent')
    ).order_by('fecha_reporte', 'producto_det_vent__id_producto')

    for reporte in ventas_productos:
        ReporteProducto.objects.create(
            producto_id=reporte['producto_det_vent__id_producto'],
            nombre_producto=reporte['producto_det_vent__nombre_producto'],
            cantidad_vendida=reporte['cantidad_vendida'],
            total_ventas=reporte['total_ventas'],
            fecha_reporte=reporte['fecha_reporte']
        )
    print(f'✅ {len(ventas_productos)} reportes de productos creados.')
    
    # 3. Reporte de Empleados
    print('  -> Generando Reporte de Empleados...')
    ventas_empleados = Ventas.objects.values('empleado_venta__id_empleado', 'empleado_venta__user_empleado__first_name', 'empleado_venta__user_empleado__last_name', fecha_reporte=TruncDate('fecha_venta')).annotate(
        total_ventas_empleado=Sum('total_venta'),
        cantidad_ventas_empleado=Count('id_venta')
    ).order_by('fecha_reporte', 'empleado_venta__id_empleado')

    for reporte in ventas_empleados:
        ReporteEmpleado.objects.create(
            empleado_id=reporte['empleado_venta__id_empleado'],
            nombre_empleado=f"{reporte['empleado_venta__user_empleado__first_name']} {reporte['empleado_venta__user_empleado__last_name']}",
            total_ventas_empleado=reporte['total_ventas_empleado'],
            cantidad_ventas_empleado=reporte['cantidad_ventas_empleado'],
            fecha_reporte=reporte['fecha_reporte']
        )
    print(f'✅ {len(ventas_empleados)} reportes de empleados creados.')
    print('✅ Reportes analíticos generados.')

def crear_registros_auditoria(empleado):
    """Crea algunos registros de auditoría de ejemplo."""
    print('\n--- Creando Registros de Auditoría ---')
    from Auditoria.models import RegistroAuditoria

    if not empleado:
        print('⚠️ No se puede crear auditoría sin un empleado. Saltando.')
        return
        
    RegistroAuditoria.objects.create(
        usuario=empleado.user_empleado,
        accion='APERTURA_CAJA',
        detalles={'mensaje': 'Apertura de caja al inicio del día (script).'}
    )
    RegistroAuditoria.objects.create(
        usuario=empleado.user_empleado,
        accion='AJUSTE_STOCK_MANUAL',
        detalles={'producto_id': 1, 'cantidad_ajustada': -2, 'motivo': 'Producto dañado (ejemplo de script).'}
    )
    print('✅ Registros de auditoría creados.')







def crear_ventas(clientes, productos, caja_abierta, estado_completada, empleado, tipo_evento_venta, metodos_pago, cantidad=150):
    print(f'\n--- Creando {cantidad} Ventas ---')
    if not caja_abierta:
        print('❌ ADVERTENCIA: No se pueden crear ventas sin una caja abierta. Aborta.')
        return
    if not metodos_pago:
        print('❌ ADVERTENCIA: No hay métodos de pago para asignar a las ventas. Aborta.')
        return

    ventas_creadas = 0
    # Convert queryset to list for random.choice
    clientes_list = list(clientes)
    productos_list = list(productos)

    for _ in range(cantidad):
        cliente_venta = random.choice(clientes_list)
        # Use timezone-aware datetime
        fecha_venta = fake.date_time_between(start_date='-2y', end_date='now', tzinfo=None)
        
        total_venta = 0
        num_productos_en_venta = random.randint(1, 5)
        
        if len(productos_list) < num_productos_en_venta:
            print(f'⚠️ No hay suficientes productos únicos ({len(productos_list)}) para la venta. Saltando.')
            continue
            
        productos_seleccionados = random.sample(productos_list, num_productos_en_venta)

        venta = Ventas.objects.create(
            caja_venta=caja_abierta,
            cliente_venta=cliente_venta,
            fecha_venta=fecha_venta,
            estado_venta=estado_completada,
            total_venta=0,
            empleado_venta=empleado,
            observaciones_venta=f'Venta generada por script para {cliente_venta.user_cliente.get_full_name()}'
        )

        detalles_creados = False
        for producto in productos_seleccionados:
            try:
                stock_disponible = Stocks.objects.filter(producto_en_stock=producto, cantidad_actual_stock__gt=0).first()
                if stock_disponible:
                    cantidad_item = random.randint(1, min(3, stock_disponible.cantidad_actual_stock))
                    
                    subtotal = producto.precio_unitario_venta_producto * cantidad_item
                    total_venta += subtotal
                    
                    Detalle_Ventas.objects.create(
                        venta_det_vent=venta,
                        producto_det_vent=producto,
                        cantidad_det_vent=cantidad_item,
                        precio_unitario_det_vent=producto.precio_unitario_venta_producto,
                        subtotal_det_vent=subtotal,
                        descripcion_det_vent='Item de venta generado por script.'
                    )
                    
                    stock_disponible.cantidad_actual_stock -= cantidad_item
                    stock_disponible.save()
                    detalles_creados = True

            except Stocks.DoesNotExist:
                continue

        if detalles_creados and total_venta > 0:
            venta.total_venta = round(total_venta, 2)
            
            # Asignar un método de pago a la venta
            metodo_pago_elegido = random.choice(metodos_pago)
            Venta_MetodoPago.objects.create(
                venta_vent_metpag=venta,
                metodopago_vent_metpag=metodo_pago_elegido
            )
            # Actualizar la venta con el nombre del método de pago para referencia rápida
            venta.metodo_pago = metodo_pago_elegido.nombre_metodo
            venta.save()
            ventas_creadas += 1

            # Registrar en Historial_Caja
            last_mov = Historial_Caja.objects.filter(caja_hc=caja_abierta).order_by('-fecha_movimiento_hcaja').first()
            saldo_anterior = last_mov.nuevo_saldo_hcaja if last_mov else caja_abierta.monto_apertura_caja
            nuevo_saldo = saldo_anterior + venta.total_venta
            
            Historial_Caja.objects.create(
                caja_hc=caja_abierta,
                empleado_hc=empleado,
                tipo_event_caja=tipo_evento_venta,
                cantidad_movida_hcaja=venta.total_venta,
                saldo_anterior_hcaja=saldo_anterior,
                nuevo_saldo_hcaja=nuevo_saldo,
                descripcion_hcaja=f'Venta #{venta.id_venta}'
            )
            print(f'  -> Venta #{venta.id_venta} creada para \'{cliente_venta.user_cliente.get_full_name()}\' por ${venta.total_venta}.')
        else:
            venta.delete()

    print(f'✅ Proceso de creación de {ventas_creadas} ventas finalizado.')


# --- SCRIPT PRINCIPAL ---
if __name__ == '__main__':
    print('\n' + '='*50)
    print('ADVERTENCIA: Este script modificará tu base de datos.')
    print('Se crearán datos de prueba que no deben usarse en producción.')
    
    # Comentado para ejecución automática
    # input('Presiona Enter para continuar o CTRL+C para cancelar...')
    
    print('='*50 + '\n')

    # 1. Obtener/crear recursos básicos
    caja, estado_venta, estado_producto, empleado, tipo_mov_inicial, tipo_evento_venta = obtener_recursos_esenciales()

    # 2. Crear datos de base
    categorias = crear_categorias()
    productos = crear_productos(categorias, estado_producto, empleado, tipo_mov_inicial)
    clientes = crear_clientes(cantidad=30)
    calles = crear_geolocalizacion_base()
    crear_direcciones_y_telefonos(clientes, calles)
    metodos_pago = crear_configuracion_base()
    proveedores = crear_proveedores()
    promociones = crear_promociones()
    crear_puntos_y_promos_clientes(clientes, promociones)
    
    # 3. Crear datos de transacciones
    if caja and estado_venta and productos.exists() and clientes.exists() and proveedores.exists():
        crear_compras(proveedores, productos, empleado, metodos_pago)
        crear_ventas(clientes, productos, caja, estado_venta, empleado, tipo_evento_venta, metodos_pago, cantidad=150)
    else:
        print('\n❌ No se pudieron crear las transacciones por falta de recursos esenciales (caja, estados, productos, clientes o proveedores).')

    # 4. Generar reportes
    generar_reportes_analiticos()

    # 5. Crear registros de auditoría
    crear_registros_auditoria(empleado)

    print('\n' + '='*50)
    print('🎉 Script de población finalizado.')
    print('='*50)