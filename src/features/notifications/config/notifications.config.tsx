import {
  Package, ShoppingBag, MessageSquare, UserPlus,
  CreditCard, Star, MessageCircle, FileText, XCircle,
  Eye, UserCheck, ClipboardCheck, Bell,
} from 'lucide-react';
import type { ReactElement } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_product'
  | 'order_status_update'
  | 'new_order'
  | 'order_cancelled'
  | 'new_message'
  | 'payment_submitted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'new_review'
  | 'review_reply'
  | 'appeal_submitted'
  | 'appeal_decision'
  | 'product_visibility_change'
  | 'follow'
  | 'new_product_review'
  | 'new_user_registered'
  | 'general';

/** UI-only concerns: icon, label, background class. Routing is handled by routing.ts. */
export interface NotificationConfigEntry {
  label: string;
  icon: ReactElement;
  bgClass: string;
  role?: 'admin' | 'merchant';
}

// ── Config registry ───────────────────────────────────────────────────────────

export const notificationConfig: Record<NotificationType, NotificationConfigEntry> = {
  new_product: {
    label: 'منتج جديد',
    icon: <ShoppingBag className="w-4 h-4 text-primary-500" />,
    bgClass: 'bg-primary-50 dark:bg-primary-900/20',
  },
  order_status_update: {
    label: 'تحديث الطلب',
    icon: <Package className="w-4 h-4 text-blue-500" />,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
  },
  new_order: {
    label: 'طلب جديد',
    icon: <ShoppingBag className="w-4 h-4 text-green-500" />,
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    role: 'merchant',
  },
  order_cancelled: {
    label: 'طلب ملغى',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    role: 'merchant',
  },
  new_message: {
    label: 'رسالة جديدة',
    icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
  },
  payment_submitted: {
    label: 'إثبات دفع',
    icon: <CreditCard className="w-4 h-4 text-yellow-500" />,
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    role: 'merchant',
  },
  payment_approved: {
    label: 'دفع مقبول',
    icon: <CreditCard className="w-4 h-4 text-green-500" />,
    bgClass: 'bg-green-50 dark:bg-green-900/20',
  },
  payment_rejected: {
    label: 'دفع مرفوض',
    icon: <CreditCard className="w-4 h-4 text-red-500" />,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
  },
  new_review: {
    label: 'تقييم جديد',
    icon: <Star className="w-4 h-4 text-yellow-400" />,
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  review_reply: {
    label: 'رد على تقييم',
    icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
  },
  appeal_submitted: {
    label: 'طعن جديد',
    icon: <FileText className="w-4 h-4 text-orange-500" />,
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
    role: 'admin',
  },
  appeal_decision: {
    label: 'قرار الطعن',
    icon: <FileText className="w-4 h-4 text-primary-500" />,
    bgClass: 'bg-primary-50 dark:bg-primary-900/20',
  },
  product_visibility_change: {
    label: 'تغيير حالة المنتج',
    icon: <Eye className="w-4 h-4 text-amber-500" />,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
  },
  follow: {
    label: 'متابعة جديدة',
    icon: <UserPlus className="w-4 h-4 text-orange-500" />,
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
  },
  new_product_review: {
    label: 'منتج للمراجعة',
    icon: <ClipboardCheck className="w-4 h-4 text-indigo-500" />,
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    role: 'admin',
  },
  new_user_registered: {
    label: 'مستخدم جديد',
    icon: <UserCheck className="w-4 h-4 text-teal-500" />,
    bgClass: 'bg-teal-50 dark:bg-teal-900/20',
    role: 'admin',
  },
  general: {
    label: 'إشعار عام',
    icon: <Bell className="w-4 h-4 text-gray-500" />,
    bgClass: 'bg-gray-50 dark:bg-gray-800',
  },
};

// ── Helper ────────────────────────────────────────────────────────────────────

/** Safe config lookup — falls back to `general` for unknown types. */
export const getNotifConfig = (type: string): NotificationConfigEntry =>
  notificationConfig[type as NotificationType] ?? notificationConfig.general;
