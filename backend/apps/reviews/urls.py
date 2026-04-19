from django.urls import path
from . import views

urlpatterns = [
    path('reviews/',          views.review_list,   name='review-list'),
    path('reviews/create/',   views.review_create, name='review-create'),
    path('reviews/<int:pk>/delete/', views.review_delete, name='review-delete'),
]
