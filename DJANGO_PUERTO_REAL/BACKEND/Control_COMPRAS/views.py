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
    queryset = Compras.objects.select_related('proveedor_compra', 'estado_compra').prefetch_related('detalles__producto_dt_comp').all().order_by('-fecha_compra')
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