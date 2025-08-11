import axios from 'axios';

class UnifiedAuthService {
  constructor() {
    this.baseURL = 'https://api.pulasa.com';
    this.tokenKey = 'pulasa_ecommerce_token';
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Validate token with unified auth service
  async validateToken(token) {
    try {
      console.log('🔍 Validating token with unified auth service...');
      
      const response = await fetch(`${this.baseURL}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.error('❌ Token validation HTTP error:', response.status, response.statusText);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      console.log('✅ Token validation response:', data.success ? 'Valid' : 'Invalid');
      return data;
    } catch (error) {
      console.error('❌ Token validation network error:', error);
      
      // Check if it's a network blocking error
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn('⚠️ Network request blocked by client (ad blocker/browser extension)');
        return { success: false, error: 'Network blocked by client' };
      }
      
      return { success: false, error: 'Network error' };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.success ? data.user : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (data.success) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Logout user
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Get user role (admin check)
  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user ? user.is_admin : false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  // Process authentication transfer from Pulasa.com
  async processAuthTransfer(authToken) {
    try {
      console.log('🔄 Processing auth transfer with token length:', authToken ? authToken.length : 0);
      
      // Validate the token with unified auth service
      const validation = await this.validateToken(authToken);
      
      if (validation.success && validation.valid) {
        // Store the validated token
        this.setToken(authToken);
        
        // Get user details
        const user = await this.getCurrentUser();
        
        return {
          success: true,
          user: user,
          message: 'Authentication transfer successful'
        };
      } else {
        console.error('❌ Token validation failed:', validation.error);
        return {
          success: false,
          error: validation.error || 'Invalid authentication token'
        };
      }
    } catch (error) {
      console.error('❌ Auth transfer error:', error);
      
      // If it's a network error (blocked by client), try a fallback approach
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.log('🔄 Network blocked, trying fallback authentication...');
        
        // Try to decode the token locally and use it directly
        try {
          // Store the token anyway and try to get user info
          this.setToken(authToken);
          const user = await this.getCurrentUser();
          
          if (user) {
            console.log('✅ Fallback authentication successful');
            return {
              success: true,
              user: user,
              message: 'Authentication transfer successful (fallback)'
            };
          }
        } catch (fallbackError) {
          console.error('❌ Fallback authentication failed:', fallbackError);
        }
      }
      
      return {
        success: false,
        error: 'Authentication transfer failed - please try logging in manually'
      };
    }
  }


  // Get user locked amount
  async getLockedAmount() {
    try {
      const user = await this.getCurrentUser();
      return user ? user.locked_amount : 0;
    } catch (error) {
      console.error('Get locked amount error:', error);
      return 0;
    }
  }
}

export default new UnifiedAuthService();
