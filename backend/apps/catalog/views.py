from django.utils import timezone
from django.db.models import Q, Sum, Min, Max
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Category, Brand, Product, ProductVariant
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer,
    ProductVariantSerializer,
)


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48


# ── Categories ──────────────────────────────────────────────────────────────

@extend_schema(tags=['catalog'], summary='قائمة الأقسام')
@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    qs = Category.objects.filter(is_active=True, parent=None).prefetch_related('children')
    return Response(CategorySerializer(qs, many=True, context={'request': request}).data)


@extend_schema(tags=['catalog'], summary='تفاصيل قسم')
@api_view(['GET'])
@permission_classes([AllowAny])
def category_detail(request, slug):
    try:
        cat = Category.objects.get(slug=slug, is_active=True)
    except Category.DoesNotExist:
        return Response({'detail': 'القسم غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    return Response(CategorySerializer(cat, context={'request': request}).data)


# ── Brands ──────────────────────────────────────────────────────────────────

@extend_schema(tags=['catalog'], summary='قائمة العلامات التجارية')
@api_view(['GET'])
@permission_classes([AllowAny])
def brand_list(request):
    qs = Brand.objects.all()
    return Response(BrandSerializer(qs, many=True, context={'request': request}).data)


@extend_schema(tags=['catalog'], summary='تفاصيل علامة تجارية')
@api_view(['GET'])
@permission_classes([AllowAny])
def brand_detail(request, slug):
    try:
        brand = Brand.objects.get(slug=slug)
    except Brand.DoesNotExist:
        return Response({'detail': 'العلامة التجارية غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    return Response(BrandSerializer(brand, context={'request': request}).data)


# ── Products ─────────────────────────────────────────────────────────────────

@extend_schema(
    tags=['catalog'],
    summary='قائمة المنتجات',
    parameters=[
        OpenApiParameter('search', str, description='بحث نصي'),
        OpenApiParameter('category', str, description='slug القسم'),
        OpenApiParameter('brand', str, description='slug العلامة التجارية'),
        OpenApiParameter('is_featured', bool, description='المنتجات المميزة'),
        OpenApiParameter('ordering', str, description='-price, price, -created_at, rating'),
        OpenApiParameter('page', int), OpenApiParameter('page_size', int),
    ],
)
@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    # Auto-publish products whose 24h review window has expired
    from django.utils import timezone
    Product.objects.filter(
        status='under_review',
        review_deadline__lt=timezone.now()
    ).update(status='active', is_active=True, review_deadline=None)

    # Staff can see all products if include_inactive is passed
    include_inactive = request.query_params.get('include_inactive') == 'true'

    if request.user.is_staff and include_inactive:
        qs = Product.objects.all()
    else:
        qs = Product.objects.filter(is_active=True)

    qs = qs.annotate(
        min_price=Min('variants__price'),
        max_price=Max('variants__price')
    ).select_related(
        'category', 'brand', 'seller__profile'
    ).prefetch_related('variants', 'variant_images__variants')

    search = request.query_params.get('search')
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

    category = request.query_params.get('category')
    if category:
        # Include products in the category OR any of its children
        qs = qs.filter(
            Q(category__slug=category) |
            Q(category__parent__slug=category)
        )

    brand = request.query_params.get('brand')
    if brand:
        qs = qs.filter(brand__slug=brand)

    seller = request.query_params.get('seller')
    if seller:
        qs = qs.filter(seller_id=seller)

    is_featured = request.query_params.get('is_featured')
    if is_featured in ('true', '1', 'True'):
        qs = qs.filter(is_featured=True)

    ordering = request.query_params.get('ordering', '-created_at')
    allowed = {'price', '-price', 'created_at', '-created_at', 'rating', '-rating', 'sold_count', '-sold_count'}
    if ordering in allowed:
        qs = qs.order_by(ordering)

    paginator = ProductPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = ProductListSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['catalog'], summary='تفاصيل منتج')
@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, slug):
    try:
        product = Product.objects.select_related(
            'category', 'brand', 'seller__profile'
        ).prefetch_related(
            'variants', 'variant_images__variants', 'attributes'
        ).get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return Response({'detail': 'المنتج غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ProductDetailSerializer(product, context={'request': request}).data)


# ── Merchant product management ──────────────────────────────────────────────

@extend_schema(tags=['merchant'], summary='منتجات التاجر')
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def merchant_product_list(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        qs = Product.objects.filter(seller=request.user).annotate(
            min_price=Min('variants__price'),
            max_price=Max('variants__price')
        ).select_related(
            'category', 'brand'
        ).prefetch_related('variants')
        return Response(ProductListSerializer(qs, many=True, context={'request': request}).data)

    serializer = ProductWriteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        product = serializer.save(seller=request.user)

        # Put product under 24h admin review before publishing
        from django.utils import timezone
        from datetime import timedelta
        product.status = Product.Status.UNDER_REVIEW
        product.is_active = False
        product.review_deadline = timezone.now() + timedelta(hours=24)
        product.save(update_fields=['status', 'is_active', 'review_deadline'])

        # Notify followers (will see it after review)
        try:
            from apps.notifications.utils import notify_followers
            notify_followers(
                seller=request.user,
                title='منتج جديد',
                message=f'تم إضافة منتج جديد: {product.name} من قبل {request.user.username}',
                related_id=product.id,
                related_type='product'
            )
        except Exception as e:
            print(f"Error notifying followers: {e}")

        # Notify all admins of new product awaiting review
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification
            from apps.accounts.models import User as UserModel
            from django.core.mail import send_mail
            admins = UserModel.objects.filter(is_staff=True)
            for admin in admins:
                create_notification(
                    user=admin,
                    n_type=Notification.Type.NEW_PRODUCT_REVIEW,
                    title='منتج جديد بانتظار المراجعة',
                    message=f'أضاف التاجر @{request.user.username} منتجاً جديداً "{product.name}" يحتاج إلى مراجعة خلال 24 ساعة.',
                    related_id=str(product.id),
                    related_type='product'
                )
            send_mail(
                f'🆕 منتج جديد بانتظار المراجعة: {product.name}',
                f'أضاف التاجر @{request.user.username} منتجاً جديداً "{product.name}".\nيُرجى المراجعة خلال 24 ساعة وإلا سيُنشر تلقائياً.',
                'noreply@souq.dz',
                [a.email for a in admins if a.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error notifying admins of new product: {e}")

        return Response(
            ProductDetailSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['merchant'], summary='تعديل/حذف منتج التاجر')
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def merchant_product_detail(request, pk):
    """Handles product detail, update, and deletion. Deletion by staff requires a reason."""
    try:
        if request.user.is_staff:
            product = Product.objects.get(pk=pk)
        else:
            product = Product.objects.get(pk=pk, seller=request.user)
    except Product.DoesNotExist:
        return Response({'detail': 'المنتج غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductDetailSerializer(product, context={'request': request}).data)

    if request.method == 'PATCH':
        is_active_before = product.is_active
        # Merchants can edit their own, staff can edit any
        serializer = ProductWriteSerializer(product, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated = serializer.save()
            
            # If admin changed visibility, log and notify
            is_active_after = updated.is_active
            if is_active_before != is_active_after and request.user.is_staff:
                from apps.accounts.services import AdminService
                from apps.accounts.models import AdminActionLog
                from apps.accounts.utils import get_product_visibility_email_html
                from django.core.mail import send_mail

                # 1. Log Action
                AdminService._create_log(
                    admin=request.user,
                    action=AdminActionLog.Action.SUSPEND if not is_active_after else 'restore',
                    target=updated,
                    reason='تغيير حالة الظهور من قبل المسؤول.',
                    before_state={'is_active': is_active_before},
                    after_state={'is_active': is_active_after}
                )

                # 2. Update suspension fields so it can be appealed
                if not is_active_after:
                    updated.suspended_at = timezone.now()
                    from datetime import timedelta
                    updated.appeal_deadline = timezone.now() + timedelta(days=14)
                    updated.suspension_reason = 'تغيير حالة الظهور من قبل المسؤول.'
                else:
                    # If admin restored visibility, clear suspension fields
                    updated.status = 'active'
                    updated.suspended_at = None
                    updated.appeal_deadline = None
                    updated.suspension_reason = None
                updated.save()

                # 2. Notify Merchant — email + in-app
                try:
                    email_html = get_product_visibility_email_html(updated.seller.username, updated.name, is_active_after)
                    send_mail(
                        f"تحديث بخصوص ظهور منتجك: {updated.name}",
                        f"تم {'تفعيل' if is_active_after else 'إخفاء'} منتجك من قبل الإدارة.",
                        'noreply@souq.dz',
                        [updated.seller.email],
                        fail_silently=True,
                        html_message=email_html
                    )
                    from apps.notifications.utils import create_notification
                    from apps.notifications.models import Notification as NotifModel
                    create_notification(
                        user=updated.seller,
                        n_type=NotifModel.Type.PRODUCT_VISIBILITY_CHANGE,
                        title='تغيير في ظهور منتجك' if not is_active_after else 'تم تفعيل منتجك',
                        message=f'تم {"إخفاء" if not is_active_after else "إعادة نشر"} منتجك "{updated.name}" من قبل الإدارة.' + ('' if is_active_after else ' يمكنك تقديم طعن.'),
                        related_id=str(updated.id),
                        related_type='product'
                    )
                except Exception as e:
                    print(f"Error sending visibility email: {e}")

            return Response(ProductDetailSerializer(updated, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        reason = request.data.get('reason', 'مخالفة سياسة النشر.')
        
        from apps.accounts.services import AdminService
        AdminService.suspend_item(request.user, product, reason)
        
        # Notify seller
        try:
            from django.core.mail import send_mail
            from apps.accounts.utils import get_product_deleted_email_html
            email_html = get_product_deleted_email_html(product.seller.username, product.name, reason)
            send_mail(
                f'إشعار بخصوص منتجك: {product.name}',
                f'تم تعليق منتجك "{product.name}" لسبب: {reason}. يمكنك تقديم طعن خلال 14 يوماً.',
                'noreply@souq.dz',
                [product.seller.email],
                fail_silently=True,
                html_message=email_html
            )
        except Exception as e:
            print(f"Error sending product deletion email: {e}")

        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Merchant Dashboard ───────────────────────────────────────────────────────

@extend_schema(tags=['merchant'], summary='لوحة تحكم التاجر')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_dashboard(request):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    from apps.orders.models import Order

    products = Product.objects.filter(seller=request.user)
    # Orders that contain at least one product by this seller
    orders = Order.objects.filter(
        items__variant__product__seller=request.user
    ).distinct()

    # Revenue: optimized calculation via aggregation
    total_revenue = Order.objects.filter(
        status=Order.Status.DELIVERED,
        items__variant__product__seller=request.user
    ).aggregate(total=Sum('items__subtotal'))['total'] or 0

    return Response({
        'products_count':   products.count(),
        'active_products':  products.filter(is_active=True).count(),
        'suspended_products_count': products.filter(status=Product.Status.SUSPENDED).count(),
        'total_orders':     orders.count(),
        'pending_orders':   orders.filter(status=Order.Status.PENDING).count(),
        'processing_orders': orders.filter(status__in=[
            Order.Status.CONFIRMED, Order.Status.PROCESSING
        ]).count(),
        'delivered_orders': orders.filter(status=Order.Status.DELIVERED).count(),
        'total_revenue':    float(total_revenue),
        'low_stock_count':  products.filter(variants__stock__lte=5, variants__stock__gt=0).distinct().count(),
        'out_of_stock_count': products.filter(variants__stock=0).distinct().count(),
    })
