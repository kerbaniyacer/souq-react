import os
import django
import sys

# Add the backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.accounts.models import User

def fix_user_status():
    print("--- Starting User Status Synchronization ---")
    
    # 1. Users who are 'active' but is_active is False
    # These users get 401 Unauthorized incorrectly
    affected_users = User.objects.filter(status='active', is_active=False)
    count = affected_users.count()
    
    if count > 0:
        print(f"Found {count} users with status='active' but is_active=False. Fixing...")
        for user in affected_users:
            user.is_active = True
            user.save()
            print(f"  Fixed user: {user.email}")
    else:
        print("No desynchronized active users found.")
    
    # 2. Users who are 'suspended' but is_active is True
    # (This is actually the desired state for our system to allow appeals, 
    # but we check it for logging purposes)
    suspended_count = User.objects.filter(status='suspended', is_active=True).count()
    print(f"Information: {suspended_count} suspended users are currently active (can access appeal pages).")

    print("--- Cleanup Complete ---")

if __name__ == "__main__":
    fix_user_status()
