from django.urls import path
from .views import (
    financial_report_view,
    product_sales_trends_report_view,
    expense_breakdown_report_view,
    analisis_pdf_view,
    top_customers_report_view,
)

app_name = 'Analizar_INGRESOS_EGRESOS'

urlpatterns = [
    # path('', AnalisisDashboardView.as_view(), name='analisis_dashboard'),
    
    # --- CORREGIDO (sin 'api/') ---
    path('report/financial/', financial_report_view, name='api_financial_report'),
    
    # --- CORREGIDO (sin 'api/') ---
    path('report/product-sales-trends/', product_sales_trends_report_view, name='api_product_sales_trends'),
    
    # --- CORREGIDO (sin 'api/') ---
    path('report/expense-breakdown/', expense_breakdown_report_view, name='api_expense_breakdown'),
    # Página HTML imprimible / PDF (browser print)
    path('report/analisis-pdf/', analisis_pdf_view, name='api_analisis_pdf'),
    # Top Clientes
    path('report/top-customers/', top_customers_report_view, name='api_top_customers'),
]