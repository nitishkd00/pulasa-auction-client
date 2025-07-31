import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import unifiedAuthService from '../services/UnifiedAuthService';

const AuthTransferHandler = ({ children }) => {
  const { user, setUser, setLoading } = useAuth();
  const [transferProcessed, setTransferProcessed] = useState(false);
  const [transferStatus, setTransferStatus] = useState('checking');

  useEffect(() => {
    const handleAuthTransfer = async () => {
      console.log('🔄 AuthTransferHandler: Starting authentication check');

      // Only process once
      if (transferProcessed) {
        console.log('⚠️ AuthTransferHandler: Transfer already processed, skipping');
        return;
      }

      try {
        // Check for auth token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('auth');

        console.log('🔍 AuthTransferHandler: Auth token detection', {
          found: !!authToken,
          length: authToken ? authToken.length : 0
        });

        if (authToken) {
          console.log('📡 AuthTransferHandler: Processing authentication transfer');
          setTransferStatus('processing');
          
          // Process the authentication transfer
          const result = await unifiedAuthService.processAuthTransfer(authToken);
          
          if (result.success) {
            console.log('✅ AuthTransferHandler: Authentication successful');
            setUser(result.user);
            setTransferStatus('success');
            
            // Clean up URL after successful authentication
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              console.log('🧹 AuthTransferHandler: URL cleaned up');
            }, 1000);
            
          } else {
            console.error('❌ AuthTransferHandler: Authentication failed:', result.error);
            setTransferStatus('failed');
          }
        } else {
          console.log('🔍 AuthTransferHandler: No auth token in URL');
          setTransferStatus('none');
        }
        
        setTransferProcessed(true);
        
      } catch (error) {
        console.error('❌ AuthTransferHandler: Error during transfer:', error);
        setTransferStatus('error');
        setTransferProcessed(true);
      }
    };

    // Run immediately
    handleAuthTransfer();
    
    // Also run after a short delay to catch any timing issues
    const timeoutId = setTimeout(() => {
      if (!transferProcessed) {
        console.log('⏰ AuthTransferHandler: Running delayed transfer check');
        handleAuthTransfer();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [transferProcessed, setUser, setLoading]);

  // Show transfer status for debugging
  if (transferStatus === 'processing') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>🔄 Processing Authentication Transfer...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            Authenticating from Pulasa.com
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-component="AuthTransferHandler" data-status={transferStatus}>
      {children}
    </div>
  );
};

export default AuthTransferHandler;
