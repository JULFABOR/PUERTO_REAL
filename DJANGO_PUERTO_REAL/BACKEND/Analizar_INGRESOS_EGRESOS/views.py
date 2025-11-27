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
from django.shortcuts import render
from Control_VENTAS.models import Ventas
from django.utils import timezone
from datetime import datetime, timedelta

# Gráficos server-side
import io
import base64
import os
import pandas as pd
from .utils import plot_line_png, plot_pie_png, to_base64_png, add_watermark

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


def analisis_pdf_view(request):
    """
    Vista que renderiza un HTML con el informe listo para imprimir/guardar como PDF.
    Esta vista no requiere librerías adicionales; el usuario puede imprimir desde el navegador.
    """
    try:
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        try:
            naive_start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            naive_end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            start_date = timezone.make_aware(naive_start_date)
            end_date = timezone.make_aware(naive_end_date)
        except (ValueError, TypeError):
            return JsonResponse({'error': 'Fechas inválidas. Usa el formato YYYY-MM-DD.'}, status=400)

        report = generate_financial_report(start_date, end_date)
        # También obtenemos datos de categorías para graficar
        product_trends = generate_product_and_sales_trends_report(start_date, end_date)

        # Cached charts directory inside the app
        cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
        os.makedirs(cache_dir, exist_ok=True)

        chart_income_b64 = None
        try:
            ts = pd.DataFrame(report.get('time_series_data', []))
            if not ts.empty:
                y_col = 'net_income' if 'net_income' in ts.columns else ('income' if 'income' in ts.columns else None)
                if y_col:
                    ts['date'] = pd.to_datetime(ts['date'])
                    income_cache = os.path.join(cache_dir, f"income_{start_date_str}_{end_date_str}.png")
                    if os.path.exists(income_cache):
                        with open(income_cache, 'rb') as f:
                            png = f.read()
                    else:
                        png = plot_line_png(ts, 'date', y_col, title='Evolución de Ingresos')
                        try:
                            png = add_watermark(png, text='PUERTO REAL')
                        except Exception:
                            # If watermarking fails, continue with original image
                            pass
                        with open(income_cache, 'wb') as f:
                            f.write(png)
                    chart_income_b64 = to_base64_png(png)
        except Exception as e:
            print('Error generando gráfico de ingresos:', e)

        chart_categories_b64 = None
        try:
            categories = product_trends.get('category_performance', [])
            if categories:
                cat_df = pd.DataFrame(categories)
                name_col = 'producto_det_vent__categoria_producto__nombre_categoria' if 'producto_det_vent__categoria_producto__nombre_categoria' in cat_df.columns else (cat_df.columns[0] if len(cat_df.columns) else None)
                value_col = 'total_revenue_category' if 'total_revenue_category' in cat_df.columns else (cat_df.columns[1] if len(cat_df.columns) > 1 else None)
                if name_col and value_col:
                    labels = cat_df[name_col].fillna('Sin categoría').astype(str).tolist()
                    values = cat_df[value_col].fillna(0).tolist()
                    cat_cache = os.path.join(cache_dir, f"cat_{start_date_str}_{end_date_str}.png")
                    if os.path.exists(cat_cache):
                        with open(cat_cache, 'rb') as f:
                            pngc = f.read()
                    else:
                        pngc = plot_pie_png(labels, values, title='Distribución por Categoría')
                        try:
                            pngc = add_watermark(pngc, text='PUERTO REAL')
                        except Exception:
                            pass
                        with open(cat_cache, 'wb') as f:
                            f.write(pngc)
                    chart_categories_b64 = to_base64_png(pngc)
        except Exception as e:
            print('Error generando gráfico de categorías:', e)

        # Datos auxiliares para la plantilla
        total_transactions = Ventas.objects.filter(fecha_venta__range=(start_date, end_date)).count()
        average_ticket = (report.get('total_income', 0) / total_transactions) if total_transactions else 0

        products = []
        for p in report.get('top_products', []):
            products.append({
                'name': p.get('producto_det_vent__nombre_producto') or 'Desconocido',
                'units': p.get('total_quantity_sold') or 0,
                'revenue': p.get('total_revenue') or 0,
                'cost': p.get('cogs') or 0,
                'profit': p.get('margin') or 0,
                'margin': f"{((p.get('margin') or 0) / (p.get('total_revenue') or 1) * 100):.2f}%"
            })

        context = {
            'today': timezone.now().strftime('%Y-%m-%d %H:%M'),
            'period': f"{start_date_str} - {end_date_str}",
            'total_sales': report.get('total_income', 0),
            'gross_profit': report.get('net_income', 0),
            'total_transactions': total_transactions,
            'average_ticket': f"{average_ticket:.2f}",
            'payment_methods': [],
            'products': products,
            'chart_income': chart_income_b64,
            'chart_categories': chart_categories_b64,
        }

        return render(request, 'sales_report_pdf.html', context)

    except Exception as e:
        print(f"Error en analisis_pdf_view: {e}")
        return JsonResponse({'error': str(e)}, status=500)