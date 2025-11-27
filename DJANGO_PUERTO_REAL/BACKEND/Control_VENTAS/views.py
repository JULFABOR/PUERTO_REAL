# Python standard library
from datetime import datetime, timedelta
from decimal import Decimal

# Django
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum, F
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
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from xhtml2pdf import pisa
from rest_framework import filters

# Local application
from Abrir_Cerrar_CAJA.models import Historial_Caja, Tipo_Evento
from Auditoria.services import crear_registro
from autenticacion.models import Empleados, Clientes
from Config_PR.models import Estados, Tipos_Movimientos
from Control_STOCK.models import Historial_Stock, Productos, Stocks
from Fidelizar_CLIENTES.models import Historial_Puntos
from .models import Ventas, Detalle_Ventas, Venta_MetodoPago, Metodos_Pago
from .serializers import VentaReadSerializer, VentaWriteSerializer, ProductSalesPerformanceSerializer

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
    queryset = Ventas.objects.all()
    serializer_class = VentaReadSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VentaWriteSerializer
        return VentaReadSerializer

    @action(detail=False, methods=['get'])
    def by_dates(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({"error": "Se requieren start_date y end_date."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        ventas = Ventas.objects.filter(fecha_venta__range=[start_date, end_date]).order_by('fecha_venta')
        serializer = self.get_serializer(ventas, many=True)
        return Response(serializer.data)


class ProductSalesPerformanceView(APIView):
    """
    API endpoint to retrieve product sales performance (quantity and revenue)
    within a specified date range, with optional limit.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        limit = request.query_params.get('limit', None)

        if not start_date_str or not end_date_str:
            return Response({"error": "Se requieren 'start_date' y 'end_date'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure end_date includes the entire day
        end_date = end_date + timedelta(days=1)

        sales_data = Detalle_Ventas.objects.filter(
            venta__fecha_venta__range=[start_date, end_date]
        ).values('producto').annotate(
            total_quantity_sold=Sum('cantidad'),
            total_revenue=Sum(F('cantidad') * F('precio_venta'))
        ).order_by('-total_quantity_sold')

        if limit:
            try:
                limit = int(limit)
                sales_data = sales_data[:limit]
            except ValueError:
                return Response({"error": "El 'limit' debe ser un número entero."}, status=status.HTTP_400_BAD_REQUEST)

        # Attach product name
        for item in sales_data:
            item['producto_nombre'] = Productos.objects.get(id=item['producto']).nombre_producto

        serializer = ProductSalesPerformanceSerializer(sales_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
