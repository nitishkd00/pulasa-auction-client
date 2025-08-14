import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Filter,
  Search,
  RefreshCw,

} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');


  // Dashboard Data
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalRefunds: 0,
    refundAmount: 0,
    averageBidsPerAuction: 0,
    topBidders: 0
  });

  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [users, setUsers] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [biddingAnalytics, setBiddingAnalytics] = useState({
    bidsByHour: [],
    bidsByDay: [],
    topBidders: [],
    refundTrends: [],
    userEngagement: []
  });

  const apiBaseUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pulasa_ecommerce_token');

      // Fetch comprehensive stats
      const statsResponse = await fetch(`${apiBaseUrl}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData.stats || {});

      // Fetch detailed bidding analytics
      const analyticsResponse = await fetch(`${apiBaseUrl}/api/admin/bidding-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsData = await analyticsResponse.json();
      setBiddingAnalytics(analyticsData || {});

      // Fetch all bids with user details
      const bidsResponse = await fetch(`${apiBaseUrl}/api/admin/all-bids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bidsData = await bidsResponse.json();
      setBids(bidsData.bids || []);

      // Fetch refund details
      const refundsResponse = await fetch(`${apiBaseUrl}/api/admin/refunds`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const refundsData = await refundsResponse.json();
      setRefunds(refundsData.refunds || []);

      // Fetch user analytics
      const usersResponse = await fetch(`${apiBaseUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch auctions
      const auctionsResponse = await fetch(`${apiBaseUrl}/api/auction`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const auctionsData = await auctionsResponse.json();
      setAuctions(auctionsData.auctions || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'ended': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getBidStatusBadge = (status, paymentStatus) => {
    if (status === 'outbid') return 'bg-red-100 text-red-800';
    if (status === 'won') return 'bg-green-100 text-green-800';
    if (paymentStatus === 'refunded') return 'bg-orange-100 text-orange-800';
    if (status === 'active') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportData = (type) => {
    // Implementation for exporting data to CSV/Excel
    toast.info(`Exporting ${type} data...`);
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.bidder?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.auction?.item_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading comprehensive admin dashboard...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Comprehensive auction analytics & management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchDashboardData}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              <Link to="/create-auction" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Create Auction
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'bidding', label: 'Bidding Analytics', icon: Users },
              { id: 'refunds', label: 'Refunds', icon: AlertCircle },
              { id: 'users', label: 'User Behavior', icon: Users },
              { id: 'auctions', label: 'Auctions', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBids}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.refundAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bidding Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Bids per Auction:</span>
                    <span className="font-semibold">{stats.averageBidsPerAuction?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Bidders:</span>
                    <span className="font-semibold">{stats.topBidders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Auctions:</span>
                    <span className="font-semibold">{stats.activeAuctions}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last 24h Bids:</span>
                    <span className="font-semibold">{bids.filter(b => new Date(b.created_at) > new Date(Date.now() - 24*60*60*1000)).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Refunds:</span>
                    <span className="font-semibold">{refunds.filter(r => r.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ending Soon:</span>
                    <span className="font-semibold">{auctions.filter(a => a.status === 'active' && new Date(a.end_time) < new Date(Date.now() + 24*60*60*1000)).length}</span>
              </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Bidding Analytics Tab */}
        {activeTab === 'bidding' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bids, users, or auctions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="outbid">Outbid</option>
                  <option value="won">Won</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => exportData('bids')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  <Download size={16} />
                  <span>Export Bids</span>
                </button>
          </div>
        </div>

            {/* Bids Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Bids ({filteredBids.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBids.map((bid) => (
                      <tr key={bid._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {bid.bidder?.username || 'Unknown'}
                        </div>
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bid.auction?.item_name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(bid.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBidStatusBadge(bid.status, bid.payment_status)}`}>
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                          </span>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bid.payment_status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                            bid.payment_status === 'authorized' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bid.payment_status.charAt(0).toUpperCase() + bid.payment_status.slice(1)}
                          </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bid.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        )}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Refund Details ({refunds.length})</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportData('refunds')}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    <Download size={16} />
                    <span>Export Refunds</span>
                  </button>

                </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Bid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refunds.map((refund) => (
                      <tr key={refund._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {refund.user?.username || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{refund.auction?.item_name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(refund.original_amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">{formatCurrency(refund.refunded_amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{refund.reason}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500">{refund.refund_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(refund.refunded_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Behavior Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Bidding Behavior</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bids</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won Auctions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refunds</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const userBids = bids.filter(b => b.bidder?._id === user._id);
                      const wonAuctions = userBids.filter(b => b.status === 'won').length;
                      const totalSpent = userBids.filter(b => b.status === 'won').reduce((sum, b) => sum + b.amount, 0);
                      const refunds = userBids.filter(b => b.payment_status === 'refunded').length;
                      
                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userBids.length}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{wonAuctions}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(totalSpent)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{refunds}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.last_login || user.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Management</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bids</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                    {auctions.map((auction) => (
                      <tr key={auction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src={auction.item_image} 
                              alt={auction.item_name}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{auction.item_name}</div>
                              <div className="text-sm text-gray-500">Base: {formatCurrency(auction.base_price)}</div>
                            </div>
                          </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(auction.status)}
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {auction.highest_bid ? formatCurrency(auction.highest_bid) : 'No bids'}
                          </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{auction.total_bids || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(auction.end_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        )}
      </div>


    </div>
  );
};

export default AdminDashboard; 