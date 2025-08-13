import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
      const response = await fetch(`${apiBaseUrl}/api/notifications/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
      const response = await fetch(`${apiBaseUrl}/api/notifications/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
      const response = await fetch(`${apiBaseUrl}/api/notifications/mark-read/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // API call to mark all as read (if you implement this endpoint)
      // const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
      // await fetch(`${apiBaseUrl}/api/notifications/mark-all-read`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
      //   }
      // });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add new notification
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Recalculate unread count
    fetchUnreadCount();
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for outbid notifications
    socket.on('outbid', (data) => {
      if (data.user_id === user.id) {
        const notification = {
          id: `outbid_${Date.now()}`,
          type: 'outbid_detailed',
          title: '🚨 You\'ve been outbid!',
          message: `You were outbid on "${data.auction_name}". Your refund of ₹${data.refunded_amount} has been processed.`,
          auction: { _id: data.auction_id, item_name: data.auction_name },
          amount: data.previous_amount,
          new_amount: data.new_amount,
          refund_id: data.refund_id,
          refunded_amount: data.refunded_amount,
          timestamp: data.timestamp,
          read: false,
          action_required: true,
          priority: 'high',
          motivational_message: 'Don\'t give up! Place a higher bid and show them who\'s boss!'
        };
        addNotification(notification);
      }
    });

    // Listen for new bid notifications
    socket.on('newBid', (data) => {
      // Add notification for new bids on auctions user is watching
      // You can implement this based on your requirements
    });

    // Listen for auction won notifications
    socket.on('auctionWon', (data) => {
      if (data.user_id === user.id) {
        const notification = {
          id: `won_${Date.now()}`,
          type: 'won',
          title: '🎉 You won the auction!',
          message: `Congratulations! You won "${data.auction_name}" for ₹${data.amount}!`,
          auction: { _id: data.auction_id, item_name: data.auction_name },
          amount: data.amount,
          timestamp: new Date().toISOString(),
          read: false,
          action_required: true,
          priority: 'high'
        };
        addNotification(notification);
      }
    });

    return () => {
      socket.off('outbid');
      socket.off('newBid');
      socket.off('auctionWon');
    };
  }, [socket, user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
