from rest_framework import serializers
from HOME.models import Cajas, Historial_Caja, Fondo_Pagos, Movimiento_Fondo, Empleados, Estados, Tipo_Evento, Tipos_Movimientos
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')

class EmpleadoSerializer(serializers.ModelSerializer):
    user_empleado = UserSerializer(read_only=True)

    class Meta:
        model = Empleados
        fields = ('id_empleado', 'user_empleado', 'dni_empleado', 'telefono_empleado')

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estados
        fields = ('id_estado', 'nombre_estado')

class TipoEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipo_Evento
        fields = ('id_evento', 'nombre_evento')

class TiposMovimientosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipos_Movimientos
        fields = ('id_tipo_movimiento', 'nombre_movimiento', 'is_transfer')

class CajasSerializer(serializers.ModelSerializer):
    estado_caja = EstadoSerializer(read_only=True)

    class Meta:
        model = Cajas
        fields = ('id_caja', 'total_gastos_caja', 'monto_apertura_caja', 
                'monto_cierre_caja', 'monto_teorico_caja', 'diferencia_caja', 
                'observaciones_caja', 'estado_caja')

class HistorialCajaSerializer(serializers.ModelSerializer):
    caja_hc = CajasSerializer(read_only=True)
    empleado_hc = EmpleadoSerializer(read_only=True)
    tipo_event_caja = TipoEventoSerializer(read_only=True)
    cantidad_movida_hcaja = serializers.DecimalField(max_digits=20, decimal_places=2) # Assuming it should be Decimal
    
    class Meta:
        model = Historial_Caja
        fields = ('id_historial_caja', 'cantidad_movida_hcaja', 'caja_hc', 
                'empleado_hc', 'tipo_event_caja', 'fecha_movimiento_hcaja', 
                'saldo_anterior_hcaja', 'nuevo_saldo_hcaja', 'descripcion_hcaja', 
                'destino_movimiento')

class FondoPagosSerializer(serializers.ModelSerializer):
    estado_fp = EstadoSerializer(read_only=True)

    class Meta:
        model = Fondo_Pagos
        fields = ('id_fondo_fp', 'saldo_fp', 'estado_fp') # Removed nombre_fp

class MovimientoFondoSerializer(serializers.ModelSerializer):
    fondo_mov_fp = FondoPagosSerializer(read_only=True)
    empleado_mov_fp = EmpleadoSerializer(read_only=True)
    tipo_mov_fp = TiposMovimientosSerializer(read_only=True) # Nested serializer for ForeignKey

    class Meta:
        model = Movimiento_Fondo
        fields = ('id_mov_fp', 'fondo_mov_fp', 'fecha_mov_fp', 
                'tipo_mov_fp', 'monto_mov_fp', 'motivo_mov_fp', 'empleado_mov_fp')

class AperturaCajaInputSerializer(serializers.Serializer):
    monto_inicial = serializers.DecimalField(max_digits=10, decimal_places=2)
    desc_ajuste = serializers.CharField(max_length=255, required=False, allow_blank=True)

class RetiroInputSerializer(serializers.Serializer):
    monto_retiro = serializers.DecimalField(max_digits=10, decimal_places=2)
    motivo = serializers.CharField(max_length=255)
    destino = serializers.CharField(max_length=50)
    aprobador = serializers.CharField(max_length=255, required=False, allow_blank=True)

class RendirFondoInputSerializer(serializers.Serializer):
    monto_a_devolver = serializers.DecimalField(max_digits=10, decimal_places=2)

class CerrarCajaInputSerializer(serializers.Serializer):
    monto_cierre_real = serializers.DecimalField(max_digits=10, decimal_places=2)
    observaciones_cierre = serializers.CharField(max_length=255, required=False, allow_blank=True)

class MovimientoFondoInputSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2)
    motivo = serializers.CharField(max_length=200, required=False, allow_blank=True)
    tipo = serializers.ChoiceField(choices=[("ENTRADA", "Entrada"), ("SALIDA", "Salida")])
