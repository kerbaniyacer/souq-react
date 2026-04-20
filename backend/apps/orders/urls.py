from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.order_list, name='order-list'),
    path('orders/create/', views.order_create, name='order-create'),
    path('orders/track/<str:order_number>/', views.order_track, name='order-track'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),
    path('orders/<int:pk>/cancel/', views.order_cancel, name='order-cancel'),
    path('orders/<int:pk>/receipt/', views.order_upload_receipt, name='order-upload-receipt'),
    path('merchant/orders/', views.merchant_order_list, name='merchant-order-list'),
    path('merchant/orders/<int:pk>/status/', views.merchant_order_status, name='merchant-order-status'),
]
