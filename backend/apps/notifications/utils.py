from .models import Notification

def create_notification(user, n_type, title, message, related_id='', related_type=''):
    """
    Helper function to create a notification for a user.
    """
    return Notification.objects.create(
        user=user,
        type=n_type,
        title=title,
        message=message,
        related_id=str(related_id),
        related_type=related_type
    )

def notify_followers(seller, title, message, related_id='', related_type=''):
    """
    Notify all followers of a seller.
    """
    from apps.accounts.models import Follow
    followers = Follow.objects.filter(following=seller)
    notifications = []
    for f in followers:
        notifications.append(
            Notification(
                user=f.follower,
                type=Notification.Type.NEW_PRODUCT,
                title=title,
                message=message,
                related_id=str(related_id),
                related_type=related_type
            )
        )
    if notifications:
        Notification.objects.bulk_create(notifications)
