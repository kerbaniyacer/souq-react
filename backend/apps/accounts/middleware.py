from django.http import JsonResponse


ALLOWED_PATH_PREFIXES = [
    '/api/auth/login/',
    '/api/auth/register/',
    '/api/auth/social/',
    '/api/auth/verify-ip/',
    '/api/auth/complete-profile/', # <--- Important!
    '/api/auth/refresh/',
    '/api/auth/profile/', # Allow profile fetch
    '/admin/',
    '/api/media/',
    '/api/docs/',
    '/api/schema/',
    '/api/health/',
    '/static/',
]


class EnsureOnboardingMiddleware:
    """
    Middleware that enforces profile completion for all authenticated users.
    
    Any authenticated user without a completed profile (phone + wilaya,
    plus store_name if seller) will get a 403 response on protected endpoints.
    
    Exemptions:
    - Unauthenticated users (let DRF handle auth)
    - Staff/Admin users
    - Requests to allowed path prefixes (auth, admin panel, etc.)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Run onboarding check only on API paths
        if request.path.startswith('/api/'):
            user = getattr(request, 'user', None)

            if user and user.is_authenticated and not user.is_staff:
                # Allow paths that are exempt (auth, etc.)
                is_allowed = any(
                    request.path.startswith(prefix)
                    for prefix in ALLOWED_PATH_PREFIXES
                )

                if not is_allowed:
                    profile = getattr(user, 'profile', None)
                    is_onboarded = profile.is_onboarded if profile else False

                    if not is_onboarded:
                        return JsonResponse(
                            {
                                "detail": "يجب إكمال ملفك الشخصي أولاً للوصول لهذه الخدمة.",
                                "code": "profile_incomplete",
                            },
                            status=403,
                        )

        return self.get_response(request)


class SuspendedUserMiddleware:
    """
    Middleware that enforces account suspension in real-time.
    If an authenticated user is suspended, they are blocked from all API access.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            user = getattr(request, 'user', None)

            if user and user.is_authenticated:
                if getattr(user, 'status', None) == 'suspended':
                    return JsonResponse(
                        {
                            "detail": "account_suspended",
                            "code": "ACCOUNT_SUSPENDED",
                        },
                        status=403,
                    )

        return self.get_response(request)
