# Python standard library
import math
from io import BytesIO

# Django
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
from io import BytesIO
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django_filters.rest_framework import DjangoFilterBackend


# Third-party
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa
from rest_framework import filters

# Local application
from Abrir_Cerrar_CAJA.models import Historial_Caja, Tipo_Evento
from Auditoria.services import crear_registro
from autenticacion.models import Empleados, Clientes
from Config_PR.models import Estados, Tipos_Movimientos
from Control_STOCK.models import Historial_Stock, Productos, Stocks
from Fidelizar_CLIENTES.models import Historial_Puntos
from .models import Ventas
from .serializers import VentaReadSerializer, VentaWriteSerializer

# --- Vistas de Template (sin cambios) ---
class VentaView(TemplateView):
    template_name = "Control_VENTAS/Venta.html"

@method_decorator(login_required, name='dispatch')
class VentasDashboardView(TemplateView):
    template_name = 'ventas_dashboard.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Punto de Venta (POS)"
        context['productos'] = Productos.objects.filter(DELETE_Prod=False)
        context['clientes'] = Clientes.objects.all()
        return context

# --- Vistas de API ---
class VentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las ventas.
    Usa VentaReadSerializer para operaciones de lectura (list, retrieve)
    y VentaWriteSerializer para operaciones de escritura (create).
    
    Permite filtrar por: /api/ventas/?cliente_venta=1&empleado_venta=2&estado_venta=3&fecha_venta_after=YYYY-MM-DD&fecha_venta_before=YYYY-MM-DD
    """
    queryset = Ventas.objects.select_related(
        'cliente_venta', 'empleado_venta', 'estado_venta'
    ).prefetch_related(
        'detalles__producto_det_vent'
    ).all().order_by('-fecha_venta')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'fecha_venta': ['gte', 'lte'],
        'cliente_venta': ['exact'],
        'empleado_venta': ['exact'],
        'estado_venta': ['exact']
    }
    ordering_fields = ['fecha_venta', 'total_venta']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VentaWriteSerializer
        return VentaReadSerializer

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
