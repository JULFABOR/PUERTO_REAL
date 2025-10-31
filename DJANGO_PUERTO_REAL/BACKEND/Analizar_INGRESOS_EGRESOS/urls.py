from django.urls import path
from .views import (
    financial_report_view,
    product_sales_trends_report_view,
    expense_breakdown_report_view,
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
]