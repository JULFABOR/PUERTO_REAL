
import os
import django

# --- Configuración del entorno de Django ---
# Esta sección debe estar ANTES de cualquier import de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DJANGO_PUERTO_REAL.settings')
django.setup()

from django.contrib.auth.models import User
from autenticacion.models import Perfil, Clientes, Empleados

def crear_usuario_con_rol(username, password, email, rol, first_name="", last_name="", dni="", telefono=""):
    """
    Crea un usuario con un rol específico si no existe.
    """
    if User.objects.filter(username=username).exists():
        print(f"ℹ️ El usuario '{username}' ya existe. No se realizarán cambios.")
        user = User.objects.get(username=username)
        # Asegurarse de que el perfil y rol sean correctos
        user.perfil.rol = rol
        user.perfil.save()
        return user, False

    # 1. Crear el usuario base
    user = User.objects.create_user(username=username, password=password, email=email, first_name=first_name, last_name=last_name)
    print(f"✅ Usuario '{username}' creado.")

    # 2. El perfil se crea automáticamente por la señal, ahora se actualiza el rol.
    user.perfil.rol = rol
    user.perfil.save()
    print(f"   -> Rol asignado: {user.perfil.get_rol_display()}.\n")

    # 3. Crear la entrada correspondiente en Clientes o Empleados si es necesario
    if rol == Perfil.Rol.CLIENTE:
        Clientes.objects.create(user_cliente=user, dni_cliente=dni, telefono_cliente=telefono)
        print(f"   -> Entrada creada en la tabla 'Clientes'.")
    elif rol == Perfil.Rol.EMPLEADO:
        Empleados.objects.create(user_empleado=user, dni_empleado=dni, telefono_empleado=telefono)
        print(f"   -> Entrada creada en la tabla 'Empleados'.")

    return user, True

if __name__ == '__main__':
    print("🚀 Iniciando script para crear usuarios de prueba...")
    
    # --- Datos de los usuarios ---
    # Contraseña común para todos para facilitar el testing
    COMMON_PASSWORD = "Testing123."

    usuarios_a_crear = [
        {
            "username": "jefe",
            "email": "jefe@puertoreal.com",
            "rol": Perfil.Rol.JEFE,
            "first_name": "Jefe",
            "last_name": "De Jefes",
            "dni": "11111111",
            "telefono": "111111111"
        },
        {
            "username": "empleado",
            "email": "empleado@puertoreal.com",
            "rol": Perfil.Rol.EMPLEADO,
            "first_name": "Empleado",
            "last_name": "De Prueba",
            "dni": "22222222",
            "telefono": "222222222"
        },
        {
            "username": "cliente",
            "email": "cliente@puertoreal.com",
            "rol": Perfil.Rol.CLIENTE,
            "first_name": "Cliente",
            "last_name": "De Prueba",
            "dni": "33333333",
            "telefono": "333333333"
        }
    ]

    for data in usuarios_a_crear:
        crear_usuario_con_rol(
            username=data["username"],
            password=COMMON_PASSWORD,
            email=data["email"],
            rol=data["rol"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            dni=data["dni"],
            telefono=data["telefono"]
        )
        print("-" * 20)

    print("\n🎉 Proceso finalizado.")
    print("Puedes usar los siguientes usuarios para probar las vistas:")
    print(f"  - Username: jefe, Password: {COMMON_PASSWORD}")
    print(f"  - Username: empleado, Password: {COMMON_PASSWORD}")
    print(f"  - Username: cliente, Password: {COMMON_PASSWORD}")
