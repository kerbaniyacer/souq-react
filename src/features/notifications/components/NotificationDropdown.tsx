import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '../hooks/useNotifications';
import {
  Package, ShoppingBag, MessageSquare, UserPlus, Info,
  CreditCard, Star, MessageCircle, FileText, XCircle,
  X, Pin, PinOff, Eye, UserCheck, ClipboardCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getIcon = (type: string) => {
  switch (type) {
    case 'new_product':               return <ShoppingBag className="w-4 h-4 text-primary-500" />;
    case 'order_status_update':       return <Package className="w-4 h-4 text-blue-500" />;
    case 'new_order':                 return <ShoppingBag className="w-4 h-4 text-green-500" />;
    case 'order_cancelled':           return <XCircle className="w-4 h-4 text-red-500" />;
    case 'new_message':               return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'follow':                    return <UserPlus className="w-4 h-4 text-orange-500" />;
    case 'payment_submitted':         return <CreditCard className="w-4 h-4 text-yellow-500" />;
    case 'payment_approved':          return <CreditCard className="w-4 h-4 text-green-500" />;
    case 'payment_rejected':          return <CreditCard className="w-4 h-4 text-red-500" />;
    case 'new_review':                return <Star className="w-4 h-4 text-yellow-400" />;
    case 'review_reply':              return <MessageCircle className="w-4 h-4 text-blue-400" />;
    case 'appeal_submitted':          return <FileText className="w-4 h-4 text-orange-500" />;
    case 'appeal_decision':           return <FileText className="w-4 h-4 text-primary-500" />;
    case 'product_visibility_change': return <Eye className="w-4 h-4 text-amber-500" />;
    case 'new_product_review':        return <ClipboardCheck className="w-4 h-4 text-indigo-500" />;
    case 'new_user_registered':       return <UserCheck className="w-4 h-4 text-teal-500" />;
    default:                          return <Info className="w-4 h-4 text-gray-500" />;
  }
};

const getLink = (type: string, relatedId: string, relatedType: string) => {
  switch (type) {
    case 'new_product':               return `/products/${relatedId}`;
    case 'order_status_update':       return `/orders/${relatedId}`;
    case 'new_order':                 return `/merchant/orders/${relatedId}`;
    case 'order_cancelled':           return `/merchant/orders/${relatedId}`;
    case 'new_message':               return `/chat?conversationId=${relatedId}`;
    case 'payment_submitted':         return `/merchant/orders/${relatedId}`;
    case 'payment_approved':          return `/orders/${relatedId}`;
    case 'payment_rejected':          return `/orders/${relatedId}`;
    case 'new_review':                return relatedType === 'product' ? `/products/${relatedId}` : `/orders/${relatedId}`;
    case 'review_reply':              return relatedType === 'product' ? `/products/${relatedId}` : `/orders/${relatedId}`;
    case 'appeal_submitted':          return `/admin/appeals`;
    case 'appeal_decision':           return `/appeals/list`;
    case 'product_visibility_change': return `/appeals/new?type=product&id=${relatedId}`;
    case 'new_product_review':        return `/admin-panel`;
    case 'new_user_registered':       return `/admin-panel`;
    default:                          return '#';
  }
};

export const NotificationDropdown: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, togglePin } = useNotifications();

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white font-arabic">الإشعارات</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => { markAllAsRead(); onClose?.(); }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 font-arabic"
          >
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {(!notifications || notifications.length === 0) ? (
          <div className="p-10 text-center text-gray-400 font-arabic">
            لا توجد إشعارات حالياً
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                !n.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
              } ${n.is_pinned ? 'bg-amber-50/30 dark:bg-amber-900/5 border-r-2 border-r-amber-400' : ''}`}
            >
              {/* Icon */}
              <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${!n.is_read ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'} shadow-sm`}>
                {getIcon(n.type)}
              </div>

              {/* Content — clickable link */}
              <Link
                to={getLink(n.type, n.related_id, n.related_type)}
                onClick={() => { if (!n.is_read) markAsRead(n.id); onClose?.(); }}
                className="flex-1 min-w-0"
              >
                <p className={`text-sm font-arabic line-clamp-1 ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic line-clamp-2 mt-0.5">
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                  </p>
                  {n.is_pinned && (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-arabic">مثبّت</span>
                  )}
                </div>
              </Link>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
              )}

              {/* Action buttons — visible on hover */}
              <div className="absolute left-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Pin/Unpin */}
                <button
                  onClick={(e) => { e.preventDefault(); togglePin(n.id, n.is_pinned); }}
                  title={n.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                  className="p-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500 transition-colors"
                >
                  {n.is_pinned
                    ? <PinOff className="w-3.5 h-3.5" />
                    : <Pin className="w-3.5 h-3.5" />
                  }
                </button>
                {/* Delete */}
                <button
                  onClick={(e) => { e.preventDefault(); removeNotification(n.id); }}
                  title="حذف الإشعار"
                  className="p-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        to="/notifications"
        onClick={onClose}
        className="block p-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 font-arabic"
      >
        عرض جميع الإشعارات
      </Link>
    </div>
  );
};
