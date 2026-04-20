from django.urls import path
from . import views

urlpatterns = [
    path('reviews/',          views.review_list,   name='review-list'),
    path('reviews/create/',   views.review_create, name='review-create'),
    path('reviews/<int:pk>/delete/', views.review_delete, name='review-delete'),
    
    # Mutual Reviews
    path('reviews/seller/', views.create_seller_review, name='review-seller'),
    path('reviews/buyer/', views.create_buyer_review, name='review-buyer'),
]
