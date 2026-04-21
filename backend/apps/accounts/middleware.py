from django.http import JsonResponse


ALLOWED_PATH_PREFIXES = [
    '/api/auth/',       # Login, Register, Social Login, OTP verify, and Profile fetch
    '/admin/',          # Django admin panel
    '/api/media/',      # Media file access
    '/api/docs/',       # API docs
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
