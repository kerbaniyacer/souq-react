from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer


@extend_schema(tags=['orders'], summary='قائمة طلبات المستخدم')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('items')
    return Response(OrderSerializer(orders, many=True).data)


@extend_schema(tags=['orders'], summary='تفاصيل طلب')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.prefetch_related('items').get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)


@extend_schema(tags=['orders'], summary='إنشاء طلب جديد من السلة')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_create(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = Cart.objects.prefetch_related('items__variant__product').get(user=request.user)
    except Cart.DoesNotExist:
        return Response({'detail': 'السلة فارغة'}, status=status.HTTP_400_BAD_REQUEST)

    cart_items = list(cart.items.all())
    if not cart_items:
        return Response({'detail': 'السلة فارغة'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Check stock for all items before creating
        for ci in cart_items:
            if ci.variant.stock < ci.quantity:
                return Response(
                    {'detail': f'المخزون غير كافٍ لـ {ci.variant.product.name} ({ci.variant.name})'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        subtotal = sum(ci.subtotal for ci in cart_items)
        shipping_cost = 0 if subtotal >= 5000 else 500
        total_amount = subtotal + shipping_cost

        d = serializer.validated_data
        order = Order.objects.create(
            user=request.user,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            payment_method=d['payment_method'],
            shipping_full_name=d['full_name'],
            shipping_phone=d['phone'],
            shipping_wilaya=d['wilaya'],
            shipping_baladia=d['baladia'],
            shipping_address=d['address'],
            notes=d.get('notes', ''),
        )

        for ci in cart_items:
            OrderItem.objects.create(
                order=order,
                variant=ci.variant,
                product_name=ci.variant.product.name,
                variant_name=ci.variant.name,
                variant_attributes=ci.variant.attributes,
                product_price=ci.variant.price,
                quantity=ci.quantity,
                subtotal=ci.subtotal,
            )
            # Deduct stock
            ci.variant.stock -= ci.quantity
            ci.variant.save(update_fields=['stock'])

        # Clear cart after successful order
        cart.items.all().delete()

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['orders'], summary='إلغاء طلب')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if order.status not in (Order.Status.PENDING, Order.Status.CONFIRMED):
        return Response({'detail': 'لا يمكن إلغاء هذا الطلب في حالته الحالية'}, status=status.HTTP_400_BAD_REQUEST)

    order.status = Order.Status.CANCELLED
    order.save(update_fields=['status', 'updated_at'])
    return Response(OrderSerializer(order).data)


@extend_schema(tags=['orders'], summary='تتبع طلب بالرقم')
@api_view(['GET'])
def order_track(request, order_number):
    try:
        order = Order.objects.prefetch_related('items').get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'رقم الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)


# ── Merchant order views ──────────────────────────────────────────────────

@extend_schema(tags=['merchant'], summary='طلبات التاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_order_list(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)
    orders = Order.objects.filter(
        items__variant__product__seller=request.user
    ).distinct().prefetch_related('items')
    return Response(OrderSerializer(orders, many=True).data)


@extend_schema(tags=['merchant'], summary='تحديث حالة الطلب')
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def merchant_order_status(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(
            pk=pk, items__variant__product__seller=request.user
        )
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in Order.Status.values:
        return Response({'detail': 'حالة غير صالحة'}, status=status.HTTP_400_BAD_REQUEST)

    order.status = new_status
    order.save(update_fields=['status', 'updated_at'])
    return Response(OrderSerializer(order).data)
