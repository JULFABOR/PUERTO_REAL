"""
Configuración de URL para el proyecto DJANGO_PUERTO_REAL.

La lista `urlpatterns` enruta URLs a vistas. Para más información, consulta:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from Analizar_INGRESOS_EGRESOS.views import financial_report_view, product_sales_trends_report_view, expense_breakdown_report_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('HOME.urls')),
    path('api/', include('Abrir_Cerrar_CAJA.urls')),
    path('api/', include('Control_COMPRAS.urls')),
    path('api/', include('Control_VENTAS.urls')),
    path('api/', include('Fidelizar_CLIENTES.urls')),
    path('', include('Control_STOCK.urls')),
    
    # Nueva ruta para la app de Auditoria
    path('auditoria/', include('Auditoria.urls')),

    # Rutas existentes de reportes
    path('api/financial-report/', financial_report_view, name='financial_report'),
    path('api/product-sales-trends/', product_sales_trends_report_view, name='product_sales_trends'),
    path('api/expense-breakdown/', expense_breakdown_report_view, name='expense_breakdown'),
]
