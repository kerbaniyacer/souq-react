from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.catalog.models import ProductVariant
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def _cart_with_prefetch(user):
    """Return cart with all related data prefetched to avoid N+1."""
    cart, _ = Cart.objects.prefetch_related(
        'items__variant__product',
        'items__variant__images',
    ).get_or_create(user=user)
    return cart


@extend_schema(tags=['cart'], summary='جلب السلة')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    cart = get_or_create_cart(request.user)
    return Response(CartSerializer(cart, context={'request': request}).data)


@extend_schema(tags=['cart'], summary='إضافة عنصر للسلة')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_add(request):
    variant_id = request.data.get('variant_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        variant = ProductVariant.objects.get(pk=variant_id, is_active=True)
    except ProductVariant.DoesNotExist:
        return Response({'detail': 'النسخة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

    if variant.stock < quantity:
        return Response({'detail': f'المخزون المتاح: {variant.stock}'}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_or_create_cart(request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
    if not created:
        new_qty = item.quantity + quantity
        if new_qty > variant.stock:
            return Response({'detail': f'لا يمكن إضافة أكثر من {variant.stock} قطعة'}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = new_qty
    else:
        item.quantity = quantity
    item.save()

    return Response(CartSerializer(cart, context={'request': request}).data)


@extend_schema(tags=['cart'], summary='تحديث كمية عنصر')
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cart_item_update(request, item_id):
    quantity = int(request.data.get('quantity', 1))
    try:
        item = CartItem.objects.select_related('variant').get(pk=item_id, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({'detail': 'العنصر غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if quantity < 1:
        item.delete()
    else:
        if quantity > item.variant.stock:
            return Response({'detail': f'المخزون المتاح: {item.variant.stock}'}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = quantity
        item.save()

    cart = get_or_create_cart(request.user)
    return Response(CartSerializer(cart, context={'request': request}).data)


@extend_schema(tags=['cart'], summary='حذف عنصر من السلة')
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_delete(request, item_id):
    try:
        CartItem.objects.get(pk=item_id, cart__user=request.user).delete()
    except CartItem.DoesNotExist:
        return Response({'detail': 'العنصر غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    cart = get_or_create_cart(request.user)
    return Response(CartSerializer(cart, context={'request': request}).data)


@extend_schema(tags=['cart'], summary='إفراغ السلة')
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cart_clear(request):
    cart = get_or_create_cart(request.user)
    cart.items.all().delete()
    return Response(CartSerializer(cart, context={'request': request}).data)
