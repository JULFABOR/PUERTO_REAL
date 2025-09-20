from django.urls import path
from .views import (
    # AnalisisDashboardView,
    financial_report_view,
    product_sales_trends_report_view,
    expense_breakdown_report_view
)

app_name = 'Analizar_INGRESOS_EGRESOS'

urlpatterns = [
    # path('', AnalisisDashboardView.as_view(), name='analisis_dashboard'),
    path('api/report/financial/', financial_report_view, name='api_financial_report'),
    path('api/report/product-sales-trends/', product_sales_trends_report_view, name='api_product_sales_trends'),
    path('api/report/expense-breakdown/', expense_breakdown_report_view, name='api_expense_breakdown'),
    ]