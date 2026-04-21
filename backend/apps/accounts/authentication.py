"""
Custom JWT authentication that reads the token from an HttpOnly cookie
as a fallback when no Authorization header is present.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """
    Extends the standard JWTAuthentication to also look for the access
    token in the 'access_token' HttpOnly cookie.
    Priority: Authorization header > Cookie.
    """

    def authenticate(self, request):
        # 1. Try the standard Bearer header first
        header = self.get_header(request)
        if header is not None:
            try:
                user_auth = super().authenticate(request)
                if user_auth is not None:
                    return user_auth
            except (InvalidToken, TokenError):
                # If header is invalid/expired, don't fail yet — try the cookie!
                pass

        # 2. Fall back to the HttpOnly cookie
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None

        return self.get_user(validated_token), validated_token
