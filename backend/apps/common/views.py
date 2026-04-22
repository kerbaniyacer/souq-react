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
    import json
 
    issue_type    = request.data.get('issue_type', 'غير محدد')
    description   = request.data.get('description', '')
    page_url      = request.data.get('page_url', 'غير معروف')
    browser_info  = request.data.get('browser_info', 'غير معروف')
    js_errors     = request.data.get('js_errors', [])
    network_errors = request.data.get('network_errors', [])
 
    sender_name = 'زائر سوق'
    if request.user.is_authenticated:
        full_name = f'{request.user.first_name} {request.user.last_name}'.strip()
        sender_name = full_name or request.user.username
        sender_name += f' ({request.user.email})'
 
    subject    = f'[سوق - بلاغ] {issue_type}'
    created_at = timezone.now().strftime('%Y/%m/%d %H:%M:%S')
 
    # ── بناء قسم الأخطاء التقنية ─────────────────────────
    technical_section = ''
 
    if js_errors:
        rows = ''.join(
            f"<tr style='border-bottom:1px solid #f3f4f6;'>"
            f"<td style='padding:6px 8px;color:#dc2626;font-size:12px;font-family:monospace;'>{e.get('type', 'JS Error')}</td>"
            f"<td style='padding:6px 8px;color:#374151;font-size:12px;'>{e.get('message', '')}</td>"
            f"<td style='padding:6px 8px;color:#9ca3af;font-size:11px;direction:ltr;'>{e.get('time', '')}</td>"
            f"</tr>"
            for e in js_errors
        )
        technical_section += f"""
        <div style="margin-top:20px;">
          <h4 style="color:#dc2626;font-size:14px;margin:0 0 8px;">⚡ أخطاء JavaScript ({len(js_errors)})</h4>
          <div style="overflow-x:auto;border-radius:8px;border:1px solid #fecaca;">
            <table width="100%" style="border-collapse:collapse;background:#fff5f5;">
              <thead>
                <tr style="background:#fecaca;">
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#991b1b;">النوع</th>
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#991b1b;">الرسالة</th>
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#991b1b;">الوقت</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>"""
 
    if network_errors:
        rows = ''.join(
            f"<tr style='border-bottom:1px solid #f3f4f6;'>"
            f"<td style='padding:6px 8px;color:#d97706;font-size:12px;font-weight:700;'>{e.get('status', e.get('error', 'خطأ'))}</td>"
            f"<td style='padding:6px 8px;color:#374151;font-size:11px;font-family:monospace;direction:ltr;word-break:break-all;'>{e.get('url', '')}</td>"
            f"<td style='padding:6px 8px;color:#9ca3af;font-size:11px;direction:ltr;'>{e.get('time', '')}</td>"
            f"</tr>"
            for e in network_errors
        )
        technical_section += f"""
        <div style="margin-top:16px;">
          <h4 style="color:#d97706;font-size:14px;margin:0 0 8px;">🌐 أخطاء الشبكة ({len(network_errors)})</h4>
          <div style="overflow-x:auto;border-radius:8px;border:1px solid #fed7aa;">
            <table width="100%" style="border-collapse:collapse;background:#fffbeb;">
              <thead>
                <tr style="background:#fed7aa;">
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#92400e;">الكود</th>
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#92400e;">الرابط</th>
                  <th style="padding:6px 8px;text-align:right;font-size:11px;color:#92400e;">الوقت</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </div>"""
 
    technical_section += f"""
    <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <p style="margin:0;font-size:12px;color:#166534;"><strong>📍 الصفحة:</strong>
        <span style="direction:ltr;display:inline-block;">{page_url}</span>
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#6b7280;direction:ltr;">{browser_info[:150]}</p>
    </div>"""
 
    # ── بناء الإيميل النهائي ──────────────────────────────
    html_message = get_support_email_html(sender_name, issue_type, created_at, description)
    html_message = html_message.replace(
        '<p style="color:#9ca3af;font-size:13px;text-align:center;margin-top:24px;">تم إرسال هذا البلاغ تلقائياً من نظام الدعم الفني لسوق.</p>',
        f'{technical_section}'
        f'<p style="color:#9ca3af;font-size:13px;text-align:center;margin-top:24px;">تم إرسال هذا البلاغ تلقائياً من نظام الدعم الفني لسوق.</p>'
    )
 
    text_message = (
        f"المرسل: {sender_name}\nنوع المشكلة: {issue_type}\nالتاريخ: {created_at}\n"
        f"الصفحة: {page_url}\n\nالتفاصيل:\n{description}\n\n"
        f"أخطاء JS:\n{json.dumps(js_errors, ensure_ascii=False, indent=2)}\n\n"
        f"أخطاء الشبكة:\n{json.dumps(network_errors, ensure_ascii=False, indent=2)}"
    )
 
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
        logger.info(
            f'Support request received: {issue_type} | '
            f'JS errors: {len(js_errors)} | Network errors: {len(network_errors)}'
        )
    except Exception as e:
        logger.warning(f'Failed to send support email: {e}')

    return Response({'status': 'received', 'message': 'تم استلام بلاغك وسنتواصل معك قريباً'})
