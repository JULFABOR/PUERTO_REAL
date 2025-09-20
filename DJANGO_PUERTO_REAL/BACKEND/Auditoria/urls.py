from django.urls import path
from .views import get_audit_logs

app_name = 'Auditoria'

urlpatterns = [
    path('api/logs/', get_audit_logs, name='api_audit_logs'),
    ]
