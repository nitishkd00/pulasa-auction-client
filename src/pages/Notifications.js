import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Award, ArrowRight, Bell, RefreshCw, Filter } from 'lucide-react';
import FishLoadingIcon from '../components/FishLoadingIcon';

const Notifications = () => {
  const { user } = useAuth();
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
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'won':
        return <Award className="w-5 h-5 text-green-500" />;
      case 'active_bid':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'bid_placed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'outbid':
      case 'outbid_detailed':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      case 'won':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'active_bid':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'bid_placed':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FishLoadingIcon size="md" />
          <p className="mt-4 text-gray-600">Fishing for notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  Stay updated with your auction activities
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchNotifications}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <Link
                to="/auctions"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                Browse Auctions
              </Link>
            </div>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'won').length}
              </div>
              <div className="text-sm text-gray-600">Won</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {notifications.filter(n => n.type === 'active_bid').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start bidding on auctions to receive notifications about your activity, outbids, and wins.
              </p>
              <Link
                to="/auctions"
                className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <span>Browse Auctions</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={index}
                className={`bg-white border-l-4 rounded-r-lg shadow-sm border border-gray-200 p-5 ${getNotificationColor(notification.type)} transition-all duration-200`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {/* Additional Details */}
                        {notification.type === 'outbid_detailed' && (
                          <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Your Bid:</span>
                                <span className="font-semibold text-gray-900">₹{notification.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">New Bid:</span>
                                <span className="font-semibold text-gray-900">₹{notification.new_amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Refund Amount:</span>
                                <span className="font-semibold text-green-600">₹{notification.refunded_amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Refund ID:</span>
                                <span className="font-mono text-xs text-gray-500">{notification.refund_id}</span>
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
                          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {notification.auction.item_image && (
                              <img
                                src={notification.auction.item_image}
                                alt={notification.auction.item_name}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
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
                          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium ml-4"
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

        {/* Subtle Footer */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Notifications are updated in real-time. Use the refresh button above to manually update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
