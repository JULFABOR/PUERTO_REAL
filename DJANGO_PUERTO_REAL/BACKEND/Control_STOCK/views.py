from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q 
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from HOME.models import Productos, Stocks, Categorias_Productos, Historial_Stock, Tipos_Movimientos, Empleados
from .serializers import StockSerializer, StockUpdateSerializer, StockAdjustmentSerializer, ProductoSerializer, HistorialStockSerializer

class StockListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StockSerializer

    def get_queryset(self):
        queryset = Stocks.objects.all()

        # Filters
        category_id = self.request.query_params.get('category')
        low_stock = self.request.query_params.get('low_stock')
        expiring_days = self.request.query_params.get('expiring_days') # e.g., '7', '15', '30'
        expired = self.request.query_params.get('expired')
        search_query = self.request.query_params.get('search')

        if category_id:
            queryset = queryset.filter(producto_en_stock__categoria_producto__id_categoria=category_id)

        if low_stock == 'true':
            # Filter products that are low in stock
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
                queryset = queryset.filter(fecha_vencimiento__range=[timezone.now(), future_date])
            except ValueError:
                pass # Invalid expiring_days, ignore filter

        if expired == 'true':
            queryset = queryset.filter(fecha_vencimiento__lt=timezone.now())

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
                return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Productos.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            employee = Empleados.objects.get(id_empleado=employee_id)
        except Empleados.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Find the stock entry to decrement from (e.g., oldest batch first, or specific batch)
            # For simplicity, we'll decrement from any available stock, prioritizing non-expired
            available_stock_entries = Stocks.objects.filter(
                producto_en_stock=product,
                cantidad_actual_stock__gt=0
            ).order_by('fecha_vencimiento') # Prioritize older stock/batches

            total_available_quantity = available_stock_entries.aggregate(Sum('cantidad_actual_stock'))['cantidad_actual_stock__sum'] or 0

            if total_available_quantity < quantity_to_decrement:
                return Response({"detail": "Insufficient stock."}, status=status.HTTP_400_BAD_REQUEST)

            remaining_to_decrement = quantity_to_decrement
            for stock_entry in available_stock_entries:
                if remaining_to_decrement <= 0:
                    break

                if stock_entry.cantidad_actual_stock >= remaining_to_decrement:
                    stock_entry.cantidad_actual_stock -= remaining_to_decrement
                    stock_entry.save()
                    # Record movement
                    Historial_Stock.objects.create(
                        cantidad_hstock=str(quantity_to_decrement), # Store as string as per model
                        stock_hs=stock_entry,
                        empleado_hs=employee,
                        tipo_movimiento_hs=Tipos_Movimientos.objects.get(nombre_movimiento='MOV_STOCK_SALIDA'),
                        stock_anterior_hstock=stock_entry.cantidad_actual_stock + remaining_to_decrement, # Before this decrement
                        stock_nuevo_hstock=stock_entry.cantidad_actual_stock, # After this decrement
                        observaciones_hstock=reason
                    )
                    remaining_to_decrement = 0
                else:
                    remaining_to_decrement -= stock_entry.cantidad_actual_stock
                    # Record movement for the full quantity of this batch
                    Historial_Stock.objects.create(
                        cantidad_hstock=str(stock_entry.cantidad_actual_stock),
                        stock_hs=stock_entry,
                        empleado_hs=employee,
                        tipo_movimiento_hs=Tipos_Movimientos.objects.get(nombre_movimiento='SALIDA'),
                        stock_anterior_hstock=0, # This batch is fully consumed
                        stock_nuevo_hstock=0,
                        observaciones_hstock=reason
                    )
                    stock_entry.cantidad_actual_stock = 0
                    stock_entry.save()

            return Response({"detail": f"Stock decremented by {quantity_to_decrement} for {product.nombre_producto}."}, status=status.HTTP_200_OK)

class StockAdjustmentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data.get('product_id')
        barcode = serializer.validated_data.get('barcode')
        quantity_change = serializer.validated_data['quantity'] # Can be positive or negative
        movement_type_str = serializer.validated_data['movement_type'] # Should be 'ADJUSTMENT'
        reason = serializer.validated_data.get('reason', '')
        employee_id = serializer.validated_data['employee_id']

        try:
            if product_id:
                product = Productos.objects.get(id_producto=product_id)
            elif barcode:
                product = Productos.objects.get(barcode=barcode)
            else:
                return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Productos.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            employee = Empleados.objects.get(id_empleado=employee_id)
        except Empleados.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            tipo_movimiento = Tipos_Movimientos.objects.get(nombre_movimiento=movement_type_str)
        except Tipos_Movimientos.DoesNotExist:
            return Response({"detail": f"Movement type '{movement_type_str}' not found."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # For simplicity, we'll adjust the quantity of the first available stock entry.
            # In a real system, you might need to specify which batch to adjust.
            stock_entry = Stocks.objects.filter(producto_en_stock=product).first()

            if not stock_entry:
                # If no stock entry exists, create one for adjustment (e.g., for initial entry or positive adjustment)
                if quantity_change > 0:
                    stock_entry = Stocks.objects.create(
                        producto_en_stock=product,
                        cantidad_actual_stock=0, # Will be updated
                        lote_stock=0, # Placeholder, might need a proper batching strategy
                        fecha_vencimiento=timezone.now() + timedelta(days=365), # Placeholder
                        observaciones_stock="Initial stock from adjustment"
                    )
                else:
                    return Response({"detail": "No stock entry found to adjust."}, status=status.HTTP_400_BAD_REQUEST)

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

            return Response({"detail": f"Stock adjusted by {quantity_change} for {product.nombre_producto}. New quantity: {stock_entry.cantidad_actual_stock}"}, status=status.HTTP_200_OK)