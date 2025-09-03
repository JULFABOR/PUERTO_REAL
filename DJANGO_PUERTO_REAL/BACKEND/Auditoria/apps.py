from django.apps import AppConfig


class AuditoriaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Auditoria'

    def ready(self):
        """
        Importa las señales cuando la aplicación está lista.
        """
        import Auditoria.signals