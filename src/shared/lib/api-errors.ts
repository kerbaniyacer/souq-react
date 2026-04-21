/**
 * Utility for standardized API error handling.
 */

import type { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from an Axios error object.
 * Handles common Django/REST framework response structures.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return 'حدث خطأ غير متوقع';

  // If it's a string, return it
  if (typeof err === 'string') return err;

  // Type guard for AxiosError
  const error = err as AxiosError<{
    detail?: string | string[];
    error?: string;
    message?: string;
    non_field_errors?: string[];
  }>;

  if (error.response) {
    const data = error.response.data;

    // 1. Handle "detail" (Common in DRF)
    if (data?.detail) {
      return Array.isArray(data.detail) ? data.detail[0] : data.detail;
    }

    // 2. Handle "non_field_errors"
    if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0];
    }

    // 3. Handle "error" or "message" keys
    if (data?.error) return data.error;
    if (data?.message) return data.message;

    // 4. Handle HTTP Status Codes directly
    switch (error.response.status) {
      case 401: return 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى';
      case 403: return 'ليس لديك صلاحية للقيام بهذا الإجراء';
      case 404: return 'المورد غير موجود';
      case 500: return 'خطأ في الخادم، يرجى المحاولة لاحقاً';
      default: break;
    }
  }

  // Fallback to standard error message
  return (err as Error).message || 'تعذّر الاتصال بالخادم';
}
