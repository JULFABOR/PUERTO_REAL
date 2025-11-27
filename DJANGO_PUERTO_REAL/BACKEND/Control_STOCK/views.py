# Python standard library
from datetime import timedelta

# Django
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q, Sum, F
from django.urls import reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import CreateView, DeleteView, TemplateView, UpdateView

# Third-party
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Local application
from Auditoria.services import crear_registro
from autenticacion.models import Empleados
from Config_PR.models import Estados, Tipos_Movimientos
from .forms import ProductoForm
from .models import Categorias_Productos, Historial_Stock, Productos, Stocks
from .serializers import (
    CategoriaProductoSerializer,
    EstadoProductoSerializer,
    HistorialStockSerializer,
    ProductoSerializer,
    ProductoWriteSerializer,
    StockAdjustmentSerializer,
    StockSerializer,
    StockUpdateSerializer,
    HistorialStockSerializer,
)


class EstadoProductoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los estados de los productos.
    """
    queryset = Estados.objects.all()
    serializer_class = EstadoProductoSerializer

class CategoriaProductoViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver las categorías de productos.
    """
    queryset = Categorias_Productos.objects.all()
    serializer_class = CategoriaProductoSerializer
    permission_classes = [IsAuthenticated]


class ProductoViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['categoria_producto']  # Permite filtrar por: /productos/?categoria_producto=2
    search_fields = ['nombre_producto', 'barcode'] # Permite buscar por: /productos/?search=coca
    
    """
    API endpoint que permite ver, crear, editar y eliminar productos.
    """
    queryset = Productos.objects.filter(DELETE_Prod=False).annotate(total_stock=Sum('stocks__cantidad_actual_stock')).order_by('-id_producto')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductoWriteSerializer
        return ProductoSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        stock_actual = serializer.validated_data.pop('stock_actual', None)
        serializer.validated_data.pop('stock_adquirido', None)

        try:
            with transaction.atomic():
                self.perform_update(serializer)

                if stock_actual is not None:
                    stock_instance, created = Stocks.objects.get_or_create(
                        producto_en_stock=instance,
                        defaults={'cantidad_actual_stock': stock_actual, 'lote_stock': 0}
                    )
                    if not created:
                        stock_instance.cantidad_actual_stock = stock_actual
                        stock_instance.save()

        except Exception as e:
            return Response({"detail": f"Error al actualizar: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        instance = self.get_queryset().get(pk=instance.pk)
        read_serializer = ProductoSerializer(instance, context=self.get_serializer_context())
        return Response(read_serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        stock_adquirido = serializer.validated_data.pop('stock_adquirido', 0)
        stock_actual = serializer.validated_data.pop('stock_actual', 0)

        try:
            with transaction.atomic():
                producto = serializer.save()

                Stocks.objects.create(
                    producto_en_stock=producto,
                    cantidad_actual_stock=stock_actual,
                    lote_stock=0,  # Asumiendo un lote inicial o único
                    observaciones_stock=f"Stock inicial de {stock_adquirido} unidades."
                )
            
            read_serializer = ProductoSerializer(producto, context=self.get_serializer_context())
            headers = self.get_success_headers(read_serializer.data)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            # Es mejor usar logging en un proyecto real, pero print sirve para depurar.
            return Response({"detail": f"Error al crear el producto: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StockListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockSerializer

    def get_queryset(self):
        queryset = Stocks.objects.all()

        # Filtros
        category_id = self.request.query_params.get('category')
        low_stock = self.request.query_params.get('low_stock')
        expiring_days = self.request.query_params.get('expiring_days') # ej., '7', '15', '30'
        expired = self.request.query_params.get('expired')
        search_query = self.request.query_params.get('search')

        if category_id:
            queryset = queryset.filter(producto_en_stock__categoria_producto__id_categoria=category_id)

        if low_stock == 'true':
            # Filtra eficientemente los productos cuyo stock total es menor o igual a su umbral de bajo stock.
            queryset = queryset.annotate(
                total_stock=Sum('producto_en_stock__stocks__cantidad_actual_stock')
            ).filter(
                total_stock__lte=F('producto_en_stock__low_stock_threshold')
            )

        if expiring_days:
            try:
                days = int(expiring_days)
                future_date = timezone.now() + timedelta(days=days)
                queryset = queryset.filter(producto_en_stock__fecha_vencimiento_producto__range=[timezone.now(), future_date])
            except ValueError:
                pass # dias_expiracion inválido, ignorar filtro

        if expired == 'true':
            queryset = queryset.filter(producto_en_stock__fecha_vencimiento_producto__lt=timezone.now())

        if search_query:
            queryset = queryset.filter(
                Q(producto_en_stock__nombre_producto__icontains=search_query) |
                Q(producto_en_stock__descripcion_producto__icontains=search_query) |
                Q(producto_en_stock__barcode__icontains=search_query)
            )
        return queryset

class StockDecrementAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = StockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data.get('product_id')
        barcode = serializer.validated_data.get('barcode')
        quantity_to_decrement = serializer.validated_data['quantity']
        reason = serializer.validated_data.get('reason', '')
        employee = serializer.validated_data['employee'] # Directly get the Empleados object

        try:
            if product_id:
                product = Productos.objects.get(id_producto=product_id)
            elif barcode:
                product = Productos.objects.get(barcode=barcode)
            else:
                return Response({"detail": "Producto no encontrado."},
                                status=status.HTTP_404_NOT_FOUND)
        except Productos.DoesNotExist:
            return Response({"detail": "Producto no encontrado."},
                            status=status.HTTP_404_NOT_FOUND)

        try:
            tipo_movimiento_salida = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA')
        except Tipos_Movimientos.DoesNotExist:
            return Response({"detail": "Tipo de movimiento 'MOV_STOCK_SALIDA' no encontrado."},
                            status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Encontrar la entrada de stock de la cual decrementar (ej., lote más antiguo primero, o lote específico)
            # Para simplificar, decrementaremos de cualquier stock disponible, priorizando los no vencidos
            available_stock_entries = Stocks.objects.filter(
                producto_en_stock=product,
                cantidad_actual_stock__gt=0
            ).order_by('producto_en_stock__fecha_vencimiento_producto') # Priorizar lotes/stock más antiguos

            total_available_quantity = available_stock_entries.aggregate(Sum('cantidad_actual_stock'))['cantidad_actual_stock__sum'] or 0

            if total_available_quantity < quantity_to_decrement:
                return Response({"detail": "Stock insuficiente."},
                                status=status.HTTP_400_BAD_REQUEST)

            remaining_to_decrement = quantity_to_decrement
            for stock_entry in available_stock_entries:
                if remaining_to_decrement <= 0:
                    break

                if stock_entry.cantidad_actual_stock >= remaining_to_decrement:
                    stock_entry.cantidad_actual_stock -= remaining_to_decrement
                    stock_entry.save()
                    # Registrar movimiento
                    Historial_Stock.objects.create(
                        cantidad_hstock=str(quantity_to_decrement), # Guardar como cadena de texto según el modelo
                        stock_hs=stock_entry,
                        empleado_hs=employee,
                        tipo_movimiento_hs=tipo_movimiento_salida,
                        stock_anterior_hstock=stock_entry.cantidad_actual_stock + remaining_to_decrement, # Antes de este decremento
                        stock_nuevo_hstock=stock_entry.cantidad_actual_stock, # Después de este decremento
                        observaciones_hstock=reason
                    )
                    remaining_to_decrement = 0
                else:
                    remaining_to_decrement -= stock_entry.cantidad_actual_stock
                    # Registrar movimiento para la cantidad completa de este lote
                    Historial_Stock.objects.create(
                        cantidad_hstock=str(stock_entry.cantidad_actual_stock),
                        stock_hs=stock_entry,
                        empleado_hs=employee,
                        tipo_movimiento_hs=tipo_movimiento_salida,
                        stock_anterior_hstock=stock_entry.cantidad_actual_stock, # Antes de este decremento
                        stock_nuevo_hstock=0,
                        observaciones_hstock=reason
                    )
                    stock_entry.cantidad_actual_stock = 0
                    stock_entry.save()

            return Response({"detail": f"Stock decrementado por {quantity_to_decrement} para {product.nombre_producto}."}, status=status.HTTP_200_OK)

class StockAdjustmentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data.get('product_id')
        barcode = serializer.validated_data.get('barcode')
        quantity_change = serializer.validated_data['quantity'] # Puede ser positivo o negativo
        movement_type_str = serializer.validated_data['movement_type'] # Debería ser 'ADJUSTMENT'
        reason = serializer.validated_data.get('reason', '')
        employee = serializer.validated_data['employee']

        try:
            if product_id:
                product = Productos.objects.get(id_producto=product_id)
            elif barcode:
                product = Productos.objects.get(barcode=barcode)
            else:
                return Response({"detail": "Producto no encontrado."},
                                status=status.HTTP_404_NOT_FOUND)
        except Productos.DoesNotExist:
            return Response({"detail": "Producto no encontrado."},
                            status=status.HTTP_404_NOT_FOUND)

        try:
            tipo_movimiento = Tipos_Movimientos.objects.get(nombre_movimiento=movement_type_str)
        except Tipos_Movimientos.DoesNotExist:
            return Response({"detail": f"Tipo de movimiento '{movement_type_str}' no encontrado."},
                            status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Para simplificar, ajustaremos la cantidad de la primera entrada de stock disponible.
            # En un sistema real, podrías necesitar especificar qué lote ajustar.
            stock_entry = Stocks.objects.filter(producto_en_stock=product).first()

            if not stock_entry:
                # Si no existe una entrada de stock, crear una para el ajuste (ej., para entrada inicial o ajuste positivo)
                if quantity_change > 0:
                    stock_entry = Stocks.objects.create(
                        producto_en_stock=product,
                        cantidad_actual_stock=0, # Será actualizado
                        lote_stock=0, # Placeholder, podría necesitar una estrategia de lotes adecuada
                        observaciones_stock="Stock inicial por ajuste"
                    )
                else:
                    return Response({"detail": "No se encontró una entrada de stock para ajustar."},
                                    status=status.HTTP_400_BAD_REQUEST)

            old_stock_quantity = stock_entry.cantidad_actual_stock
            stock_entry.cantidad_actual_stock += quantity_change
            stock_entry.save()

            Historial_Stock.objects.create(
                cantidad_hstock=str(quantity_change),
                stock_hs=stock_entry,
                empleado_hs=employee,
                tipo_movimiento_hs=tipo_movimiento,
                stock_anterior_hstock=old_stock_quantity,
                stock_nuevo_hstock=stock_entry.cantidad_actual_stock,
                observaciones_hstock=reason
            )

            # --- REGISTRO DE AUDITORÍA ---
            crear_registro(
                usuario=request.user,
                accion='AJUSTE_STOCK_MANUAL',
                detalles={
                    'producto_id': product.id_producto,
                    'producto_nombre': product.nombre_producto,
                    'cantidad_ajustada': quantity_change,
                    'stock_anterior': old_stock_quantity,
                    'stock_nuevo': stock_entry.cantidad_actual_stock,
                    'motivo': reason
                }
            )
            # --- FIN REGISTRO ---

            return Response({"detail": f"Stock ajustado por {quantity_change} para {product.nombre_producto}. Nueva cantidad: {stock_entry.cantidad_actual_stock}"}, status=status.HTTP_200_OK)
        
class StockAddAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # --- 1. LEEMOS TODOS LOS DATOS DEL REQUEST ---
        product_id = request.data.get('product_id')
        quantity_to_add = request.data.get('quantity')
        reason = request.data.get('reason', 'Entrada de stock manual')
        employee_id = request.data.get('employee') 
        
        # --- 2. VALIDAMOS LOS DATOS ---
        if not product_id or quantity_to_add is None:
            return Response({"detail": "Se requiere ID del producto y cantidad."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not employee_id:
            print(f"ID de empleado RECIBIDO POR LA API: {employee_id}")
            # Este error saltará si el modal no envía el ID
            return Response({"detail": "Se requiere ID de empleado."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity_to_add = int(quantity_to_add)
            if quantity_to_add <= 0:
                return Response({"detail": "La cantidad debe ser un número positivo."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "La cantidad debe ser un número."}, status=status.HTTP_400_BAD_REQUEST)

        # --- 3. BUSCAMOS LOS OBJETOS EN LA BD ---
        try:
            producto = Productos.objects.get(id_producto=product_id)
        except Productos.DoesNotExist:
            return Response({"detail": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            empleado = Empleados.objects.get(id_empleado=employee_id) 
        except Empleados.DoesNotExist:
            return Response({"detail": "Empleado no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Captura otros errores, como si el PK fuera incorrecto
            return Response({"detail": f"Error al buscar empleado: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        # --- 4. GUARDAMOS EN LA BD (CON EL EMPLEADO CORRECTO) ---
        with transaction.atomic():
            stock_entry, created = Stocks.objects.get_or_create(
                producto_en_stock=producto,
                defaults={'cantidad_actual_stock': 0, 'lote_stock': 'LOTE-INICIAL'}
            )
            
            stock_anterior = stock_entry.cantidad_actual_stock
            stock_entry.cantidad_actual_stock += quantity_to_add
            stock_entry.save()

            try:
                tipo_movimiento_entrada = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_ENTRADA')
            except Tipos_Movimientos.DoesNotExist:
                # Este es el error que probablemente tenías antes y que causaba "Sistema"
                print("--- ERROR CRÍTICO: No se encontró el Tipo de Movimiento 'MOV_STOCK_ENTRADA' ---")
                # No detenemos la transacción, pero el historial no se creará
                tipo_movimiento_entrada = None

            if tipo_movimiento_entrada:
                Historial_Stock.objects.create(
                    cantidad_hstock=str(quantity_to_add),
                    stock_hs=stock_entry,
                    empleado_hs=empleado, 
                    tipo_movimiento_hs=tipo_movimiento_entrada,
                    stock_anterior_hstock=stock_anterior,
                    stock_nuevo_hstock=stock_entry.cantidad_actual_stock,
                    observaciones_hstock=reason
                )

        return Response({"detail": f"Se agregaron {quantity_to_add} unidades al stock de {producto.nombre_producto}."}, status=status.HTTP_200_OK)

class StockHistoryAPIView(generics.ListAPIView):
    """
    API View para devolver el historial de stock de un producto específico.
    Se accede a través de la URL: /api/stock/historial-producto/<id_producto>/
    """
    
    # --- Usa tu serializer existente ---
    serializer_class = HistorialStockSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Devuelve todos los resultados

    def get_queryset(self):
        """
        Filtra el historial basado en el ID del producto de la URL.
        """
        product_id = self.kwargs.get('id_producto')
        if not product_id:
            return Historial_Stock.objects.none()

        # Filtra Historial_Stock por el ID del producto anidado
        # (Historial_Stock -> stock_hs -> producto_en_stock -> id_producto)
        return Historial_Stock.objects.filter(
            stock_hs__producto_en_stock__id_producto=product_id
        ).select_related(
            'empleado_hs', 
            'tipo_movimiento_hs'
        ).order_by('-fecha_movimiento_hstock')