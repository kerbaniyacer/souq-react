import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Package, ShoppingBag, MessageSquare, UserPlus, Info, CheckAll } from 'lucide-react';
import { Link } from 'react-router-dom';

const getIcon = (type: string) => {
  switch (type) {
    case 'new_product': return <ShoppingBag className="w-4 h-4 text-primary-500" />;
    case 'order_status_update': return <Package className="w-4 h-4 text-blue-500" />;
    case 'new_order': return <ShoppingBag className="w-4 h-4 text-green-500" />;
    case 'new_message': return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'follow': return <UserPlus className="w-4 h-4 text-orange-500" />;
    default: return <Info className="w-4 h-4 text-gray-500" />;
  }
};

const getLink = (type: string, relatedId: string) => {
  switch (type) {
    case 'new_product': return `/products/${relatedId}`;
    case 'order_status_update': return `/orders/${relatedId}`;
    case 'new_order': return `/merchant/orders/${relatedId}`;
    case 'new_message': return `/chat`; // Open chat
    default: return '#';
  }
};

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white font-arabic">الإشعارات</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllAsRead()}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 font-arabic"
          >
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {(!notifications || notifications.length === 0) ? (
          <div className="p-10 text-center text-gray-400 font-arabic">
            لا توجد إشعارات حالياً
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              to={getLink(n.type, n.related_id)}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${!n.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
            >
              <div className={`p-2 rounded-xl ${!n.is_read ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'} shadow-sm`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-arabic line-clamp-1 ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic line-clamp-2 mt-0.5">
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                </p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>

      <Link 
        to="/notifications" 
        className="block p-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 font-arabic"
      >
        عرض جميع الإشعارات
      </Link>
    </div>
  );
};
