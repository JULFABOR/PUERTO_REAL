
from django.shortcuts import render
from django.http import JsonResponse
from .reports import generate_financial_report, generate_product_and_sales_trends_report
from datetime import datetime, timedelta

def financial_report_view(request):
    # Default date range for demonstration: last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # You can get dates from request.GET if needed for dynamic reports
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

