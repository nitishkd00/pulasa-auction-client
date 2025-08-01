import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
  const [balance, setBalance] = useState(0);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Get API base URL from environment
  const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';

  // DEBUG: Log environment variables
  console.log('🔍 DEBUG - WalletContext Environment Variables:');
  console.log('REACT_APP_AUCTION_SERVER_URL:', process.env.REACT_APP_AUCTION_SERVER_URL);
  console.log('Using apiBaseUrl:', apiBaseUrl);

  const fetchBalance = async () => {
    if (!user) {
      console.log('No user found, skipping wallet fetch');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      console.log('Fetching wallet balance for user:', user.email, 'Token exists:', !!token);
      
      const response = await fetch(`${apiBaseUrl}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
      setBalance(data.balance);
      setLockedAmount(data.locked_amount);
      return data;
    } catch (err) {
      console.error('Fetch wallet balance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTopupOrder = async (amount) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/topup/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create topup order');
      }
    } catch (err) {
      console.error('Create topup order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId, orderId, signature) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/topup/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId, orderId, signature })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchBalance(); // Refresh balance
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verify topup payment error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (auctionId, amount) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/bid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auctionId, amount })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchBalance(); // Refresh balance
        return data;
      } else {
        const errorData = await response.json();
        console.error('Bid error response:', errorData);
        if (errorData.errors) {
          throw new Error(
            errorData.errors.map(e => e.msg).join('; ') || 'Failed to place bid'
          );
        }
        throw new Error(errorData.error || 'Failed to place bid');
      }
    } catch (err) {
      console.error('Place bid error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const withdrawAmount = async (amount) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchBalance(); // Refresh balance
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Withdrawal failed');
      }
    } catch (err) {
      console.error('Withdraw wallet error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`${apiBaseUrl}/api/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        return data;
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Get transaction history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBids = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/active-bids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveBids(data.bids);
        return data;
      } else {
        console.error('Failed to fetch active bids');
      }
    } catch (err) {
      console.error('Get active bids error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWonAuctions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/wallet/won-auctions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWonAuctions(data.auctions);
        return data;
      } else {
        console.error('Failed to fetch won auctions');
      }
    } catch (err) {
      console.error('Get won auctions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize wallet balance when user logs in
  useEffect(() => {
    if (user) {
      fetchBalance();
    } else {
      setBalance(0);
      setLockedAmount(0);
      setTransactions([]);
      setActiveBids([]);
      setWonAuctions([]);
    }
  }, [user]);

  // Listen for real-time wallet updates
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for bid updates that might affect wallet
    socket.on('newBid', (bidData) => {
      // Refresh wallet balance when new bids are placed
      fetchBalance();
    });

    return () => {
      socket.off('newBid');
    };
  }, [socket, user]);

  const value = {
    balance,
    lockedAmount,
    transactions,
    activeBids,
    wonAuctions,
    loading,
    fetchBalance,
    createTopupOrder,
    verifyPayment,
    placeBid,
    withdrawAmount,
    fetchTransactions,
    fetchActiveBids,
    fetchWonAuctions
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 