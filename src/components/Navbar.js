import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Fish, Menu, X, AlertCircle, ArrowRight, ExternalLink, ArrowLeft } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToMainSite = () => {
    const mainSiteUrl = process.env.REACT_APP_MAIN_SITE_URL || 'https://pulasa.com';
    console.log('🔗 NAVBAR: Redirecting to main site:', mainSiteUrl);
    window.open(mainSiteUrl, '_blank');
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
              <Link to="/my-bids" className="text-gray-600 hover:text-orange-700 transition-colors font-medium">
                My Bids
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">
                  Welcome, {user.name || user.username}
                </span>
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Pulasa</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Pulasa</span>
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
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
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
              {user && !user.is_admin && (
                <Link
                  to="/my-bids"
                  className="block px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  My Bids
                </Link>
              )}
              {user ? (
                <div className="px-3 py-2">
                  <span className="text-gray-700 font-medium">
                    Welcome, {user.name || user.username}
                  </span>
                  <button
                    onClick={handleGoToMainSite}
                    className="flex items-center space-x-2 w-full mt-2 px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                  >
                    <ArrowLeft size={20} />
                    <span>Back to Pulasa</span>
                </button>
                </div>
              ) : (
                <button
                  onClick={handleGoToMainSite}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-gray-600 hover:text-orange-700 transition-colors font-medium"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Pulasa</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
