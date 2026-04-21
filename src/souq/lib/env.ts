/**
 * Centralized environment variable access.
 * This helper makes it easier to manage environment variables 
 * and provides defaults where necessary.
 */

export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string || '',
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID as string || '',
  apiUrl: import.meta.env.VITE_API_URL as string || '/api',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000',
};
