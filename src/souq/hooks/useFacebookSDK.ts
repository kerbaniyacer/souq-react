import { useEffect, useState } from 'react';

declare global {
  interface Window {
    FB: {
      init: (params: object) => void;
      login: (callback: (res: FacebookLoginResponse) => void, opts?: object) => void;
      api: (path: string, callback: (res: FacebookUserData) => void) => void;
    };
    fbAsyncInit: () => void;
  }
}

export interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
  };
}

export interface FacebookUserData {
  id: string;
  name: string;
  email: string;
  picture?: { data: { url: string } };
}

export function useFacebookSDK() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    const appId = (import.meta.env.VITE_FACEBOOK_APP_ID as string) || '';
    if (!appId || appId === 'your-facebook-app-id') {
      setIsSdkLoaded(false);
      return;
    }

    // إذا كان SDK محمّلاً بالفعل
    if (window.FB) {
      setIsSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      setIsSdkLoaded(true);
    };

    // تحميل SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/ar_AR/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[src*="facebook.net"]');
      if (existing) existing.remove();
    };
  }, []);

  const login = (): Promise<{ accessToken: string; userID: string; name: string; email: string }> => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK غير محمّل'));
        return;
      }
      window.FB.login(
        (res) => {
          if (res.status === 'connected' && res.authResponse) {
            const { accessToken, userID } = res.authResponse;
            // جلب بيانات المستخدم
            window.FB.api('/me?fields=name,email', (userData) => {
              resolve({
                accessToken,
                userID,
                name: userData.name,
                email: userData.email,
              });
            });
          } else {
            reject(new Error('تم إلغاء تسجيل الدخول'));
          }
        },
        { scope: 'email,public_profile' }
      );
    });
  };

  return { isSdkLoaded, login };
}
