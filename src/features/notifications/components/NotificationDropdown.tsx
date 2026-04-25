import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '../hooks/useNotifications';
import { getNotifConfig } from '../config/notifications.config';
import { getUrl } from '@/shared/lib/routing';
import type { Notification } from '../services/notificationApi';
import { X, Pin, PinOff } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Single notification item ──────────────────────────────────────────────────

const NotificationItem = memo(({
  n, onRead, onRemove, onTogglePin, onClose,
}: {
  n: Notification;
  onRead: (id: number) => void;
  onRemove: (id: number) => void;
  onTogglePin: (id: number, current: boolean) => void;
  onClose?: () => void;
}) => {
  const cfg = getNotifConfig(n.type);

  return (
    <div
      className={`group relative flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        !n.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
      } ${n.is_pinned ? 'border-r-2 border-r-amber-400 bg-amber-50/20 dark:bg-amber-900/5' : ''}`}
    >
      {/* Icon */}
      <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${cfg.bgClass} ${!n.is_read ? 'shadow-sm' : ''}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <Link
        to={getUrl({ type: n.type, entityId: n.entityId, meta: n.meta })}
        onClick={() => { if (!n.is_read) onRead(n.id); onClose?.(); }}
        className="flex-1 min-w-0"
      >
        <p className={`text-sm font-arabic line-clamp-1 ${
          !n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
        }`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic line-clamp-2 mt-0.5">
          {n.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <time className="text-[10px] text-gray-400">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
          </time>
          {n.is_pinned && (
            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-arabic">
              مثبّت
            </span>
          )}
        </div>
      </Link>

      {/* Unread dot */}
      {!n.is_read && (
        <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
      )}

      {/* Hover actions */}
      <div className="absolute left-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); onTogglePin(n.id, n.is_pinned); }}
          title={n.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
          className="p-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500 transition-colors"
        >
          {n.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onRemove(n.id); }}
          title="حذف"
          className="p-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
NotificationItem.displayName = 'NotificationItem';

// ── Dropdown ──────────────────────────────────────────────────────────────────

export const NotificationDropdown: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, togglePin } = useNotifications();

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white font-arabic">الإشعارات</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-500 text-white rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => { markAllAsRead(); onClose?.(); }}
            className="text-xs text-primary-600 hover:text-primary-700 font-arabic font-medium"
          >
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {(!notifications || notifications.length === 0) ? (
          <div className="p-10 text-center text-gray-400 font-arabic text-sm">
            لا توجد إشعارات حالياً
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onRead={markAsRead}
              onRemove={removeNotification}
              onTogglePin={togglePin}
              onClose={onClose}
            />
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
