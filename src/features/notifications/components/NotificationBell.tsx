import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationPolling } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/useNotificationStore';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Polling runs here (always mounted) — mutations are in NotificationDropdown
  useNotificationPolling();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const location = useLocation();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-400 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-400 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};
