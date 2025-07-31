import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import WalletCard from '../components/WalletCard';
import { Wallet as WalletIcon, Clock, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

const WalletPage = () => {
  const { user } = useAuth();
  const { 
    wallet, 
    loading, 
    getTransactionHistory, 
    getActiveBids, 
    getWonAuctions 
  } = useWallet();
  
  const [transactions, setTransactions] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactionPage, setTransactionPage] = useState(1);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, transactionPage]);

  const loadData = async () => {
    try {
      // Load transaction history
      const transactionData = await getTransactionHistory(transactionPage);
      setTransactions(transactionData.transactions || []);

      // Load active bids
      const bidsData = await getActiveBids();
      setActiveBids(bidsData.active_bids || []);

      // Load won auctions
      const auctionsData = await getWonAuctions();
      setWonAuctions(auctionsData.won_auctions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'topup':
        return <ArrowDown className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUp className="h-5 w-5 text-red-600" />;
      case 'bid':
        return <WalletIcon className="h-5 w-5 text-blue-600" />;
      case 'unlock':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <WalletIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'topup':
        return 'text-green-600 bg-green-100';
      case 'withdrawal':
        return 'text-red-600 bg-red-100';
      case 'bid':
        return 'text-blue-600 bg-blue-100';
      case 'unlock':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600">You need to be logged in to view your wallet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your wallet balance and view transaction history</p>
        </div>

        {/* Wallet Card */}
        <div className="mb-8">
          <WalletCard />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaction History
              </button>
              <button
                onClick={() => setActiveTab('active-bids')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active-bids'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Bids ({activeBids.length})
              </button>
              <button
                onClick={() => setActiveTab('won-auctions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'won-auctions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Won Auctions ({wonAuctions.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
                {/* Render transaction history here */}
                {transactions.length === 0 ? (
                  <p className="text-gray-500">No transactions found.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {transactions.map((tx, idx) => (
                      <li key={idx} className="py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {tx.type === 'topup' && <ArrowUp className="h-5 w-5 text-green-500" />}
                          {tx.type === 'withdrawal' && <ArrowDown className="h-5 w-5 text-red-500" />}
                          {tx.type === 'bid' && <WalletIcon className="h-5 w-5 text-blue-500" />}
                          <span className="font-medium text-gray-900">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-700 font-semibold">₹{tx.amount}</span>
                          <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === 'active-bids' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Active Bids</h2>
                {/* Render active bids here */}
                {activeBids.length === 0 ? (
                  <p className="text-gray-500">No active bids found.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {activeBids.map((bid, idx) => (
                      <li key={idx} className="py-4 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">Auction: {bid.auction_name}</span>
                          <div className="text-xs text-gray-400">Bid Amount: ₹{bid.amount}</div>
                        </div>
                        <div>
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === 'won-auctions' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Won Auctions</h2>
                {/* Render won auctions here */}
                {wonAuctions.length === 0 ? (
                  <p className="text-gray-500">No won auctions found.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {wonAuctions.map((auction, idx) => (
                      <li key={idx} className="py-4 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{auction.item_name}</span>
                          <div className="text-xs text-gray-400">Winning Bid: ₹{auction.winning_amount}</div>
                        </div>
                        <div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage; 