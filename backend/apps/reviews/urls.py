from django.urls import path
from . import views

urlpatterns = [
    path('products/create/',   views.review_create, name='review-create'),
    path('products/',          views.review_list,   name='review-list'),
    path('products/<int:pk>/delete/', views.review_delete, name='review-delete'),
    
    # Seller Reviews
    path('seller/<int:seller_id>/', views.seller_review_list, name='seller-review-list'),
    path('seller/create/', views.create_seller_review, name='review-seller-create'),
    
    # Buyer Reviews
    path('buyer/<int:buyer_id>/', views.buyer_review_list, name='buyer-review-list'),
    path('buyer/create/', views.create_buyer_review, name='review-buyer-create'),
    
    # Replies
    path('replies/create/', views.create_review_reply, name='review-reply-create'),
]
