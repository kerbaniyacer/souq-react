import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@shared/lib/queryClient'
import '@shared/styles/index.css'
import App from './App.tsx'

import { env } from '@shared/lib/env'

const GOOGLE_CLIENT_ID = env.googleClientId


// تطبيق الوضع الداكن فوراً قبل تحميل React لمنع الوميض
const savedTheme = localStorage.getItem('theme-storage');
if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme);
    if (parsed?.state?.isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore parse errors
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
