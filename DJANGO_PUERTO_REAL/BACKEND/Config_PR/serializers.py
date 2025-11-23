from rest_framework import serializers
from .models import ConfiguracionTienda, ConfiguracionPuntos

class ConfiguracionTiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionTienda
        fields = '__all__'

class ConfiguracionPuntosSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionPuntos
        fields = '__all__'
