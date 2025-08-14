import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { useBid } from '../contexts/BidContext';
import { useSocket } from '../contexts/SocketContext';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Guard: if id is missing or invalid, redirect to /auctions
  useEffect(() => {
    if (!id || id === 'undefined') {
      navigate('/auctions');
    }
  }, [id, navigate]);

  const { user } = useAuth();
  const { fetchAuctionById } = useAuction();
  const { placeBid, createRazorpayOrder, verifyPaymentAndBid, fetchAuctionBids, calculatePlatformFee, getTotalAmount } = useBid();
  const { socket } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditEndTime, setShowEditEndTime] = useState(false);
  const [newEndTime, setNewEndTime] = useState(auction ? auction.end_time : '');
  const [endTimeLoading, setEndTimeLoading] = useState(false);
  const [recentBids, setRecentBids] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [showOutbidModal, setShowOutbidModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') return;
    loadAuctionData();
    
    // Join auction room for real-time updates
    if (socket) {
      socket.emit('joinAuction', id);
    }

    return () => {
      if (socket) {
        socket.emit('leaveAuction', id);
      }
    };
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new bids
    socket.on('newBid', (bidData) => {
      if (bidData.auction_id === id) {
        console.log('🔄 New bid received, updating auction data...');
        // Update auction data and bids
        loadAuctionData();
      }
    });

    return () => {
      socket.off('newBid');
    };
  }, [socket, id]);

  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      setAuction((prev) => {
        if (!prev) return prev;
        const now = new Date();
        let status = prev.status;
        if (now < new Date(prev.start_time)) status = 'pending';
        else if (now >= new Date(prev.start_time) && now < new Date(prev.end_time)) status = 'active';
        else if (now >= new Date(prev.end_time)) status = 'ended';
        if (status !== prev.status) {
          return { ...prev, status };
        }
        return prev;
      });
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [auction]);

  useEffect(() => {
    if (!socket || !user) return;
    // Listen for outbid event
    socket.on('outbid', (data) => {
      console.log('🚨 Outbid event received:', data);
      if (data.auction_id === auction._id && data.user_id === user?.id) {
        setShowOutbidModal(true);
        // Show toast notification
        toast.error(`You've been outbid on "${data.auction_name}"!`, {
          duration: 5000,
          action: {
            label: 'Bid Again',
            onClick: () => {
              setShowOutbidModal(false);
              document.getElementById('bid-form')?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      }
    });
    // Listen for auction won event
    socket.on('auctionWon', (data) => {
      if (data && data.auctionId === id) {
        setShowWinnerModal(true);
      }
    });
    // Listen for new bid events to update bids in real-time
    socket.on('newBid', (bidData) => {
      console.log('🔄 New bid received:', bidData);
      if (bidData.auction_id === id) {
        console.log('🔄 New bid for this auction, updating bids data...');
        // Update auction data and bids
        loadAuctionData();
      }
    });
    return () => {
      socket.off('outbid');
      socket.off('auctionWon');
      socket.off('newBid');
    };
  }, [socket, user, id]);

  const loadAuctionData = async () => {
    try {
      setLoading(true);
      if (!id || id === 'undefined') {
        setError('Invalid auction ID');
        setLoading(false);
        return;
      }
      const auctionData = await fetchAuctionById(id);
      console.log('Auction data received:', auctionData);
      setAuction(auctionData.auction);
      
      // Load bids separately to ensure we have the latest data
      await loadBidsData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBidsData = async () => {
    try {
      if (!id || id === 'undefined') return;
      
      setBidsLoading(true);
      const bidsData = await fetchAuctionBids(id);
      console.log('Bids data received:', bidsData);
      console.log('Current user:', user);
      
      if (bidsData.success && bidsData.bids) {
        console.log('Raw bids array:', bidsData.bids);
        console.log('Current auction state:', auction);
        console.log('Bids count:', bidsData.bids.length);
        setBids(bidsData.bids);
        const recentBidsArray = bidsData.bids.slice(0, 5);
        console.log('Setting recent bids:', recentBidsArray);
        setRecentBids(recentBidsArray); // Show last 5 bids as recent
        
        // Update auction total_bids count based on actual bids
        setAuction(prev => {
          if (prev && prev.total_bids !== bidsData.bids.length) {
            console.log('🔢 Updated auction total_bids from', prev.total_bids, 'to:', bidsData.bids.length);
            return {
              ...prev,
              total_bids: bidsData.bids.length
            };
          }
          return prev;
        });
        
        // Filter bid history to show only current user's bids
        if (user) {
          console.log('User ID:', user.id, 'User _id:', user._id);
          console.log('Sample bid bidder:', bidsData.bids[0]?.bidder);
          
          const userBids = bidsData.bids.filter(bid => {
            console.log('Checking bid:', {
              bidId: bid._id,
              bidderId: bid.bidder?._id,
              bidderIdAlt: bid.bidder?.id,
              userId: user.id,
              userIdAlt: user._id,
              matches: (bid.bidder && (bid.bidder._id === user.id || bid.bidder._id === user._id))
            });
            return bid.bidder && (bid.bidder._id === user.id || bid.bidder._id === user._id);
          });
          
          console.log('Filtered user bids:', userBids);
          setBidHistory(userBids);
        } else {
          console.log('No user authenticated');
          setBidHistory([]);
        }
      } else {
        console.log('No bids data or success false:', bidsData);
      }
    } catch (err) {
      console.error('Error loading bids data:', err);
    } finally {
      setBidsLoading(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    
    console.log('🎯 handleBid triggered with:', {
      auctionId: auction?._id,
      amount: bidAmount,
      user: user?.id,
      auctionStatus: auction?.status
    });
    
    if (!user) {
      console.error('❌ User not authenticated in handleBid');
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      console.error('❌ Invalid bid amount:', bidAmount);
      setError('Please enter a valid bid amount');
      return;
    }

    if (auction && amount <= auction.highest_bid) {
      console.error('❌ Bid amount too low:', {
        bidAmount: amount,
        currentHighest: auction.highest_bid
      });
      setError(`Bid must be at least ₹1 higher than current highest bid: ₹${auction.highest_bid}`);
      return;
    }

    console.log('✅ All validations passed, proceeding with bid placement...');

    // Show confirmation popup
    setShowConfirm(true);
  };

  const confirmBid = async () => {
    console.log('🎯 confirmBid triggered');
    setShowConfirm(false);
    
    try {
      setBidding(true);
      setError(null);
      
      console.log('🔄 Calling placeBid...');
      const result = await placeBid(auction._id, parseFloat(bidAmount), '');
      
      if (result.success) {
        console.log('✅ Payment popup opened successfully');
        
        if (result.status === 'payment_pending') {
          // Show info message that payment is pending
          toast.info(result.message || 'Payment popup opened. Please complete the payment to place your bid.');
          
          // Don't clear the form or hide it yet - wait for payment completion
          // The form will be handled by the payment success/error callbacks in the context
        } else {
          // This shouldn't happen with the new flow, but handle it just in case
          console.log('✅ Bid placed successfully (immediate success)');
      setBidAmount('');
      setShowBidForm(false);
      toast.success(`Bid placed successfully! Amount: ₹${parseFloat(bidAmount)}`);
      
      console.log('🔄 Refreshing auction data...');
      await loadAuctionData();
      console.log('✅ Auction data refreshed');
        }
      }
      
    } catch (err) {
      console.error('💥 confirmBid error:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      setError(err.message || 'Failed to place bid');
      toast.error(err.message || 'Failed to place bid');
      setBidding(false);
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'ended': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeRemaining = () => {
    if (!auction || auction.status !== 'active') return null;
    
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const diff = endTime - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const testRazorpayConfig = () => {
    console.log('🧪 Testing Razorpay Configuration...');
    console.log('🔍 Environment Variables:');
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 REACT_APP_RAZORPAY_KEY_ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
    console.log('🔍 REACT_APP_RAZORPAY_KEY_SECRET:', process.env.REACT_APP_RAZORPAY_KEY_SECRET);
    
    // Try to get the key from different sources
    let razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
    
    // If not found in process.env, try to get from window object (for runtime injection)
    if (!razorpayKey && window.__RAZORPAY_CONFIG__) {
      razorpayKey = window.__RAZORPAY_CONFIG__.key_id;
      console.log('🔍 Found Razorpay key from window.__RAZORPAY_CONFIG__');
    }
    
    console.log('🔍 Razorpay SDK:');
    console.log('🔍 window.Razorpay:', typeof window.Razorpay);
    console.log('🔍 window.Razorpay constructor:', window.Razorpay);
    
    if (typeof window.Razorpay !== 'undefined') {
      try {
        const testOptions = {
          key: razorpayKey,
          amount: 100, // 1 rupee test
          currency: 'INR',
          name: 'Test Payment',
          description: 'Test payment for debugging',
          order_id: 'test_order_' + Date.now(),
          handler: function(response) {
            console.log('✅ Test payment successful:', response);
            toast.success('Test payment successful!');
          },
          prefill: {
            name: 'Test User',
            email: 'test@example.com'
          },
          theme: {
            color: '#3B82F6'
          }
        };
        
        console.log('🔧 Test Razorpay options:', testOptions);
        const rzp = new window.Razorpay(testOptions);
        rzp.open();
        console.log('✅ Test Razorpay checkout opened');
      } catch (error) {
        console.error('❌ Test Razorpay error:', error);
        toast.error('Test failed: ' + error.message);
      }
    } else {
      toast.error('Razorpay SDK not loaded');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'The auction you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/auctions')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button></li>
            <li>/</li>
            <li><button onClick={() => navigate('/auctions')} className="hover:text-blue-600">Auctions</button></li>
            <li>/</li>
            <li className="text-gray-900">{auction.item_name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Auction Image */}
          <div className="space-y-4">
            <img
              src={auction.item_image}
              alt={auction.item_name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
            
            {/* Auction Status */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </span>
              
              {timeRemaining && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Time Remaining:</span> {timeRemaining}
                </div>
              )}
            </div>
          </div>

          {/* Auction Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.item_name}</h1>
              {auction.description && (
                <p className="text-gray-700 text-base mb-4 whitespace-pre-line">{auction.description}</p>
              )}
              {/* Admin Controls for Live Auctions */}
              {user && user.is_admin && auction.status === 'active' && (
                <div className="flex gap-4 mt-2">
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this auction? This cannot be undone.')) {
                        try {
                          const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
        await fetch(`${apiBaseUrl}/api/auction/${auction._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}` },
                          });
                          toast.success('Auction deleted');
                          navigate('/auctions');
                        } catch (err) {
                          toast.error('Failed to delete auction');
                        }
                      }
                    }}
                  >
                    Delete Auction
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => setShowEditEndTime(true)}
                  >
                    Edit End Time
                  </button>
                </div>
              )}
              {/* Edit End Time Modal */}
              {showEditEndTime && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-4">Edit Auction End Time</h2>
                    <input
                      type="datetime-local"
                      value={newEndTime ? new Date(newEndTime).toISOString().slice(0,16) : ''}
                      min={auction.start_time ? new Date(auction.start_time).toISOString().slice(0,16) : ''}
                      onChange={e => setNewEndTime(e.target.value)}
                      className="input-field w-full mb-4"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        onClick={() => setShowEditEndTime(false)}
                        disabled={endTimeLoading}
                      >Cancel</button>
                      <button
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        disabled={endTimeLoading}
                        onClick={async () => {
                          setEndTimeLoading(true);
                          try {
                            const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
        const res = await fetch(`${apiBaseUrl}/api/auction/${auction._id}/end-time`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
                              },
                              body: JSON.stringify({ end_time: newEndTime })
                            });
                            if (!res.ok) throw new Error('Failed to update end time');
                            toast.success('End time updated');
                            setShowEditEndTime(false);
                            window.location.reload();
                          } catch (err) {
                            toast.error('Failed to update end time');
                          } finally {
                            setEndTimeLoading(false);
                          }
                        }}
                      >Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Bid */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Highest Bid</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{auction.highest_bid || auction.base_price}
              </div>
              {auction.highest_bidder_address && (
                <p className="text-sm text-gray-600">
                  By: {auction.highest_bidder_address.slice(0, 6)}...{auction.highest_bidder_address.slice(-4)}
                </p>
              )}
            </div>

            {/* Auction Info */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Auction Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{(auction.total_bids || 0) === 0 ? 'Starting Bid:' : 'Current Highest Bid:'}</span>
                  <div className="font-medium">₹{(auction.total_bids || 0) === 0 ? auction.base_price : auction.highest_bid}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Bids:</span>
                  <div className="font-medium">{auction.total_bids || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">Start Time:</span>
                  <div className="font-medium">{formatTime(auction.start_time)}</div>
                </div>
                <div>
                  <span className="text-gray-600">End Time:</span>
                  <div className="font-medium">{formatTime(auction.end_time)}</div>
                </div>
              </div>
            </div>

            {/* Bid Form: Only show if user is logged in, auction is live, user is not admin, and not auction creator */}
            {auction.status === 'active' && (
              user && !user.is_admin && auction.created_by !== user.id ? (
                                 <div className="bg-white p-6 rounded-lg shadow-md" id="bid-form">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bid</h3>
                   
                   {/* Transaction Fee Information */}
                   <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                     <h4 className="text-sm font-medium text-blue-900 mb-2">Transaction Fee Structure</h4>
                     <div className="text-xs text-blue-800 space-y-1">
                       <div>• Bid Amount ₹0 - ₹1000: ₹7.99 fee</div>
                       <div>• Bid Amount ₹1001 - ₹25000: ₹11.99 fee</div>
                       <div>• Bid Amount ₹25001+: ₹14.99 fee</div>
                     </div>
                     <p className="text-xs text-blue-700 mt-2 italic">
                       This transaction fee covers Razorpay's instant refund processing charges when you get outbid by another user and is non-refundable
                     </p>
                   </div>
                  
                  {/* Debug Button - Only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <button
                        type="button"
                        onClick={testRazorpayConfig}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        🧪 Test Razorpay Config
                      </button>
                      <p className="text-xs text-yellow-700 mt-1">
                        Use this button to test if Razorpay is properly configured
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={handleBid} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bid Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={auction.highest_bid ? auction.highest_bid + 1 : auction.base_price + 1}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Min: ₹${auction.highest_bid ? auction.highest_bid + 1 : auction.base_price + 1}`}
                        required
                      />
                    </div>

                                         {bidAmount && (
                       <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
                         <div className="flex justify-between">
                           <span>Bid Amount:</span>
                           <span>₹{parseFloat(bidAmount) || 0}</span>
                         </div>
                         <div className="flex justify-between text-gray-600">
                           <span>Transaction Fee:</span>
                           <span>₹{bidAmount <= 1000 ? '7.99' : bidAmount <= 25000 ? '11.99' : '14.99'}</span>
                         </div>
                         <div className="flex justify-between font-semibold border-t pt-2">
                           <span>Total Amount:</span>
                           <span>₹{(parseFloat(bidAmount) || 0) + (bidAmount <= 1000 ? 7.99 : bidAmount <= 25000 ? 11.99 : 14.99)}</span>
                         </div>
                         <div className="text-xs text-gray-500 mt-2">
                           💡 Transaction fee covers Razorpay processing charges and is non-refundable
                         </div>
                       </div>
                     )}

                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}

                    <button
                      type="submit"
                      disabled={bidding || !bidAmount}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {bidding ? 'Processing...' : 'Place Bid'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 font-medium">
                  Login to place a bid or register if you are new.
                </div>
              )
            )}
            {/* End Bid Form */}

            {/* Winner Info */}
            {auction.status === 'ended' && auction.winner_id && (
              <div className="bg-gradient-to-r from-blue-50 to-green-100 p-6 rounded-lg border border-green-300 flex items-center space-x-6 shadow-lg mt-4">
                <div className="flex-shrink-0">
                  {/* Fish trophy icon (SVG) */}
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="32" cy="32" rx="30" ry="18" fill="#34d399" stroke="#059669" strokeWidth="3" />
                    <ellipse cx="44" cy="32" rx="6" ry="3" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                    <ellipse cx="20" cy="32" rx="6" ry="3" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                    <circle cx="32" cy="32" r="8" fill="#2563eb" stroke="#1e40af" strokeWidth="2" />
                    <circle cx="35" cy="30" r="1.5" fill="#fff" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900 mb-1 flex items-center">
                    <span className="mr-2">🏆</span> Auction Winner
                  </h3>
                  <div className="text-green-800 text-lg font-semibold">
                    <span className="mr-2">Winner:</span>
                    {auction.winner_name ? (
                      <span className="text-blue-700">{auction.winner_name}</span>
                    ) : (
                      <span className="text-gray-700">User {auction.winner_id}</span>
                    )}
                  </div>
                  <div className="text-green-700 text-lg mt-1">
                    <span className="mr-2">Winning Bid:</span>
                    <span className="font-bold">₹{auction.winning_amount}</span>
                  </div>
                  {auction.winner_location && (
                    <div className="text-green-700 text-base mt-1">
                      <span className="mr-2">Location:</span>
                      <span className="font-semibold">{auction.winner_location}</span>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500 italic">Congratulations to the champion of the Pulasa auction!</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Bids - Public (visible to everyone) */}
        <div className="mt-12">
                     <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Bids</h2>
          </div>
           
           
           
           {bidsLoading ? (
               <div className="text-center py-4">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                 <p className="text-gray-500 mt-2">Updating bids...</p>
               </div>
             ) : recentBids.length === 0 ? (
            <div className="text-gray-500">No recent bids yet.</div>
          ) : (
            recentBids.map((bid, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-2">
                      <div>
                   <div className="font-semibold">{bid.bidder?.username || bid.bidder?.name || 'Unknown User'}</div>
                  <div className="text-xs text-gray-500">{formatTime(bid.created_at)}</div>
                  {bid.location && <div className="text-xs text-gray-400">{bid.location}</div>}
                      </div>
                <div className="text-green-600 font-bold text-lg">₹{bid.amount}</div>
              </div>
            ))
            )}
        </div>

        {/* Bid History - Only for logged-in users */}
        {user && (
          <div className="mt-12">
                      <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Bid History</h2>
          </div>
            {bidsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Updating bid history...</p>
              </div>
            ) : bidHistory.length === 0 ? (
              <div className="text-gray-500">No bid history yet.</div>
            ) : (
              bidHistory.map((bid, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-2">
                        <div>
                     <div className="font-semibold">{bid.bidder?.username || bid.bidder?.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{formatTime(bid.created_at)}</div>
                    {bid.location && <div className="text-xs text-gray-400">{bid.location}</div>}
                        </div>
                  <div className="text-green-600 font-bold text-lg">₹{bid.amount}</div>
                </div>
              ))
              )}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-700 rounded-full p-2 shadow-lg">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full relative">
            <div className="flex flex-col items-center">
              <svg className="h-10 w-10 text-yellow-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Bid</h2>
              <p className="text-gray-700 mb-4">Are you sure you want to place this bid? <br/> <b>Once placed, your bid cannot be reverted or undone.</b></p>
              <div className="flex space-x-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={confirmBid}>Yes, Place Bid</button>
                <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Outbid Modal */}
      {showOutbidModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative text-center border-2 border-red-200">
            {/* Close button */}
            <button
              onClick={() => setShowOutbidModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Alert Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Main Message */}
            <h2 className="text-2xl font-bold text-red-700 mb-3">🚨 You've Been Outbid!</h2>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-700 text-lg">
                <span className="font-semibold">Don't let this one get away!</span>
              </p>
              <p className="text-gray-600">
                Another bidder just placed a higher bid on <span className="font-semibold text-gray-800">"{auction.item_name}"</span>
              </p>
              
              {/* Refund Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Your previous bid has been automatically refunded!</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => {
                  setShowOutbidModal(false);
                  // Scroll to bid form
                  document.getElementById('bid-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                🚀 Bid Again & Stay on Top!
              </button>
              
              <button
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => {
                  setShowOutbidModal(false);
                  navigate(`/auction/${auction._id}`);
                }}
              >
                💪 Show Them Who's Boss!
              </button>
              
              <button
                className="w-full bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                onClick={() => setShowOutbidModal(false)}
              >
                Maybe Later
              </button>
            </div>

            {/* Motivational Quote */}
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 italic">
                "The best revenge is massive success!" - Frank Sinatra
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h2>
            <p className="text-gray-800 mb-4">
              🎉 You won the auction for <b>{auction.item_name}</b> with a bid of <b>₹{auction.winning_amount}</b>!
            </p>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => setShowWinnerModal(false)}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuctionDetail; 