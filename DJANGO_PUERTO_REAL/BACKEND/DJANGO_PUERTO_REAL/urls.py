"""
Configuración de URL para el proyecto DJANGO_PUERTO_REAL.

La lista `urlpatterns` enruta URLs a vistas. Para más información, consulta:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.authtoken.views import obtain_auth_token

# Se importan las listas de URLs de las apps
from Control_VENTAS.urls import urlpatterns as ventas_web_urls
from Control_VENTAS.urls import api_urlpatterns as ventas_api_urls
from Control_COMPRAS.urls import urlpatterns as compras_web_urls
from Control_COMPRAS.urls import api_urlpatterns as compras_api_urls
from Control_STOCK.urls import urlpatterns as stock_web_urls
from Control_STOCK.urls import api_urlpatterns as stock_api_urls
from Fidelizar_CLIENTES.urls import urlpatterns as fidelizar_web_urls
from Fidelizar_CLIENTES.urls import api_urlpatterns as fidelizar_api_urls
from Abrir_Cerrar_CAJA.urls import web_urlpatterns as caja_web_urls
from Abrir_Cerrar_CAJA.urls import api_urlpatterns as caja_api_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('autenticacion.urls')), # Rutas de autenticación
    path('', include('HOME.urls')),

    # Rutas de la App de Análisis (exclusivo para Staff)
    path('analisis/', include('Analizar_INGRESOS_EGRESOS.urls')),

    # Rutas de las páginas web de las apps
    path('ventas/', include(ventas_web_urls)),
    path('compras/', include(compras_web_urls)),
    path('stock/', include(stock_web_urls)),
    path('fidelizacion/', include(fidelizar_web_urls)),
    path('caja/', include(caja_web_urls)),

    # Rutas de API
    path('api/token-auth/', obtain_auth_token, name='api_token_auth'), # Para obtener tokens
    path('api/ventas/', include(ventas_api_urls)),
    path('api/compras/', include(compras_api_urls)),
    path('api/stock/', include(stock_api_urls)),
    path('api/fidelizacion/', include(fidelizar_api_urls)),
    path('api/', include(caja_api_urls)),
    
    # Nueva ruta para la app de Auditoria
    path('auditoria/', include('Auditoria.urls')),

    # Las rutas de la API de reportes ahora deberían estar en Analizar_INGRESOS_EGRESOS/urls.py si se quiere mantener consistencia
    # Por ahora, se dejan comentadas o se pueden mover a la app correspondiente.
    # path('api/financial-report/', financial_report_view, name='financial_report'),
    # path('api/product-sales-trends/', product_sales_trends_report_view, name='product_sales_trends'),
    # path('api/expense-breakdown/', expense_breakdown_report_view, name='expense_breakdown'),

    # Catch-all para servir el frontend de React
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]
