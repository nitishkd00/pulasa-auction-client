import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Fish, Shield, Zap, Users, Clock, Award, AlertCircle } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure Platform',
      description: 'All auction data is securely managed for transparency and fairness.'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Real-time Bidding',
      description: 'Live updates with Socket.IO for instant bid notifications and auction status'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Global Access',
      description: 'Participate in auctions from anywhere with secure INR payments via Razorpay'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: '24/7 Auctions',
      description: 'Round-the-clock auction platform with automated bidding and monitoring'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Premium Fish',
      description: 'Exclusive collection of rare and premium fish species for serious collectors'
    },
    {
      icon: <Fish className="h-8 w-8" />,
      title: 'Expert Curation',
      description: 'Carefully selected and verified fish specimens with detailed documentation'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Fish className="h-16 w-16 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="text-gradient">Pulasa Auction</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The premier platform for real-time English auctions of rare and premium fish. 
              Experience secure bidding with instant INR payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/auctions" className="btn-primary text-lg px-8 py-3">
                    Browse Auctions
                  </Link>
                  {!user.is_admin && (
                  <Link to="/my-bids" className="btn-secondary text-lg px-8 py-3">
                    My Bids
                  </Link>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-6 py-4">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-800 font-medium">
                    Please login via Pulasa.com to participate in auctions
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Pulasa Auction?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of fish auctions with cutting-edge technology and 
              unparalleled security.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-full text-primary-600">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to participate in our premium fish auctions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Login via Pulasa.com
              </h3>
              <p className="text-gray-600">
                Access the auction platform through your Pulasa.com account.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Browse Auctions
              </h3>
              <p className="text-gray-600">
                Explore our collection of rare fish and find the perfect specimen to bid on
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bid & Win
              </h3>
              <p className="text-gray-600">
                Place secure bids with INR payments and watch real-time updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Bidding?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of collectors and enthusiasts in the most advanced 
            fish auction platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/auctions" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                View Active Auctions
              </Link>
            ) : (
              <div className="flex items-center justify-center space-x-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-6 py-4">
                <AlertCircle className="h-5 w-5 text-white" />
                <span className="text-white font-medium">
                  Login via Pulasa.com to start bidding
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 