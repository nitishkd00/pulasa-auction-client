import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const BidContext = createContext();

export const useBid = () => {
  const context = useContext(BidContext);
  if (!context) {
    throw new Error('useBid must be used within a BidProvider');
  }
  return context;
};

export const BidProvider = ({ children }) => {
  const [userBids, setUserBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Get API base URL from environment
  const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';

  // Create bid order for authorization
  const createBidOrder = async (auctionId, amount, location = '') => {
    try {
      console.log('🚀 Starting createBidOrder...', { auctionId, amount, location });
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
      
      const requestBody = { 
        auction_id: auctionId, 
        amount: amount,
        location: location
      };
      console.log('📤 Request body:', requestBody);
      
      console.log('🌐 Making API call to:', `${apiBaseUrl}/api/bid/place`);
      
      const response = await fetch(`${apiBaseUrl}/api/bid/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to create bid order');
      }
      
      const data = await response.json();
      console.log('✅ API Success Response:', data);
      return data;
    } catch (err) {
      console.error('💥 createBidOrder Error Details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify payment authorization
  const verifyPayment = async (auctionId, paymentId, orderId, signature) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/api/bid/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({
          auction_id: auctionId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Payment verification error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch auction bids
  const fetchAuctionBids = async (auctionId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bid/auction/${auctionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch auction bids');
      }
      
      const data = await response.json();
      return data.bids;
    } catch (err) {
      console.error('Fetch auction bids error:', err);
      throw err;
    }
  };

  // Fetch user's bids
  const fetchUserBids = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/api/bid/my-bids`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user bids');
      }
      
      const data = await response.json();
      setUserBids(data.bids);
      return data.bids;
    } catch (err) {
      setError(err.message);
      console.error('Fetch user bids error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate platform fee (if any)
  const calculatePlatformFee = (amount) => {
    // No platform fee in this implementation
    return 0;
  };

  // Get total amount including fees
  const getTotalAmount = (amount) => {
    return amount + calculatePlatformFee(amount);
  };

  // Place bid using Razorpay
  const placeBid = async (auctionId, amount, location = '') => {
    try {
      console.log('🎯 Starting placeBid...', { auctionId, amount, location });
      
      // Step 1: Create bid order
      console.log('📋 Step 1: Creating bid order...');
      const orderResult = await createBidOrder(auctionId, amount, location);
      console.log('📋 Step 1 Result:', orderResult);
      
      if (!orderResult.success) {
        console.error('❌ Bid order creation failed:', orderResult);
        throw new Error('Failed to create bid order');
      }

      // Step 2: Initialize Razorpay Checkout
      console.log('💳 Step 2: Initializing Razorpay...');
      console.log('🔑 Razorpay Key ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
      console.log('📊 Order Result:', orderResult);
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: Math.round(orderResult.razorpay_order.amount * 100), // Convert rupees to paise for Razorpay
        currency: orderResult.razorpay_order.currency,
        name: 'Pulasa Auctions',
        description: `Bid of ₹${amount} on auction`,
        order_id: orderResult.razorpay_order.id,
        handler: async function (response) {
          try {
            console.log('💳 Razorpay Payment Response:', response);
            
            // Step 3: Verify payment
            console.log('🔍 Step 3: Verifying payment...');
            await verifyPayment(
              auctionId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            toast.success('Bid placed successfully!');
            
            // Emit socket event for real-time updates
            if (socket) {
              socket.emit('bidPlaced', {
                auctionId,
                amount,
                bidder: user.id
              });
            }

            // Refresh user bids
            await fetchUserBids();
            
            return { success: true };
          } catch (error) {
            toast.error('Payment verification failed: ' + error.message);
            throw error;
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#7C3AED'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      return { success: true, orderId: orderResult.razorpay_order.id };
    } catch (error) {
      toast.error('Failed to place bid: ' + error.message);
      throw error;
    }
  };

  // Load user bids when user changes
  useEffect(() => {
    if (user) {
      fetchUserBids();
    }
  }, [user]);

  const value = {
    userBids,
    loading,
    error,
    placeBid,
    fetchUserBids,
    fetchAuctionBids,
    calculatePlatformFee,
    getTotalAmount,
    createBidOrder,
    verifyPayment
  };

  return (
    <BidContext.Provider value={value}>
      {children}
    </BidContext.Provider>
  );
};
