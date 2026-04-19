from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.cart_detail, name='cart-detail'),
    path('cart/items/', views.cart_add, name='cart-add'),
    path('cart/items/<int:item_id>/', views.cart_item_update, name='cart-item-update'),
    path('cart/items/<int:item_id>/delete/', views.cart_item_delete, name='cart-item-delete'),
    path('cart/clear/', views.cart_clear, name='cart-clear'),
]
