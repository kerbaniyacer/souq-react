from django.urls import path
from . import views

urlpatterns = [
    path('wishlist/', views.wishlist_list, name='wishlist-list'),
    path('wishlist/items/', views.wishlist_add, name='wishlist-add'),
    path('wishlist/items/<int:product_id>/', views.wishlist_remove, name='wishlist-remove'),
]
