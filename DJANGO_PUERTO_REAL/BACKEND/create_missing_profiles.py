
import os
import django

# Configura el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DJANGO_PUERTO_REAL.settings')
django.setup()

from django.contrib.auth.models import User
from autenticacion.models import Perfil

def create_missing_profiles():
    """
    Itera sobre todos los usuarios y les crea un perfil si no lo tienen.
    """
    users_without_profile = User.objects.filter(perfil__isnull=True)
    
    if not users_without_profile:
        print("Todos los usuarios tienen un perfil.")
        return

    print(f"Se encontraron {users_without_profile.count()} usuarios sin perfil. Creando perfiles...")

    for user in users_without_profile:
        Perfil.objects.create(usuario=user)
        print(f"Perfil creado para el usuario: {user.username}")

    print("¡Proceso completado!")

if __name__ == "__main__":
    create_missing_profiles()
