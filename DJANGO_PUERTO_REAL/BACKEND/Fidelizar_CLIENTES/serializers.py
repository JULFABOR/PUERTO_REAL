from rest_framework import serializers
from HOME.models import ConfiguracionFidelizacion, Cupones_Descuento, Cupones_Clientes, Historial_Puntos, Clientes, Estados

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clientes
        fields = ('id_cliente', 'dni_cliente', 'telefono_cliente', 'puntos_actuales')

class ConfiguracionFidelizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionFidelizacion
        fields = '__all__'

class CuponesDescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cupones_Descuento
        fields = '__all__'

class CuponesClientesSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente_cupon_cli.user_cliente.first_name', read_only=True)
    cupon_nombre = serializers.CharField(source='cupon_descuento_cupon_cli.nombre_cupon_desc', read_only=True)
    estado_nombre = serializers.CharField(source='estado_cupon_cli.nombre_estado', read_only=True)

    class Meta:
        model = Cupones_Clientes
        fields = '__all__'

class HistorialPuntosSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.user_cliente.first_name', read_only=True)
    venta_id = serializers.IntegerField(source='venta_origen.id_venta', read_only=True)
    cupon_canjeado_nombre = serializers.CharField(source='cupon_canjeado.cupon_descuento_cupon_cli.nombre_cupon_desc', read_only=True)

    class Meta:
        model = Historial_Puntos
        fields = '__all__'

class AjustePuntosSerializer(serializers.Serializer):
    """
    Serializador para validar los datos de un ajuste manual de puntos.
    """
    cantidad = serializers.IntegerField()
    motivo = serializers.CharField(max_length=255, required=True, allow_blank=False)

    def validate_cantidad(self, value):
        """
        Asegura que la cantidad no sea cero.
        """
        if value == 0:
            raise serializers.ValidationError("La cantidad de puntos a ajustar no puede ser cero.")
        return value
