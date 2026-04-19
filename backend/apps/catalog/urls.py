from django.urls import path
from . import views

urlpatterns = [
    # Public catalog
    path('categories/', views.category_list, name='category-list'),
    path('categories/<slug:slug>/', views.category_detail, name='category-detail'),
    path('brands/', views.brand_list, name='brand-list'),
    path('brands/<slug:slug>/', views.brand_detail, name='brand-detail'),
    path('products/', views.product_list, name='product-list'),
    path('products/<slug:slug>/', views.product_detail, name='product-detail'),

    # Merchant
    path('merchant/products/', views.merchant_product_list, name='merchant-product-list'),
    path('merchant/products/<int:pk>/', views.merchant_product_detail, name='merchant-product-detail'),
]
