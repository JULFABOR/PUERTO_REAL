# Config_PR/serializers.py

from rest_framework import serializers
from .models import Estados, Tipos_Movimientos, Alertas # Asegúrate de importar los modelos

# --- Serializer para Estados ---
class EstadoSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Estados. Usado para mostrar detalles
    en otros modelos (Compras, Proveedores, etc.).
    """
    class Meta:
        model = Estados
        fields = ('id_estado', 'nombre_estado') # Campos a exponer en la API

# --- Serializer para Tipos de Movimientos ---
# (Usado en el historial de caja o movimientos de fondo, por ejemplo)
class TiposMovimientosSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Tipos_Movimientos.
    """
    class Meta:
        model = Tipos_Movimientos
        fields = ('id_tipo_movimiento', 'nombre_movimiento', 'is_transfer') # Ajusta los campos según tu modelo

# --- Serializer para Alertas ---
# (Usado si tienes una API para listar/gestionar alertas)
class AlertaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Alertas.
    """
    # Puedes añadir campos relacionados si es necesario, por ejemplo, el usuario que la creó
    # creado_por = serializers.StringRelatedField(read_only=True) # Ejemplo

    class Meta:
        model = Alertas
        # Incluye todos los campos o los que necesites
        fields = '__all__'
        # O especifica: fields = ('id_alerta', 'nombre_alerta', 'mensaje_alerta', 'fecha_creacion', 'resuelta')

# --- Puedes añadir más serializers para otros modelos de Config_PR si los necesitas ---