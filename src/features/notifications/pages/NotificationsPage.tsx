import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Bell, Pin, PinOff, X, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { getNotifConfig } from '../config/notifications.config';
import { getUrl } from '@/shared/lib/routing';
import type { Notification } from '../services/notificationApi';

// ── Date grouping ────────────────────────────────────────────────────────────

function groupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))     return 'اليوم';
  if (isYesterday(d)) return 'أمس';
  return format(d, 'dd MMMM yyyy', { locale: ar });
}

function groupNotifications(list: Notification[]): { label: string; items: Notification[] }[] {
  const map = new Map<string, Notification[]>();
  for (const n of list) {
    const label = groupLabel(n.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ── Filter tabs ──────────────────────────────────────────────────────────────

type Filter = 'all' | 'unread' | 'pinned';

const FILTER_LABELS: Record<Filter, string> = {
  all:    'الكل',
  unread: 'غير مقروء',
  pinned: 'مثبّت',
};

// ── Notification card ────────────────────────────────────────────────────────

function NotificationCard({
  n, onRead, onRemove, onTogglePin,
}: {
  n: Notification;
  onRead: (id: number) => void;
  onRemove: (id: number) => void;
  onTogglePin: (id: number, current: boolean) => void;
}) {
  const cfg = getNotifConfig(n.type);
  const url = getUrl({ type: n.type, entityId: n.entityId, meta: n.meta });

  return (
    <div className={`group relative flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all ${
      n.is_pinned
        ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-900/5'
        : !n.is_read
        ? 'border-primary-100 dark:border-primary-900/30 bg-primary-50/20 dark:bg-primary-900/5'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
    } hover:shadow-sm`}>

      {/* Icon */}
      <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${cfg.bgClass}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <Link
        to={url}
        onClick={() => { if (!n.is_read) onRead(n.id); }}
        className="flex-1 min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-arabic leading-snug ${
            !n.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {n.title}
          </p>
          <time className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 font-mono">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
          </time>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic leading-relaxed mt-1 line-clamp-2">
          {n.message}
        </p>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-arabic text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
            {cfg.label}
          </span>
          {!n.is_read && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
          )}
          {n.is_pinned && (
            <span className="text-[10px] font-arabic text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              مثبّت
            </span>
          )}
        </div>
      </Link>

      {/* Actions — hover */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onTogglePin(n.id, n.is_pinned)}
          title={n.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
          className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-300 dark:text-gray-600 hover:text-amber-500 transition-colors"
        >
          {n.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onRemove(n.id)}
          title="حذف"
          className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, togglePin } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (!notifications) return [];
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.is_read);
      case 'pinned': return notifications.filter(n => n.is_pinned);
      default:       return notifications;
    }
  }, [notifications, filter]);

  const groups = useMemo(() => groupNotifications(filtered), [filtered]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-arabic" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-primary-500" />
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">الإشعارات</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 bg-primary-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {notifications?.length ?? 0} إشعار في المجموع
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 mb-6 bg-gray-50 dark:bg-[#1A1A1A] p-1 rounded-2xl border border-gray-100 dark:border-gray-800">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => {
          const count =
            f === 'unread' ? (notifications?.filter(n => !n.is_read).length ?? 0)
            : f === 'pinned' ? (notifications?.filter(n => n.is_pinned).length ?? 0)
            : (notifications?.length ?? 0);

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {FILTER_LABELS[f]}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  filter === f ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-800">
            <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' :
             filter === 'pinned' ? 'لا توجد إشعارات مثبّتة' :
             'لا توجد إشعارات حالياً'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <section key={label}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map(n => (
                  <NotificationCard
                    key={n.id}
                    n={n}
                    onRead={markAsRead}
                    onRemove={removeNotification}
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
