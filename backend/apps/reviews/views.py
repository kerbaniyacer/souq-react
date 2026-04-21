from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.catalog.models import Product
from apps.orders.models import Order
from .models import Review, SellerReview, BuyerReview
from .serializers import ReviewSerializer, SellerReviewSerializer, BuyerReviewSerializer


@extend_schema(tags=['reviews'], summary='تقديم تقييم لتاجر')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_seller_review(request):
    """Buyers rate sellers. Must be tied to a DELIVERED order."""
    order_id = request.data.get('order')
    try:
        order = Order.objects.get(pk=order_id, user=request.user, status=Order.Status.DELIVERED)
    except Order.DoesNotExist:
        return Response({'detail': 'لا يمكن التقييم إلا بعد استلام الطلب بنجاح.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if SellerReview.objects.filter(order=order).exists():
        return Response({'detail': 'لقد قمت بتقييم هذا التاجر بالفعل لهذا الطلب.'}, status=status.HTTP_400_BAD_REQUEST)

    first_item = order.items.first()
    if not first_item:
         return Response({'detail': 'الطلب فارغ.'}, status=status.HTTP_400_BAD_REQUEST)
    
    seller = first_item.variant.product.seller
    
    serializer = SellerReviewSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(buyer=request.user, seller=seller, order=order)
        
        # Update seller rating in real-time
        profile = seller.profile
        all_reviews = SellerReview.objects.filter(seller=seller, is_visible=True)
        count = all_reviews.count()
        avg = sum(r.rating for r in all_reviews) / count if count else 0
        profile.seller_reviews_count = count
        profile.seller_rating = round(avg, 2)
        profile.save(update_fields=['seller_reviews_count', 'seller_rating'])
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['reviews'], summary='تقديم تقييم لمشتري')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_buyer_review(request):
    """Sellers rate buyers. Must be tied to a DELIVERED order they fulfilled."""
    order_id = request.data.get('order')
    try:
        # Check if the requesting user (seller) has a product in this delivered order
        order = Order.objects.get(pk=order_id, status=Order.Status.DELIVERED, items__variant__product__seller=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'لا يمكن تقييم المشتري إلا لطلب مكتمل قمت بتنفيذه.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if BuyerReview.objects.filter(order=order).exists():
        return Response({'detail': 'لقد قمت بتقييم هذا المشتري بالفعل لهذا الطلب.'}, status=status.HTTP_400_BAD_REQUEST)

    buyer = order.user
    
    serializer = BuyerReviewSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save(seller=request.user, buyer=buyer, order=order)
        
        # Update buyer rating in real-time
        profile = buyer.profile
        all_reviews = BuyerReview.objects.filter(buyer=buyer, is_visible=True)
        count = all_reviews.count()
        avg = sum(r.rating for r in all_reviews) / count if count else 0
        profile.buyer_reviews_count = count
        profile.buyer_rating = round(avg, 2)
        profile.save(update_fields=['buyer_reviews_count', 'buyer_rating'])
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['reviews'], summary='قائمة تقييمات منتج')
@api_view(['GET'])
def review_list(request):
    """GET /api/reviews/?product=<id>"""
    product_id = request.query_params.get('product')
    if not product_id:
        return Response({'detail': 'product param required'}, status=status.HTTP_400_BAD_REQUEST)
    reviews = Review.objects.filter(product_id=product_id, is_visible=True).select_related('user').prefetch_related('official_reply')
    return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)


@extend_schema(tags=['reviews'], summary='قائمة تقييمات بائع')
@api_view(['GET'])
def seller_review_list(request, seller_id):
    reviews = SellerReview.objects.filter(seller_id=seller_id, is_visible=True).select_related('buyer').prefetch_related('official_reply')
    return Response(SellerReviewSerializer(reviews, many=True, context={'request': request}).data)


@extend_schema(tags=['reviews'], summary='قائمة تقييمات مشتري')
@api_view(['GET'])
def buyer_review_list(request, buyer_id):
    reviews = BuyerReview.objects.filter(buyer_id=buyer_id, is_visible=True).select_related('seller').prefetch_related('official_reply')
    return Response(BuyerReviewSerializer(reviews, many=True, context={'request': request}).data)


@extend_schema(tags=['reviews'], summary='إضافة تقييم لمنتج')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_create(request):
    """POST /api/reviews/  body: { product, rating, comment }"""
    product_id = request.data.get('product')
    try:
        product = Product.objects.get(pk=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({'detail': 'المنتج غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if Review.objects.filter(product=product, user=request.user).exists():
        return Response({'detail': 'لقد قمت بتقييم هذا المنتج من قبل'}, status=status.HTTP_400_BAD_REQUEST)

    # Auto-detect verified purchaser: user has a delivered order containing this product
    verified = Order.objects.filter(
        user=request.user,
        status=Order.Status.DELIVERED,
        items__variant__product=product,
    ).exists()

    serializer = ReviewSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    review = serializer.save(user=request.user, product=product, verified=verified)

    # Update product rating & reviews_count
    all_reviews = Review.objects.filter(product=product)
    count = all_reviews.count()
    avg   = sum(r.rating for r in all_reviews) / count if count else 0
    product.reviews_count = count
    product.rating        = round(avg, 2)
    product.save(update_fields=['reviews_count', 'rating'])

    return Response(ReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['reviews'], summary='حذف تقييم')
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def review_delete(request, pk):
    try:
        review = Review.objects.get(pk=pk, user=request.user)
    except Review.DoesNotExist:
        return Response({'detail': 'التقييم غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    review.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
@extend_schema(tags=['reviews'], summary='تقديم رد رسمي على تقييم')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review_reply(request):
    """Product owner or admin can reply to a review (One reply limit)."""
    from .models import ReviewReply
    
    review_id = request.data.get('review_id')
    review_type = request.data.get('type') # 'product', 'seller', 'buyer'
    content = request.data.get('content')
    
    if not review_id or not content:
        return Response({'detail': 'review_id and content required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        if review_type == 'product':
            review = Review.objects.get(pk=review_id)
            is_authorized = request.user.is_staff or review.product.seller == request.user
            link_field = {'product_review': review}
        elif review_type == 'seller':
            review = SellerReview.objects.get(pk=review_id)
            is_authorized = request.user.is_staff or review.seller == request.user
            link_field = {'seller_review': review}
        elif review_type == 'buyer':
            review = BuyerReview.objects.get(pk=review_id)
            is_authorized = request.user.is_staff or review.seller == request.user
            link_field = {'buyer_review': review}
        else:
            return Response({'detail': 'نوع تقييم غير صحيح'}, status=status.HTTP_400_BAD_REQUEST)
    except (Review.DoesNotExist, SellerReview.DoesNotExist, BuyerReview.DoesNotExist):
        return Response({'detail': 'التقييم غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    if not is_authorized:
        return Response({'detail': 'غير مصرح لك بالرد على هذا التقييم.'}, status=status.HTTP_403_FORBIDDEN)

    if ReviewReply.objects.filter(**link_field).exists():
        return Response({'detail': 'تم الرد على هذا التقييم مسبقاً.'}, status=status.HTTP_400_BAD_REQUEST)

    reply = ReviewReply.objects.create(
        user=request.user,
        content=content,
        **link_field
    )
    
    from .serializers import ReviewReplySerializer
    return Response(ReviewReplySerializer(reply).data, status=status.HTTP_201_CREATED)
