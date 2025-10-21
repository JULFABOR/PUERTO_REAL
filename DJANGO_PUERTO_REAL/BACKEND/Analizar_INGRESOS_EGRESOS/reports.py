import pandas as pd
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
from Control_VENTAS.models import Ventas, Detalle_Ventas
from Abrir_Cerrar_CAJA.models import Historial_Caja, Movimiento_Fondo, Tipo_Evento, Historial_Movimientos_Financieros

from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
from datetime import datetime, timedelta

# Constants for event types
EVENTO_RETIRO = 'Retiro'
DESTINO_PARA_PAGOS_FONDO = 'PARA_PAGOS_FONDO'
TIPO_MOVIMIENTO_SALIDA = 'SALIDA'

def generate_expense_breakdown_report(start_date, end_date):
    """
    Genera un informe de desglose de gastos, mostrando la proporción de cada tipo de gasto.
    """
    # Obtener Datos de Movimientos Financieros para compras
    total_gastos_compras = Historial_Movimientos_Financieros.objects.filter(
        fecha_mov_fin__range=(start_date, end_date),
        compra_mov_fin__isnull=False
    ).aggregate(total=Sum('monto_mov_fin'))['total'] or 0

    # Obtener Datos de Historial_Caja (Gastos Operacionales)
    cash_movements_qs = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date)
    ).values('fecha_movimiento_hcaja', 'cantidad_movida_hcaja', 'tipo_event_caja__nombre_evento', 'destino_movimiento')

    cash_movements_df = pd.DataFrame(list(cash_movements_qs))

    gastos_operacionales_caja = 0
    if not cash_movements_df.empty:
        cash_movements_df['cantidad_movida_hcaja'] = pd.to_numeric(cash_movements_df['cantidad_movida_hcaja'], errors='coerce').fillna(0)
        gastos_operacionales_caja = cash_movements_df[
            (cash_movements_df['tipo_event_caja__nombre_evento'] == EVENTO_RETIRO) &
            (cash_movements_df['destino_movimiento'] != DESTINO_PARA_PAGOS_FONDO)
        ]['cantidad_movida_hcaja'].sum()

    # Obtener Datos de Movimiento_Fondo (Otros Gastos/Transferencias)
    otros_gastos_fondo = Movimiento_Fondo.objects.filter(
        fecha_mov_fp__range=(start_date, end_date),
        tipo_mov_fp__nombre_movimiento=TIPO_MOVIMIENTO_SALIDA
    ).aggregate(total=Sum('monto_mov_fp'))['total'] or 0

    # Crear un DataFrame para el desglose de gastos
    gastos_data = {
        'categoria': ['Gastos de Compras', 'Gastos Operacionales de Caja', 'Otros Gastos de Fondo'],
        'monto': [total_gastos_compras, gastos_operacionales_caja, otros_gastos_fondo]
    }
    df_gastos = pd.DataFrame(gastos_data)

    # Filtrar categorías con monto cero
    df_gastos = df_gastos[df_gastos['monto'] > 0]

    return {
        "gastos_desglose_data": df_gastos.to_dict(orient='records'),
        "status": "Informe de desglose de gastos generado exitosamente."
    }

