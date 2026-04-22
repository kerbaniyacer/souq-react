from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from drf_spectacular.utils import extend_schema
from .models import Order, OrderItem, PaymentProof, SubOrder
from apps.cart.models import Cart
from .serializers import OrderSerializer, OrderCreateSerializer, PaymentProofSerializer, SubOrderSerializer
from apps.catalog.models import Product


@extend_schema(tags=['orders'], summary='قائمة طلبات المستخدم')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    if request.user.is_staff:
        orders = Order.objects.all()
    else:
        orders = Order.objects.filter(user=request.user)
    return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


@extend_schema(tags=['orders'], summary='تفاصيل الطلب')
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
    return Response(OrderSerializer(order, context={'request': request}).data)


@extend_schema(tags=['orders'], summary='تتبع الطلب برقم الطلب')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_track(request, order_number):
    try:
        order = Order.objects.prefetch_related('items').get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'رقم الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order, context={'request': request}).data)


@extend_schema(tags=['orders'], summary='إلغاء الطلب من طرف المشتري')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    if order.status not in [Order.Status.PENDING, Order.Status.CONFIRMED]:
        return Response({'detail': 'لا يمكن إلغاء الطلب في هذه المرحلة'}, status=status.HTTP_400_BAD_REQUEST)
        
    order.status = Order.Status.CANCELLED
    order.save()
    
    # Also cancel all suborders
    order.sub_orders.all().update(status=SubOrder.Status.CANCELLED)
    
    return Response(OrderSerializer(order, context={'request': request}).data)


