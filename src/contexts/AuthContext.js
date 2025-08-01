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
      try {
        // Check for existing user session
        const currentUser = await unifiedAuthService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await unifiedAuthService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        toast.success('Login successful!');
        return { success: true };
      } else {
        toast.error(result.error || 'Login failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error('Login failed - please try again');
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await unifiedAuthService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        toast.success('Registration successful!');
        return { success: true };
      } else {
        toast.error(result.error || 'Registration failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error('Registration failed - please try again');
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await unifiedAuthService.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      // Still clear user even if logout fails
      setUser(null);
    }
  };

  const updateProfile = async (userData) => {
    try {
      const result = await unifiedAuthService.updateUser(user.id, userData);
      
      if (result.success) {
        setUser(result.user);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(result.error || 'Profile update failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
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