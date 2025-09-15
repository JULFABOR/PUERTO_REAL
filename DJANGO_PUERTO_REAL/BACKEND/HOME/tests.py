from django.test import TestCase
from django.contrib.auth.models import User
from .models import (
    Tipos_Estados, Estados, Categorias_Productos, Productos, Stocks, Compras,
    Fondo_Pagos, Tipo_Evento, Historial_Caja, Empleados
)
from . import services as S
from datetime import date

class ServiceTests(TestCase):

    def setUp(self):
        # Create necessary related objects for Productos and Stocks
        self.user = User.objects.create_user(username='testuser', password='password')
        self.empleado = Empleados.objects.create(user_empleado=self.user, dni_empleado='12345678', telefono_empleado='123456789')

        self.tipo_estado_activo = Tipos_Estados.objects.create(nombre_tipo_estado='Activo')
        self.estado_activo = Estados.objects.create(nombre_estado='ACTIVO', tipo_estado=self.tipo_estado_activo)
        self.estado_inactivo = Estados.objects.create(nombre_estado='INACTIVO', tipo_estado=self.tipo_estado_activo)
        self.estado_pendiente = Estados.objects.create(nombre_estado='PENDIENTE', tipo_estado=self.tipo_estado_activo)

        self.categoria = Categorias_Productos.objects.create(nombre_categoria='Electrónica')

        # Create a product with low stock threshold
        self.product_low_stock = Productos.objects.create(
            nombre_producto='Laptop',
            descripcion_producto='Gaming Laptop',
            precio_unitario_compra_producto=1000.00,
            precio_unitario_venta_producto=1200.00,
            categoria_producto=self.categoria,
            estado_producto=self.estado_activo,
            low_stock_threshold=5,
            barcode='1234567890123'
        )
        Stocks.objects.create(
            producto_en_stock=self.product_low_stock,
            cantidad_actual_stock=3,
            lote_stock=1,
            observaciones_stock=''
        )

        # Create a product with sufficient stock
        self.product_sufficient_stock = Productos.objects.create(
            nombre_producto='Mouse',
            descripcion_producto='Wireless Mouse',
            precio_unitario_compra_producto=20.00,
            precio_unitario_venta_producto=30.00,
            categoria_producto=self.categoria,
            estado_producto=self.estado_activo,
            low_stock_threshold=10,
            barcode='9876543210987'
        )
        Stocks.objects.create(
            producto_en_stock=self.product_sufficient_stock,
            cantidad_actual_stock=15,
            lote_stock=1,
            observaciones_stock=''
        )

        # Create a product with no stock entry
        self.product_no_stock = Productos.objects.create(
            nombre_producto='Keyboard',
            descripcion_producto='Mechanical Keyboard',
            precio_unitario_compra_producto=50.00,
            precio_unitario_venta_producto=70.00,
            categoria_producto=self.categoria,
            estado_producto=self.estado_activo,
            low_stock_threshold=2,
            barcode='1122334455667'
        )

        # Create a purchase that expires today
        self.compra_vence_hoy = Compras.objects.create(
            total_compra=500.00,
            proveedor_compra=self.empleado, # Using empleado as a placeholder for proveedor
            estado_compra=self.estado_pendiente,
            fecha_limite=date.today()
        )

        # Create a purchase that does not expire today
        self.compra_no_vence_hoy = Compras.objects.create(
            total_compra=200.00,
            proveedor_compra=self.empleado, # Using empleado as a placeholder for proveedor
            estado_compra=self.estado_pendiente,
            fecha_limite=date(2026, 1, 1) # Future date
        )

        # Create Fondo_Pagos with low balance
        self.fondo_bajo = Fondo_Pagos.objects.create(
            saldo_fp=50.00,
            estado_fp=self.estado_activo
        )

        # Create Fondo_Pagos with sufficient balance
        self.fondo_suficiente = Fondo_Pagos.objects.create(
            saldo_fp=200.00,
            estado_fp=self.estado_activo
        )

        # Create a Cajas instance for testing
        self.caja_abierta = Cajas.objects.create(
            monto_apertura_caja=100.00,
            total_gastos_caja=0,
            monto_cierre_caja=100.00,
            monto_teorico_caja=100.00,
            diferencia_caja=0,
            observaciones_caja='',
            estado_caja=Estados.objects.create(nombre_estado='ABIERTO', tipo_estado=self.tipo_estado_activo)
        )
        self.caja_cerrada = Cajas.objects.create(
            monto_apertura_caja=0.00,
            total_gastos_caja=0,
            monto_cierre_caja=0.00,
            monto_teorico_caja=0.00,
            diferencia_caja=0,
            observaciones_caja='',
            estado_caja=Estados.objects.create(nombre_estado='CERRADO', tipo_estado=self.tipo_estado_activo)
        )

        # Create Tipo_Evento for kpi_egresos_operativos test
        self.tipo_evento_egreso = Tipo_Evento.objects.create(nombre_evento='EGRESO')
        self.tipo_evento_gasto = Tipo_Evento.objects.create(nombre_evento='GASTO')
        self.tipo_evento_apertura = Tipo_Evento.objects.create(nombre_evento='APERTURA')

        # Create Historial_Caja entries for kpi_egresos_operativos test
        Historial_Caja.objects.create(
            caja_hc=self.caja_abierta,
            empleado_hc=self.empleado,
            tipo_event_caja=self.tipo_evento_egreso,
            cantidad_movida_hcaja=50.00,
            saldo_anterior_hcaja=100.00,
            nuevo_saldo_hcaja=50.00,
            descripcion_hcaja='Egreso de prueba',
            destino_movimiento='OTRO'
        )
        Historial_Caja.objects.create(
            caja_hc=self.caja_abierta,
            empleado_hc=self.empleado,
            tipo_event_caja=self.tipo_evento_gasto,
            cantidad_movida_hcaja=20.00,
            saldo_anterior_hcaja=50.00,
            nuevo_saldo_hcaja=30.00,
            descripcion_hcaja='Gasto de prueba',
            destino_movimiento='OTRO'
        )
        Historial_Caja.objects.create(
            caja_hc=self.caja_abierta,
            empleado_hc=self.empleado,
            tipo_event_caja=self.tipo_evento_apertura,
            cantidad_movida_hcaja=100.00,
            saldo_anterior_hcaja=0.00,
            nuevo_saldo_hcaja=100.00,
            descripcion_hcaja='Apertura de caja',
            destino_movimiento='DEPOSITAR_OTROS'
        )


    def test_hay_stock_bajo(self):
        self.assertTrue(S.hay_stock_bajo())

        # Ensure that if all products have sufficient stock, it returns False
        Stocks.objects.filter(producto_en_stock=self.product_low_stock).update(cantidad_actual_stock=10)
        self.assertFalse(S.hay_stock_bajo())

    def test_cxp_vencen_hoy(self):
        self.assertTrue(S.cxp_vencen_hoy())

        # Change the expiring purchase date to a future date
        self.compra_vence_hoy.fecha_limite = date(2026, 1, 1)
        self.compra_vence_hoy.save()
        self.assertFalse(S.cxp_vencen_hoy())

    def test_fondos_pagos_bajo_saldo(self):
        self.assertTrue(S.fondos_pagos_bajo_saldo())

        # Increase the balance of the low fund
        self.fondo_bajo.saldo_fp = 150.00
        self.fondo_bajo.save()
        self.assertFalse(S.fondos_pagos_bajo_saldo())

    def test_obtener_estado_caja(self):
        self.assertEqual(S.obtener_estado_caja(), 'ABIERTO')

        # Close the open cash register
        self.caja_abierta.estado_caja = self.estado_inactivo # Assuming INACTIVO means closed
        self.caja_abierta.save()
        self.assertEqual(S.obtener_estado_caja(), 'CERRADO') # Should return CERRADO if no open boxes

    def test_kpi_saldo_caja_actual(self):
        # Assuming the last created caja is self.caja_cerrada, but the service orders by -id_caja
        # So, the last created caja with a valid monto_cierre_caja should be returned.
        # Let's ensure self.caja_abierta is the latest by id.
        latest_caja = Cajas.objects.order_by('-id_caja').first()
        self.assertEqual(S.kpi_saldo_caja_actual(), float(latest_caja.monto_cierre_caja))

    def test_kpi_egresos_operativos(self):
        # Assuming total egresos are 50.00 + 20.00 = 70.00
        start, end, _ = S.parse_rango('hoy')
        self.assertEqual(S.kpi_egresos_operativos(start, end), 70.00)

    def test_autenticar_cliente(self):
        # Create a client for authentication test
        client_user = User.objects.create_user(username='clienttest', password='clientpass', email='client@example.com')
        client = Clientes.objects.create(user_cliente=client_user, dni_cliente='11223344', telefono_cliente='99887766')

        # Test with DNI and PIN
        auth_result = S.autenticar_cliente('11223344', 'clientpass')
        self.assertTrue(auth_result['ok'])
        self.assertEqual(auth_result['cliente_id'], client.id_cliente)

        # Test with email and password
        auth_result = S.autenticar_cliente('client@example.com', 'clientpass')
        self.assertTrue(auth_result['ok'])
        self.assertEqual(auth_result['cliente_id'], client.id_cliente)

        # Test with invalid credentials
        auth_result = S.autenticar_cliente('11223344', 'wrongpass')
        self.assertFalse(auth_result['ok'])

    def test_crear_cliente(self):
        client_data = {
            'nombre': 'Nuevo',
            'apellido': 'Cliente',
            'dni': '55667788',
            'email': 'nuevo@example.com',
            'pin': 'newpass'
        }
        create_result = S.crear_cliente(client_data)
        self.assertTrue(create_result['ok'])
        self.assertIsNotNone(create_result['cliente_id'])

        # Verify client was created
        new_client = Clientes.objects.get(id_cliente=create_result['cliente_id'])
        self.assertEqual(new_client.dni_cliente, '55667788')
        self.assertEqual(new_client.user_cliente.email, 'nuevo@example.com')

        # Test with existing DNI (should fail)
        client_data_duplicate_dni = {
            'nombre': 'Otro',
            'apellido': 'Cliente',
            'dni': '55667788',
            'email': 'otro@example.com',
            'pin': 'anotherpass'
        }
        create_result_duplicate = S.crear_cliente(client_data_duplicate_dni)
        self.assertFalse(create_result_duplicate['ok'])