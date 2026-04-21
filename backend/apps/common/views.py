import django
from django.db import connection
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
import logging

logger = logging.getLogger(__name__)


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


@extend_schema(
    tags=['support'],
    summary='Submit a support request',
    description='Accepts a support request from a user and sends it to the support team.',
    responses={200: dict},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def support_request(request):
    from apps.accounts.utils import get_support_email_html
    
    issue_type = request.data.get('issue_type', 'غير محدد')
    description = request.data.get('description', '')
    sender_name = 'زائر سوق'
    
    if request.user.is_authenticated:
        full_name = f'{request.user.first_name} {request.user.last_name}'.strip()
        sender_name = full_name or request.user.username
        sender_name += f' ({request.user.email})'

    subject = f'[سوق - بلاغ] {issue_type}'
    now = timezone.now()
    # Format date like the image (roughly): 2026/4/19 14:30:51
    created_at = now.strftime('%Y/%m/%d %H:%M:%S')
    
    html_message = get_support_email_html(sender_name, issue_type, created_at, description)
    # Also keep a text version as fallback
    text_message = f"المرسل: {sender_name}\nنوع المشكلة: {issue_type}\nالتاريخ: {created_at}\n\nالتفاصيل:\n{description}"

    support_email = getattr(settings, 'SUPPORT_EMAIL', 'souqsupport@gmail.com')
    try:
        send_mail(
            subject=subject,
            message=text_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[support_email],
            fail_silently=True,
        )
        logger.info(f'Support request received: {issue_type}')
    except Exception as e:
        logger.warning(f'Failed to send support email: {e}')

    return Response({'status': 'received', 'message': 'تم استلام بلاغك وسنتواصل معك قريباً'})
