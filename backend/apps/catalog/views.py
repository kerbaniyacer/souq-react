from django.db.models import Q
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
    qs = Brand.objects.filter(is_active=True)
    return Response(BrandSerializer(qs, many=True, context={'request': request}).data)


@extend_schema(tags=['catalog'], summary='تفاصيل علامة تجارية')
@api_view(['GET'])
@permission_classes([AllowAny])
def brand_detail(request, slug):
    try:
        brand = Brand.objects.get(slug=slug, is_active=True)
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
    qs = Product.objects.filter(is_active=True).select_related(
        'category', 'brand', 'seller__profile'
    ).prefetch_related('variants')

    search = request.query_params.get('search')
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

    category = request.query_params.get('category')
    if category:
        qs = qs.filter(category__slug=category)

    brand = request.query_params.get('brand')
    if brand:
        qs = qs.filter(brand__slug=brand)

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
        ).prefetch_related('variants', 'images', 'attributes').get(slug=slug, is_active=True)
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
        qs = Product.objects.filter(seller=request.user).select_related(
            'category', 'brand'
        ).prefetch_related('variants')
        return Response(ProductListSerializer(qs, many=True, context={'request': request}).data)

    serializer = ProductWriteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        product = serializer.save(seller=request.user)
        return Response(
            ProductDetailSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['merchant'], summary='تعديل/حذف منتج التاجر')
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def merchant_product_detail(request, pk):
    if not getattr(getattr(request.user, 'profile', None), 'is_seller', False):
        return Response({'detail': 'هذا المسار للتجار فقط'}, status=status.HTTP_403_FORBIDDEN)

    try:
        product = Product.objects.get(pk=pk, seller=request.user)
    except Product.DoesNotExist:
        return Response({'detail': 'المنتج غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductDetailSerializer(product, context={'request': request}).data)

    if request.method == 'PATCH':
        serializer = ProductWriteSerializer(product, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProductDetailSerializer(updated, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
