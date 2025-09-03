from django.urls import path
from .views import audit_log_view

app_name = 'Auditoria'

urlpatterns = [
    path('log/', audit_log_view, name='audit_log'),
]
