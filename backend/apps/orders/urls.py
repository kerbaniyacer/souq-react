from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.order_list, name='order-list'),
    path('orders/create/', views.order_create, name='order-create'),
    path('orders/track/<str:order_number>/', views.order_track, name='order-track'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),
    path('orders/<int:pk>/cancel/', views.order_cancel, name='order-cancel'),
    path('orders/<int:pk>/confirm-receipt/', views.order_confirm_receipt, name='order-confirm-receipt'),
    path('orders/<int:pk>/proof/upload/', views.payment_proof_upload, name='payment-proof-upload'),
    path('merchant/orders/', views.merchant_order_list, name='merchant-order-list'),
    path('merchant/stats/', views.merchant_stats, name='merchant-stats'),
    path('merchant/orders/<int:pk>/', views.merchant_order_detail, name='merchant-order-detail'),
    path('merchant/orders/<int:pk>/status/', views.merchant_order_status, name='merchant-order-status'),
    path('merchant/payments/<int:pk>/approve/', views.merchant_approve_payment, name='payment-proof-approve'),
    path('merchant/payments/<int:pk>/reject/', views.merchant_reject_payment, name='payment-proof-reject'),
    # SubOrders
    path('merchant/suborders/', views.merchant_suborder_list, name='merchant-suborder-list'),
    path('merchant/suborders/<int:pk>/', views.merchant_suborder_detail, name='merchant-suborder-detail'),
    path('merchant/suborders/<int:pk>/status/', views.sub_order_update_status, name='sub-order-update-status'),
]
