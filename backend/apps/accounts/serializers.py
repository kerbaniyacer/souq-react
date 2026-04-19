from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'id', 'phone', 'address', 'wilaya', 'baladia', 'bio',
            'is_seller', 'store_name', 'store_description',
            'store_category', 'store_logo', 'commercial_register',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'photo', 'provider', 'is_staff', 'date_joined',
            'profile',
        ]
        read_only_fields = ['id', 'is_staff', 'date_joined', 'provider']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    is_seller = serializers.BooleanField(default=False)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    wilaya = serializers.CharField(required=False, allow_blank=True, default='')
    baladia = serializers.CharField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    store_name = serializers.CharField(required=False, allow_blank=True, default='')
    store_description = serializers.CharField(required=False, allow_blank=True, default='')
    store_category = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password2',
            'is_seller', 'phone', 'wilaya', 'baladia', 'address',
            'store_name', 'store_description', 'store_category',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password2': 'كلمتا المرور غير متطابقتان.'})
        return attrs

    def create(self, validated_data):
        profile_data = {
            'is_seller': validated_data.pop('is_seller', False),
            'phone': validated_data.pop('phone', ''),
            'wilaya': validated_data.pop('wilaya', ''),
            'baladia': validated_data.pop('baladia', ''),
            'address': validated_data.pop('address', ''),
            'store_name': validated_data.pop('store_name', ''),
            'store_description': validated_data.pop('store_description', ''),
            'store_category': validated_data.pop('store_category', ''),
        }
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, **profile_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'كلمتا المرور غير متطابقتان.'})
        return attrs


from django.db.models import Q
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.mail import send_mail

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that hooks into successful login to track LoginHistory."""
    # Override fields to allow plain usernames in the 'email' field
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        # Allow checking by username or email
        email_or_username = attrs.get('email')
        if email_or_username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = User.objects.filter(Q(email__iexact=email_or_username) | Q(username__iexact=email_or_username)).first()
            if user_obj:
                attrs['email'] = user_obj.email

        data = super().validate(attrs)
        
        user = self.user
        request = self.context.get('request')
        if request and user:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR', '127.0.0.1')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            from apps.accounts.models import LoginHistory, OTPVerification
            
            is_known_ip = LoginHistory.objects.filter(user=user, ip_address=ip).exists()
            if not is_known_ip:
                # Clear any existing unverified OTPs
                OTPVerification.objects.filter(user=user).delete()
                
                otp_record = OTPVerification(user=user, ip_address=ip)
                otp_record.generate_otp()
                
                from apps.accounts.utils import get_otp_email_html
                otp_html = get_otp_email_html(otp_record.otp)
                
                send_mail(
                    'رمز التحقق للولوج الآمن (Souq)',
                    f'لقد لاحظنا تسجيل دخول من شبكة جديدة.\n\nرمز التحقق الخاص بك هو: {otp_record.otp}',
                    'noreply@souq.dz',
                    [user.email],
                    fail_silently=False,
                    html_message=otp_html
                )
                
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    "detail": "verification_required",
                    "email": user.email
                })
            
            LoginHistory.objects.create(user=user, ip_address=ip, user_agent=user_agent)
            
        return data
