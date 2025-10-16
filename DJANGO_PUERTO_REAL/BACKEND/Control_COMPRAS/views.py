from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from django.template.loader import get_template
from django.utils import timezone
from xhtml2pdf import pisa
from io import BytesIO

from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

from HOME.models import Compras, Proveedores, Stocks, Historial_Stock, Tipos_Movimientos, Estados
from .serializers import CompraReadSerializer, CompraWriteSerializer, ProveedorSerializer
from Auditoria.services import crear_registro

# --- Vistas de Template ---
@method_decorator(login_required, name='dispatch')
class ProveedorListView(TemplateView):
    template_name = 'HOME/Proveedores.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Gestión de Proveedores"
        context['proveedores'] = Proveedores.objects.all()
        return context


# --- Vistas de API ---
class CompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las Compras.
    Usa CompraReadSerializer para lectura y CompraWriteSerializer para escritura.
    Permite filtrar por: /api/compras/?proveedor_compra=1&estado_compra=2&fecha_compra_after=YYYY-MM-DD
    """
    queryset = Compras.objects.all().order_by('-fecha_compra')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'fecha_compra': ['gte', 'lte'],
        'proveedor_compra': ['exact'],
        'estado_compra': ['exact']
    }
    ordering_fields = ['fecha_compra', 'total_compra']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompraWriteSerializer
        return CompraReadSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        data_keys = list(request.data.keys())
        is_status_change_only = 'estado_compra' in data_keys and len(data_keys) == 1

        if not is_status_change_only:
            time_diff = timezone.now() - instance.fecha_compra
            if time_diff.total_seconds() > 1200:
                return Response(
                    {"error": "Solo se puede editar la compra dentro de los 20 minutos de su creacion."},
                    status=status.HTTP_403_FORBIDDEN
                )

        nuevo_estado_id = request.data.get('estado_compra')
        
        try:
            estado_recibida = Estados.objects.get(nombre_estado='RECIBIDA')
        except Estados.DoesNotExist:
            return Response({"error": "Estado 'RECIBIDA' no encontrado."}, status=status.HTTP_400_BAD_REQUEST)

        if nuevo_estado_id and int(nuevo_estado_id) == estado_recibida.id_estado and instance.estado_compra != estado_recibida:
            try:
                tipo_movimiento = Tipos_Movimientos.objects.get(nombre_movimiento='COMPRA A PROVEEDOR')
                
                empleado = None
                if hasattr(request.user, 'empleado'):
                    empleado = request.user.empleado
                else:
                    return Response({"error": "Solo los empleados pueden realizar esta acción."},
                                    status=status.HTTP_403_FORBIDDEN)

                for detalle in instance.detalles.all():
                    stock, created = Stocks.objects.get_or_create(
                        producto_en_stock=detalle.producto_dt_comp,
                        defaults={
                            'cantidad_actual_stock': 0, 
                            'lote_stock': 0, 
                            'observaciones_stock': 'Registro de stock inicial creado automaticamente'
                        }
                    )
                    
                    stock_anterior = stock.cantidad_actual_stock
                    stock.cantidad_actual_stock += detalle.cant_det_comp
                    stock.save()

                    Historial_Stock.objects.create(
                        stock_hs=stock, cantidad_hstock=detalle.cant_det_comp,
                        stock_anterior_hstock=stock_anterior, stock_nuevo_hstock=stock.cantidad_actual_stock,
                        tipo_movimiento_hs=tipo_movimiento, empleado_hs=empleado,
                        observaciones_hstock=f"Entrada por compra ID: {instance.id_compra}"
                    )
                
                crear_registro(
                    usuario=request.user,
                    accion='COMPRA_RECIBIDA',
                    detalles={
                        'compra_id': instance.id_compra,
                        'proveedor': instance.proveedor_compra.nombre_proveedor if instance.proveedor_compra else None,
                        'total_compra': str(instance.total_compra)
                    }
                )

            except Tipos_Movimientos.DoesNotExist:
                return Response({"error": "Tipo de movimiento 'COMPRA A PROVEEDOR' no encontrado."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": f"Error al actualizar el stock: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        compra = self.get_object()
        template = get_template('Control_COMPRAS/compra_pdf.html')
        context = {'compra': compra}
        html = template.render(context)
        
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
        
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=compra_{compra.id_compra}.pdf'
            return response
        return Response({'error': 'Error al generar el PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedores.objects.all()
    serializer_class = ProveedorSerializer
