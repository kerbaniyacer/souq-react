from django.urls import path
from .views import health_check, support_request

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('support/request/', support_request, name='support-request'),
]
