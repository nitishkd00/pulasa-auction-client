import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to Socket.IO server
      const isProd = process.env.NODE_ENV === 'production';
      const socketUrl = isProd ? window.location.origin : 'http://localhost:5001';
      const newSocket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('pulasa_ecommerce_token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setConnected(true);
        if (user && user.id) {
          newSocket.emit('registerUser', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Connection error. Please refresh the page.');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  const joinAuction = (auctionId) => {
    if (socket && connected) {
      socket.emit('joinAuction', auctionId);
      console.log(`Joined auction room: ${auctionId}`);
    }
  };

  const leaveAuction = (auctionId) => {
    if (socket && connected) {
      socket.emit('leaveAuction', auctionId);
      console.log(`Left auction room: ${auctionId}`);
    }
  };

  const onNewBid = (callback) => {
    if (socket) {
      socket.on('newBid', callback);
      return () => socket.off('newBid', callback);
    }
  };

  const onAuctionEnded = (callback) => {
    if (socket) {
      socket.on('auctionEnded', callback);
      return () => socket.off('auctionEnded', callback);
    }
  };

  const value = {
    socket,
    connected,
    joinAuction,
    leaveAuction,
    onNewBid,
    onAuctionEnded
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 