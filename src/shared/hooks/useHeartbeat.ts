import { useEffect } from 'react';
import { useAuthStore } from '@features/auth/stores/authStore';
import api from '@features/auth/services/authService';

const HEARTBEAT_INTERVAL = 20_000; // 20 seconds

export function useHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const ping = () => api.post('/auth/heartbeat/').catch(() => {});

    ping(); // immediate on mount / auth change
    const id = setInterval(ping, HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, [isAuthenticated]);
}
