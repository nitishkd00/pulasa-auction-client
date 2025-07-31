import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Fetch all auctions
  const fetchAuctions = async (status = null, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (page > 1) params.append('page', page);
      
      const response = await fetch(`https://pulasa-auction-server.onrender.com/api/auction?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      
      const data = await response.json();
      setAuctions(data.auctions || []);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Fetch auctions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single auction
  const fetchAuction = async (id) => {
    if (!id || id === 'undefined') {
      console.error('fetchAuction called with invalid id:', id);
      throw new Error('Invalid auction ID');
    }
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`https://pulasa-auction-server.onrender.com/api/auction/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch auction');
      }
      
      const data = await response.json();
      return data;
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
      
      const response = await fetch(`https://pulasa-auction-server.onrender.com/api/auction/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        },
        body: JSON.stringify(auctionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create auction');
      }
      
      const data = await response.json();
      
      // Refresh auctions list
      await fetchAuctions();
      
      return data;
    } catch (err) {
      setError(err.message);
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
      
      const response = await fetch(`https://pulasa-auction-server.onrender.com/api/auction/${auctionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end auction');
      }
      
      const data = await response.json();
      
      // Refresh auctions list
      await fetchAuctions();
      
      return data;
    } catch (err) {
      setError(err.message);
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
      
      const response = await fetch(`https://pulasa-auction-server.onrender.com/api/auction/${auctionId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pulasa_ecommerce_token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auction statistics');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
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
    fetchAuction,
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