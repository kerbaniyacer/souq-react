/**
 * Centralized and validated environment variable access.
 */

function required(name: string, value?: string): string {
  if (!value) {
    // In development, we might want to just warn, but in production this should be fatal
    if (import.meta.env.PROD) {
      throw new Error(`[FATAL] Missing required environment variable: ${name}`);
    }
    console.warn(`[WARN] Missing environment variable: ${name}. Using empty string as fallback.`);
    return '';
  }
  return value;
}

export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // Required variables
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL as string),
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL as string),
  
  // Optional / with fallbacks
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '',
  facebookAppId: (import.meta.env.VITE_FACEBOOK_APP_ID as string) || '',
};
