import React from 'react';

const Terms = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Terms & Conditions</h1>
      <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
      <p className="mb-4">By registering for and participating in auctions on Pulasa Auction, you agree to abide by the following terms and conditions. Please read them carefully before using our platform.</p>
      <h2 className="text-xl font-semibold mb-4">2. Eligibility</h2>
      <p className="mb-4">You must be at least 18 years old and legally capable of entering into binding contracts to participate in auctions.</p>
      <h2 className="text-xl font-semibold mb-4">3. Auction Process</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>All auctions are conducted in real-time and are open to registered users only.</li>
        <li>Bids are binding offers to purchase the auctioned item at the specified price.</li>
        <li>The highest valid bid at the end of the auction period will be deemed the winner.</li>
        <li>Pulasa Auction reserves the right to reject or cancel any bid at its sole discretion.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-4">4. Payment & Refunds</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>All payments must be made in INR via the supported payment methods.</li>
        <li>If you are outbid, your funds will be immediately refunded to your payment method.</li>
        <li>Winning bidders must complete payment within the specified time or risk forfeiture of the item.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-4">5. Item Descriptions & Condition</h2>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>All item descriptions are provided in good faith. Pulasa Auction does not guarantee the accuracy or authenticity of any item.</li>
        <li>It is the responsibility of the bidder to review all information and images before placing a bid.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-4">6. Disputes</h2>
      <p className="mb-4">Any disputes arising from auctions will be resolved at the sole discretion of Pulasa Auction. Our decision will be final and binding.</p>
      <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
      <p className="mb-4">Pulasa Auction reserves the right to update or modify these terms at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>
      <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
      <p className="mb-4">For any questions or concerns regarding these terms, please contact us at <a href="mailto:contact@pulasa-auction.com" className="text-blue-600 underline">contact@pulasa-auction.com</a>.</p>
    </div>
  </div>
);

export default Terms; 