@extend_schema(tags=['orders'], summary='تأكيد الاستلام من طرف المشتري (إشعار البائع)')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_confirm_receipt(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    # Send email to all sellers in this order
    from django.core.mail import send_mail
    from apps.accounts.models import User
    
    # Get unique sellers
    seller_ids = OrderItem.objects.filter(order=order).values_list('variant__product__seller_id', flat=True).distinct()
    sellers = User.objects.filter(id__in=seller_ids)
    
    for seller in sellers:
        subject = f"تأكيد استلام الطلب #{order.order_number}"
        message = f"أهلاً {seller.username}، لقد قام المشتري بتأكيد استلام المنتجات الخاصة بالطلب #{order.order_number}. يرجى مراجعة حالة الطلب وتحديثها إلى 'تم التسليم' في لوحة التحكم الخاصة بك."
        
        try:
            send_mail(
                subject,
                message,
                'noreply@souq.dz',
                [seller.email],
                fail_silently=True,
            )
        except:
            pass

    return Response({'detail': 'تم إرسال إشعار الاستلام إلى البائعين بنجاح'})


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

    # Find the corresponding SubOrder
    sub_order = SubOrder.objects.filter(order=order, seller_id=seller_id).first()

    # Create new proof linked to seller and sub_order
    proof = PaymentProof.objects.create(
        order=order,
        sub_order=sub_order,
        seller_id=seller_id,
        image=image,
        transaction_id=request.data.get('transaction_id', ''),
        amount=request.data.get('amount') or None,
    )

    # Update order status to reflect that at least one proof was uploaded
    order.payment_status = Order.PaymentStatus.PROOF_UPLOADED
    order.save(update_fields=['payment_status', 'updated_at'])

    return Response(OrderSerializer(order, context={'request': request}).data)


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

        from collections import defaultdict
        import decimal

        merchant_subtotals = defaultdict(decimal.Decimal)
        for ci in cart_items:
            merchant_subtotals[ci.variant.product.seller] += ci.subtotal
            OrderItem.objects.create(
                order=order,
                variant=ci.variant,
                product_name=ci.variant.product.name,
                variant_name=ci.variant.name,
                variant_attributes=ci.variant.attributes,
                product_price=ci.variant.price,
                quantity=ci.quantity,
                subtotal=ci.subtotal
            )
            # Update stock
            ci.variant.stock -= ci.quantity
            ci.variant.save()

        # Create SubOrders for each merchant
        from apps.notifications.utils import create_notification
        from apps.notifications.models import Notification

        for seller, amount in merchant_subtotals.items():
            sub_order = SubOrder.objects.create(
                order=order,
                seller=seller,
                subtotal=amount
            )
            # Notify Merchant
            try:
                create_notification(
                    user=seller,
                    n_type=Notification.Type.NEW_ORDER,
                    title='طلب جديد',
                    message=f'لقد استلمت طلباً جديداً #{order.order_number}',
                    related_id=order.id,
                    related_type='order'
                )
            except Exception as e:
                print(f"Error notifying merchant: {e}")
            
        # Link items to suborders
        for item in order.items.all():
            seller = item.variant.product.seller
            sub_order = SubOrder.objects.get(order=order, seller=seller)
            item.sub_order = sub_order
            item.save()

        # Clear cart
        cart.items.all().delete()

    return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['merchant'], summary='قائمة الطلبات للتاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_order_list(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)
    
    # Orders that contain products from this seller
    orders = Order.objects.filter(items__variant__product__seller=request.user).distinct().order_by('-created_at')
    return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


@extend_schema(tags=['merchant'], summary='تفاصيل الطلب للتاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_order_detail(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        order = Order.objects.prefetch_related('items', 'proofs').get(pk=pk, items__variant__product__seller=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'الطلب غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(OrderSerializer(order, context={'request': request}).data)


@extend_schema(tags=['merchant'], summary='تحديث حالة الطلب (من طرف التاجر)')
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def merchant_order_status(request, pk):
    # This might be deprecated in favor of suborder status updates
    return Response({'detail': 'يرجى تحديث حالة الطلب الفرعي بدلاً من ذلك'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['merchant'], summary='تأكيد الدفع')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merchant_approve_payment(request, pk):
    # This pk is PaymentProof ID
    try:
        proof = PaymentProof.objects.get(pk=pk, seller=request.user)
    except PaymentProof.DoesNotExist:
        return Response({'detail': 'إثبات الدفع غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    proof.status = PaymentProof.Status.APPROVED
    proof.save()

    # Update order status if all sellers approved
    order = proof.order
    sellers_in_order = OrderItem.objects.filter(order=order).values_list('variant__product__seller_id', flat=True).distinct()
    approved_sellers = PaymentProof.objects.filter(order=order, status=PaymentProof.Status.APPROVED).values_list('seller_id', flat=True).distinct()
    
    if set(sellers_in_order).issubset(set(approved_sellers)):
        order.payment_status = Order.PaymentStatus.PAID
        order.save()

    return Response({'detail': 'تم تأكيد استلام الدفع بنجاح'})


@extend_schema(tags=['merchant'], summary='رفض الوصل')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merchant_reject_payment(request, pk):
    try:
        proof = PaymentProof.objects.get(pk=pk, seller=request.user)
    except PaymentProof.DoesNotExist:
        return Response({'detail': 'إثبات الدفع غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', '')
    if not reason:
        return Response({'detail': 'يجب ذكر سبب الرفض'}, status=status.HTTP_400_BAD_REQUEST)

    proof.status = PaymentProof.Status.REJECTED
    proof.rejection_reason = reason
    proof.save()

    order = proof.order
    order.payment_status = Order.PaymentStatus.REJECTED
    order.save()

    return Response({'detail': 'تم رفض الوصل'})


@extend_schema(tags=['merchant'], summary='قائمة الطلبات الفرعية للتاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_suborder_list(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)
    
    sub_orders = SubOrder.objects.filter(seller=request.user).order_by('-created_at')
    return Response(SubOrderSerializer(sub_orders, many=True, context={'request': request}).data)


@extend_schema(tags=['merchant'], summary='إحصائيات التاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_stats(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    products_qs = Product.objects.filter(seller=request.user)
    order_items_qs = OrderItem.objects.filter(
        sub_order__seller=request.user,
        sub_order__status__in=[
            SubOrder.Status.CONFIRMED,
            SubOrder.Status.PROCESSING,
            SubOrder.Status.SHIPPED,
            SubOrder.Status.DELIVERED,
        ],
    )
    sub_orders_qs = SubOrder.objects.filter(seller=request.user)

    revenue = order_items_qs.aggregate(total=Sum('subtotal'))['total'] or 0
    orders_count = sub_orders_qs.count()
    products_count = products_qs.count()
    active_products = products_qs.filter(is_active=True, status=Product.Status.ACTIVE).count()
    suspended_products_count = products_qs.filter(status=Product.Status.SUSPENDED).count()
    pending_orders = sub_orders_qs.filter(status=SubOrder.Status.PENDING).count()

    sales_history = list(
        order_items_qs
        .annotate(date=TruncDate('order__created_at'))
        .values('date')
        .annotate(
            revenue=Sum('subtotal'),
            orders=Count('order', distinct=True),
        )
        .order_by('date')[:30]
    )

    top_products_raw = list(
        order_items_qs
        .values(product_id=F('variant__product_id'), name=F('product_name'))
        .annotate(
            sales=Sum('quantity'),
            revenue=Sum('subtotal'),
        )
        .order_by('-sales', '-revenue')[:5]
    )

    top_products = [
        {
            'id': p['product_id'],
            'name': p['name'],
            'sales': p['sales'],
            'revenue': p['revenue']
        }
        for p in top_products_raw
    ]

    return Response({
        'revenue': revenue,
        'orders_count': orders_count,
        'products_count': products_count,
        'active_products': active_products,
        'suspended_products_count': suspended_products_count,
        'pending_orders': pending_orders,
        'sales_history': sales_history,
        'top_products': top_products,
    })


@extend_schema(tags=['merchant'], summary='تحديث حالة الطلب الفرعي')
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def sub_order_update_status(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    try:
        sub_order = SubOrder.objects.get(pk=pk, seller=request.user)
    except SubOrder.DoesNotExist:
        return Response({'detail': 'الطلب الفرعي غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in SubOrder.Status.values:
        return Response({'detail': 'حالة غير صالحة'}, status=status.HTTP_400_BAD_REQUEST)

    sub_order.status = new_status
    sub_order.save(update_fields=['status', 'updated_at'])
    
    # Notify User
    try:
        from apps.notifications.utils import create_notification
        from apps.notifications.models import Notification
        create_notification(
            user=sub_order.order.user,
            n_type=Notification.Type.ORDER_STATUS_UPDATE,
            title='تحديث حالة الطلب',
            message=f'تم تحديث حالة طلبك #{sub_order.order.order_number} إلى "{sub_order.get_status_display()}"',
            related_id=sub_order.order.id,
            related_type='order'
        )
    except Exception as e:
        print(f"Error notifying user about status update: {e}")
    
    # Aggregate main order status
    main_order = sub_order.order
    all_subs = main_order.sub_orders.all()
    statuses = [s.status for s in all_subs]
    
    if all(s == SubOrder.Status.DELIVERED for s in statuses):
        main_order.status = Order.Status.DELIVERED
    elif all(s == SubOrder.Status.CANCELLED for s in statuses):
        main_order.status = Order.Status.CANCELLED
    elif any(s == SubOrder.Status.PROCESSING for s in statuses):
        main_order.status = Order.Status.PROCESSING
    elif all(s in [SubOrder.Status.CONFIRMED, SubOrder.Status.PROCESSING, SubOrder.Status.SHIPPED, SubOrder.Status.DELIVERED] for s in statuses):
        main_order.status = Order.Status.CONFIRMED
    
    main_order.save(update_fields=['status', 'updated_at'])
    
    return Response(SubOrderSerializer(sub_order, context={'request': request}).data)


@extend_schema(tags=['merchant'], summary='تفاصيل طلب فرعي')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_suborder_detail(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    try:
        sub_order = SubOrder.objects.prefetch_related('items', 'proofs').get(pk=pk, seller=request.user)
    except SubOrder.DoesNotExist:
        return Response({'detail': 'الطلب الفرعي غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    return Response(SubOrderSerializer(sub_order, context={'request': request}).data)
