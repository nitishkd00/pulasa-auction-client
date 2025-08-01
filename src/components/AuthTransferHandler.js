import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import unifiedAuthService from '../services/UnifiedAuthService';

const AuthTransferHandler = ({ children }) => {
  const { user, setUser, setLoading } = useAuth();
  const [transferProcessed, setTransferProcessed] = useState(false);

  useEffect(() => {
    const handleAuthTransfer = async () => {
      // Only process once
      if (transferProcessed) {
        return;
      }

      try {
        // Check for auth token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('auth');

        if (authToken) {
          // Process the authentication transfer
          const result = await unifiedAuthService.processAuthTransfer(authToken);
          
          if (result.success) {
            setUser(result.user);
            
            // Clean up URL after successful authentication
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 1000);
          }
        }
        
        setTransferProcessed(true);
        
      } catch (error) {
        setTransferProcessed(true);
      }
    };

    // Run immediately
    handleAuthTransfer();
    
    // Also run after a short delay to catch any timing issues
    const timeoutId = setTimeout(() => {
      if (!transferProcessed) {
        handleAuthTransfer();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [transferProcessed, setUser, setLoading]);

  return <>{children}</>;
};

export default AuthTransferHandler;
