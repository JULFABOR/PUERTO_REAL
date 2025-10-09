from django.urls import path
from . import views

app_name = 'home'

urlpatterns = [
    path("api/saludo/", views.api_saludo, name="api_saludo)"),
    ]