const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get environment variables for production URLs
  const unifiedAuthUrl = process.env.REACT_APP_UNIFIED_AUTH_URL || 'https://api.pulasa.com';
const auctionServerUrl = process.env.REACT_APP_AUCTION_SERVER_URL || 'https://auction-api.pulasa.com';
const clientUrl = process.env.REACT_APP_CLIENT_URL || 'https://auction.pulasa.com';

  // Proxy for unified auth service (port 6001) - Specific endpoints only
  app.use('/api/auth', createProxyMiddleware({
    target: unifiedAuthUrl,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔗 Proxying unified auth request: ${req.method} ${req.url} -> ${unifiedAuthUrl}${req.url}`);
    }
  }));

  // Proxy for auction server (port 5001) - all other API requests (excluding unified auth endpoints)
  app.use(
    '/api',
    createProxyMiddleware({
      target: auctionServerUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      // Skip unified auth endpoints - they're handled above
      filter: (pathname, req) => {
        const unifiedAuthEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/validate', '/api/auth/profile', '/api/auth/logout'];
        const isUnifiedAuth = unifiedAuthEndpoints.some(endpoint => pathname.startsWith(endpoint));
        console.log(`🔍 Proxy filter: ${pathname} -> ${isUnifiedAuth ? 'SKIP (Unified Auth)' : 'AUCTION SERVER'}`);
        return !isUnifiedAuth;
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With'
      },
      onError: (err, req, res) => {
        console.error('🚨 Auction Server proxy error:', err.message);
        res.status(500).json({
          success: false,
          error: 'Auction Server connection failed',
          details: err.message
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔗 Proxying auction request: ${req.method} ${req.url} -> ${auctionServerUrl}${req.url}`);
        // Add CORS headers to proxy request
        proxyReq.setHeader('Origin', clientUrl);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📡 Auction Server response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
        // Add CORS headers to response
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
      }
    })
  );

  // Proxy for unified auth health check
  app.use('/health', createProxyMiddleware({
    target: unifiedAuthUrl,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔗 Proxying unified auth health check: ${req.method} ${req.url} -> ${unifiedAuthUrl}/health`);
    }
  }));
};
