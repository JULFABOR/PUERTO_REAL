import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Count
from HOME.models import Ventas, Detalle_Ventas, Compras, Detalle_Compras, Historial_Caja, Movimiento_Fondo, Productos, Empleados, Tipos_Movimientos, Categorias_Productos
from datetime import datetime, timedelta
import io
import base64

def plot_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64

def generate_financial_report(start_date, end_date):
    """
    Generates a financial report including income, expenses, and net.
    """
    # 1. Fetch Sales Data (Income)
    sales_qs = Ventas.objects.filter(
        fecha_venta__range=(start_date, end_date)
    ).annotate(
        income=F('total_venta') - F('descuento_aplicado')
    ).values('fecha_venta', 'income')
    sales_df = pd.DataFrame(list(sales_qs))
    total_income = sales_df['income'].sum() if not sales_df.empty else 0

    # 2. Fetch Purchase Data (Expenses from Purchases)
    purchases_qs = Compras.objects.filter(
        fecha_compra__range=(start_date, end_date)
    ).values('fecha_compra', 'total_compra')
    purchases_df = pd.DataFrame(list(purchases_qs))
    total_purchase_expenses = purchases_df['total_compra'].sum() if not purchases_df.empty else 0

    # 3. Fetch Historial_Caja Data (Operational Expenses and Transfers)
    cash_movements_qs = Historial_Caja.objects.filter(
        fecha_movimiento_hcaja__range=(start_date, end_date)
    ).values('fecha_movimiento_hcaja', 'cantidad_movida_hcaja', 'tipo_event_caja__nombre_evento', 'destino_movimiento')

    cash_movements_df = pd.DataFrame(list(cash_movements_qs))
    
    operational_expenses_caja = 0
    if not cash_movements_df.empty:
        cash_movements_df['cantidad_movida_hcaja'] = pd.to_numeric(cash_movements_df['cantidad_movida_hcaja'], errors='coerce').fillna(0)
        operational_expenses_caja = cash_movements_df[
            (cash_movements_df['tipo_event_caja__nombre_evento'] == 'Retiro') &
            (cash_movements_df['destino_movimiento'] != 'PARA_PAGOS_FONDO')
        ]['cantidad_movida_hcaja'].sum()

    # 4. Fetch Movimiento_Fondo Data (Transfers and other fund movements)
    fund_movements_qs = Movimiento_Fondo.objects.filter(
        fecha_mov_fp__range=(start_date, end_date)
    ).values('fecha_mov_fp', 'tipo_mov_fp', 'monto_mov_fp')
    fund_movements_df = pd.DataFrame(list(fund_movements_qs))

    # Calculate total expenses
    total_expenses = total_purchase_expenses + operational_expenses_caja

    # Calculate Net
    net_income = total_income - total_expenses

    # 5. Top Products Analysis
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

    # 6. Employee Performance Analysis
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

    # 7. Time Series Analysis (Income, Expenses, Net)
    # Prepare data for time series plotting
    # Ensure date columns are datetime objects
    if not sales_df.empty: sales_df['fecha_venta'] = pd.to_datetime(sales_df['fecha_venta'])
    if not purchases_df.empty: purchases_df['fecha_compra'] = pd.to_datetime(purchases_df['fecha_compra'])
    if not cash_movements_df.empty: cash_movements_df['fecha_movimiento_hcaja'] = pd.to_datetime(cash_movements_df['fecha_movimiento_hcaja'])

    # Resample to daily frequency
    daily_income = sales_df.set_index('fecha_venta')['income'].resample('D').sum().fillna(0)
    daily_purchase_expenses = purchases_df.set_index('fecha_compra')['total_compra'].resample('D').sum().fillna(0)
    
    # For operational expenses from caja, we need to be careful with aggregation
    # Assuming 'Retiro' events are expenses, and we sum them up daily
    daily_operational_expenses_caja = cash_movements_df[
        (cash_movements_df['tipo_event_caja__nombre_evento'] == 'Retiro') &
        (cash_movements_df['destino_movimiento'] != 'PARA_PAGOS_FONDO')
    ].set_index('fecha_movimiento_hcaja')['cantidad_movida_hcaja'].resample('D').sum().fillna(0)

    # Combine all daily financial data
    financial_data = pd.DataFrame({
        'income': daily_income,
        'purchase_expenses': daily_purchase_expenses,
        'operational_expenses_caja': daily_operational_expenses_caja,
    }).fillna(0)
    financial_data['total_expenses'] = financial_data['purchase_expenses'] + financial_data['operational_expenses_caja']
    financial_data['net_income'] = financial_data['income'] - financial_data['total_expenses']

    # Plotting Time Series
    fig_time_series, ax_time_series = plt.subplots(figsize=(12, 6))
    financial_data[['income', 'total_expenses', 'net_income']].plot(ax=ax_time_series)
    ax_time_series.set_title('Income, Expenses, and Net Over Time')
    ax_time_series.set_xlabel('Date')
    ax_time_series.set_ylabel('Amount')
    ax_time_series.legend(['Income', 'Total Expenses', 'Net Income'])
    time_series_plot_base64 = plot_to_base64(fig_time_series)

    # 8. Bar Charts
    # Top Products by Revenue
    top_products_plot_base64 = None
    if not top_products_df.empty:
        fig_top_products, ax_top_products = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_revenue', y='producto_det_vent__nombre_producto', data=top_products_df, ax=ax_top_products)
        ax_top_products.set_title('Top 10 Products by Revenue')
        ax_top_products.set_xlabel('Total Revenue')
        ax_top_products.set_ylabel('Product')
        top_products_plot_base64 = plot_to_base64(fig_top_products)

    # Employee Sales Ranking
    employee_sales_plot_base64 = None
    if not employee_sales_df.empty:
        fig_employee_sales, ax_employee_sales = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_sales_amount', y='full_name', data=employee_sales_df, ax=ax_employee_sales)
        ax_employee_sales.set_title('Employee Sales Ranking')
        ax_employee_sales.set_xlabel('Total Sales Amount')
        ax_employee_sales.set_ylabel('Employee')
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
        "status": "Financial report generated successfully."
    }

