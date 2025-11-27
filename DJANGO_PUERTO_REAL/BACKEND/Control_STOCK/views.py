# Python standard library
from datetime import timedelta
import datetime

# Django
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q, Sum, F
from django.db.models.functions import Cast # Added
from django.db.models import IntegerField # Added
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
from pagination import StandardResultsSetPagination
from autenticacion.permissions import IsAuthenticatedOrReadOnly
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
    StockMovementSummarySerializer,
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
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination


class ProductoViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['categoria_producto']  # Permite filtrar por: /productos/?categoria_producto=2
    search_fields = ['nombre_producto', 'barcode'] # Permite buscar por: /productos/?search=coca
    pagination_class = StandardResultsSetPagination
    
    """
    API endpoint que permite ver, crear, editar y eliminar productos.
    """
    queryset = Productos.objects.filter(DELETE_Prod=False).annotate(total_stock=Sum('stocks__cantidad_actual_stock')).order_by('-id_producto')
    permission_classes = [IsAuthenticatedOrReadOnly]
    
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
        read_serializer = ProductoSerializer(instance)
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
            
            read_serializer = ProductoSerializer(producto)
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

class StockMovementSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({"detail": "Se requieren 'start_date' y 'end_date'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.datetime.fromisoformat(start_date_str).replace(tzinfo=datetime.timezone.utc)
            end_date = datetime.datetime.fromisoformat(end_date_str).replace(tzinfo=datetime.timezone.utc)
        except ValueError:
            return Response({"detail": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure end_date includes the entire day
        end_date = end_date + timedelta(days=1, microseconds=-1)

        # Get movement types
        try:
            tipo_movimiento_entrada = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_ENTRADA')
            tipo_movimiento_salida = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA')
        except Tipos_Movimientos.DoesNotExist:
            return Response({"detail": "Tipos de movimiento 'MOV_STOCK_ENTRADA' o 'MOV_STOCK_SALIDA' no encontrados."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Filter historial stock for the date range
        movements = Historial_Stock.objects.filter(
            fecha_movimiento_hstock__range=[start_date, end_date]
        )

        # Calculate total entries
        total_entries = movements.filter(
            tipo_movimiento_hs=tipo_movimiento_entrada
        ).aggregate(
            total=Sum(Cast('cantidad_hstock', IntegerField())) # Cast to IntegerField before summing
        )['total'] or 0

        # Calculate total exits
        total_exits = movements.filter(
            tipo_movimiento_hs=tipo_movimiento_salida
        ).aggregate(
            total=Sum(Cast('cantidad_hstock', IntegerField())) # Cast to IntegerField before summing
        )['total'] or 0

        data = {
            'total_entries': total_entries,
            'total_exits': total_exits,
        }
        serializer = StockMovementSummarySerializer(data)
        return Response(serializer.data)

class StockHistoryAPIView(generics.ListAPIView):
    """
    API View para devolver el historial de stock de un producto específico,
    permitiendo filtrar por rango de fechas para análisis de tendencias.
    Se accede a través de la URL: /api/stock/historial-producto/<id_producto>/?start_date=<date>&end_date=<date>
    """
    
    serializer_class = HistorialStockSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Devuelve todos los resultados para gráficos

    def get_queryset(self):
        product_id = self.kwargs.get('id_producto')
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')

        if not product_id:
            return Historial_Stock.objects.none()

        queryset = Historial_Stock.objects.filter(
            stock_hs__producto_en_stock__id_producto=product_id
        )

        if start_date_str and end_date_str:
            try:
                start_date = timezone.datetime.fromisoformat(start_date_str).replace(tzinfo=timezone.utc)
                end_date = timezone.datetime.fromisoformat(end_date_str).replace(tzinfo=timezone.utc)
                end_date = end_date + timedelta(days=1, microseconds=-1) # Include the entire end day
                queryset = queryset.filter(fecha_movimiento_hstock__range=[start_date, end_date])
            except ValueError:
                # Invalid date format, ignore filter
                pass
        
        # Order by date to show history chronologically for charts
        return queryset.select_related(
            'stock_hs__producto_en_stock', 
            'empleado_hs', 
            'tipo_movimiento_hs'
        ).order_by('fecha_movimiento_hstock')

class TopProductsByStockView(generics.ListAPIView):
    """
    API View para listar productos por cantidad de stock (más altos o más bajos).
    Se accede a través de la URL: /api/stock/top-products-by-stock/?limit=<int>&order_by=<'highest'|'lowest'>
    """
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        limit = self.request.query_params.get('limit')
        order_by = self.request.query_params.get('order_by', 'highest') # Default to highest

        queryset = Productos.objects.filter(DELETE_Prod=False).annotate(
            total_stock=Sum('stocks__cantidad_actual_stock')
        )

        if order_by == 'lowest':
            queryset = queryset.order_by('total_stock')
        else: # 'highest' or any other value
            queryset = queryset.order_by('-total_stock')
        
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass # Invalid limit, ignore

        return queryset

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
    StockMovementSummarySerializer, # Added this import
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
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination


class ProductoViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['categoria_producto']  # Permite filtrar por: /productos/?categoria_producto=2
    search_fields = ['nombre_producto', 'barcode'] # Permite buscar por: /productos/?search=coca
    pagination_class = StandardResultsSetPagination
    
    """
    API endpoint que permite ver, crear, editar y eliminar productos.
    """
    queryset = Productos.objects.filter(DELETE_Prod=False).annotate(total_stock=Sum('stocks__cantidad_actual_stock')).order_by('-id_producto')
    permission_classes = [IsAuthenticatedOrReadOnly]
    
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
        read_serializer = ProductoSerializer(instance)
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
            
            read_serializer = ProductoSerializer(producto)
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

class StockMovementSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response({"detail": "Se requieren 'start_date' y 'end_date'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.datetime.fromisoformat(start_date_str).replace(tzinfo=datetime.timezone.utc)
            end_date = datetime.datetime.fromisoformat(end_date_str).replace(tzinfo=datetime.timezone.utc)
        except ValueError:
            return Response({"detail": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure end_date includes the entire day
        end_date = end_date + timedelta(days=1, microseconds=-1)

        # Get movement types
        try:
            tipo_movimiento_entrada = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_ENTRADA')
            tipo_movimiento_salida = Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA')
        except Tipos_Movimientos.DoesNotExist:
            return Response({"detail": "Tipos de movimiento 'MOV_STOCK_ENTRADA' o 'MOV_STOCK_SALIDA' no encontrados."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Filter historial stock for the date range
        movements = Historial_Stock.objects.filter(
            fecha_movimiento_hstock__range=[start_date, end_date]
        )

        # Calculate total entries
        total_entries = movements.filter(
            tipo_movimiento_hs=tipo_movimiento_entrada
        ).aggregate(Sum('cantidad_hstock'))['cantidad_hstock__sum'] or 0 # Ensure sum of string field is converted to int during aggregation

        # Calculate total exits
        total_exits = movements.filter(
            tipo_movimiento_hs=tipo_movimiento_salida
        ).aggregate(Sum('cantidad_hstock'))['cantidad_hstock__sum'] or 0 # Ensure sum of string field is converted to int during aggregation

        data = {
            'total_entries': total_entries,
            'total_exits': total_exits,
        }
        serializer = StockMovementSummarySerializer(data)
        return Response(serializer.data)
