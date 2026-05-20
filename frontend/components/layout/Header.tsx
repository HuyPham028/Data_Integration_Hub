'use client';

import { Bell, Globe, LogOut } from 'lucide-react';
import { clearAuthSession } from '@/lib/auth-session';
import { useLanguage } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';

interface AppNotification {
  id: string | number;
  type?: 'warning' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
}

export function Header() {
  const { lang, setLang, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleLogOut = () => {
    clearAuthSession();
    window.location.href = '/login';
  };

  // 1. Connect to Real-time Backend via Server-Sent Events (SSE)
  useEffect(() => {
    // Note: Adjust the URL to match your actual backend API URL
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_KONG_URL}/notifications/stream`);

    eventSource.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      
      // Add the new notification to the top of the list
      setNotifications((prev) => [
        { ...newNotification, unread: true },
        ...prev,
      ]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE Connection Error:', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  // 2. Fetch Initial Notifications (Optional)
  // useEffect(() => {
  //   fetch('/notifications/history').then(res => res.json()).then(data => setNotifications(data));
  // }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    // TODO: Call your backend API to mark notifications as read in the database
  };

  // Helper to format time relative to now
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
      <div className="flex-1"></div>
      
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white">
                <span className="sr-only">{unreadCount} unread notifications</span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${notification.unread ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-medium ${notification.unread ? 'text-slate-900' : 'text-slate-700'} ${notification.type === 'warning' ? 'text-amber-600' : ''}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors border-t border-slate-100">
                <span className="text-sm text-blue-600 font-medium">View all notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Globe className="h-4 w-4 text-slate-500" />
          <span className="hidden sm:inline-block">{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* Logout */}
        <button
          onClick={handleLogOut}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline-block">{t('nav.logout') || 'Log out'}</span>
        </button>
      </div>
    </header>
  );
}
