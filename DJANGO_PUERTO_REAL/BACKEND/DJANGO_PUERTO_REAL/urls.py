"""
"""
URL configuration for DJANGO_PUERTO_REAL project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from Analizar_INGRESOS_EGRESOS.views import financial_report_view, product_sales_trends_report_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('HOME.urls')),
    path('api/', include('Abrir_Cerrar_CAJA.urls')),
    path('api/', include('Control_COMPRAS.urls')),
    path('api/', include('Control_VENTAS.urls')),
    path('api/', include('Fidelizar_CLIENTES.urls')),
    path('', include('Control_STOCK.urls')),
    path('api/financial-report/', financial_report_view, name='financial_report'),
    path('api/product-sales-trends/', product_sales_trends_report_view, name='product_sales_trends'),
]
"""
from django.contrib import admin
from django.urls import path, include
from Analizar_INGRESOS_EGRESOS.views import financial_report_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('HOME.urls')),
    path('api/', include('Abrir_Cerrar_CAJA.urls')),
    path('api/', include('Control_COMPRAS.urls')),
    path('api/', include('Control_VENTAS.urls')),
    path('api/', include('Fidelizar_CLIENTES.urls')),
    path('', include('Control_STOCK.urls')),
    path('api/financial-report/', financial_report_view, name='financial_report'),
]

