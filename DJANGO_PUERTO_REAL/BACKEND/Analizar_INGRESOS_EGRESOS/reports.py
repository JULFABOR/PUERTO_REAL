import pandas as pd
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count, Value
from django.db.models.functions import Concat, TruncDay, ExtractWeekDay, ExtractHour
from HOME.models import (
    Ventas, Detalle_Ventas, Compras, Detalle_Compras, Historial_Caja,
    Movimiento_Fondo, Productos, Empleados, Tipos_Movimientos,
    Categorias_Productos, Historial_Movimientos_Financieros
)
from datetime import datetime, timedelta

# Constants for event types
EVENTO_RETIRO = 'Retiro'
DESTINO_PARA_PAGOS_FONDO = 'PARA_PAGOS_FONDO'
TIPO_MOVIMIENTO_SALIDA = 'SALIDA'

def generate_expense_breakdown_report(start_date, end_date):
    """
    Genera un informe de desglose de gastos, mostrando la proporción de cada tipo de gasto.
    """
    total_gastos_compras = Historial_Movimientos_Financieros.objects.filter(
        fecha_mov_fin__range=(start_date, end_date),
        compra_mov_fin__isnull=False
    ).aggregate(total=Sum('monto_mov_fin'))['total'] or 0

    gastos_operacionales_caja = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date),
        tipo_event_caja__nombre_evento=EVENTO_RETIRO
    ).exclude(
        destino_movimiento=DESTINO_PARA_PAGOS_FONDO
    ).aggregate(total=Sum('cantidad_movida_hcaja'))['total'] or 0

    otros_gastos_fondo = Movimiento_Fondo.objects.filter(
        fecha_mov_fp__range=(start_date, end_date),
        tipo_mov_fp__nombre_movimiento=TIPO_MOVIMIENTO_SALIDA
    ).aggregate(total=Sum('monto_mov_fp'))['total'] or 0

    gastos_data = [
        {'categoria': 'Gastos de Compras', 'monto': total_gastos_compras},
        {'categoria': 'Gastos Operacionales de Caja', 'monto': gastos_operacionales_caja},
        {'categoria': 'Otros Gastos de Fondo', 'monto': otros_gastos_fondo},
    ]

    # Filtrar categorías con monto cero
    gastos_desglose_data = [gasto for gasto in gastos_data if gasto['monto'] > 0]

    return {
        "gastos_desglose_data": gastos_desglose_data,
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

    # 4. Gastos Operacionales de Caja
    operational_expenses_caja = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date),
        tipo_event_caja__nombre_evento=EVENTO_RETIRO
    ).exclude(
        destino_movimiento=DESTINO_PARA_PAGOS_FONDO
    ).aggregate(total=Sum('cantidad_movida_hcaja'))['total'] or 0

    # 5. Calcular gastos totales
    total_expenses = total_purchase_expenses + operational_expenses_caja

    # 6. Calcular Neto
    net_income = total_income - total_expenses

    # 7. Análisis de Productos Principales
    top_products_data = list(Detalle_Ventas.objects.filter(
        venta_det_vent__fecha_venta__range=(start_date, end_date)
    ).values(
        'producto_det_vent__nombre_producto'
    ).annotate(
        total_quantity_sold=Sum('cantidad_det_vent'),
        total_revenue=Sum('subtotal_det_vent'),
        cogs=Sum(F('cantidad_det_vent') * F('producto_det_vent__precio_unitario_compra_producto'), output_field=DecimalField()),
        margin=F('total_revenue') - F('cogs')
    ).order_by('-total_revenue').values(
        'producto_det_vent__nombre_producto',
        'total_quantity_sold',
        'total_revenue',
        'cogs',
        'margin'
    )[:10])

    # 8. Análisis de Rendimiento de Empleados
    employee_sales_data = list(Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).annotate(
        full_name=Concat(
            'empleado_venta__user_empleado__first_name',
            Value(' '),
            'empleado_venta__user_empleado__last_name'
        )
    ).values('full_name').annotate(
        total_sales_amount=Sum('total_venta'),
        total_tickets=Count('id_venta')
    ).order_by('-total_sales_amount').values('full_name', 'total_sales_amount', 'total_tickets'))

    # 9. Análisis de Series de Tiempo (Ingresos, Gastos, Neto)
    daily_income_qs = financial_movements_qs.filter(
        venta_mov_fin__isnull=False
    ).annotate(
        day=TruncDay('fecha_mov_fin')
    ).values('day').annotate(
        total=Sum('monto_mov_fin')
    ).order_by('day')

    daily_purchase_expenses_qs = financial_movements_qs.filter(
        compra_mov_fin__isnull=False
    ).annotate(
        day=TruncDay('fecha_mov_fin')
    ).values('day').annotate(
        total=Sum('monto_mov_fin')
    ).order_by('day')

    daily_operational_expenses_caja_qs = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date),
        tipo_event_caja__nombre_evento=EVENTO_RETIRO
    ).exclude(
        destino_movimiento=DESTINO_PARA_PAGOS_FONDO
    ).annotate(
        day=TruncDay('fecha_movimiento_hcaja')
    ).values('day').annotate(
        total=Sum('cantidad_movida_hcaja')
    ).order_by('day')

    income_df = pd.DataFrame(list(daily_income_qs)).rename(columns={'total': 'income'})
    purchase_df = pd.DataFrame(list(daily_purchase_expenses_qs)).rename(columns={'total': 'purchase_expenses'})
    operational_df = pd.DataFrame(list(daily_operational_expenses_caja_qs)).rename(columns={'total': 'operational_expenses_caja'})

    if not income_df.empty:
        income_df['day'] = pd.to_datetime(income_df['day'])
        income_df = income_df.set_index('day')
    if not purchase_df.empty:
        purchase_df['day'] = pd.to_datetime(purchase_df['day'])
        purchase_df = purchase_df.set_index('day')
    if not operational_df.empty:
        operational_df['day'] = pd.to_datetime(operational_df['day'])
        operational_df = operational_df.set_index('day')

    financial_data = pd.concat([income_df, purchase_df, operational_df], axis=1).fillna(0)
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
    category_performance_data = list(Detalle_Ventas.objects.filter(
        venta_det_vent__fecha_venta__range=(start_date, end_date)
    ).values(
        'producto_det_vent__categoria_producto__nombre_categoria'
    ).annotate(
        total_revenue_category=Sum('subtotal_det_vent'),
        total_quantity_category=Sum('cantidad_det_vent')
    ).order_by('-total_revenue_category'))

    # 2. Tendencia de Ventas por Día de la Semana
    sales_by_day_qs = Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).annotate(
        day_of_week=ExtractWeekDay('fecha_venta')
    ).values('day_of_week').annotate(
        total_venta=Sum('total_venta')
    ).order_by('day_of_week')

    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    sales_by_day_data = {day: 0 for day in days}
    for item in sales_by_day_qs:
        sales_by_day_data[days[item['day_of_week']-1]] = item['total_venta']

    sales_by_day_data_list = [{'day_of_week': day, 'total_venta': sales_by_day_data[day]} for day in days]

    # 3. Tendencia de Ventas por Hora del Día
    sales_by_hour_data = list(Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).annotate(
        hour_of_day=ExtractHour('fecha_venta')
    ).values('hour_of_day').annotate(
        total_venta=Sum('total_venta')
    ).order_by('hour_of_day'))

    return {
        "category_performance": category_performance_data,
        "sales_by_day_of_week": sales_by_day_data_list,
        "sales_by_hour_of_day": sales_by_hour_data,
        "status": "Informe de tendencias de productos y ventas generado exitosamente."
    }