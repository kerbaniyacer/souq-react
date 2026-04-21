from django.contrib.auth import update_session_auth_hash
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
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
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .utils import get_password_reset_email_html, get_password_changed_email_html

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

    # Send Notification Email from Backend
    try:
        email_html = get_password_changed_email_html(user.username)
        send_mail(
            'تم تغيير كلمة المرور بنجاح - سوق',
            f'مرحباً {user.username}، تم تغيير كلمة مرور حسابك بنجاح.',
            'noreply@souq.dz',
            [user.email],
            fail_silently=True,
            html_message=email_html
        )
    except Exception as e:
        print(f"Error sending password changed email: {e}")

    return Response({'detail': 'تم تغيير كلمة المرور بنجاح.'})

@extend_schema(tags=['auth'], summary='طلب إعادة تعيين كلمة المرور')
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def password_reset_request(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'detail': 'البريد الإلكتروني مطلوب.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # In production, use the real domain. For now, localhost:5173
        reset_url = f"http://localhost:5173/reset-password?uid={uid}&token={token}"
        
        email_html = get_password_reset_email_html(reset_url)
        send_mail(
            'إعادة تعيين كلمة المرور - سوق',
            f'استلمنا طلباً لإعادة تعيين كلمة المرور. اتبع الرابط: {reset_url}',
            'noreply@souq.dz',
            [user.email],
            fail_silently=False,
            html_message=email_html
        )
        return Response({'detail': 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.'})
    except User.DoesNotExist:
        # Security best practice: don't reveal if user exists, but here the user specifically
        # wants to know why they get "No matching email", so I'll return 404 for clarity.
        return Response({'detail': 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'detail': f'خطأ أثناء إرسال البريد: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(tags=['auth'], summary='تأكيد إعادة تعيين كلمة المرور')
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([uidb64, token, new_password]):
        return Response({'detail': 'جميع الحقول مطلوبة.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'})
        else:
            return Response({'detail': 'الرابط غير صالح أو منتهي الصلاحية.'}, status=status.HTTP_400_BAD_REQUEST)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'detail': 'الرابط غير صالح.'}, status=status.HTTP_400_BAD_REQUEST)


from .serializers import CustomTokenObtainPairSerializer
from django.conf import settings

def _set_auth_cookies(response, refresh_token: str = None, remember_me: bool = False, request=None):
    """
    Sets the Refresh Token as a secure HttpOnly cookie.
    Access Tokens are handled in-memory by the frontend (Zustand).
    """
    from django.conf import settings
    
    # Secure detection for production/ngrok stability
    is_secure = False
    if request:
        is_secure = request.is_secure() or 'ngrok' in request.get_host().lower() or request.META.get('HTTP_X_FORWARDED_PROTO') == 'https'
    
    # Fallback to settings
    is_secure = is_secure or getattr(settings, 'SESSION_COOKIE_SECURE', True)
    
    # SameSite=None is required for cross-origin (ngrok on mobile) but REQUIRES Secure=True
    samesite = 'None' if is_secure else 'Lax'
    secure = is_secure

    # Refresh token age: 7 days (standard) or 30 days if remember_me
    refresh_max_age = (60 * 60 * 24 * 30) if remember_me else (60 * 60 * 24 * 7)

    if refresh_token:
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=refresh_max_age,
            path='/',
        )


class CustomLoginView(TokenObtainPairView):
    """Custom login view — issues JWT tokens AND sets them as HttpOnly cookies."""
    serializer_class = CustomTokenObtainPairSerializer
    # Disable auth classes to avoid 401s from stale browser headers/cookies
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        remember_me = str(request.data.get('remember_me', 'false')).lower() in ('true', '1', 'yes')
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Pass refresh_token to cookie helper, access_token stays in response data
            _set_auth_cookies(
                response,
                refresh_token=response.data.get('refresh', ''),
                remember_me=remember_me,
                request=request
            )
            # Remove refresh from JSON response body for extra security if desired (optional)
            # response.data.pop('refresh', None)
        return response


class CustomTokenRefreshView(APIView):
    """Reads the refresh token from the HttpOnly cookie, rotates it, and sets new cookies."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.views import TokenRefreshView
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'الرمز المميز للتجديد مفقود.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            from rest_framework_simplejwt.tokens import RefreshToken as RT
            token = RT(refresh_token)
            new_access = str(token.access_token)

            # Rotate refresh token if configured
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
                    token.blacklist()
                token.set_jti()
                token.set_exp()
                new_refresh = str(token)
            else:
                new_refresh = refresh_token

            response = Response({'access': new_access, 'detail': 'تم تجديد الجلسة بنجاح.'})
            _set_auth_cookies(response, refresh_token=new_refresh, request=request)
            return response

        except (TokenError, InvalidToken) as e:
            return Response({'detail': 'رمز التجديد غير صالح أو منتهي الصلاحية.'}, status=status.HTTP_401_UNAUTHORIZED)


class CustomLogoutView(APIView):
    """Blacklists the refresh token and clears both JWT cookies."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as RT
                token = RT(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token already invalid — continue to clear cookies

        response = Response({'detail': 'تم تسجيل الخروج بنجاح.'})
        # Clear cookies
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


# JWT refresh/logout are handled above via cookie-aware views — see urls.py

from rest_framework_simplejwt.tokens import RefreshToken
import uuid

@extend_schema(tags=['auth'], summary='الدخول عبر منصات التواصل (Google/Facebook)')
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def social_login(request):
    email = request.data.get('email')
    provider = request.data.get('provider', 'google')
    provider_id = request.data.get('provider_id', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not email:
        return Response({'detail': 'Email is required for social login.'}, status=status.HTTP_400_BAD_REQUEST)
        
    is_new = False
    try:
        user = User.objects.get(email=email)
        # Update provider bindings if they differ
        if user.provider != provider:
            user.provider = provider
            user.provider_id = provider_id
            user.save()
    except User.DoesNotExist:
        # Create new user for social onboarding
        # Use email prefix for username, ensuring uniqueness
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            provider=provider,
            provider_id=provider_id,
            is_active=True
        )
        # Set a random password as it's a social account
        user.set_unusable_password()
        user.save()
        
        # Create Profile
        from .models import Profile
        Profile.objects.get_or_create(user=user)
        is_new = True
        
    # Check if user is suspended
    if user.status == 'suspended':
        return Response({
            'detail': 'account_suspended',
            'code': 'ACCOUNT_SUSPENDED',
            'reason': user.suspension_reason or 'مخالفة شروط الاستخدام',
            'user_id': user.id,
            'email': user.email
        }, status=status.HTTP_403_FORBIDDEN)
        
    # Track the successful login in LoginHistory
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    is_known_ip = LoginHistory.objects.filter(user=user, ip_address=ip).exists()
    if not is_known_ip and not is_new:
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
    
    response = Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
        'is_new_social_user': is_new
    })
    
    _set_auth_cookies(response, refresh_token=str(refresh), request=request)
    return response


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
            
        # Check if user was suspended AFTER the OTP was sent
        if user.status == 'suspended':
            return Response({
                'detail': 'account_suspended',
                'code': 'ACCOUNT_SUSPENDED',
                'reason': user.suspension_reason or 'مخالفة شروط الاستخدام',
                'email': user.email
            }, status=status.HTTP_403_FORBIDDEN)
            
        # Success! Clear OTP, record login, issue tokens
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        LoginHistory.objects.create(user=user, ip_address=ip, user_agent=user_agent)
        otp_record.delete()
        
        refresh = RefreshToken.for_user(user)
        
        response = Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
        
        _set_auth_cookies(response, refresh_token=str(refresh), request=request)
        return response
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
    
    day = request.query_params.get('day')
    logs = AdminActionLog.objects.all().order_by('-created_at')
    
    if day:
        from datetime import datetime as dt
        try:
            date_obj = dt.strptime(day, '%Y-%m-%d').date()
            logs = logs.filter(created_at__date=date_obj)
        except ValueError:
            pass
    else:
        # Default to last 100 actions if no date filter
        logs = logs[:100]

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
            log.is_processed = True
            log.save()
            return Response({'detail': 'تمت استعادة العنصر بنجاح.'})
        elif action_type == 'finalize_delete':
            AdminService.finalize_delete(request.user, log.target_model, log.target_id)
            log.is_processed = True
            log.save()
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
    from .serializers import ReportSerializer
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@extend_schema(tags=['appeals'], summary='تقديم طعن على تجميد')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_appeal(request):
    """
    Users submit an appeal for account or product suspension.
    Rules:
    1. Must be within 14 days of suspension.
    2. Max 3 appeals per item.
    """
    from .models import Appeal
    from .serializers import AppealSerializer
    from apps.catalog.models import Product
    from django.utils import timezone
    from datetime import timedelta
    
    target_type = request.data.get('target_type') # 'account' or 'product'
    target_id = request.data.get('target_id')
    reason = request.data.get('reason')
    
    if not all([target_type, target_id, reason]):
        return Response({'detail': 'جميع الحقول مطلوبة.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 1. Fetch Target and check suspension
    try:
        if target_type == 'account':
            target = request.user if str(request.user.id) == str(target_id) else User.objects.get(pk=target_id)
            if target != request.user and not request.user.is_staff:
                 return Response({'detail': 'غير مصرح لك بالطعن نيابة عن غيرك.'}, status=status.HTTP_403_FORBIDDEN)
            suspended_at = target.suspended_at
        elif target_type == 'product':
            target = Product.objects.get(pk=target_id, seller=request.user)
            suspended_at = target.suspended_at
        else:
            return Response({'detail': 'نوع مستهدف غير صحيح.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'detail': 'العنصر المستهدف غير موجود أو لا تملكه.'}, status=status.HTTP_404_NOT_FOUND)

    if not suspended_at:
        return Response({'detail': 'هذا العنصر غير مجمد حالياً.'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Check 14-day deadline
    if timezone.now() > suspended_at + timedelta(days=14):
        return Response({'detail': 'لقد انتهت فترة الـ 14 يوماً المتاحة لتقديم الطعن.'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Check Appeal Limit (Max 3)
    existing_count = Appeal.objects.filter(target_type=target_type, target_id=target_id).count()
    if existing_count >= 3:
        return Response({'detail': 'لقد استنفدت الحد الأقصى من الطعون لهذا العنصر (3).'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = AppealSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user, target_type=target_type, target_id=target_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(tags=['appeals'], summary='تقديم طعن عام (للحسابات المجمدة)')
@api_view(['POST'])
@permission_classes([AllowAny])
def public_submit_appeal(request):
    """Allows suspended users to submit an appeal without logging in."""
    email = request.data.get('email', '').strip()
    reason = request.data.get('reason', '').strip()
    
    if not email or not reason:
        return Response({'detail': 'البريد الإلكتروني والسبب مطلوبان.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email__iexact=email)
        if user.status != User.Status.SUSPENDED:
            return Response({'detail': 'هذا الحساب غير مجمد حالياً.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check for 14-day deadline
        from django.utils import timezone
        from datetime import timedelta
        if user.suspended_at and timezone.now() > user.suspended_at + timedelta(days=14):
            return Response({'detail': 'لقد انتهت المهلة المتاحة لتقديم طعن (14 يوماً).'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check limit (max 3)
        from .models import Appeal
        if Appeal.objects.filter(target_type='account', target_id=user.id).count() >= 3:
            return Response({'detail': 'لقد استنفدت الحد الأقصى من الطعون.'}, status=status.HTTP_400_BAD_REQUEST)
            
        appeal = Appeal.objects.create(
            user=user,
            target_type='account',
            target_id=user.id,
            reason=reason
        )
        return Response({'detail': 'تم تقديم طعنك بنجاح. سيتم مراجعته من قبل الإدارة.', 'appeal_id': appeal.appeal_id})
        
    except User.DoesNotExist:
        return Response({'detail': 'البريد الإلكتروني غير موجود.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'detail': f'خطأ أثناء تقديم الطعن: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(tags=['appeals'], summary='قائمة الطعون الخاصة بالمستخدم')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_appeal_list(request):
    from .models import Appeal
    from .serializers import AppealSerializer
    appeals = Appeal.objects.filter(user=request.user)
    return Response(AppealSerializer(appeals, many=True).data)


@extend_schema(tags=['admin'], summary='قائمة الطعون (للمسؤولين)')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_appeal_list(request):
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Appeal
    from .serializers import AppealSerializer
    appeals = Appeal.objects.all().order_by('-created_at')
    return Response(AppealSerializer(appeals, many=True).data)


@extend_schema(tags=['admin'], summary='معالجة الطعن (قبول/رفض)')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_manage_appeal(request, pk):
    if not request.user.is_staff:
        return Response({'detail': 'مدخل للمسؤولين فقط.'}, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Appeal
    from .services import AdminService
    from django.utils import timezone
    
    try:
        appeal = Appeal.objects.get(pk=pk)
    except Appeal.DoesNotExist:
        return Response({'detail': 'الطعن غير موجود.'}, status=status.HTTP_404_NOT_FOUND)
        
    decision = request.data.get('status') # 'approved' or 'rejected'
    admin_response = request.data.get('admin_response', '')

    if decision not in ['approved', 'rejected']:
        return Response({'detail': 'قرار غير صالح.'}, status=status.HTTP_400_BAD_REQUEST)

    appeal.status = decision
    appeal.admin_response = admin_response
    appeal.reviewed_at = timezone.now()
    appeal.save()

    if decision == 'approved':
        # Automatically restore the item
        try:
            AdminService.restore_item(
                admin_user=request.user,
                target_type=appeal.target_type,
                target_id=appeal.target_id,
                reason=f"تم قبول الطعن رقم: {appeal.appeal_id}"
            )
        except Exception as e:
            return Response({'detail': f'تم قبول الطعن ولكن فشلت الاستعادة التلقائية: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Mark related "Suspend" logs as processed so the UI updates correctly
        from .models import AdminActionLog
        AdminActionLog.objects.filter(
            target_model=appeal.target_type,
            target_id=appeal.target_id,
            action='suspend',
            is_processed=False
        ).update(is_processed=True)

    return Response({'detail': f'تم تحديث حالة الطعن إلى {decision}.'})


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile(request):
    """
    Dedicated endpoint for mandatory onboarding.
    Accepts: phone, wilaya, store_name, is_seller, etc.
    Returns: Updated profile info and onboarding status.
    """
    user = request.user
    profile, _ = Profile.objects.get_or_create(user=user)
    
    data = request.data
    
    # Update profile fields
    profile.phone = data.get('phone', profile.phone)
    profile.wilaya = data.get('wilaya', profile.wilaya)
    profile.baladia = data.get('baladia', profile.baladia)
    profile.address = data.get('address', profile.address)
    
    # Optional/conditional store fields
    if 'is_seller' in data:
        profile.is_seller = data.get('is_seller')
    
    profile.store_name = data.get('store_name', profile.store_name)
    profile.store_description = data.get('store_description', profile.store_description)
    profile.store_category = data.get('store_category', profile.store_category)
    
    profile.save()
    
    # Also update user fields if provided (first_name, last_name)
    if 'first_name' in data:
        user.first_name = data.get('first_name')
    if 'last_name' in data:
        user.last_name = data.get('last_name')
    if 'first_name' in data or 'last_name' in data:
        user.save()

    from .serializers import UserSerializer
    return Response({
        "message": "تم تحديث الملف الشخصي بنجاح",
        "is_onboarded": profile.is_onboarded,
        "user": UserSerializer(user).data
    })
