from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.cart.models import Cart
from .models import Order, OrderItem, PaymentProof
from .serializers import OrderSerializer, OrderCreateSerializer, PaymentProofSerializer


@extend_schema(
    tags=['orders'],
    summary='قائمة الطلبات',
    parameters=[
        OpenApiParameter('user', int, description='فلترة بحسب المشتري (للمسؤولين)'),
        OpenApiParameter('seller', int, description='فلترة بحسب التاجر (للمسؤولين)'),
    ]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    if request.user.is_staff:
        orders = Order.objects.all().prefetch_related('items').order_by('-created_at')
        
        user_id = request.query_params.get('user')
        if user_id:
            orders = orders.filter(user_id=user_id)
            
        seller_id = request.query_params.get('seller')
        if seller_id:
            # Filter orders containing at least one item from this seller
            orders = orders.filter(items__variant__product__seller_id=seller_id).distinct()
    else:
        orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
    return Response(OrderSerializer(orders, many=True).data)


@extend_schema(tags=['orders'], summary='تفاصيل طلب')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        if request.user.is_staff:
            order = Order.objects.prefetch_related('items', 'proofs').get(pk=pk)
        else:
            order = Order.objects.prefetch_related('items', 'proofs').get(pk=pk, user=request.user)
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

        # ── Send Emails ──────────────────────────────────────────────────────
        try:
            from django.core.mail import send_mail
            from apps.accounts.utils import get_order_email_html
            from collections import defaultdict

            # 1. Customer Confirmation
            items_data = [
                {'product_name': item.product_name, 'quantity': item.quantity, 'subtotal': float(item.subtotal)}
                for item in order.items.all()
            ]
            cust_html = get_order_email_html(False, order.order_number, float(order.total_amount), items_data)
            send_mail(
                f'تأكيد طلبك رقم {order.order_number} - سوق 🎉',
                f'شكراً لطلبك من سوق! رقم الطلب: {order.order_number}',
                'noreply@souq.dz',
                [request.user.email],
                fail_silently=True,
                html_message=cust_html
            )

            # 2. Merchant Notifications
            # Group items by merchant email
            merchant_orders = defaultdict(list)
            for item in order.items.all():
                merchant_email = item.variant.product.seller.email
                merchant_orders[merchant_email].append({
                    'product_name': item.product_name, 
                    'quantity': item.quantity, 
                    'subtotal': float(item.subtotal)
                })

            for m_email, m_items in merchant_orders.items():
                m_total = sum(i['subtotal'] for i in m_items)
                m_html = get_order_email_html(True, order.order_number, m_total, m_items)
                send_mail(
                    f'طلب جديد رقم {order.order_number} - سوق 🛒',
                    f'لديك طلب جديد في متجرك! رقم الطلب: {order.order_number}',
                    'noreply@souq.dz',
                    [m_email],
                    fail_silently=True,
                    html_message=m_html
                )

        except Exception as e:
            print(f"Error sending order emails: {e}")

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
    
    
@extend_schema(tags=['orders'], summary='رفع وصل الدفع (CCP/BaridiMob)')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_proof_upload(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_method not in (Order.PaymentMethod.CCP, Order.PaymentMethod.BARIDIMOB):
        return Response({'detail': 'هذا الطلب لا يتطلب وصل دفع بريدي'}, status=status.HTTP_400_BAD_REQUEST)

    seller_id = request.data.get('seller_id')
    if not seller_id:
        return Response({'detail': 'يجب تحديد التاجر المراد الدفع له'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify seller is part of this order
    if not OrderItem.objects.filter(order=order, variant__product__seller_id=seller_id).exists():
        return Response({'detail': 'هذا التاجر ليس جزءاً من هذا الطلب'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES.get('image')
    if not image:
        return Response({'detail': 'يجب توفير صورة الوصل'}, status=status.HTTP_400_BAD_REQUEST)

    # Create new proof linked to seller
    proof = PaymentProof.objects.create(
        order=order,
        seller_id=seller_id,
        image=image,
        transaction_id=request.data.get('transaction_id', ''),
        amount=request.data.get('amount') or None,
    )

    # Update order status to reflect that at least one proof was uploaded
    order.payment_status = Order.PaymentStatus.PROOF_UPLOADED
    order.save(update_fields=['payment_status', 'updated_at'])

    return Response(OrderSerializer(order).data)


@extend_schema(tags=['merchant'], summary='تأكيد الدفع')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_proof_approve(request, pk):
    # Here pk is the PaymentProof ID
    try:
        proof = PaymentProof.objects.get(pk=pk, seller=request.user)
    except PaymentProof.DoesNotExist:
        return Response({'detail': 'إثبات الدفع غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        proof.status = PaymentProof.Status.APPROVED
        proof.save(update_fields=['status', 'updated_at'])

        order = proof.order
        
        # Check if ALL sellers in this order have an approved proof
        # 1. Get all unique sellers for this order
        involved_sellers = set(OrderItem.objects.filter(order=order).values_list('variant__product__seller_id', flat=True))
        
        # 2. Get all approved sellers for this order
        approved_sellers = set(PaymentProof.objects.filter(order=order, status=PaymentProof.Status.APPROVED).values_list('seller_id', flat=True))
        
        if involved_sellers.issubset(approved_sellers):
            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=['payment_status', 'status', 'updated_at'])

    return Response(OrderSerializer(order).data)


@extend_schema(tags=['merchant'], summary='رفض الدفع')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_proof_reject(request, pk):
    try:
        proof = PaymentProof.objects.get(pk=pk, seller=request.user)
    except PaymentProof.DoesNotExist:
        return Response({'detail': 'إثبات الدفع غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', '')
    if not reason:
        return Response({'detail': 'يجب ذكر سبب الرفض'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        proof.status = PaymentProof.Status.REJECTED
        proof.rejection_reason = reason
        proof.save(update_fields=['status', 'rejection_reason', 'updated_at'])

        order = proof.order
        order.payment_status = Order.PaymentStatus.REJECTED
        order.save(update_fields=['payment_status', 'updated_at'])

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
    ).distinct().prefetch_related('items', 'proofs')
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


@extend_schema(tags=['merchant'], summary='تفاصيل طلب التاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_order_detail(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    try:
        # Check if the order contains at least one item from this seller
        order = Order.objects.prefetch_related('items', 'proofs').get(
            pk=pk, items__variant__product__seller=request.user
        )
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    # Filter items and proofs to only show those belonging to this merchant
    data = OrderSerializer(order).data
    data['items'] = [i for i in data['items'] if i['seller_id'] == request.user.id]
    data['proofs'] = [p for p in data['proofs'] if p['seller'] == request.user.id]
    
    return Response(data)
