import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';
import axios from 'axios'; // Added axios import

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

  // Create Razorpay order for payment authorization
  const createRazorpayOrder = async (auctionId, amount, location = '') => {
    try {
      console.log('🚀 Starting createRazorpayOrder...', { auctionId, amount, location });
      
      // Check if user is authenticated
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated:', user.id);

      // Check if auth token exists
      const token = localStorage.getItem('pulasa_ecommerce_token');
      if (!token) {
        console.error('❌ No auth token found');
        throw new Error('No authentication token found');
      }
      console.log('🔑 Auth token: Present');

      // Prepare request body
      const requestBody = {
        auction_id: auctionId,
        amount: amount,
        location: location || ''
      };
      console.log('📤 Request body:', requestBody);

      // Make API call
      const apiUrl = `${apiBaseUrl}/api/bid/place`;
      console.log('🌐 Making API call to:', apiUrl);
      
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.data.success) {
        console.log('✅ Razorpay order created successfully:', response.data);
        console.log('🔍 Order details:', response.data.razorpay_order);
        return response.data;
      } else {
        console.error('❌ API returned success: false:', response.data);
        throw new Error(response.data.error || 'Failed to create Razorpay order');
      }

    } catch (error) {
      console.error('💥 createRazorpayOrder Error Details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response) {
        console.error('📥 Response status:', error.response.status);
        console.error('📥 Response headers:', error.response.headers);
        console.error('❌ API Error Response:', error.response.data);
      }

      throw error;
    }
  };

  // Verify payment authorization
  const verifyPayment = async (paymentId, orderId, signature, auctionId, amount, location = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiBaseUrl}/api/bid/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({
          payment_id: paymentId,
          order_id: orderId,
          signature: signature,
          auction_id: auctionId,
          amount: amount,
          location: location
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
      
      // Check if user is authenticated
      if (!user) {
        console.error('❌ User not authenticated in placeBid');
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated:', user.id);

      // Check if auctionId is valid
      if (!auctionId || auctionId === 'undefined') {
        console.error('❌ Invalid auctionId:', auctionId);
        throw new Error('Invalid auction ID');
      }
      console.log('✅ AuctionId valid:', auctionId);

      // Check if amount is valid
      if (!amount || amount <= 0) {
        console.error('❌ Invalid amount:', amount);
        throw new Error('Invalid bid amount');
      }
      console.log('✅ Amount valid:', amount);

      // Create Razorpay order
      console.log('🔄 Creating Razorpay order...');
      const orderResult = await createRazorpayOrder(auctionId, amount, location);
      console.log('✅ Razorpay order created:', orderResult);

      // Check if orderResult has the expected structure
      if (!orderResult.razorpay_order || !orderResult.razorpay_order.id) {
        console.error('❌ Invalid orderResult structure:', orderResult);
        throw new Error('Invalid order result from server');
      }
      console.log('✅ OrderResult structure valid:', {
        orderId: orderResult.razorpay_order.id,
        amount: orderResult.razorpay_order.amount,
        currency: orderResult.razorpay_order.currency
      });

      // Prepare Razorpay options
      const razorpayAmount = Math.round(orderResult.razorpay_order.amount * 100);
      console.log('💰 Razorpay amount calculation:', {
        originalAmount: orderResult.razorpay_order.amount,
        convertedToPaise: razorpayAmount
      });

      // Check if Razorpay key is available
      console.log('🔍 Environment check:');
      console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
      console.log('🔍 REACT_APP_RAZORPAY_KEY_ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
      console.log('🔍 All env vars with RAZORPAY:', Object.keys(process.env).filter(key => key.includes('RAZORPAY')));
      
      // Try to get the key from different sources
      let razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      
      // If not found in process.env, try to get from window object (for runtime injection)
      if (!razorpayKey && window.__RAZORPAY_CONFIG__) {
        razorpayKey = window.__RAZORPAY_CONFIG__.key_id;
        console.log('🔍 Found Razorpay key from window.__RAZORPAY_CONFIG__');
      }
      
      if (!razorpayKey) {
        console.error('❌ REACT_APP_RAZORPAY_KEY_ID not found in environment');
        console.error('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('RAZORPAY')));
        console.error('🔍 Window config:', window.__RAZORPAY_CONFIG__);
        throw new Error('Razorpay configuration missing. Please check environment variables.');
      }

      console.log('🔑 Razorpay Key ID found:', razorpayKey ? 'Present' : 'Missing');

      const options = {
        key: razorpayKey,
        amount: razorpayAmount,
        currency: orderResult.razorpay_order.currency || 'INR',
        name: 'Pulasa Auctions',
        description: `Bid of ₹${amount} on auction`,
        order_id: orderResult.razorpay_order.id,
        handler: async function (response) {
          console.log('🎉 Razorpay payment successful:', response);
          try {
            await verifyPayment(response.payment_id, response.order_id, response.signature, auctionId, amount, location);
            toast.success('Bid placed successfully!');
            // Refresh auction data after successful bid
            window.location.reload();
          } catch (error) {
            console.error('❌ Payment verification failed:', error);
            toast.error('Payment verification failed. Please try again.');
          }
        },
        prefill: {
          name: user.name || user.username || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            console.log('Razorpay checkout dismissed');
            toast.info('Bid placement cancelled');
          }
        }
      };

      console.log('🔧 Razorpay options prepared:', {
        key: options.key ? 'Present' : 'Missing',
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id
      });

      // Check if Razorpay is loaded
      console.log('🔍 Razorpay SDK check:');
      console.log('🔍 window.Razorpay:', typeof window.Razorpay);
      console.log('🔍 window.Razorpay constructor:', window.Razorpay);
      
      if (typeof window.Razorpay === 'undefined') {
        console.error('❌ Razorpay SDK not loaded');
        console.error('🔍 Available window objects:', Object.keys(window).filter(key => key.includes('Razorpay')));
        throw new Error('Razorpay SDK not available. Please refresh the page or check internet connection.');
      }

      // Open Razorpay checkout
      console.log('🚀 Opening Razorpay checkout...');
      console.log('🔧 Final Razorpay options:', options);
      
      try {
        const rzp = new window.Razorpay(options);
        console.log('✅ Razorpay instance created successfully');
        rzp.open();
        console.log('✅ Razorpay checkout opened successfully');
      } catch (rzpError) {
        console.error('❌ Error opening Razorpay checkout:', rzpError);
        console.error('❌ Error details:', {
          name: rzpError.name,
          message: rzpError.message,
          stack: rzpError.stack
        });
        throw new Error('Failed to open payment gateway. Please try again.');
      }
      
      return { success: true, orderId: orderResult.razorpay_order.id };

    } catch (error) {
      console.error('💥 placeBid Error Details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        auctionId,
        amount,
        location
      });
      
      toast.error(error.message || 'Failed to place bid');
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
    createRazorpayOrder,
    verifyPayment
  };

  return (
    <BidContext.Provider value={value}>
      {children}
    </BidContext.Provider>
  );
};
