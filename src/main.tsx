import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.tsx'

// FOUC prevention: apply dark class before React mounts
;(() => {
  try {
    const stored = localStorage.getItem('theme-storage')
    const parsed = stored ? JSON.parse(stored) : null
    const isDark = parsed?.state?.isDark ?? true
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch {
    document.documentElement.classList.add('dark')
  }
})()

// استخدام placeholder آمن إذا لم يُضبط الـ Client ID
// useGoogleLogin تحتاج clientId غير فارغ حتى لا تتعطل
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'not-configured'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
