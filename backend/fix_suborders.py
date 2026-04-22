import os
import django
import decimal
from collections import defaultdict

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order, SubOrder, OrderItem

def fix():
    for order in Order.objects.all():
        if not order.sub_orders.exists():
            print(f'Creating suborders for Order {order.order_number}')
            merchant_subtotals = defaultdict(decimal.Decimal)
            for item in order.items.all():
                if item.variant:
                    merchant_subtotals[item.variant.product.seller] += item.subtotal
            
            for seller, amount in merchant_subtotals.items():
                sub, created = SubOrder.objects.get_or_create(
                    order=order, 
                    seller=seller, 
                    defaults={'subtotal': amount, 'status': order.status}
                )
                if created:
                    print(f'  - Created SubOrder for {seller.username}')
                
                # Link items
                for item in order.items.all():
                    if item.variant and item.variant.product.seller == seller:
                        item.sub_order = sub
                        item.save()
            print(f'  - Done for Order {order.order_number}')

if __name__ == '__main__':
    fix()
