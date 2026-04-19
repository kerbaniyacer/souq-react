from django.contrib.auth import update_session_auth_hash
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from .models import Profile
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


# JWT login/refresh/logout are handled by simplejwt views — wired in urls.py
