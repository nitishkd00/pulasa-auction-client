import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Users, Gavel, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [winnerModal, setWinnerModal] = useState({ open: false, auction: null });
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    fetchAuctions();
  }, [filter, page]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (page > 1) params.append('page', page);

      const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
      const response = await axios.get(`${apiBaseUrl}/api/auction`, { params });
      const newAuctions = response.data.auctions;
      
      if (page === 1) {
        setAuctions(newAuctions);
      } else {
        setAuctions(prev => [...prev, ...newAuctions]);
      }
      
      setHasMore(newAuctions.length === 12);
      setRateLimited(false);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      if (error.response && error.response.status === 429) {
        setRateLimited(true);
        toast.error('You are making requests too quickly. Please wait a moment and try again.');
      } else {
        toast.error('Failed to load auctions');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (status === 'ended') {
      return <span className="badge badge-error">Ended</span>;
    }
    
    if (now < start) {
      return <span className="badge badge-warning">Upcoming</span>;
    }
    
    if (now >= start && now <= end) {
      return <span className="badge badge-success">Live</span>;
    }
    
    return <span className="badge badge-info">{status}</span>;
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

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading auctions...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auctions</h1>
          <p className="text-gray-600">Discover rare and premium fish specimens</p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('active'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => { setFilter('pending'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => { setFilter('ended'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ended' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ended
            </button>
          </div>
        </div>

        {/* Auctions Grid */}
        {rateLimited ? (
          <div className="text-center py-12">
            <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Too Many Requests</h3>
            <p className="text-gray-600">You are making requests too quickly. Please wait a moment and try again.</p>
          </div>
        ) : (filter === 'pending') ? (
          auctions.filter(a => {
            const now = new Date();
            return a.status === 'pending' && new Date(a.start_time) > now;
          }).length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming auctions</h3>
              <p className="text-gray-600">There are currently no auctions available. Stay tuned for the next wave of rare Pulasa fish auctions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {auctions.filter(a => {
                const now = new Date();
                return a.status === 'pending' && new Date(a.start_time) > now;
              }).map((auction) => (
                <Link
                  key={auction._id}
                  to={`/auction/${auction._id}`}
                  className="card-hover group"
                >
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={auction.item_image || 'https://via.placeholder.com/400x300?text=Pulasa+Fish'}
                      alt={auction.item_name}
                      className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Pulasa+Fish';
                      }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {auction.item_name}
                      </h3>
                      {getStatusBadge(auction.status, auction.start_time, auction.end_time)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{auction.status === 'ended' ? 'Winning Bid' : 'Current Bid'}</span>
                        <span className="font-semibold text-lg text-primary-600">
                          {auction.status === 'ended' ? formatPrice(auction.winning_amount || auction.base_price) : formatPrice(auction.highest_bid || auction.base_price)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{auction.total_bids || 0} bids</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{getTimeRemaining(auction.end_time)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Ends {formatDate(auction.end_time)}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          auctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions available</h3>
              <p className="text-gray-600">There are currently no auctions available. Stay tuned for the next wave of rare Pulasa fish auctions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {auctions.map((auction) => (
                <div key={auction._id} className="relative">
                  <Link
                    to={`/auction/${auction._id}`}
                    className="card-hover group block"
                  >
                    {/* 5-minutes-to-start alert banner */}
                    {auction.status === 'pending' && (new Date(auction.start_time) - new Date()) <= 5 * 60 * 1000 && (new Date(auction.start_time) - new Date()) > 0 && (
                      <div className="absolute top-0 left-0 right-0 bg-yellow-200 text-yellow-900 text-center py-1 font-semibold z-20 rounded-t-lg animate-pulse">
                        <span role="img" aria-label="clock">⏰</span> Auction starting soon! Only a few minutes left.
                      </div>
                    )}
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img
                        src={auction.item_image || 'https://via.placeholder.com/400x300?text=Pulasa+Fish'}
                        alt={auction.item_name}
                        className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Pulasa+Fish';
                        }}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {auction.item_name}
                        </h3>
                        {getStatusBadge(auction.status, auction.start_time, auction.end_time)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{auction.status === 'ended' ? 'Winning Bid' : 'Current Bid'}</span>
                          <span className="font-semibold text-lg text-primary-600">
                            {auction.status === 'ended' ? formatPrice(auction.winning_amount || auction.base_price) : formatPrice(auction.highest_bid || auction.base_price)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{auction.total_bids || 0} bids</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{getTimeRemaining(auction.end_time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Ends {formatDate(auction.end_time)}</span>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  {/* Show View Winner button for ended auctions with winner info */}
                  {auction.status === 'ended' && auction.winner_name && (
                    <button
                      className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 z-10"
                      onClick={() => setWinnerModal({ open: true, auction })}
                    >
                      View Winner
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Auctions'}
            </button>
          </div>
        )}
      </div>
      {/* Winner Modal */}
      {winnerModal.open && winnerModal.auction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setWinnerModal({ open: false, auction: null })}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex flex-col items-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="32" cy="32" rx="30" ry="18" fill="#34d399" stroke="#059669" strokeWidth="3" />
                <ellipse cx="44" cy="32" rx="6" ry="3" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                <ellipse cx="20" cy="32" rx="6" ry="3" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                <circle cx="32" cy="32" r="8" fill="#2563eb" stroke="#1e40af" strokeWidth="2" />
                <circle cx="35" cy="30" r="1.5" fill="#fff" />
              </svg>
              <h2 className="text-2xl font-bold text-green-800 mt-4 mb-2">Auction Winner</h2>
              <div className="text-lg text-gray-700 mb-1">{winnerModal.auction.winner_name}</div>
              <div className="text-green-700 font-semibold text-xl mb-2">₹{winnerModal.auction.winning_amount}</div>
              <div className="text-sm text-gray-500">Congratulations to the winner!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionList; 