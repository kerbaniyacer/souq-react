import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string ?? ''

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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
