from django.urls import path
from . import views

urlpatterns = [
    # Public catalog
    path('categories/', views.category_list, name='category-list'),
    path('categories/<slug:slug>/', views.category_detail, name='category-detail'),
    path('brands/', views.brand_list, name='brand-list'),
    path('brands/<slug:slug>/', views.brand_detail, name='brand-detail'),
    path('series/', views.series_list, name='series-list'),
    path('products/', views.product_list, name='product-list'),
    path('products/<slug:slug>/', views.product_detail, name='product-detail'),

    # Merchant
    path('merchant/dashboard/', views.merchant_dashboard, name='merchant-dashboard'),
    path('merchant/products/', views.merchant_product_list, name='merchant-product-list'),
    path('merchant/products/<int:pk>/', views.merchant_product_detail, name='merchant-product-detail'),
    path('merchant/products/<int:pk>/resubmit/', views.merchant_product_resubmit, name='merchant-product-resubmit'),

    # Admin review
    path('admin/products/review/', views.admin_product_review_list, name='admin-product-review-list'),
    path('admin/products/review/<int:pk>/decide/', views.admin_product_review_decide, name='admin-product-review-decide'),
]
