import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!user) {
      console.log('No user found, skipping wallet fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      console.log('Fetching wallet balance for user:', user.email, 'Token exists:', !!token);
      
      const response = await fetch(`/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Wallet API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Wallet API error response:', errorText);
        throw new Error('Failed to fetch wallet balance');
      }
      
      const data = await response.json();
      console.log('Wallet data received:', data);
      setWallet(data.wallet);
      return data.wallet;
    } catch (err) {
      setError(err.message);
      console.error('Fetch wallet balance error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create top-up order
  const createTopupOrder = async (amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/topup/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create top-up order');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Create topup order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify top-up payment
  const verifyTopupPayment = async (paymentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/topup/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
      }
      
      const data = await response.json();
      
      // Refresh wallet balance
      await fetchWalletBalance();
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Verify topup payment error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Place bid using wallet
  const placeBid = async (auctionId, amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({ auction_id: auctionId, amount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Bid error response:', errorData);
        if (errorData.errors) {
          throw new Error(
            errorData.errors.map(e => e.msg).join('; ') || 'Failed to place bid'
          );
        }
        throw new Error(errorData.error || 'Failed to place bid');
      }
      
      const data = await response.json();
      
      // Refresh wallet balance
      await fetchWalletBalance();
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Place bid error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Withdraw wallet balance
  const withdrawWallet = async (amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify({ amount })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw funds');
      }
      
      const data = await response.json();
      
      // Refresh wallet balance
      await fetchWalletBalance();
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Withdraw wallet error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction history
  const getTransactionHistory = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page);
      if (limit !== 10) params.append('limit', limit);
      
      const response = await fetch(`/api/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Get transaction history error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get active bids
  const getActiveBids = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/active-bids`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch active bids');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Get active bids error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get won auctions
  const getWonAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/won-auctions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch won auctions');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Get won auctions error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize wallet balance when user logs in
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    } else {
      setWallet(null);
    }
  }, [user]);

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for bid updates that might affect wallet
    socket.on('newBid', (bidData) => {
      // Refresh wallet balance when new bids are placed
      fetchWalletBalance();
    });

    return () => {
      socket.off('newBid');
    };
  }, [socket, user]);

  const value = {
    wallet,
    loading,
    error,
    fetchWalletBalance,
    createTopupOrder,
    verifyTopupPayment,
    placeBid,
    withdrawWallet,
    getTransactionHistory,
    getActiveBids,
    getWonAuctions
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 