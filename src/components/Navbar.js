import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Fish, Menu, X, Wallet, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();

  const handleGoToMainSite = () => {
    window.open('http://localhost:8080', '_blank');
  };

  return (
    <nav className="bg-gray-100/80 backdrop-blur-md border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <img
                src="https://res.cloudinary.com/ddw4avyim/image/upload/v1752650318/WhatsApp_Image_2025-07-16_at_12.47.22_PM_1_eab8kb.jpg"
                alt="Pulasa Auctions Logo"
                className="w-8 h-8 object-contain rounded-full shadow-md"
              />
              <span className="text-xl font-bold text-orange-700 tracking-wide group-hover:text-amber-500 transition-colors">
                Pulasa <span className="text-amber-500">Auctions</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/auctions" className="text-gray-600 hover:text-orange-700 transition-colors font-medium">
              Auctions
            </Link>
            {user && user.is_admin && (
              <Link to="/admin" className="text-gray-600 hover:text-orange-700 transition-colors font-medium">
                Admin
              </Link>
            )}
            {user && !user.is_admin && (
              <>
                <Link to="/my-bids" className="text-gray-600 hover:text-orange-700 transition-colors font-medium">
                  My Bids
                </Link>
                <Link to="/wallet" className="flex items-center space-x-1 text-gray-600 hover:text-orange-700 transition-colors font-medium">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet</span>
                  {wallet && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ₹{wallet.available_balance?.toFixed(0) || '0'}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-600 hover:text-orange-700 transition-colors font-medium">
                  {user.name || user.email}
                </Link>
                <button
                  onClick={handleGoToMainSite}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>Back to Pulasa</span>
                  <ArrowRight className="h-4 w-4" />
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Please login first</span>
                </div>
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 bg-orange-700 text-white px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors font-medium"
                >
                  <span>Go to Pulasa</span>
                  <ArrowRight className="h-4 w-4" />
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-orange-700 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link
              to="/auctions"
              className="block px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Auctions
            </Link>
            {user && user.is_admin && (
              <Link
                to="/admin"
                className="block px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/my-bids"
                  className="block px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  My Bids
                </Link>
                <Link
                  to="/wallet"
                  className="flex items-center justify-between px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center space-x-1">
                    <Wallet className="h-4 w-4" />
                    <span>Wallet</span>
                  </span>
                  {wallet && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ₹{wallet.available_balance?.toFixed(0) || '0'}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium w-full justify-center"
                >
                  <span>Back to Pulasa</span>
                  <ArrowRight className="h-4 w-4" />
                  <ExternalLink className="h-3 w-3" />
                </button>
              </>
            )}
            
            {!user && (
              <div className="space-y-3 px-3 py-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Please login first</span>
                </div>
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 bg-orange-700 text-white px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors font-medium w-full justify-center"
                >
                  <span>Go to Pulasa</span>
                  <ArrowRight className="h-4 w-4" />
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 