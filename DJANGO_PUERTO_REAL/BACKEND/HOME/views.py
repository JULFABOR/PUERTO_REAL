from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics, viewsets
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from .models import Empleados, Estados
from .serializers import EmpleadoSerializer, EstadoSerializer

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
