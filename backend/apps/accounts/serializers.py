from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Profile, Store, Report, AdminActionLog, Appeal


class ProfileSerializer(serializers.ModelSerializer):
    is_seller = serializers.SerializerMethodField()

    def get_is_seller(self, obj):
        return obj.is_seller  # computed @property

    class Meta:
        model = Profile
        fields = [
            'id', 'phone', 'address', 'wilaya', 'baladia', 'bio',
            'is_seller', 'commercial_register',
            'ccp_number', 'ccp_name', 'baridimob_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_seller', 'created_at', 'updated_at']


class PublicProfileSerializer(serializers.ModelSerializer):
    is_seller = serializers.SerializerMethodField()

    def get_is_seller(self, obj):
        return obj.is_seller

    class Meta:
        model = Profile
        fields = [
            'bio', 'wilaya', 'baladia', 'is_seller',
            'seller_rating', 'seller_reviews_count',
            'buyer_rating', 'buyer_reviews_count',
            'created_at'
        ]


class StoreMiniSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'slug', 'logo', 'category', 'status', 'rating', 'reviews_count', 'products_count', 'created_at']

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class StoreWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['name', 'description', 'logo', 'category']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_onboarded = serializers.SerializerMethodField()
    reports_count = serializers.IntegerField(read_only=True)
    is_online = serializers.SerializerMethodField()
    stores = serializers.SerializerMethodField()

    def get_is_onboarded(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.is_onboarded if profile else False

    def get_is_online(self, obj):
        return obj.is_online

    def get_stores(self, obj):
        return StoreMiniSerializer(obj.stores.filter(status='active'), many=True).data

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'photo', 'provider', 'is_staff', 'date_joined', 'role',
            'profile', 'status', 'suspended_at', 'appeal_deadline', 'suspension_reason',
            'is_onboarded', 'reports_count', 'last_seen', 'is_online', 'stores',
        ]
        read_only_fields = ['id', 'is_staff', 'date_joined', 'provider', 'last_seen', 'is_online']