def generate_financial_report(start_date, end_date):
    """
    Genera un informe financiero que incluye ingresos, gastos y el neto.
    """
    # 1. Obtener Datos de Movimientos Financieros
    financial_movements_qs = Historial_Movimientos_Financieros.objects.filter(
        fecha_mov_fin__range=(start_date, end_date)
    )

    # 2. Calcular Ingresos Totales
    total_income = financial_movements_qs.filter(venta_mov_fin__isnull=False).aggregate(
        total=Sum('monto_mov_fin')
    )['total'] or 0

    # 3. Calcular Gastos Totales de Compras
    total_purchase_expenses = financial_movements_qs.filter(compra_mov_fin__isnull=False).aggregate(
        total=Sum('monto_mov_fin')
    )['total'] or 0

    # 4. Obtener Datos de Historial_Caja (Gastos Operacionales y Transferencias)
    cash_movements_qs = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date)
    ).values('fecha_movimiento_hcaja', 'cantidad_movida_hcaja', 'tipo_event_caja__nombre_evento', 'destino_movimiento')

    cash_movements_df = pd.DataFrame(list(cash_movements_qs))

    operational_expenses_caja = 0
    if not cash_movements_df.empty:
        cash_movements_df['cantidad_movida_hcaja'] = pd.to_numeric(cash_movements_df['cantidad_movida_hcaja'], errors='coerce').fillna(0)
        operational_expenses_caja = cash_movements_df[
            (cash_movements_df['tipo_event_caja__nombre_evento'] == EVENTO_RETIRO) &
            (cash_movements_df['destino_movimiento'] != DESTINO_PARA_PAGOS_FONDO)
        ]['cantidad_movida_hcaja'].sum()

    # 5. Calcular gastos totales
    total_expenses = total_purchase_expenses + operational_expenses_caja

    # 6. Calcular Neto
    net_income = total_income - total_expenses

    # 7. Análisis de Productos Principales
    detailed_sales_qs = Detalle_Ventas.objects.filter(
        venta_det_vent__fecha_venta__range=(start_date, end_date)
    ).values(
        'producto_det_vent__nombre_producto',
        'producto_det_vent__precio_unitario_compra_producto',
        'producto_det_vent__precio_unitario_venta_producto',
    ).annotate(
        total_quantity_sold=Sum('cantidad_det_vent'),
        total_revenue=Sum('subtotal_det_vent'),
        cogs=Sum(ExpressionWrapper(
            F('cantidad_det_vent') * F('producto_det_vent__precio_unitario_compra_producto'),
            output_field=DecimalField()
        )),
    ).order_by('-total_revenue')

    top_products_df = pd.DataFrame(list(detailed_sales_qs))
    if not top_products_df.empty:
        top_products_df['margin'] = top_products_df['total_revenue'] - top_products_df['cogs']
        top_products_df = top_products_df.sort_values(by='total_revenue', ascending=False).head(10)
        top_products_data = top_products_df.to_dict(orient='records')
    else:
        top_products_data = []

    # 8. Análisis de Rendimiento de Empleados
    employee_sales_qs = Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).values(
        'empleado_venta__user_empleado__first_name',
        'empleado_venta__user_empleado__last_name',
    ).annotate(
        total_sales_amount=Sum('total_venta'),
        total_tickets=Count('id_venta')
    ).order_by('-total_sales_amount')

    employee_sales_df = pd.DataFrame(list(employee_sales_qs))
    if not employee_sales_df.empty:
        employee_sales_df['full_name'] = employee_sales_df['empleado_venta__user_empleado__first_name'] + ' ' + employee_sales_df['empleado_venta__user_empleado__last_name']
        employee_sales_data = employee_sales_df.to_dict(orient='records')
    else:
        employee_sales_data = []

    # 9. Análisis de Series de Tiempo (Ingresos, Gastos, Neto)
    sales_df = pd.DataFrame(list(financial_movements_qs.filter(venta_mov_fin__isnull=False).values('fecha_mov_fin', 'monto_mov_fin')))
    purchases_df = pd.DataFrame(list(financial_movements_qs.filter(compra_mov_fin__isnull=False).values('fecha_mov_fin', 'monto_mov_fin')))

    if not sales_df.empty: sales_df['fecha_mov_fin'] = pd.to_datetime(sales_df['fecha_mov_fin'])
    if not purchases_df.empty: purchases_df['fecha_mov_fin'] = pd.to_datetime(purchases_df['fecha_mov_fin'])
    if not cash_movements_df.empty: cash_movements_df['fecha_movimiento_hcaja'] = pd.to_datetime(cash_movements_df['fecha_movimiento_hcaja'])

    daily_income = sales_df.set_index('fecha_mov_fin')['monto_mov_fin'].resample('D').sum().fillna(0) if not sales_df.empty else pd.Series()
    daily_purchase_expenses = purchases_df.set_index('fecha_mov_fin')['monto_mov_fin'].resample('D').sum().fillna(0) if not purchases_df.empty else pd.Series()

    daily_operational_expenses_caja = cash_movements_df[
        (cash_movements_df['tipo_event_caja__nombre_evento'] == 'Retiro') &
        (cash_movements_df['destino_movimiento'] != 'PARA_PAGOS_FONDO')
    ].set_index('fecha_movimiento_hcaja')['cantidad_movida_hcaja'].resample('D').sum().fillna(0)

    financial_data = pd.DataFrame({
        'income': daily_income,
        'purchase_expenses': daily_purchase_expenses,
        'operational_expenses_caja': daily_operational_expenses_caja,
    }).fillna(0)
    financial_data['total_expenses'] = financial_data['purchase_expenses'] + financial_data['operational_expenses_caja']
    financial_data['net_income'] = financial_data['income'] - financial_data['total_expenses']

    time_series_data = financial_data.reset_index().rename(columns={'index': 'date'}).to_dict(orient='records')

    return {
        "total_income": total_income,
        "total_purchase_expenses": total_purchase_expenses,
        "operational_expenses_caja": operational_expenses_caja,
        "total_expenses": total_expenses,
        "net_income": net_income,
        "top_products": top_products_data,
        "employee_sales": employee_sales_data,
        "time_series_data": time_series_data,
        "status": "Informe financiero generado exitosamente."
    }

