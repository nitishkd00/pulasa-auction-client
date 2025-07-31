import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

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

  // Create bid order
  const createBidOrder = async (auctionId, amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bid/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({ auction_id: auctionId, amount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bid order');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Create bid order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify payment and place bid
  const verifyPaymentAndBid = async (paymentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bid/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment and place bid');
      }
      
      const data = await response.json();
      
      // Refresh user bids
      await fetchUserBids();
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Verify payment error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's bids
  const fetchUserBids = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page);
      
      const response = await fetch(`/api/bid/my-bids?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user bids');
      }
      
      const data = await response.json();
      setUserBids(data.bids || []);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Fetch user bids error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch auction bids
  const fetchAuctionBids = async (auctionId, page = 1) => {
    if (!auctionId || auctionId === 'undefined') {
      return { bids: [] };
    }
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page);
      
      const response = await fetch(
        `/api/bid/auction/${auctionId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 403) {
          return { bids: [] };
        }
        throw new Error('Failed to fetch auction bids');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Fetch auction bids error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate platform fee
  const calculatePlatformFee = (bidAmount) => {
    const fee = Math.min(Math.max(bidAmount * 0.02, 2), 5); // 2% with min ₹2, max ₹5
    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  };

  // Get total amount including platform fee
  const getTotalAmount = (bidAmount) => {
    const platformFee = calculatePlatformFee(bidAmount);
    return bidAmount + platformFee;
  };

  // Listen for real-time bid updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new bids
    socket.on('newBid', (bidData) => {
      // Update user bids if the new bid is from current user
      if (user && bidData.bidder === user.username) {
        fetchUserBids();
      }
    });

    return () => {
      socket.off('newBid');
    };
  }, [socket, user]);

  const value = {
    userBids,
    loading,
    error,
    createBidOrder,
    verifyPaymentAndBid,
    fetchUserBids,
    fetchAuctionBids,
    calculatePlatformFee,
    getTotalAmount
  };

  return (
    <BidContext.Provider value={value}>
      {children}
    </BidContext.Provider>
  );
}; 