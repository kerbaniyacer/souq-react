import django
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


@extend_schema(
    tags=['health'],
    summary='Health check',
    description='Returns API status, database connectivity, and server time.',
    responses={200: dict},
)
@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def health_check(request):
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False

    return Response({
        'status': 'ok' if db_ok else 'degraded',
        'django': django.VERSION,
        'database': 'connected' if db_ok else 'unreachable',
        'time': timezone.now().isoformat(),
    })