def generate_product_and_sales_trends_report(start_date, end_date):
    """
    Generates reports on product performance by category and sales trends.
    """
    # 1. Product Performance by Category
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

        # Plotting Product Performance by Category
        fig_category_sales, ax_category_sales = plt.subplots(figsize=(10, 6))
        sns.barplot(x='total_revenue_category', y='producto_det_vent__categoria_producto__nombre_categoria', data=category_sales_df, ax=ax_category_sales)
        ax_category_sales.set_title('Product Performance by Category (Revenue)')
        ax_category_sales.set_xlabel('Total Revenue')
        ax_category_sales.set_ylabel('Product Category')
        category_sales_plot_base64 = plot_to_base64(fig_category_sales)
    else:
        category_sales_plot_base64 = None

    # 2. Sales Trend by Day of Week and Hour of Day
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

        # Sales by Day of Week
        sales_by_day = sales_trend_df.groupby('day_of_week')['total_venta'].sum().reindex([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ]).fillna(0)
        
        fig_sales_day, ax_sales_day = plt.subplots(figsize=(10, 6))
        sales_by_day.plot(kind='bar', ax=ax_sales_day)
        ax_sales_day.set_title('Total Sales by Day of Week')
        ax_sales_day.set_xlabel('Day of Week')
        ax_sales_day.set_ylabel('Total Sales')
        ax_sales_day.tick_params(axis='x', rotation=45)
        sales_day_of_week_plot_base64 = plot_to_base64(fig_sales_day)

        # Sales by Hour of Day
        sales_by_hour = sales_trend_df.groupby('hour_of_day')['total_venta'].sum().fillna(0)
        
        fig_sales_hour, ax_sales_hour = plt.subplots(figsize=(12, 6))
        sales_by_hour.plot(kind='line', marker='o', ax=ax_sales_hour)
        ax_sales_hour.set_title('Total Sales by Hour of Day')
        ax_sales_hour.set_xlabel('Hour of Day')
        ax_sales_hour.set_ylabel('Total Sales')
        ax_sales_hour.set_xticks(range(24))
        sales_hour_of_day_plot_base64 = plot_to_base64(fig_sales_hour)

    return {
        "category_performance": category_performance_data,
        "category_sales_plot": category_sales_plot_base64,
        "sales_by_day_of_week_plot": sales_day_of_week_plot_base64,
        "sales_by_hour_of_day_plot": sales_hour_of_day_plot_base64,
        "status": "Product and sales trends report generated successfully."
    }