def generate_product_and_sales_trends_report(start_date, end_date):
    """
    Genera informes sobre el rendimiento del producto por categoría y tendencias de ventas.
    """
    # 1. Rendimiento del Producto por Categoría
    category_sales_qs = Detalle_Ventas.objects.filter(
        venta_det_vent__fecha_venta__range=(start_date, end_date)
    ).values(
        'producto_det_vent__categoria_producto__nombre_categoria'
    ).annotate(
        total_revenue_category=Sum('subtotal_det_vent'),
        total_quantity_category=Sum('cantidad_det_vent')
    ).order_by('-total_revenue_category')

    category_sales_df = pd.DataFrame(list(category_sales_qs))
    category_performance_data = []
    if not category_sales_df.empty:
        category_performance_data = category_sales_df.to_dict(orient='records')

    # 2. Tendencia de Ventas por Día de la Semana y Hora del Día
    sales_trend_qs = Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).values('fecha_venta', 'total_venta')

    sales_trend_df = pd.DataFrame(list(sales_trend_qs))
    sales_by_day_data = None
    sales_by_hour_data = None

    if not sales_trend_df.empty:
        sales_trend_df['fecha_venta'] = pd.to_datetime(sales_trend_df['fecha_venta'])
        sales_trend_df['day_of_week'] = sales_trend_df['fecha_venta'].dt.day_name()
        sales_trend_df['hour_of_day'] = sales_trend_df['fecha_venta'].dt.hour

        # Ventas por Día de la Semana
        sales_by_day = sales_trend_df.groupby('day_of_week')['total_venta'].sum().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ]).fillna(0)
        sales_by_day_data = sales_by_day.reset_index().to_dict(orient='records')

        # Ventas por Hora del Día
        sales_by_hour = sales_trend_df.groupby('hour_of_day')['total_venta'].sum().fillna(0)
        sales_by_hour_data = sales_by_hour.reset_index().to_dict(orient='records')

    return {
        "category_performance": category_performance_data,
        "sales_by_day_of_week": sales_by_day_data,
        "sales_by_hour_of_day": sales_by_hour_data,
        "status": "Informe de tendencias de productos y ventas generado exitosamente."
    }
