from rest_framework import serializers
from HOME.models import Promociones_Descuento, Promos_Clientes, Historial_Puntos, Clientes, Estados, Transacciones_Puntos
from django.db.models import Sum

class ClienteSerializer(serializers.ModelSerializer):
    puntos = serializers.SerializerMethodField()

    class Meta:
        model = Clientes
        fields = ('id_cliente', 'dni_cliente', 'telefono_cliente', 'puntos')

    def get_puntos(self, obj):
        return Transacciones_Puntos.objects.filter(cliente_trans_puntos=obj).aggregate(Sum('puntos_transaccion'))['puntos_transaccion__sum'] or 0

class PromocionesDescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promociones_Descuento
        fields = '__all__'

class PromocionesClientesSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente_promo_cli.user_cliente.first_name', read_only=True)
    cupon_nombre = serializers.CharField(source='cupon_descuento_promo_cli.nombre_promo_desc', read_only=True)
    estado_nombre = serializers.CharField(source='estado_promo_cli.nombre_estado', read_only=True)

    class Meta:
        model = Promos_Clientes
        fields = '__all__'

class HistorialPuntosSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='trans_hist_puntos.cliente_trans_puntos.user_cliente.first_name', read_only=True)
    venta_id = serializers.IntegerField(source='trans_hist_puntos.venta_origen.id_venta', read_only=True, allow_null=True)
    cupon_canjeado_nombre = serializers.CharField(source='promo_usada_hist_puntos.cupon_descuento_promo_cli.nombre_promo_desc', read_only=True, allow_null=True)

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