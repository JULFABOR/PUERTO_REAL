from django.db import transaction
from rest_framework import serializers
from Auditoria.services import crear_registro
from Control_STOCK.models import Stocks, Historial_Stock
from Config_PR.models import Tipos_Movimientos

def _get_or_create_stock(producto):
    stock, created = Stocks.objects.get_or_create(
        producto_en_stock=producto,
        defaults={
            'cantidad_actual_stock': 0,
            'lote_stock': 0,  # Consider how to handle lotes properly
            'observaciones_stock': 'Stock inicial creado automáticamente por compra.'
        }
    )
    return stock

@transaction.atomic
def receive_purchase_stock(compra, empleado):
    """
    Handles the stock update when a purchase is marked as 'RECIBIDA' for the first time.
    Increases stock for all items in the purchase.
    """
    try:
        mov_compra = Tipos_Movimientos.objects.get(nombre_movimiento='COMP_A_PROVEEDOR')
    except Tipos_Movimientos.DoesNotExist:
        raise serializers.ValidationError("Tipo de movimiento 'COMP_A_PROVEEDOR' no encontrado.")

    for detalle in compra.detalles.all():
        stock = _get_or_create_stock(detalle.producto_dt_comp)
        stock_anterior = stock.cantidad_actual_stock
        stock.cantidad_actual_stock += detalle.cant_det_comp
        stock.save()

        Historial_Stock.objects.create(
            stock_hs=stock,
            cantidad_hstock=detalle.cant_det_comp,
            stock_anterior_hstock=stock_anterior,
            stock_nuevo_hstock=stock.cantidad_actual_stock,
            tipo_movimiento_hs=mov_compra,
            empleado_hs=empleado,
            observaciones_hstock=f"Entrada por recepción de compra ID: {compra.id_compra}"
        )
    
    crear_registro(
        usuario=empleado.user_empleado,
        accion='COMPRA_RECIBIDA',
        detalles={'compra_id': compra.id_compra}
    )

@transaction.atomic
def adjust_stock_on_purchase_edit(compra, detalles_data, empleado):
    """
    Adjusts stock when an already 'RECIBIDA' purchase is edited.
    Compares the new details with the old ones and creates stock adjustments.
    """
    try:
        mov_ajuste = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_AJUSTE')
    except Tipos_Movimientos.DoesNotExist:
        raise serializers.ValidationError("Tipo de movimiento 'MOV_STOCK_AJUSTE' no encontrado.")

    existing_detalles_map = {str(d.id_det_comp): d for d in compra.detalles.all()}
    new_detalles_map = {str(d.get('id_det_comp')): d for d in detalles_data if d.get('id_det_comp')}

    # 1. Handle updated details
    for det_id, new_data in new_detalles_map.items():
        if det_id in existing_detalles_map:
            old_detalle = existing_detalles_map.pop(det_id)
            cantidad_diff = new_data.get('cant_det_comp', old_detalle.cant_det_comp) - old_detalle.cant_det_comp

            if cantidad_diff != 0:
                stock = _get_or_create_stock(old_detalle.producto_dt_comp)
                stock_anterior = stock.cantidad_actual_stock
                stock.cantidad_actual_stock += cantidad_diff
                stock.save()

                Historial_Stock.objects.create(
                    stock_hs=stock, cantidad_hstock=cantidad_diff,
                    stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
                    tipo_movimiento_hs=mov_ajuste, empleado_hs=empleado,
                    observaciones_hstock=f"Ajuste por edición de compra ID: {compra.id_compra}"
                )

    # 2. Handle deleted details
    for det_id, old_detalle in existing_detalles_map.items():
        stock = _get_or_create_stock(old_detalle.producto_dt_comp)
        stock_anterior = stock.cantidad_actual_stock
        stock.cantidad_actual_stock -= old_detalle.cant_det_comp
        stock.save()

        Historial_Stock.objects.create(
            stock_hs=stock, cantidad_hstock=-old_detalle.cant_det_comp,
            stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
            tipo_movimiento_hs=mov_ajuste, empleado_hs=empleado,
            observaciones_hstock=f"Ajuste por eliminación de detalle de compra ID: {compra.id_compra}"
        )

    # 3. Handle new details (This part was missing in the original logic)
    new_details_without_id = [d for d in detalles_data if not d.get('id_det_comp')]
    for new_data in new_details_without_id:
        producto = new_data.get('producto_dt_comp')
        cantidad = new_data.get('cant_det_comp')
        if producto and cantidad:
            stock = _get_or_create_stock(producto)
            stock_anterior = stock.cantidad_actual_stock
            stock.cantidad_actual_stock += cantidad
            stock.save()

            Historial_Stock.objects.create(
                stock_hs=stock, cantidad_hstock=cantidad,
                stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
                tipo_movimiento_hs=mov_ajuste, empleado_hs=empleado,
                observaciones_hstock=f"Ajuste por nuevo detalle en compra ID: {compra.id_compra}"
            )
