# Third-party
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics, viewsets
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, F, Count
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User


# Local application
from Config_PR.models import Estados
from autenticacion.models import Empleados
from .serializers import EmpleadoSerializer, EstadoSerializer
from Control_VENTAS.models import Ventas
from Control_STOCK.models import Stocks


class EstadoFilter(django_filters.FilterSet):
    nombre_estado = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model = Estados
        fields = ['nombre_estado']

class EstadoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows states to be viewed.
    """
    queryset = Estados.objects.all()
    serializer_class = EstadoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = EstadoFilter

@api_view(["GET"])

def api_saludo(request):
    return Response({"mensaje": "¡Hola desde la API de Django!"})

class EmpleadoList(generics.ListCreateAPIView):
    """
    API view to retrieve a list of employees or create a new employee.
    """
    queryset = Empleados.objects.filter(DELETE_Emple=False)
    serializer_class = EmpleadoSerializer


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Endpoint eficiente que devuelve las estadísticas clave para el dashboard del Jefe.
        Maneja de forma segura los casos donde la base de datos está vacía.
        """
        today = timezone.now().date()
        start_of_today = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        end_of_today = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

        start_of_week = timezone.now() - timedelta(days=7)

        # 1. Ventas de Hoy
        # Suma el total_venta solo si hay ventas, de lo contrario devuelve 0.
        today_sales = Ventas.objects.filter(fecha_venta__range=(start_of_today, end_of_today)).aggregate(total=Sum('total_venta'))['total'] or 0

        # 2. Items con Stock Bajo
        # Cuenta los productos donde la cantidad es menor o igual al umbral.
        low_stock_count = Stocks.objects.filter(
            cantidad_actual_stock__lte=F('producto_en_stock__low_stock_threshold')
        ).count()

        # 3. Nuevos Clientes (de la última semana)
        # Cuenta los usuarios creados en los últimos 7 días.
        new_customers_count = User.objects.filter(date_joined__gte=start_of_week).count()

        stats = {
            'today_sales': today_sales,
            'low_stock_items': low_stock_count,
            'new_customers_week': new_customers_count,
        }

        return JsonResponse(stats)
