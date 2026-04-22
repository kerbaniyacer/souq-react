import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.orders.models import Order, OrderItem, SubOrder
from apps.accounts.models import User

user = User.objects.get(username='admin')
print(f"Merchant: {user.username}")

from django.db.models import Sum
from apps.orders.models import SubOrder, OrderItem

order_items_qs = OrderItem.objects.filter(
    sub_order__seller=user,
    sub_order__status__in=[
        SubOrder.Status.CONFIRMED,
        SubOrder.Status.PROCESSING,
        SubOrder.Status.SHIPPED,
        SubOrder.Status.DELIVERED,
    ],
)

revenue = order_items_qs.aggregate(total=Sum('subtotal'))['total'] or 0
print(f"\nCalculated Revenue: {revenue}")
print(f"Items included: {order_items_qs.count()}")
for item in order_items_qs:
    print(f"  - Item ID: {item.id} | Status: {item.sub_order.status} | Subtotal: {item.subtotal}")
