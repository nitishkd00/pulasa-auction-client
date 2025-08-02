import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const AuctionContext = createContext();

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};

export const AuctionProvider = ({ children }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Get API base URL from environment
  const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';

  // Fetch all auctions
  const fetchAuctions = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/auction?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions);
        return data;
      } else {
        throw new Error('Failed to fetch auctions');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch auctions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single auction
  const fetchAuctionById = async (id) => {
    if (!id || id === 'undefined') {
      console.error('fetchAuction called with invalid id:', id);
      throw new Error('Invalid auction ID');
    }
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/auction/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data; // Return the complete response
      } else {
        throw new Error('Failed to fetch auction');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch auction error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new auction (Admin only)
  const createAuction = async (auctionData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/auction/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auctionData)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Auction created successfully!');
        await fetchAuctions(); // Refresh auctions list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create auction');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Create auction error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // End auction (Admin only)
  const endAuction = async (auctionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/auction/${auctionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Auction ended successfully!');
        await fetchAuctions(); // Refresh auctions list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end auction');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('End auction error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get auction statistics (Admin only)
  const getAuctionStats = async (auctionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await fetch(`${apiBaseUrl}/api/auction/${auctionId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to fetch auction stats');
      }
    } catch (err) {
      console.error('Get auction stats error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new bids
    socket.on('newBid', (bidData) => {
      setAuctions(prevAuctions => 
        prevAuctions.map(auction => 
          auction.id === bidData.auction_id 
            ? { ...auction, highest_bid: bidData.amount, highest_bidder_address: bidData.bidder_address }
            : auction
        )
      );
    });

    // Listen for auction status changes
    socket.on('auctionEnded', (auctionData) => {
      setAuctions(prevAuctions => 
        prevAuctions.map(auction => 
          auction.id === auctionData.auction_id 
            ? { ...auction, status: 'ended', winner_id: auctionData.winner_id, winning_amount: auctionData.winning_amount }
            : auction
        )
      );
    });

    return () => {
      socket.off('newBid');
      socket.off('auctionEnded');
    };
  }, [socket]);

  const value = {
    auctions,
    loading,
    error,
    fetchAuctions,
    fetchAuctionById,
    createAuction,
    endAuction,
    getAuctionStats
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}; 