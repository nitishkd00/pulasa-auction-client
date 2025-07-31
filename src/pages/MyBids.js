import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Gavel, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchBids();
  }, [page]);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await axios.get('/api/bid/my-bids', {
        params: { page, limit: 10 },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const newBids = response.data.bids;
      
      if (page === 1) {
        setBids(newBids);
      } else {
        setBids(prev => [...prev, ...newBids]);
      }
      
      setHasMore(newBids.length === 10);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-error-600" />;
      case 'refunded':
        return <AlertCircle className="h-5 w-5 text-warning-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Successful';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return 'badge-success';
      case 'failed':
        return 'badge-error';
      case 'refunded':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your bids...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bids</h1>
          <p className="text-gray-600">Track your bidding history and auction participation</p>
        </div>

        {/* Bids List */}
        {bids.length === 0 ? (
          <div className="card text-center py-12">
            <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids yet</h3>
            <p className="text-gray-600 mb-6">Start bidding on auctions to see your history here</p>
            <Link to="/auctions" className="btn-primary">
              Browse Auctions
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bids.map((bid) => (
              <div key={bid._id || bid.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={bid.item_image || 'https://via.placeholder.com/80x80?text=Fish'}
                      alt={bid.item_name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=Fish';
                      }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {bid.item_name}
                        </h3>
                        <div className={`badge ${getStatusBadge(bid.status)}`}>
                          {getStatusIcon(bid.status)}
                          <span className="ml-1">{getStatusText(bid.status)}</span>
                        </div>
                      </div>
                      {/* Congratulatory message for winner */}
                      {bid.status === 'won' && (
                        <div className="flex items-center bg-green-50 text-green-700 rounded px-3 py-2 mb-2">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>Congratulations! You're the winner of this auction at a price of <b>₹{bid.amount}</b></span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Bid Amount:</span>
                          <div className="text-lg font-semibold text-primary-600">
                            {formatPrice(bid.amount)}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>
                          <div>{formatDate(bid.created_at)}</div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Link
                      to={`/auction/${bid.auction_id}`}
                      className="btn-secondary text-sm"
                    >
                      View Auction
                    </Link>
                    
                    {bid.status === 'success' && bid.auction_status === 'ended' && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Auction Ended</div>
                        <div className="text-sm font-medium text-gray-900">
                          {bid.auction_status === 'ended' ? 'Check Result' : 'Active'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Bids'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBids; 