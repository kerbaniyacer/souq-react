from django.contrib.auth import update_session_auth_hash
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from .models import Profile, User, LoginHistory, OTPVerification, Report
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer, ChangePasswordSerializer, ReportSerializer
import base64
from django.core.files.base import ContentFile
import uuid

def decode_base64_file(data):
    """Helper to convert base64 string to ContentFile."""
    if isinstance(data, str) and data.startswith('data:image'):
        # header, data = data.split(';base64,')
        # format, imgstr = data.split(';base64,') 
        try:
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]
            return ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")
        except Exception:
            return data
    return data


class AuthRateThrottle(AnonRateThrottle):
    rate = '10/minute'


@extend_schema(tags=['auth'], summary='تسجيل حساب جديد')
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send Welcome Email
        try:
            from django.core.mail import send_mail
            from apps.accounts.utils import get_welcome_email_html
            welcome_html = get_welcome_email_html(user.username)
            send_mail(
                'مرحباً بك في سوق! 🎉',
                f'أهلاً وسهلاً {user.username}! يسعدنا انضمامك إلى سوق.',
                'noreply@souq.dz',
                [user.email],
                fail_silently=True,
                html_message=welcome_html
            )
        except Exception as e:
            print(f"Error sending welcome email: {e}")

        return Response(
            {'detail': 'تم إنشاء الحساب بنجاح.', 'email': user.email},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['auth'], summary='جلب وتحديث الملف الشخصي')
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

    # PATCH — update user + profile
    data = request.data.copy()
    if 'photo' in data:
        data['photo'] = decode_base64_file(data['photo'])

    user_fields = {k: v for k, v in data.items()
                   if k in ['first_name', 'last_name', 'username', 'photo']}
    profile_fields = {k: v for k, v in data.items()
                      if k not in ['first_name', 'last_name', 'username', 'email', 'password', 'photo']}

    if user_fields:
        user_serializer = UserSerializer(user, data=user_fields, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if profile_fields:
        prof, _ = Profile.objects.get_or_create(user=user)
        profile_serializer = ProfileSerializer(prof, data=profile_fields, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
        else:
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(UserSerializer(user, context={'request': request}).data)


@extend_schema(tags=['auth'], summary='تغيير كلمة المرور')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'old_password': 'كلمة المرور الحالية غير صحيحة.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    update_session_auth_hash(request, user)
    return Response({'detail': 'تم تغيير كلمة المرور بنجاح.'})


from .serializers import CustomTokenObtainPairSerializer

class CustomLoginView(TokenObtainPairView):
    """Custom login view to track LoginHistory on successful login."""
    serializer_class = CustomTokenObtainPairSerializer

# JWT refresh/logout are handled by simplejwt views — wired in urls.py

from rest_framework_simplejwt.tokens import RefreshToken
import uuid

@extend_schema(tags=['auth'], summary='الدخول عبر منصات التواصل (Google/Facebook)')
@api_view(['POST'])
@permission_classes([AllowAny])
def social_login(request):
    email = request.data.get('email')
    provider = request.data.get('provider', 'google')
    provider_id = request.data.get('provider_id', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not email:
        return Response({'detail': 'Email is required for social login.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        # Update provider bindings if they differ
        if user.provider != provider:
            user.provider = provider
            user.provider_id = provider_id
            user.save()
    except User.DoesNotExist:
        # DO NOT create the user automatically. 
        # Inform the frontend so it can redirect to registration.
        return Response({
            'detail': 'user_not_registered',
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'provider': provider,
            'provider_id': provider_id
        }, status=status.HTTP_404_NOT_FOUND)
        
    # Track the successful login in LoginHistory
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    is_known_ip = LoginHistory.objects.filter(user=user, ip_address=ip).exists()
    if not is_known_ip:
        # Clear any existing unverified OTPs for this user
        OTPVerification.objects.filter(user=user).delete()
        
        otp_record = OTPVerification(user=user, ip_address=ip)
        otp_record.generate_otp()
        
        from apps.accounts.utils import get_otp_email_html
        otp_html = get_otp_email_html(otp_record.otp)
        
        from django.core.mail import send_mail
        send_mail(
            'رمز التحقق للولوج الآمن (Souq)',
            f'لقد لاحظنا تسجيل دخول من شبكة جديدة.\n\nرمز التحقق الخاص بك هو: {otp_record.otp}',
            'noreply@souq.dz',
            [user.email],
            fail_silently=False,
            html_message=otp_html
        )
        return Response({"detail": "verification_required", "email": user.email}, status=status.HTTP_400_BAD_REQUEST)

    LoginHistory.objects.create(
        user=user,
        ip_address=ip,
        user_agent=user_agent
    )
    
    # Issue JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@extend_schema(tags=['auth'], summary='تأكيد تسجيل الدخول من IP جديد')
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_ip_login(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'detail': 'يرجى توفير البريد الإلكتروني ورمز التحقق.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        otp_record = OTPVerification.objects.filter(user=user).first()
        
        if not otp_record or otp_record.otp != otp:
            return Response({'detail': 'الرمز غير صحيح أو منتهي الصلاحية.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Success! Clear OTP, record login, issue tokens
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        LoginHistory.objects.create(user=user, ip_address=ip, user_agent=user_agent)
        otp_record.delete()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    except User.DoesNotExist:
        return Response({'detail': 'حساب غير موجود.'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(tags=['auth'], summary='جلب سجل تسجيل الدخول')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_history(request):
    """Returns login history. Staff sees everyone's history, users see only theirs."""
    day = request.query_params.get('day')
    if request.user.is_staff:
        history = LoginHistory.objects.all().order_by('-logged_at')
    else:
        history = LoginHistory.objects.filter(user=request.user).order_by('-logged_at')

    if day:
        from datetime import datetime as dt
        try:
            date_obj = dt.strptime(day, '%Y-%m-%d').date()
            history = history.filter(logged_at__date=date_obj)
        except ValueError:
            pass
    else:
        # If no day filter, limit results
        if request.user.is_staff:
            history = history[:50]
        else:
            history = history[:20]
        
    data = [{
        'id': h.id,
        'ip': h.ip_address,
        'user_agent': h.user_agent,
        'logged_at': h.logged_at,
        'user_id': h.user.id if request.user.is_staff else None,
        'username': h.user.username if request.user.is_staff else None
    } for h in history]
    return Response(data)


@extend_schema(tags=['auth'], summary='قائمة كافة الحسابات (للمسؤولين فقط)')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profiles_list(request):
    """Returns all users. Restricted to staff."""
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@extend_schema(tags=['auth'], summary='تفاصيل حساب (للمسؤولين فقط)')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, pk):
    """Returns a single user's detail. Restricted to staff."""
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'الحساب غير موجود.'}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = UserSerializer(user)
    return Response(serializer.data)


@extend_schema(tags=['auth'], summary='حذف حساب (للمسؤولين فقط)')
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, pk):
    """Suspends a user (Soft Delete) and sends notification email. Restricted to staff."""
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user_to_delete = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'الحساب غير موجود.'}, status=status.HTTP_404_NOT_FOUND)
    
    if user_to_delete.is_staff:
         return Response({'detail': 'لا يمكن حذف حساب مسؤول آخر.'}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('reason', 'مخالفة شروط الاستخدام.')
    
    from .services import AdminService
    AdminService.suspend_item(request.user, user_to_delete, reason)
    
    # Send Notification Email
    try:
        from django.core.mail import send_mail
        from apps.accounts.utils import get_account_deleted_email_html
        email_html = get_account_deleted_email_html(user_to_delete.username, reason)
        send_mail(
            'إشعار بخصوص حسابك في سوق',
            f'نحيطك علماً بأنه تم تعليق حسابك للأسباب التالية: {reason}. يمكنك تقديم طعن خلال 14 يوماً.',
            'noreply@souq.dz',
            [user_to_delete.email],
            fail_silently=True,
            html_message=email_html
        )
    except Exception as e:
        print(f"Error sending account deletion email: {e}")

    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['admin'], summary='سجل عمليات المسؤولين')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_action_log(request):
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import AdminActionLog
    from .serializers import AdminActionLogSerializer
    logs = AdminActionLog.objects.all().order_by('-created_at')
    return Response(AdminActionLogSerializer(logs, many=True).data)


@extend_schema(tags=['admin'], summary='التراجع عن عملية أو الحذف النهائي')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_manage_action(request, pk):
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import AdminActionLog
    from .services import AdminService
    
    try:
        log = AdminActionLog.objects.get(pk=pk)
    except AdminActionLog.DoesNotExist:
        return Response({'detail': 'العملية غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)
        
    action_type = request.data.get('action') # 'restore' or 'finalize_delete'
    
    try:
        if action_type == 'restore':
            AdminService.restore_item(request.user, log.target_model, log.target_id, log.id)
            return Response({'detail': 'تمت استعادة العنصر بنجاح.'})
        elif action_type == 'finalize_delete':
            AdminService.finalize_delete(request.user, log.target_model, log.target_id)
            return Response({'detail': 'تم الحذف النهائي بنجاح.'})
        else:
            return Response({'detail': 'عملية غير صالحة.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['auth'], summary='قائمة البلاغات (للمسؤولين فقط)')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_report_list(request):
    """Returns all reports. Restricted to staff."""
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    reports = Report.objects.all().order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@extend_schema(tags=['auth'], summary='تقديم بلاغ جديد')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """Creates a new report. Open to all authenticated users."""
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        report = serializer.save(reporter=request.user)
        
        # Send Notification Email to Support
        try:
            from django.core.mail import send_mail
            from apps.accounts.utils import get_report_notification_email_html
            
            target_name = "غير محدد"
            if report.target_product:
                target_name = report.target_product.name
            elif report.target_user:
                target_name = report.target_user.username or report.target_user.email
            
            email_html = get_report_notification_email_html(
                reporter_name=request.user.username,
                report_type=report.report_type,
                target_name=target_name,
                reason=report.reason,
                description=report.description
            )
            
            send_mail(
                f'🚩 بلاغ جديد: {report.get_report_type_display()} - {report.reason}',
                f'بلاغ جديد من {request.user.username} بخصوص {target_name}',
                'noreply@souq.dz',
                ['souqsupport@gmail.com'],
                fail_silently=True,
                html_message=email_html
            )
        except Exception as e:
            print(f"Error sending report notification: {e}")
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
