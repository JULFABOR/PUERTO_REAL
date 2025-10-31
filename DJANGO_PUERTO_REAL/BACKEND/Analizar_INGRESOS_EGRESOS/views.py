# Python standard library
from datetime import datetime, timedelta

# Django
from django.http import JsonResponse
from django.utils import timezone  # <-- 1. IMPORTACIÓN AÑADIDA

# Local application
from .reports import (
    generate_expense_breakdown_report,
    generate_financial_report,
    generate_product_and_sales_trends_report,
)

def financial_report_view(request):
    """
    Vista para generar un reporte financiero.
    """
    # --- 2. BLOQUE TRY...EXCEPT GENERAL AÑADIDO ---
    try:
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        # --- 3. CORRECCIÓN DE FECHAS "NAIVE" ---
        try:
            naive_start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            naive_end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            
            # Convierte las fechas a "aware" (conscientes de la zona horaria)
            start_date = timezone.make_aware(naive_start_date)
            end_date = timezone.make_aware(naive_end_date)
            
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

        report_data = generate_financial_report(start_date, end_date)
        return JsonResponse(report_data)

    except Exception as e:
        # --- 4. RESPUESTA DE ERROR GENERAL ---
        # Captura cualquier error (como el KeyError) y lo devuelve como JSON
        print(f"Error en financial_report_view: {e}") # Para debugging en terminal
        return JsonResponse({'error': str(e)}, status=500)

def product_sales_trends_report_view(request):
    """
    Vista para generar un reporte de productos y tendencias de ventas.
    """
    # --- 2. BLOQUE TRY...EXCEPT GENERAL AÑADIDO ---
    try:
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        # --- 3. CORRECCIÓN DE FECHAS "NAIVE" ---
        try:
            naive_start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            naive_end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            
            start_date = timezone.make_aware(naive_start_date)
            end_date = timezone.make_aware(naive_end_date)
            
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

        report_data = generate_product_and_sales_trends_report(start_date, end_date)
        return JsonResponse(report_data)

    except Exception as e:
        # --- 4. RESPUESTA DE ERROR GENERAL ---
        print(f"Error en product_sales_trends_report_view: {e}") # Para debugging
        return JsonResponse({'error': str(e)}, status=500)

def expense_breakdown_report_view(request):
    """
    Vista para generar un desglose de gastos.
    """
    # --- 2. BLOQUE TRY...EXCEPT GENERAL AÑADIDO ---
    try:
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        # --- 3. CORRECCIÓN DE FECHAS "NAIVE" ---
        try:
            naive_start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            naive_end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)

            start_date = timezone.make_aware(naive_start_date)
            end_date = timezone.make_aware(naive_end_date)
            
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

        report_data = generate_expense_breakdown_report(start_date, end_date)
        return JsonResponse(report_data)

    except Exception as e:
        # --- 4. RESPUESTA DE ERROR GENERAL ---
        print(f"Error en expense_breakdown_report_view: {e}") # Para debugging
        return JsonResponse({'error': str(e)}, status=500)