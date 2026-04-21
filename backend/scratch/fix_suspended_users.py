import os
import sys
import django

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User

def fix_suspended_users():
    suspended_users = User.objects.filter(status='suspended', is_active=False)
    count = suspended_users.count()
    if count == 0:
        print("No suspended inactive users found.")
        return

    print(f"Found {count} suspended users who are inactive. Fixing...")
    
    updated = User.objects.filter(status='suspended', is_active=False).update(is_active=True)
    
    print(f"Successfully reactivated {updated} suspended users.")

if __name__ == "__main__":
    fix_suspended_users()
