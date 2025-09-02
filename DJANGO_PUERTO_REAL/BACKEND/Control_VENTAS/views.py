from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse
from django.template.loader import get_template
from django.utils import timezone
from xhtml2pdf import pisa
from io import BytesIO
from django.conf import settings
import math

from HOME.models import (
    Ventas, Detalle_Ventas, Stocks, Historial_Stock,
    Cajas, Historial_Caja, Tipos_Movimientos, Tipo_Evento, Productos,
    Cupones_Clientes, Estados, Historial_Puntos, Clientes, Empleados
)
from .serializers import VentaSerializer

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Ventas.objects.all()
    serializer_class = VentaSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check for cancellation request
        nuevo_estado_id = request.data.get('estado_venta')
        if nuevo_estado_id and int(nuevo_estado_id) == 4 and instance.estado_venta.id_estado != 4: # 4: ANULADA
            # Check 5-minute time limit for cancellation
            time_diff = timezone.now() - instance.fecha_venta
            if time_diff.total_seconds() > 300: # 5 minutes
                return Response(
                    {"error": "La venta solo puede ser anulada dentro de los 5 minutos de su creacion."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Revert Stock
            tipo_movimiento_entrada = Tipos_Movimientos.objects.get(id_tipo_movimiento=10) # MOV_STOCK_ENTRADA
            empleado = request.user.empleado # Assumes user is linked to an Empleado

            for detalle in instance.detalles.all():
                stock, created = Stocks.objects.get_or_create(
                    producto_en_stock=detalle.producto_det_vent,
                    defaults={'cantidad_actual_stock': 0, 'lote_stock': 0, 'fecha_vencimiento': '2099-12-31'}
                )
                stock_anterior = stock.cantidad_actual_stock
                stock.cantidad_actual_stock += detalle.cantidad_det_vent
                stock.save()

                Historial_Stock.objects.create(
                    stock_hs=stock,
                    cantidad_hstock=detalle.cantidad_det_vent,
                    stock_anterior_hstock=stock_anterior,
                    stock_nuevo_hstock=stock.cantidad_actual_stock,
                    tipo_movimiento_hs=tipo_movimiento_entrada,
                    empleado_hs=empleado,
                    observaciones_hstock=f"Entrada por anulacion de venta ID: {instance.id_venta}"
                )
            
            # Revert Caja
            caja = instance.caja_venta
            
            # Revert income from sale
            monto_ingreso_original = instance.total_venta - instance.descuento_aplicado
            saldo_anterior_caja = caja.monto_teorico_caja
            caja.monto_teorico_caja -= monto_ingreso_original
            caja.save()

            tipo_evento_egreso_anulacion, _ = Tipo_Evento.objects.get_or_create(nombre_evento="ANULACION_VENTA_EGRESO")
            Historial_Caja.objects.create(
                caja_hc=caja,
                empleado_hc=empleado,
                tipo_event_caja=tipo_evento_egreso_anulacion,
                cantidad_movida_hcaja=monto_ingreso_original * -1, # Negative for expense
                saldo_anterior_hcaja=saldo_anterior_caja,
                nuevo_saldo_hcaja=caja.monto_teorico_caja,
                descripcion_hcaja=f"Egreso por anulacion de ingreso de venta ID: {instance.id_venta}"
            )

            # Revert expense for change given (if any)
            if instance.vuelto_entregado > 0:
                saldo_anterior_vuelto = caja.monto_teorico_caja
                caja.monto_teorico_caja += instance.vuelto_entregado
                caja.save()

                tipo_evento_ingreso_anulacion, _ = Tipo_Evento.objects.get_or_create(nombre_evento="ANULACION_VENTA_INGRESO")
                Historial_Caja.objects.create(
                    caja_hc=caja,
                    empleado_hc=empleado,
                    tipo_event_caja=tipo_evento_ingreso_anulacion,
                    cantidad_movida_hcaja=instance.vuelto_entregado,
                    saldo_anterior_hcaja=saldo_anterior_vuelto,
                    nuevo_saldo_hcaja=caja.monto_teorico_caja,
                    descripcion_hcaja=f"Ingreso por anulacion de vuelto de venta ID: {instance.id_venta}"
                )
            
            # Revert points (if any were awarded)
            if instance.cliente_venta and instance.total_venta - instance.descuento_aplicado > 0:
                neto_pagado = instance.total_venta - instance.descuento_aplicado
                puntos_ganados = math.floor(neto_pagado / settings.PESOS_POR_PUNTO)
                if puntos_ganados > 0:
                    cliente = instance.cliente_venta
                    puntos_anteriores = cliente.puntos_actuales
                    cliente.puntos_actuales -= puntos_ganados
                    cliente.save()
                    Historial_Puntos.objects.create(
                        cliente=cliente, venta_origen=instance, puntos_movidos=puntos_ganados * -1,
                        puntos_anteriores=puntos_anteriores, puntos_nuevos=cliente.puntos_actuales,
                        tipo_movimiento='AJUSTE' # Or a specific 'ANULACION_PUNTOS' type if defined
                    )
            
            # Revert coupon status (if a coupon was applied)
            if instance.cupon_aplicado:
                estado_disponible = Estados.objects.get(id_estado=16) # 16: DISPONIBLE
                instance.cupon_aplicado.estado_cupon_cli = estado_disponible
                instance.cupon_aplicado.save()

        # Proceed with the update (e.g., changing the status to ANULADA)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def generate_ticket_pdf(self, request, pk=None):
        venta = self.get_object()
        template = get_template('Control_VENTAS/venta_ticket.html')
        context = {'venta': venta}
        html = template.render(context)
        
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
        
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=ticket_venta_{venta.id_venta}.pdf'
            return response
        return Response({'error': 'Error al generar el PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)