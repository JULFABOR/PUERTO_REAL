from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from .models import Empleados
from .serializers import EmpleadoSerializer

@api_view(["GET"])

def api_saludo(request):
    return Response({"mensaje": "¡Hola desde la API de Django!"})

class EmpleadoList(generics.ListCreateAPIView):
    """
    API view to retrieve a list of employees or create a new employee.
    """
    queryset = Empleados.objects.filter(DELETE_Emple=False)
    serializer_class = EmpleadoSerializer
