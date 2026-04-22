from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.catalog.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer


@extend_schema(tags=['wishlist'], summary='جلب المفضلة')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wishlist_list(request):
    items = WishlistItem.objects.filter(user=request.user).select_related(
        'product__category', 'product__brand'
    ).prefetch_related('product__variants')
    return Response(WishlistItemSerializer(items, many=True, context={'request': request}).data)


@extend_schema(tags=['wishlist'], summary='إضافة منتج للمفضلة')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def wishlist_add(request):
    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(pk=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({'detail': 'المنتج غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if product.seller_id == request.user.id:
        return Response({'detail': 'لا يمكنك إضافة منتجك إلى المفضلة'}, status=status.HTTP_400_BAD_REQUEST)

    item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        return Response({'detail': 'المنتج موجود في المفضلة بالفعل'}, status=status.HTTP_200_OK)
    return Response(WishlistItemSerializer(item, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['wishlist'], summary='حذف منتج من المفضلة')
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def wishlist_remove(request, product_id):
    deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
    if not deleted:
        return Response({'detail': 'المنتج غير موجود في المفضلة'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)
