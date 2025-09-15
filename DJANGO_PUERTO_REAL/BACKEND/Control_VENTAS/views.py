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
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from HOME.models import (
    Ventas, Detalle_Ventas, Stocks, Historial_Stock,
    Cajas, Historial_Caja, Tipos_Movimientos, Tipo_Evento, Productos,
    Promos_Clientes, Estados, Historial_Puntos, Clientes, Empleados
)
from .serializers import VentaSerializer
from Auditoria.services import crear_registro

# --- Vista de Template para el Dashboard de Ventas ---
@method_decorator(login_required, name='dispatch')
class VentasDashboardView(TemplateView):
    template_name = 'Control_VENTAS/Venta.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Punto de Venta (POS)"
        context['productos'] = Productos.objects.filter(DELETE_Prod=False)
        context['clientes'] = Clientes.objects.all()
        return context


# --- Vistas de API ---
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Ventas.objects.all()
    serializer_class = VentaSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        empleado = None
        if hasattr(request.user, 'empleado'):
            empleado = request.user.empleado
        else:
            return Response({"error": "Solo los empleados pueden realizar esta acción."},
                            status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Comprobar solicitud de anulación
            nuevo_estado_id = request.data.get('estado_venta')
            
            try:
                estado_anulada = Estados.objects.get(nombre_estado='ANULADA')
            except Estados.DoesNotExist:
                return Response({"error": "Estado 'ANULADA' no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

            if nuevo_estado_id and int(nuevo_estado_id) == estado_anulada.id_estado and instance.estado_venta != estado_anulada:
                # Comprobar límite de 20 minutos para anulación
                time_diff = timezone.now() - instance.fecha_venta
                if time_diff.total_seconds() > 1200: # 20 minutos
                    return Response(
                        {"error": "La venta solo puede ser anulada dentro de los 20 minutos de su creacion."},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # --- REGISTRO DE AUDITORÍA ---
                crear_registro(
                    usuario=request.user,
                    accion='ANULACION_VENTA',
                    detalles={
                        'venta_id': instance.id_venta,
                        'cliente': instance.cliente_venta.id_cliente if instance.cliente_venta else None,
                        'total_original': str(instance.total_venta),
                        'realizada_por': instance.empleado_venta.user_empleado.username if instance.empleado_venta else None
                    }
                )
                # --- FIN REGISTRO ---
                
                # Revertir Stock
                try:
                    tipo_movimiento_entrada = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_ENTRADA')
                except Tipos_Movimientos.DoesNotExist:
                    return Response({"error": "Tipo de movimiento 'MOV_STOCK_ENTRADA' no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

                for detalle in instance.detalles.all():
                    stock, created = Stocks.objects.get_or_create(
                        producto_en_stock=detalle.producto_det_vent,
                        defaults={'cantidad_actual_stock': 0, 'lote_stock': 0}
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
                
                # Revertir Caja
                caja = instance.caja_venta
                
                # Revertir ingreso de la venta
                monto_ingreso_original = instance.total_venta - instance.descuento_aplicado
                saldo_anterior_caja = caja.monto_teorico_caja
                caja.monto_teorico_caja -= monto_ingreso_original
                caja.save()

                tipo_evento_egreso_anulacion, _ = Tipo_Evento.objects.get_or_create(nombre_evento="ANULACION_VENTA_EGRESO")
                Historial_Caja.objects.create(
                    caja_hc=caja,
                    empleado_hc=empleado,
                    tipo_event_caja=tipo_evento_egreso_anulacion,
                    cantidad_movida_hcaja=monto_ingreso_original * -1, # Negativo para egreso
                    saldo_anterior_hcaja=saldo_anterior_caja,
                    nuevo_saldo_hcaja=caja.monto_teorico_caja,
                    descripcion_hcaja=f"Egreso por anulacion de ingreso de venta ID: {instance.id_venta}"
                )

                # Revertir egreso por vuelto entregado (si lo hubo)
                if hasattr(instance, 'vuelto_entregado') and instance.vuelto_entregado > 0:
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
                
                # Revertir puntos (si se otorgaron)
                if instance.cliente_venta and hasattr(instance, 'descuento_aplicado') and instance.total_venta - instance.descuento_aplicado > 0:
                    neto_pagado = instance.total_venta - instance.descuento_aplicado
                    puntos_ganados = math.floor(neto_pagado / settings.PESOS_POR_PUNTO)
                    if puntos_ganados > 0:
                        cliente = instance.cliente_venta
                        puntos_anteriores = cliente.puntos_actuales
                        cliente.puntos_actuales -= puntos_ganados
                        Historial_Puntos.objects.create(
                            cliente=cliente, venta_origen=instance, puntos_movidos=puntos_ganados * -1,
                            puntos_anteriores=puntos_anteriores, puntos_nuevos=cliente.puntos_actuales,
                            tipo_movimiento='AJUSTE' # O un tipo específico 'ANULACION_PUNTOS' si está definido
                        )
                
                # Revertir estado del cupón (si se aplicó uno)
                if instance.promo_aplicada:
                    try:
                        estado_disponible = Estados.objects.get(nombre_estado='DISPONIBLE')
                    except Estados.DoesNotExist:
                        return Response({"error": "Estado 'DISPONIBLE' no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
                    instance.promo_aplicada.estado_promo_cli = estado_disponible
                    instance.promo_aplicada.save()

            # Proceder con la actualización (ej., cambiando el estado a ANULADA)
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