# Python standard library
from io import BytesIO

# Django
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template.loader import get_template
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.mixins import LoginRequiredMixin # Added for class-based views

# Third-party
from rest_framework import status, viewsets, generics # Added generics
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated # Added IsAuthenticated

# Local application
from Auditoria.services import crear_registro
# Assuming Estado model and serializer are in Config_PR
from Config_PR.models import Estados
from .serializers import EstadoSimpleSerializer as EstadoSerializer
from Control_STOCK.models import Historial_Stock, Stocks
from .models import Compras, Proveedores
from .serializers import CompraReadSerializer, CompraWriteSerializer, ProveedorSerializer
from .services import receive_purchase_stock, adjust_stock_on_purchase_edit


# --- Vistas de Template ---
# Used LoginRequiredMixin for class-based view protection
class ProveedorListView(LoginRequiredMixin, TemplateView):
    template_name = 'HOME/Proveedores.html' # Confirm template path if needed

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Gestión de Proveedores"
        # Consider adding filtering or pagination if the list grows large
        context['proveedores'] = Proveedores.objects.all()
        return context


# --- Vistas de API ---
class CompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar las Compras.
    Usa CompraReadSerializer para lectura y CompraWriteSerializer para escritura.
    Permite filtrar por: /api/compras/?proveedor_compra=1&estado_compra=2&fecha_compra_after=YYYY-MM-DD
    """
    queryset = Compras.objects.select_related(
        'proveedor_compra', 'estado_compra'
        ).prefetch_related(
        'detalles__producto_dt_comp'
        ).all().order_by('-fecha_compra')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'fecha_compra': ['gte', 'lte', 'exact'], # Added 'exact' for specific date
        'proveedor_compra': ['exact'],
        'estado_compra': ['exact']
    }
    ordering_fields = ['fecha_compra', 'total_compra']
    permission_classes = [IsAuthenticated] # Added default permission

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompraWriteSerializer
        return CompraReadSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    # --- Consider adding perform_create and perform_update for audit logs ---
    # def perform_create(self, serializer):
    #     instance = serializer.save()
    #     # crear_registro(self.request.user, 'CREATE', 'Compra', instance.id_compra)
    #
    # def perform_update(self, serializer):
    #     instance = serializer.save()
    #     # crear_registro(self.request.user, 'UPDATE', 'Compra', instance.id_compra)
    #
    # def perform_destroy(self, instance):
    #     instance_id = instance.id_compra
    #     instance.delete()
    #     # crear_registro(self.request.user, 'DELETE', 'Compra', instance_id)


    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        compra = self.get_object()
        template = get_template('Control_COMPRAS/compra_pdf.html') # Confirm template path
        context = {'compra': compra}
        html = template.render(context)

        result = BytesIO()
        # Ensure UTF-8 encoding for PDF generation
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, encoding='UTF-8')

        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            # Use f-string for filename
            response['Content-Disposition'] = f'attachment; filename="compra_{compra.id_compra}.pdf"'
            return response
        # Log the error for debugging
        print(f"Error generating PDF for Compra {pk}: {pdf.err}")
        return Response({'error': 'Error al generar el PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedores.objects.all().order_by('nombre_proveedor') # Added default ordering
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated] # Added default permission
    filter_backends = [filters.SearchFilter, filters.OrderingFilter] # Added SearchFilter
    search_fields = ['nombre_proveedor', 'razon_social_proveedor', 'cuit_proveedor', 'correo_proveedor'] # Fields for search
    ordering_fields = ['nombre_proveedor', 'razon_social_proveedor'] # Fields allowed for ordering

    # --- Consider adding audit logs here too ---
    # def perform_create(self, serializer): ...
    # def perform_update(self, serializer): ...
    # def perform_destroy(self, instance): ...

# --- VISTA AÑADIDA PARA ESTADOS ---
class EstadoProveedorListAPIView(generics.ListAPIView):
    """
    Vista API para listar los posibles estados de proveedor (ej: Activo, Inactivo).
    """
    # Assuming Estados model has relevant states named 'Activo' and 'Inactivo'
    queryset = Estados.objects.filter(nombre_estado__in=['ACTIVO', 'INACTIVO'])
    serializer_class = EstadoSerializer # Use the correct serializer for Estados
    permission_classes = [IsAuthenticated] # Adjust permissions as needed
    pagination_class = None # Return all relevant states in one list