class PublicUserSerializer(serializers.ModelSerializer):
    profile = PublicProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_online = serializers.SerializerMethodField()

    def get_is_online(self, obj):
        return obj.is_online

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'photo', 'date_joined', 'profile', 'last_seen', 'is_online']


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.ReadOnlyField(source='admin_user.username')
    
    class Meta:
        model = AdminActionLog
        fields = [
            'id', 'admin_user', 'admin_name', 'action', 'target_model', 
            'target_id', 'target_name', 'reason', 'before_state', 
            'after_state', 'is_processed', 'created_at'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    wilaya = serializers.CharField(required=False, allow_blank=True, default='')
    baladia = serializers.CharField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password2',
            'phone', 'wilaya', 'baladia', 'address',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password2': 'كلمتا المرور غير متطابقتان.'})
        return attrs

    def create(self, validated_data):
        profile_data = {
            'phone':   validated_data.pop('phone', ''),
            'wilaya':  validated_data.pop('wilaya', ''),
            'baladia': validated_data.pop('baladia', ''),
            'address': validated_data.pop('address', ''),
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
    # Define both to ensure compatibility with various SimpleJWT/DRF versions
    username = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        # 1. Normalize the identifier and strip any whitespace (mobile autofill often adds spaces)
        username_field = self.username_field
        # We accept 'email' or 'username' keys, whichever the frontend sends
        raw_identifier = attrs.get('email') or attrs.get('username') or attrs.get(username_field) or ''
        identifier = raw_identifier.strip()

        if identifier:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            # Find user by email OR username (iexact for case-insensitivity)
            user_obj = User.objects.filter(
                Q(email__iexact=identifier) | Q(username__iexact=identifier)
            ).first()
            if user_obj:
                # Ensure the key expected by authenticate() is populated with the correct email
                attrs[username_field] = user_obj.email
            else:
                # Still set it so authenticate() gets the attempt with the stripped value
                attrs[username_field] = identifier

        # 2. Call super().validate which performs authentication
        try:
            data = super().validate(attrs)
        except Exception as e:
            # If standard authentication failed, let's find out WHY to help the user
            if identifier:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user_check = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
                
                if user_check:
                    # 1. Check if the account is suspended (highest priority)
                    if user_check.status == User.Status.SUSPENDED:
                        from rest_framework.exceptions import PermissionDenied
                        raise PermissionDenied({
                            "detail": "account_suspended",
                            "code": "ACCOUNT_SUSPENDED",
                            "reason": user_check.suspension_reason or "مخالفة شروط الاستخدام",
                            "email": user_check.email
                        })
                    
                    # 2. Check if the account is inactive
                    if not user_check.is_active:
                        from rest_framework.exceptions import AuthenticationFailed
                        raise AuthenticationFailed({
                            "detail": "الحساب غير نشط. يرجى مراجعة البريد الإلكتروني لتفعيله.", 
                            "code": "user_inactive"
                        })
                    
                    # 3. If user exists, is active, and NOT suspended, then it must be a wrong password
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed({
                        "detail": "كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.",
                        "code": "invalid_password"
                    })
            
            # If we couldn't find the user at all
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed({
                "detail": "لا يوجد حساب مرتبط بهذه البيانات. يرجى التأكد من البريد الإلكتروني.",
                "code": "user_not_found"
            })

        user = self.user
        request = self.context.get('request')
        if request and user:
            from apps.accounts.views import _get_client_ip
            ip = _get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            from apps.accounts.models import LoginHistory, OTPVerification, User

            # Check for account suspension BEFORE anything else
            if user.status == User.Status.SUSPENDED:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied({
                    "detail": "account_suspended",
                    "code": "ACCOUNT_SUSPENDED",
                    "reason": user.suspension_reason or "مخالفة شروط الاستخدام",
                    "email": user.email
                })

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
                    fail_silently=True,  # don't let email failure block login flow
                    html_message=otp_html
                )

                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    "detail": "verification_required",
                    "email": user.email
                })

            LoginHistory.objects.create(user=user, ip_address=ip, user_agent=user_agent)
            
        # 3. Handle 'Remember Me' logic for token lifetime
        remember_me = str(request.data.get('remember_me', 'false')).lower() in ('true', '1', 'yes') if request else False
        
        from rest_framework_simplejwt.tokens import RefreshToken
        from datetime import timedelta
        
        refresh = RefreshToken.for_user(user)
        if remember_me:
            refresh.set_exp(lifetime=timedelta(days=7))
        else:
            refresh.set_exp(lifetime=timedelta(days=1))
            
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        return data


class ReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reporter.username')
    target_product_name = serializers.ReadOnlyField(source='target_product.name')
    target_product_slug = serializers.ReadOnlyField(source='target_product.slug')
    target_product_seller = serializers.ReadOnlyField(source='target_product.seller.id')
    target_user_name = serializers.ReadOnlyField(source='target_user.username')

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_name', 'report_type', 
            'target_product', 'target_product_name', 'target_product_slug', 'target_product_seller',
            'target_user', 'target_user_name', 'reason', 
            'description', 'status', 'created_at'
        ]
        read_only_fields = [
            'id', 'reporter', 'reporter_name', 'target_product_name', 
            'target_product_slug', 'target_user_name', 'status', 'created_at'
        ]


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.ReadOnlyField(source='admin_user.username')

    class Meta:
        model = AdminActionLog
        fields = '__all__'


class AppealSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    target_name = serializers.SerializerMethodField()

    class Meta:
        model = Appeal
        fields = [
            'id', 'appeal_id', 'user', 'user_email', 
            'target_type', 'target_id', 'target_name',
            'reason', 'status', 'admin_response',
            'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'appeal_id', 'user', 'user_email', 'status', 'admin_response', 'reviewed_at', 'created_at']

    def get_target_name(self, obj):
        from .models import User
        from apps.catalog.models import Product
        
        try:
            if obj.target_type == 'account':
                target = User.objects.get(pk=obj.target_id)
                return target.username or target.email
            elif obj.target_type == 'product':
                target = Product.objects.get(pk=obj.target_id)
                return target.name
        except Exception:
            return "مستهدف غير موجود"
        return "غير معروف"
