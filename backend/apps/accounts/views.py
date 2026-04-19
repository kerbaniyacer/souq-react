from django.contrib.auth import update_session_auth_hash
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from .models import Profile, User, LoginHistory, OTPVerification
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer, ChangePasswordSerializer


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
        serializer = UserSerializer(user)
        return Response(serializer.data)

    # PATCH — update user + profile
    user_fields = {k: v for k, v in request.data.items()
                   if k in ['first_name', 'last_name', 'username']}
    profile_fields = {k: v for k, v in request.data.items()
                      if k not in ['first_name', 'last_name', 'username', 'email', 'password']}

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

    return Response(UserSerializer(user).data)


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
        username = email.split('@')[0]
        # Ensure unique username
        username = f"{username}_{uuid.uuid4().hex[:6]}"
        
        user = User.objects.create(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            provider=provider,
            provider_id=provider_id,
        )
        user.set_unusable_password()
        user.save()
        Profile.objects.create(user=user)
        
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
