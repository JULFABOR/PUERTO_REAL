from rest_framework import serializers
from .models import Promociones_Descuento, Promos_Clientes, Historial_Puntos, Transacciones_Puntos
from autenticacion.models import Clientes
from django.db.models import Sum

# --- AÑADIDO: Importar User y transaction ---
from django.contrib.auth.models import User # O tu modelo de usuario personalizado
from django.db import transaction

class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer for the Cliente model.
    Handles READ (GET), CREATE (POST), and UPDATE (PATCH/PUT).
    """
    puntos = serializers.IntegerField(read_only=True)
    
    # --- Campos de LECTURA (read_only) ---
    user_first_name = serializers.CharField(source='user_cliente.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user_cliente.last_name', read_only=True)
    user_email = serializers.EmailField(source='user_cliente.email', read_only=True)

    # --- Campos de ESCRITURA (write_only) ---
    first_name = serializers.CharField(write_only=True, required=False) # Required False para PATCH
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = Clientes
        fields = (
            'id_cliente', 
            'dni_cliente', 
            'telefono_cliente', 
            'puntos',
            # Campos de Lectura
            'user_first_name',
            'user_last_name',
            'user_email',
            # Campos de Escritura
            'first_name',
            'last_name',
            'email',
            'password'
        )
        read_only_fields = ['id_cliente', 'puntos'] 

    # --- Validación (evita emails/DNI duplicados) ---
    def validate_email(self, value):
        # Al editar, permite que el email sea el mismo que el actual
        if self.instance and self.instance.user_cliente.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value

    def validate_dni_cliente(self, value):
        # Al editar, permite que el DNI sea el mismo que el actual
        if self.instance and self.instance.dni_cliente == value:
            return value
        if Clientes.objects.filter(dni_cliente=value).exists():
            raise serializers.ValidationError("Este DNI ya está registrado.")
        return value

    # --- Método CREATE (para el NewClientModal) ---
    @transaction.atomic
    def create(self, validated_data):
        user_data = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email'),
        }
        user_data['username'] = user_data['email'] 
        password = validated_data.pop('password')

        user = User.objects.create_user(**user_data, password=password)
        cliente = Clientes.objects.create(user_cliente=user, **validated_data)
        return cliente

    # --- AÑADIDO: Método UPDATE (para el EditClientModal) ---
    @transaction.atomic
    def update(self, instance, validated_data):
        # 1. Actualizar datos del Cliente (DNI, telefono)
        # 'instance' es el Cliente que se está editando
        instance.dni_cliente = validated_data.get('dni_cliente', instance.dni_cliente)
        instance.telefono_cliente = validated_data.get('telefono_cliente', instance.telefono_cliente)
        instance.save()

        # 2. Actualizar datos del User (first_name, last_name, email)
        user = instance.user_cliente
        user.first_name = validated_data.get('first_name', user.first_name)
        user.last_name = validated_data.get('last_name', user.last_name)
        user.email = validated_data.get('email', user.email)
        
        # Si se envía 'email', también actualizamos 'username'
        if 'email' in validated_data:
            user.username = validated_data.get('email')
        
        user.save()

        # (Omitimos la actualización de contraseña a propósito)

        return instance

class PromocionesDescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promociones_Descuento
        fields = '__all__'

class PromocionesClientesSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente_promo_cli.user_cliente.first_name', read_only=True)
    cupon_nombre = serializers.CharField(source='cupon_descuunto_promo_cli.nombre_promo_desc', read_only=True)
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