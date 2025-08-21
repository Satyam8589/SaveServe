'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useUser();
  const [foregroundNotifications, setForegroundNotifications] = useState([]);
  
  useEffect(() => {
    if (!user) return;

    // Note: FCM foreground message listening removed with Firebase
    // You can implement alternative real-time notifications here if needed
    console.log('NotificationProvider initialized for user:', user.id);

    // Firebase messaging removed - notifications now handled via MongoDB and API polling
    // You can implement WebSocket or SSE for real-time notifications if needed

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

