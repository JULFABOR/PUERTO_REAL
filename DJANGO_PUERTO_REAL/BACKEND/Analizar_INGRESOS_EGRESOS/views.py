from django.shortcuts import render
from django.http import JsonResponse
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils.decorators import method_decorator
from .reports import generate_financial_report, generate_product_and_sales_trends_report, generate_expense_breakdown_report
from datetime import datetime, timedelta

# Decorador para verificar si el usuario es staff
def is_staff(user):
    return user.is_staff

# --- Vista de Template para el Dashboard de Staff ---
@method_decorator([login_required, user_passes_test(is_staff)], name='dispatch')
class AnalisisDashboardView(TemplateView):
    template_name = 'Analizar_INGRESOS_EGRESOS/Analisis.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = "Dashboard de Análisis"
        # Aquí puedes añadir más datos para pasar a la plantilla en el futuro
        # Por ejemplo, puedes llamar a tus funciones de reportes aquí
        return context


# --- Vistas de API para Reportes (existentes) ---


def financial_report_view(request):
    # Rango de fechas predeterminado para demostración: últimos 30 días
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # Puedes obtener fechas de request.GET si es necesario para informes dinámicos
    # start_date_str = request.GET.get('start_date')
    # end_date_str = request.GET.get('end_date')
    # if start_date_str and end_date_str:
    #     start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    #     end_date = datetime.strptime(end_date_str, '%Y-%m-%d')

    report_data = generate_financial_report(start_date, end_date)
    return JsonResponse(report_data)

def product_sales_trends_report_view(request):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    report_data = generate_product_and_sales_trends_report(start_date, end_date)
    return JsonResponse(report_data)

def expense_breakdown_report_view(request):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    report_data = generate_expense_breakdown_report(start_date, end_date)
    return JsonResponse(report_data)