import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import unifiedAuthService from '../services/UnifiedAuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🚀 AuthContext: Starting authentication check');
      
      try {
        // Check for existing user session
        const currentUser = await unifiedAuthService.getCurrentUser();
        
        if (currentUser) {
          console.log('✅ AuthContext: User found in session:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('🔍 AuthContext: No existing user session found');
        }
      } catch (error) {
        console.error('❌ AuthContext: Authentication check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('⏱️ AuthContext: Loading completed');
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 AuthContext: Login attempt for:', email);
      const result = await unifiedAuthService.login(email, password);
      
      if (result.success) {
        console.log('✅ AuthContext: Login successful');
        setUser(result.user);
        toast.success('Login successful!');
        return { success: true };
      } else {
        console.error('❌ AuthContext: Login failed:', result.error);
        toast.error(result.error || 'Login failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      toast.error('Login failed - please try again');
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 AuthContext: Registration attempt for:', userData.email);
      const result = await unifiedAuthService.register(userData);
      
      if (result.success) {
        console.log('✅ AuthContext: Registration successful');
        setUser(result.user);
        toast.success('Registration successful!');
        return { success: true };
      } else {
        console.error('❌ AuthContext: Registration failed:', result.error);
        toast.error(result.error || 'Registration failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      toast.error('Registration failed - please try again');
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logout attempt');
      await unifiedAuthService.logout();
      setUser(null);
      toast.success('Logged out successfully');
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      // Still clear user even if logout fails
      setUser(null);
    }
  };

  const updateProfile = async (userData) => {
    try {
      console.log('📝 AuthContext: Profile update attempt');
      const result = await unifiedAuthService.updateUser(user.id, userData);
      
      if (result.success) {
        console.log('✅ AuthContext: Profile update successful');
        setUser(result.user);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        console.error('❌ AuthContext: Profile update failed:', result.error);
        toast.error(result.error || 'Profile update failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Profile update error:', error);
      toast.error('Profile update failed - please try again');
      return { success: false, error: 'Profile update failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 