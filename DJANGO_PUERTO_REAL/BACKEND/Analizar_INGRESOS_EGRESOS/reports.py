import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
from HOME.models import (
    Ventas, Detalle_Ventas, Compras, Detalle_Compras, Historial_Caja, 
    Movimiento_Fondo, Productos, Empleados, Tipos_Movimientos, 
    Categorias_Productos, Historial_Movimientos_Financieros
)
from datetime import datetime, timedelta
import io
import base64

# Constants for event types
EVENTO_RETIRO = 'Retiro'
DESTINO_PARA_PAGOS_FONDO = 'PARA_PAGOS_FONDO'
TIPO_MOVIMIENTO_SALIDA = 'SALIDA'

def plot_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64

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

    # Filtrar categorías con monto cero para no mostrarlas en el gráfico
    df_gastos = df_gastos[df_gastos['monto'] > 0]

    gastos_desglose_plot_base64 = None
    if not df_gastos.empty:
        fig_gastos, ax_gastos = plt.subplots(figsize=(8, 8))
        ax_gastos.pie(df_gastos['monto'], labels=df_gastos['categoria'], autopct='%1.1f%%', startangle=90, colors=sns.color_palette('pastel'))
        ax_gastos.set_title('Desglose de Gastos')
        ax_gastos.axis('equal') # Asegura que el pie chart sea circular.
        gastos_desglose_plot_base64 = plot_to_base64(fig_gastos)

    return {
        "gastos_desglose_plot": gastos_desglose_plot_base64,
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

    # 7. Análisis de Productos Principales (esto no cambia)
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

    # 8. Análisis de Rendimiento de Empleados (esto no cambia)
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
    # Preparar datos para el trazado de series de tiempo
    sales_df = pd.DataFrame(list(financial_movements_qs.filter(venta_mov_fin__isnull=False).values('fecha_mov_fin', 'monto_mov_fin')))
    purchases_df = pd.DataFrame(list(financial_movements_qs.filter(compra_mov_fin__isnull=False).values('fecha_mov_fin', 'monto_mov_fin')))
    
    if not sales_df.empty: sales_df['fecha_mov_fin'] = pd.to_datetime(sales_df['fecha_mov_fin'])
    if not purchases_df.empty: purchases_df['fecha_mov_fin'] = pd.to_datetime(purchases_df['fecha_mov_fin'])
    if not cash_movements_df.empty: cash_movements_df['fecha_movimiento_hcaja'] = pd.to_datetime(cash_movements_df['fecha_movimiento_hcaja'])

    # Remuestrear a frecuencia diaria
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

    # Trazado de Series de Tiempo
    fig_time_series, ax_time_series = plt.subplots(figsize=(12, 6))
    financial_data[['income', 'total_expenses', 'net_income']].plot(ax=ax_time_series)
    ax_time_series.set_title('Ingresos, Gastos y Neto a lo largo del tiempo')
    ax_time_series.set_xlabel('Fecha')
    ax_time_series.set_ylabel('Cantidad')
    ax_time_series.legend(['Ingresos', 'Gastos Totales', 'Ingreso Neto'])
    time_series_plot_base64 = plot_to_base64(fig_time_series)

    # 10. Gráficos de Barras (sin cambios)
    top_products_plot_base64 = None
    if not top_products_df.empty:
        fig_top_products, ax_top_products = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_revenue', y='producto_det_vent__nombre_producto', data=top_products_df, ax=ax_top_products)
        ax_top_products.set_title('Los 10 Productos Principales por Ingresos')
        ax_top_products.set_xlabel('Ingresos Totales')
        ax_top_products.set_ylabel('Producto')
        top_products_plot_base64 = plot_to_base64(fig_top_products)

    employee_sales_plot_base64 = None
    if not employee_sales_df.empty:
        fig_employee_sales, ax_employee_sales = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_sales_amount', y='full_name', data=employee_sales_df, ax=ax_employee_sales)
        ax_employee_sales.set_title('Ranking de Ventas por Empleado')
        ax_employee_sales.set_xlabel('Cantidad Total de Ventas')
        ax_employee_sales.set_ylabel('Empleado')
        employee_sales_plot_base64 = plot_to_base64(fig_employee_sales)

    return {
        "total_income": total_income,
        "total_purchase_expenses": total_purchase_expenses,
        "operational_expenses_caja": operational_expenses_caja,
        "total_expenses": total_expenses,
        "net_income": net_income,
        "top_products": top_products_data,
        "employee_sales": employee_sales_data,
        "time_series_plot": time_series_plot_base64,
        "top_products_plot": top_products_plot_base64,
        "employee_sales_plot": employee_sales_plot_base64,
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

        # Trazado del Rendimiento del Producto por Categoría
        fig_category_sales, ax_category_sales = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_revenue_category', y='producto_det_vent__categoria_producto__nombre_categoria', data=category_sales_df, ax=ax_category_sales)
        ax_category_sales.set_title('Rendimiento del Producto por Categoría (Ingresos)')
        ax_category_sales.set_xlabel('Ingresos Totales')
        ax_category_sales.set_ylabel('Categoría de Producto')
        category_sales_plot_base64 = plot_to_base64(fig_category_sales)
    else:
        category_sales_plot_base64 = None

    # 2. Tendencia de Ventas por Día de la Semana y Hora del Día
    sales_trend_qs = Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).values('fecha_venta', 'total_venta')

    sales_trend_df = pd.DataFrame(list(sales_trend_qs))
    sales_trend_data = {}
    sales_day_of_week_plot_base64 = None
    sales_hour_of_day_plot_base64 = None

    if not sales_trend_df.empty:
        sales_trend_df['fecha_venta'] = pd.to_datetime(sales_trend_df['fecha_venta'])
        sales_trend_df['day_of_week'] = sales_trend_df['fecha_venta'].dt.day_name()
        sales_trend_df['hour_of_day'] = sales_trend_df['fecha_venta'].dt.hour

        # Ventas por Día de la Semana
        sales_by_day = sales_trend_df.groupby('day_of_week')['total_venta'].sum().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ]).fillna(0)
        
        fig_sales_day, ax_sales_day = plt.subplots(figsize=(10, 6))
        sales_by_day.plot(kind='bar', ax=ax_sales_day)
        ax_sales_day.set_title('Ventas Totales por Día de la Semana')
        ax_sales_day.set_xlabel('Día de la Semana')
        ax_sales_day.set_ylabel('Ventas Totales')
        ax_sales_day.tick_params(axis='x', rotation=45)
        sales_day_of_week_plot_base64 = plot_to_base64(fig_sales_day)

        # Ventas por Hora del Día
        sales_by_hour = sales_trend_df.groupby('hour_of_day')['total_venta'].sum().fillna(0)
        
        fig_sales_hour, ax_sales_hour = plt.subplots(figsize=(12, 6))
        sales_by_hour.plot(kind='line', marker='o', ax=ax_sales_hour)
        ax_sales_hour.set_title('Ventas Totales por Hora del Día')
        ax_sales_hour.set_xlabel('Hora del Día')
        ax_sales_hour.set_ylabel('Ventas Totales')
        ax_sales_hour.set_xticks(range(24))
        sales_hour_of_day_plot_base64 = plot_to_base64(fig_sales_hour)

    return {
        "category_performance": category_performance_data,
        "category_sales_plot": category_sales_plot_base64,
        "sales_by_day_of_week_plot": sales_day_of_week_plot_base64,
        "sales_by_hour_of_day_plot": sales_hour_of_day_plot_base64,
        "status": "Informe de tendencias de productos y ventas generado exitosamente."
    }