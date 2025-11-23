from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from .models import ConfiguracionTienda, ConfiguracionPuntos
from .serializers import ConfiguracionTiendaSerializer, ConfiguracionPuntosSerializer

class ConfiguracionTiendaView(APIView):
    """
    Vista para obtener y actualizar la configuración de la tienda.
    Utiliza un patrón singleton para asegurar una única instancia de configuración.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        """
        Obtiene la configuración actual de la tienda.
        """
        config, created = ConfiguracionTienda.objects.get_or_create(pk=1)
        serializer = ConfiguracionTiendaSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        """
        Actualiza la configuración de la tienda.
        """
        config, created = ConfiguracionTienda.objects.get_or_create(pk=1)
        serializer = ConfiguracionTiendaSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConfiguracionPuntosView(APIView):
    """
    Vista para obtener y actualizar la configuración de puntos de fidelidad.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        config, created = ConfiguracionPuntos.objects.get_or_create(pk=1)
        serializer = ConfiguracionPuntosSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        config, created = ConfiguracionPuntos.objects.get_or_create(pk=1)
        serializer = ConfiguracionPuntosSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)