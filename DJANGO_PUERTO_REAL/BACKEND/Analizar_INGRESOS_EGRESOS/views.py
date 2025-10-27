# Python standard library
from datetime import datetime, timedelta

# Django
from django.http import JsonResponse

# Local application
from .reports import (
    generate_expense_breakdown_report,
    generate_financial_report,
    generate_product_and_sales_trends_report,
)

def financial_report_view(request):
    """
    Vista para generar un reporte financiero.
    Parámetros esperados en la solicitud GET:
    - start_date: Fecha de inicio en formato 'YYYY-MM-DD'
    - end_date: Fecha de fin en formato 'YYYY-MM-DD'
    """
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # Incluir el día final
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

    report_data = generate_financial_report(start_date, end_date)
    return JsonResponse(report_data)

def product_sales_trends_report_view(request):
    """
    Vista para generar un reporte de productos y tendencias de ventas.
    Parámetros esperados en la solicitud GET:
    - start_date: Fecha de inicio en formato 'YYYY-MM-DD'
    - end_date: Fecha de fin en formato 'YYYY-MM-DD'
    """
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # Incluir el día final
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

    report_data = generate_product_and_sales_trends_report(start_date, end_date)
    return JsonResponse(report_data)

def expense_breakdown_report_view(request):
    """
    Vista para generar un desglose de gastos.
    Parámetros esperados en la solicitud GET:
    - start_date: Fecha de inicio en formato 'YYYY-MM-DD'
    - end_date: Fecha de fin en formato 'YYYY-MM-DD'
    """
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # Incluir el día final
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

    report_data = generate_expense_breakdown_report(start_date, end_date)
    return JsonResponse(report_data)