'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { onMessageListener } from '@/lib/firebaseClient';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useUser();
  const [foregroundNotifications, setForegroundNotifications] = useState([]);
  
  useEffect(() => {
    if (!user) return;

    // Listen for foreground FCM messages
    const unsubscribe = onMessageListener((payload) => {
      console.log('Foreground notification received:', payload);
      
      // Show toast notification
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🔔</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {payload.notification?.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {payload.notification?.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ),
        {
          duration: 6000,
          position: 'top-right',
        }
      );

      // Store notification in state for potential use
      setForegroundNotifications(prev => [
        {
          id: Date.now(),
          ...payload.notification,
          data: payload.data,
          timestamp: new Date()
        },
        ...prev.slice(0, 9) // Keep only last 10
      ]);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const contextValue = {
    foregroundNotifications,
    clearForegroundNotifications: () => setForegroundNotifications([])
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

