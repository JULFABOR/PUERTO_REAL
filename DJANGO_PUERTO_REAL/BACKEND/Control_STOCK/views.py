from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, F
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from django.views.generic import TemplateView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

from HOME.models import Productos, Stocks, Categorias_Productos, Historial_Stock, Tipos_Movimientos, Empleados, Estados
from .serializers import StockSerializer, StockUpdateSerializer, StockAdjustmentSerializer, ProductoSerializer, HistorialStockSerializer
from .forms import ProductoForm
from Auditoria.services import crear_registro


# --- Vistas de Template ---
@method_decorator(login_required, name='dispatch')
class StockDashboardView(TemplateView):
    template_name = 'Control_STOCK/Control-Stock.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Gestión de Inventario"
        
        # Obtener todos los productos con su información de stock
        productos = Productos.objects.filter(DELETE_Prod=False).annotate(
            total_stock=Sum('stocks__cantidad_actual_stock')
        )
        
        context['productos'] = productos
        return context


# --- Vistas de la API (existentes y nuevas) ---

class ProductoViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver, crear, editar y eliminar productos.
    """
    queryset = Productos.objects.filter(DELETE_Prod=False).order_by('-id_producto')
    serializer_class = ProductoSerializer
    # Los permisos y la autenticación se manejan globalmente por la config en settings.py

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
            # Filtrar productos con bajo stock
            low_stock_products_ids = []
            for product in Productos.objects.all():
                total_stock = Stocks.objects.filter(producto_en_stock=product).aggregate(total=Sum('cantidad_actual_stock'))['total'] or 0
                if total_stock <= product.low_stock_threshold:
                    low_stock_products_ids.append(product.id_producto)
            queryset = queryset.filter(producto_en_stock__id_producto__in=low_stock_products_ids)

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
        employee_id = serializer.validated_data['employee_id']

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
            employee = Empleados.objects.get(id_empleado=employee_id)
        except Empleados.DoesNotExist:
            return Response({"detail": "Empleado no encontrado."},
                            status=status.HTTP_404_NOT_FOUND)

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
                        tipo_movimiento_hs=Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA'),
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
                        tipo_movimiento_hs=Tipos_Movimientos.objects.get(nombre_movimiento='SALIDA'),
                        stock_anterior_hstock=0, # Este lote está completamente consumido
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
        employee_id = serializer.validated_data['employee_id']

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
            employee = Empleados.objects.get(id_empleado=employee_id)
        except Empleados.DoesNotExist:
            return Response({"detail": "Empleado no encontrado."},
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
                cantidad_hstock=str(abs(quantity_change)),
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
