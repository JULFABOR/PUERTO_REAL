
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Resets the password for a given user.'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='The username of the user whose password to reset')
        parser.add_argument('new_password', type=str, help='The new password')

    def handle(self, *args, **options):
        username = options['username']
        new_password = options['new_password']

        try:
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Password for user "{username}" has been reset successfully.'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" not found.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {e}'))
