import React from 'react';
import { NotificationDropdown } from '../components/NotificationDropdown';

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <NotificationDropdown />
      </div>
    </div>
  );
}
