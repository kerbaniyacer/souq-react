import { useEffect, useRef } from 'react';

interface JSError {
  message: string;
  source?: string;
  line?: number;
  type?: string;
  time: string;
}

interface NetworkError {
  url: string;
  status?: number;
  error?: string;
  time: string;
}

export function useErrorCollector() {
  const jsErrors = useRef<JSError[]>([]);
  const networkErrors = useRef<NetworkError[]>([]);

  useEffect(() => {
    // ── جمع أخطاء JS ──────────────────────────────────────
    const handleError = (event: ErrorEvent) => {
      jsErrors.current.push({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        time: new Date().toISOString(),
      });
      // احتفظ بآخر 20 خطأ فقط
      if (jsErrors.current.length > 20) jsErrors.current.shift();
    };

    // ── جمع أخطاء Promise غير المعالجة ───────────────────
    const handleRejection = (event: PromiseRejectionEvent) => {
      jsErrors.current.push({
        message: event.reason?.message || String(event.reason),
        type: 'UnhandledPromiseRejection',
        time: new Date().toISOString(),
      });
      if (jsErrors.current.length > 20) jsErrors.current.shift();
    };

    // ── اعتراض fetch لجمع أخطاء Network ─────────────────
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          networkErrors.current.push({
            url: String(args[0]),
            status: response.status,
            time: new Date().toISOString(),
          });
          if (networkErrors.current.length > 20) networkErrors.current.shift();
        }
        return response;
      } catch (error: any) {
        networkErrors.current.push({
          url: String(args[0]),
          error: error.message,
          time: new Date().toISOString(),
        });
        if (networkErrors.current.length > 20) networkErrors.current.shift();
        throw error;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.fetch = originalFetch;
    };
  }, []);

  const getErrors = () => ({
    js_errors: jsErrors.current.slice(-10),
    network_errors: networkErrors.current.slice(-10),
  });

  return { getErrors };
}
