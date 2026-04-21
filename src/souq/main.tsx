import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

import { env } from '@souq/lib/env'

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
