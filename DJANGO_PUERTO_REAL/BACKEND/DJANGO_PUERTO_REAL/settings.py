"""
Configuración de Django para el proyecto DJANGO_PUERTO_REAL.
CORREGIDO PARA SOPORTE DE REACT + AXIOS + CORS
"""

from pathlib import Path
import os
from dotenv import load_dotenv
import sys
from django.core.exceptions import ImproperlyConfigured

# Construye rutas dentro del proyecto así: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent
    
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

load_dotenv(os.path.join(BASE_DIR, '.env'))

# Entorno: development o production
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# ADVERTENCIA DE SEGURIDAD: ¡mantén en secreto la clave secreta utilizada en producción!
# Cargar SECRET_KEY desde entorno; no dejar por defecto en producción
SECRET_KEY = os.getenv('SECRET_KEY')

# ADVERTENCIA DE SEGURIDAD: no ejecutes con DEBUG activado en producción.
# Por defecto usamos False y se debe activar explícitamente en desarrollo.
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Validar SECRET_KEY: permitir un valor de desarrollo si DEBUG=True,
# pero exigir SECRET_KEY en producción para evitar despliegues inseguros.
if not SECRET_KEY:
    if DEBUG:
        # Valor temporal para desarrollo local cuando no se provee .env
        SECRET_KEY = 'dev-secret-key-change-me'
    else:
        raise ImproperlyConfigured('Missing SECRET_KEY environment variable in production')

# URLs del frontend y backend
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

# ALLOWED_HOSTS
FRONTEND_HOSTNAME = FRONTEND_URL.split('//')[-1].split(':')[0]
BACKEND_HOSTNAME = BACKEND_URL.split('//')[-1].split(':')[0]

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    FRONTEND_HOSTNAME,
    BACKEND_HOSTNAME,
]

ADDITIONAL_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS')
if ADDITIONAL_HOSTS:
    ALLOWED_HOSTS.extend(ADDITIONAL_HOSTS.split(','))


# Definición de la aplicación

INSTALLED_APPS = [
    'jazzmin', 
    'django.contrib.admin',  
    'django.contrib.auth',  
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles', 
    'rest_framework', 
    'django_filters', 
    'rest_framework.authtoken', 
    'corsheaders', # IMPORTANTE: Debe estar aquí
    'HOME', 
    'Abrir_Cerrar_CAJA', 
    'Control_COMPRAS', 
    'Control_VENTAS',
    'Control_STOCK',
    'Fidelizar_CLIENTES',  
    'Analizar_INGRESOS_EGRESOS', 
    'Auditoria', 
    'autenticacion',
    'Config_PR',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [ 
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

# --- CORRECCIÓN 1: ORDEN DEL MIDDLEWARE ---
# CorsMiddleware debe ir lo más arriba posible para interceptar las pre-flight requests
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # <--- MOVIDO AQUÍ (ARRIBA)
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # 'corsheaders.middleware.CorsMiddleware', <--- ELIMINADO DE AQUÍ (ESTABA MAL POSICIONADO)
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'DJANGO_PUERTO_REAL.urls'

WSGI_APPLICATION = 'DJANGO_PUERTO_REAL.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR.parent, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# Validación de contraseña
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Configuración de Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Internacionalización
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Archivos estáticos
STATIC_URL = 'static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR.parent.parent, 'FRONTEND', 'dist', 'assets')
]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuraciones personalizadas
PESOS_POR_PUNTO = 110
LOGIN_REDIRECT_URL = 'home:index_privado_staff'
LOGOUT_REDIRECT_URL = 'home:index_publico'

# --- CORRECCIÓN 2 Y 3: CONFIGURACIÓN CORS Y CSRF ---

# Habilita el envío de cookies y credenciales (Soluciona el error de la foto)
CORS_ALLOW_CREDENTIALS = True 

# Orígenes permitidos explícitamente (Incluyendo tu React en Vite)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Orígenes de confianza para CSRF (Necesario para POST/PUT/DELETE)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Headers permitidos (Opcional, pero recomendado para evitar bloqueos de tokens)
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-csrftoken",
    "authorization",
]

JAZZMIN_SETTINGS = {
    "site_title": "Puerto Real Admin",
    "site_header": "Puerto Real",
    "site_brand": "Puerto Real",
    "welcome_sign": "Bienvenido a Puerto Real",
    "copyright": "Puerto Real Ltd.",
    "theme": "darkly",
}

# --- Seguridad adicional para entornos de producción ---
# Cuando ENVIRONMENT=production, aplicamos ajustes seguros. 
# En desarrollo (ENVIRONMENT=development), no aplicamos SSL redirect.
if ENVIRONMENT == 'production':
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
