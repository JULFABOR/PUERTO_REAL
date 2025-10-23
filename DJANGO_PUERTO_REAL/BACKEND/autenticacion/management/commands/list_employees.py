
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from HOME.models import Empleados

class Command(BaseCommand):
    help = 'Lists all users with the "Empleado" role'

    def handle(self, *args, **options):
        try:
            # Assuming the role is determined by the existence of a related Empleados object
            empleado_users = User.objects.filter(empleado__isnull=False)
            
            if not empleado_users.exists():
                self.stdout.write(self.style.WARNING('No users with "Empleado" role found.'))
                return

            self.stdout.write(self.style.SUCCESS('Users with "Empleado" role:'))
            for user in empleado_users:
                self.stdout.write(f'- {user.username}')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {e}'))
