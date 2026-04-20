from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import User, AdminActionLog
from apps.catalog.models import Product


class AdminService:
    @staticmethod
    def _create_log(admin, action, target, reason, before_state, after_state):
        return AdminActionLog.objects.create(
            admin_user=admin,
            action=action,
            target_model=target.__class__.__name__,
            target_id=target.id,
            target_name=getattr(target, 'name', getattr(target, 'username', str(target.id))),
            reason=reason,
            before_state=before_state,
            after_state=after_state
        )

    @staticmethod
    def _get_item_snapshot(item):
        """Simple snapshot of the current state of an item."""
        if isinstance(item, User):
            return {
                'username': item.username,
                'email': item.email,
                'is_active': item.is_active,
                'status': item.status
            }
        elif isinstance(item, Product):
            return {
                'name': item.name,
                'is_active': item.is_active,
                'status': item.status
            }
        return {}

    @classmethod
    def suspend_item(cls, admin, item, reason):
        with transaction.atomic():
            before_state = cls._get_item_snapshot(item)
            
            item.status = 'suspended'
            item.is_active = False # Deactivate so it doesn't show up in listings
            item.suspended_at = timezone.now()
            item.appeal_deadline = timezone.now() + timedelta(days=14)
            item.suspension_reason = reason
            item.save()
            
            after_state = cls._get_item_snapshot(item)
            cls._create_log(admin, AdminActionLog.Action.SUSPEND, item, reason, before_state, after_state)

    @classmethod
    def restore_item(cls, admin, item_type, item_id, log_id=None):
        with transaction.atomic():
            if item_type == 'User':
                item = User.objects.get(id=item_id)
            else:
                item = Product.objects.get(id=item_id)
            
            before_state = cls._get_item_snapshot(item)
            
            item.status = 'active'
            item.is_active = True
            item.suspended_at = None
            item.appeal_deadline = None
            item.suspension_reason = None
            item.save()
            
            after_state = cls._get_item_snapshot(item)
            cls._create_log(admin, AdminActionLog.Action.RESTORE, item, 'إلغاء التجميد من قبل المسؤول', before_state, after_state)

    @classmethod
    def finalize_delete(cls, admin, item_type, item_id):
        with transaction.atomic():
            if item_type == 'User':
                item = User.objects.get(id=item_id)
            else:
                item = Product.objects.get(id=item_id)
            
            before_state = cls._get_item_snapshot(item)
            
            # Physical deletion or terminal status
            # For now, we set status to 'deleted' and is_active to False. 
            # In a real SaaS, we keep it for 30 more days then hard delete.
            item.status = 'deleted'
            item.is_active = False
            item.save()
            
            cls._create_log(admin, AdminActionLog.Action.PERMANENT_DELETE, item, 'حذف نهائي بعد مراجعة المسؤول', before_state, {'status': 'deleted'})
            
            # If the user wants a hard delete:
            # item.delete() 
