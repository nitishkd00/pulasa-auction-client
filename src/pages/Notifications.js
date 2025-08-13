import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Award, ArrowRight } from 'lucide-react';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'outbid':
      case 'outbid_detailed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'won':
        return <Award className="w-6 h-6 text-green-500" />;
      case 'active_bid':
        return <TrendingUp className="w-6 h-6 text-blue-500" />;
      case 'bid_placed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'outbid':
      case 'outbid_detailed':
        return 'border-red-200 bg-red-50';
      case 'won':
        return 'border-green-200 bg-green-50';
      case 'active_bid':
        return 'border-blue-200 bg-blue-50';
      case 'bid_placed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleNotificationAction = (notification) => {
    if (notification.type === 'outbid' || notification.type === 'outbid_detailed') {
      // Navigate to auction page to re-bid
      navigate(`/auction/${notification.auction._id}`);
    } else if (notification.type === 'won') {
      // Navigate to won auction
      navigate(`/auction/${notification.auction._id}`);
    } else if (notification.type === 'active_bid') {
      // Navigate to active auction
      navigate(`/auction/${notification.auction._id}`);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                Stay updated with your auction activities
              </p>
            </div>
            <Link
              to="/auctions"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Browse Auctions
            </Link>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
              <div className="text-gray-600">Total Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-gray-600">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'won').length}
              </div>
              <div className="text-gray-600">Auctions Won</div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600 mb-6">
                Start bidding on auctions to receive notifications about your activity.
              </p>
              <Link
                to="/auctions"
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Browse Auctions
              </Link>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={index}
                className={`border rounded-lg p-6 ${getNotificationColor(notification.type)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {notification.title}
                        </h3>
                        <p className="text-gray-700 mb-3">
                          {notification.message}
                        </p>
                        
                        {/* Additional Details */}
                        {notification.type === 'outbid_detailed' && (
                          <div className="bg-white rounded-lg p-4 mb-3 border">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Your Bid:</span>
                                <span className="font-semibold text-gray-900 ml-2">₹{notification.amount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">New Bid:</span>
                                <span className="font-semibold text-gray-900 ml-2">₹{notification.new_amount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Refund Amount:</span>
                                <span className="font-semibold text-green-600 ml-2">₹{notification.refunded_amount}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Refund ID:</span>
                                <span className="font-mono text-xs text-gray-500 ml-2">{notification.refund_id}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Motivational Message for Outbids */}
                        {notification.motivational_message && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-yellow-800 text-sm italic">
                              💪 {notification.motivational_message}
                            </p>
                          </div>
                        )}

                        {/* Auction Info */}
                        {notification.auction && (
                          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border">
                            {notification.auction.item_image && (
                              <img
                                src={notification.auction.item_image}
                                alt={notification.auction.item_name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {notification.auction.item_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Base Price: ₹{notification.auction.base_price}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-sm text-gray-500 mt-3">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>

                      {/* Action Button */}
                      {notification.action_required && (
                        <button
                          onClick={() => handleNotificationAction(notification)}
                          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          <span>Take Action</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Notifications are updated in real-time. Keep an eye on this page for the latest updates!
          </p>
          <button
            onClick={fetchNotifications}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Refresh Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
