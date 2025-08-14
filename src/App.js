import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuctionProvider } from './contexts/AuctionContext';
import { BidProvider } from './contexts/BidContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthTransferHandler from './components/AuthTransferHandler';
import FishLoadingIcon from './components/FishLoadingIcon';

// Debug utilities
import './utils/BrowserDebugger';

// Pages
import Home from './pages/Home';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import Profile from './pages/Profile';
import MyBids from './pages/MyBids';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import Terms from './pages/Terms';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FishLoadingIcon size="md" />
      </div>
    );
  }

  if (!user) {
    // Redirect to home instead of login since auction app doesn't have login
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FishLoadingIcon size="md" />
      </div>
    );
  }
  return (
    <AuthTransferHandler>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auctions" element={<AuctionList />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/terms" element={<Terms />} />
          {/* Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bids" 
            element={
              <ProtectedRoute>
                <MyBids />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-auction" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <CreateAuction />
              </ProtectedRoute>
            } 
          />
          <Route 
            element={
              <ProtectedRoute>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
    </AuthTransferHandler>
  );
};

// Root App Component
const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AuctionProvider>
          <BidProvider>
            <NotificationProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </NotificationProvider>
          </BidProvider>
        </AuctionProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App; 