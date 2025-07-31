import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, Plus, Minus, History } from 'lucide-react';

const WalletCard = () => {
  const { wallet, loading, createTopupOrder, withdrawWallet, verifyTopupPayment } = useWallet();
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!topupAmount || topupAmount < 100) return;

    try {
      setProcessing(true);
      const orderData = await createTopupOrder(parseFloat(topupAmount));
      
      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Pulasa Auction',
        description: `Wallet Top-up of ₹${topupAmount}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            await verifyTopupPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            setShowTopupModal(false);
            setTopupAmount('');
            alert('Wallet topped up successfully!');
          } catch (err) {
            alert('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com'
        },
        theme: {
          color: '#10B981'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert('Failed to create top-up order: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || withdrawAmount < 100) return;

    try {
      setProcessing(true);
      await withdrawWallet(parseFloat(withdrawAmount));
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      alert('Withdrawal initiated successfully!');
    } catch (err) {
      alert('Withdrawal failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Wallet className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-semibold">My Wallet</h3>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-green-100 text-sm">Available Balance</p>
            <p className="text-2xl font-bold">₹{wallet?.available_balance?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Total Balance: ₹{wallet?.total_balance?.toFixed(2) || '0.00'}</span>
            <span>Locked: ₹{wallet?.locked_amount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setShowTopupModal(true)}
            className="flex-1 bg-white text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Top Up
          </button>
          
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!wallet?.available_balance || wallet.available_balance < 100}
            className="flex-1 bg-white text-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4 inline mr-1" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Top Up Wallet</h3>
            <form onSubmit={handleTopup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  max="100000"
                  step="0.01"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter amount (min ₹100)"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={processing || !topupAmount || topupAmount < 100}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Top Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  max={wallet?.available_balance || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`Max: ₹${wallet?.available_balance?.toFixed(2) || '0.00'}`}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: ₹{wallet?.available_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={processing || !withdrawAmount || withdrawAmount < 100 || withdrawAmount > wallet?.available_balance}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Withdraw'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletCard; 