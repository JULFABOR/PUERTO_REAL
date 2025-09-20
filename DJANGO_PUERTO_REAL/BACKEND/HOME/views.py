from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])

def api_saludo(request):
    return Response({"mensaje": "¡Hola desde la API de Django!"})
