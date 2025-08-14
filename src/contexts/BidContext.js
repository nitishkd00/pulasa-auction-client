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
        
        // Add fee information to the response
        const totalAmount = getTotalAmount(amount);
        const feeInfo = {
          bid_amount: amount,
          transaction_fee: calculateTransactionFee(amount),
          total_amount: totalAmount
        };
        
        return {
          ...response.data,
          fee_info: feeInfo
        };
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
          location: location,
          transaction_fee: calculateTransactionFee(amount),
          total_amount: getTotalAmount(amount)
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
      return data; // Return the full response object
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
      setUserBids(data.bids); // Changed from setBids to setUserBids
      return data.bids;
    } catch (err) {
      setError(err.message);
      console.error('Fetch user bids error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate transaction fee based on Razorpay processing charges
  const calculateTransactionFee = (amount) => {
    if (amount <= 1000) {
      return 7.99;
    } else if (amount <= 25000) {
      return 11.99;
    } else {
      return 14.99;
    }
  };

  // Get total amount including transaction fee
  const getTotalAmount = (amount) => {
    return amount + calculateTransactionFee(amount);
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
      console.log('🔍 User data available:', {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasPhone: !!user.phone
      });

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

      // Calculate transaction fee and total amount
      const transactionFee = calculateTransactionFee(amount);
      const totalAmount = getTotalAmount(amount);
      console.log('💰 Fee calculation:', {
        bidAmount: amount,
        transactionFee: transactionFee,
        totalAmount: totalAmount
      });

      // Create Razorpay order with total amount (bid + fee)
      console.log('🔄 Creating Razorpay order for total amount:', totalAmount);
      const orderResult = await createRazorpayOrder(auctionId, totalAmount, location);
      console.log('✅ Razorpay order created:', orderResult);

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create payment order');
      }

      // Validate order result structure
      if (!orderResult.razorpay_order || !orderResult.razorpay_order.id || !orderResult.razorpay_order.amount || !orderResult.razorpay_order.currency) {
        console.error('❌ Invalid order result structure:', orderResult);
        throw new Error('Invalid order response from server');
      }
      console.log('✅ OrderResult structure valid:', {
        orderId: orderResult.razorpay_order.id,
        amount: orderResult.razorpay_order.amount,
        currency: orderResult.razorpay_order.currency
      });

      // Calculate amount in paise (Razorpay requirement)
      const razorpayAmount = Math.round(parseFloat(amount) * 100);
      console.log('💰 Razorpay amount calculation:', {
        originalAmount: amount,
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
        throw new Error('Razorpay configuration missing. Please check environment variables.');
      }

      console.log('🔑 Razorpay Key ID found:', process.env.REACT_APP_RAZORPAY_KEY_ID ? 'Present' : 'Missing');

      // Prepare Razorpay options
      const options = {
        key: razorpayKey,
        amount: razorpayAmount,
        currency: orderResult.razorpay_order.currency || 'INR',
        name: 'Pulasa Auctions',
        description: `Bid of ₹${amount} on auction`,
        order_id: orderResult.razorpay_order.id,
        prefill: {
          name: user.name || user.email,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          auction_id: auctionId,
          user_id: user.id,
          bid_amount: amount,
          location: location
        },
        theme: {
          color: '#10B981'
        },
        handler: async function (response) {
          console.log('🎉 Razorpay payment successful!', response);
          try {
            // Verify payment and complete bid
            const verificationResult = await verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              auctionId,
              amount,
              location
            );
            
            if (verificationResult.success) {
              console.log('✅ Bid completed successfully after payment verification');
              // Show success message
              toast.success('Bid placed successfully!');
              // Refresh auction data after successful bid
              window.location.reload();
            } else {
              console.error('❌ Payment verification failed:', verificationResult.error);
              toast.error('Payment verification failed. Please try again.');
            }
          } catch (error) {
            console.error('❌ Error during payment verification:', error);
            toast.error('Payment verification failed. Please try again.');
          }
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Razorpay checkout dismissed by user');
            toast.info('Bid placement cancelled');
          }
        }
      };

      console.log('🔧 Razorpay options prepared:', {
        key: razorpayKey ? 'Present' : 'Missing',
        amount: razorpayAmount,
        currency: options.currency,
        order_id: options.order_id,
        prefill: options.prefill
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
        
        // Return success but DON'T show success message yet - wait for payment completion
        return { 
          success: true, 
          orderId: orderResult.orderId,
          message: 'Payment popup opened. Please complete the payment to place your bid.',
          status: 'payment_pending'
        };
        
      } catch (rzpError) {
        console.error('❌ Error opening Razorpay checkout:', rzpError);
        throw new Error('Failed to open payment gateway. Please try again.');
      }
      
    } catch (error) {
      console.error('💥 placeBid error:', error);
      setError(error.message);
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
    userBids: userBids, // Renamed from userBids to bids to match the new state variable
    loading,
    error,
    placeBid,
    fetchUserBids,
    fetchAuctionBids,
    calculateTransactionFee,
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
