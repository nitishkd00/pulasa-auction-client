// Browser Debugger for Authentication Transfer Investigation
class BrowserDebugger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
    this.enabled = true;
  }

  log(category, message, data = null) {
    if (!this.enabled) return;
    
    const timestamp = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 50)
    };
    
    this.logs.push(logEntry);
    
    // Console output with styling
    const style = this.getStyleForCategory(category);
    console.log(`%c[${timestamp}ms] ${category}: ${message}`, style, data || '');
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('browserDebugLogs', JSON.stringify(this.logs.slice(-100)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  getStyleForCategory(category) {
    const styles = {
      'AUTH_TRANSFER': 'color: #ff6b35; font-weight: bold;',
      'COMPONENT': 'color: #4ecdc4; font-weight: bold;',
      'URL_PARAMS': 'color: #45b7d1; font-weight: bold;',
      'NETWORK': 'color: #96ceb4; font-weight: bold;',
      'ERROR': 'color: #ff4757; font-weight: bold; background: #ffe6e6;',
      'SUCCESS': 'color: #2ed573; font-weight: bold;',
      'WARNING': 'color: #ffa502; font-weight: bold;',
      'INFO': 'color: #747d8c;'
    };
    return styles[category] || styles.INFO;
  }

  checkEnvironment() {
    this.log('INFO', 'Browser Environment Check Started');
    
    // Check basic environment
    this.log('INFO', 'Window location', window.location.href);
    this.log('INFO', 'User agent', navigator.userAgent);
    this.log('INFO', 'Local storage available', !!window.localStorage);
    this.log('INFO', 'Session storage available', !!window.sessionStorage);
    
    // Check React
    this.log('INFO', 'React available', !!window.React);
    this.log('INFO', 'React DOM available', !!window.ReactDOM);
    
    // Check if we're in the auction app
    const isAuctionApp = window.location.port === '3000';
    this.log('INFO', 'Is auction app', isAuctionApp);
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    this.log('URL_PARAMS', 'Auth parameter present', !!authParam);
    if (authParam) {
      this.log('URL_PARAMS', 'Auth parameter length', authParam.length);
      this.log('URL_PARAMS', 'Auth parameter preview', authParam.substring(0, 50) + '...');
    }
    
    // Check for common libraries
    this.log('INFO', 'Axios available', !!window.axios);
    this.log('INFO', 'jQuery available', !!window.$);
    
    return {
      isAuctionApp,
      hasAuthParam: !!authParam,
      authParamLength: authParam ? authParam.length : 0
    };
  }

  monitorAuthTransfer() {
    this.log('AUTH_TRANSFER', 'Starting authentication transfer monitoring');
    
    // Monitor URL changes
    let lastUrl = window.location.href;
    const urlMonitor = setInterval(() => {
      if (window.location.href !== lastUrl) {
        this.log('URL_PARAMS', 'URL changed', {
          from: lastUrl,
          to: window.location.href
        });
        lastUrl = window.location.href;
      }
    }, 100);

    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        this.log('AUTH_TRANSFER', 'LocalStorage auth data set', { key, valueLength: value.length });
      }
      return originalSetItem.call(localStorage, key, value);
    };

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      if (typeof url === 'string' && (url.includes('auth') || url.includes('validate'))) {
        this.log('NETWORK', 'Auth-related fetch request', url);
      }
      try {
        const response = await originalFetch(...args);
        if (typeof url === 'string' && (url.includes('auth') || url.includes('validate'))) {
          this.log('NETWORK', 'Auth-related fetch response', {
            url,
            status: response.status,
            ok: response.ok
          });
        }
        return response;
      } catch (error) {
        if (typeof url === 'string' && (url.includes('auth') || url.includes('validate'))) {
          this.log('ERROR', 'Auth-related fetch error', { url, error: error.message });
        }
        throw error;
      }
    };

    // Monitor console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.log('ERROR', 'Console error detected', args.join(' '));
      return originalError(...args);
    };

    // Cleanup function
    return () => {
      clearInterval(urlMonitor);
      localStorage.setItem = originalSetItem;
      window.fetch = originalFetch;
      console.error = originalError;
    };
  }

  checkAuthTransferHandler() {
    this.log('COMPONENT', 'Checking AuthTransferHandler component');
    
    // Check if AuthTransferHandler is in the DOM
    const authHandlerElements = document.querySelectorAll('[data-component="AuthTransferHandler"]');
    this.log('COMPONENT', 'AuthTransferHandler elements found', authHandlerElements.length);
    
    // Check for React components
    const reactRoots = document.querySelectorAll('#root, [data-reactroot]');
    this.log('COMPONENT', 'React root elements found', reactRoots.length);
    
    // Check for loading indicators
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
    this.log('COMPONENT', 'Loading elements found', loadingElements.length);
    
    return {
      authHandlerElements: authHandlerElements.length,
      reactRoots: reactRoots.length,
      loadingElements: loadingElements.length
    };
  }

  testAuthFlow() {
    this.log('AUTH_TRANSFER', 'Testing authentication flow');
    
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('auth');
    
    if (!authToken) {
      this.log('WARNING', 'No auth token found in URL');
      return { success: false, reason: 'No auth token' };
    }
    
    this.log('AUTH_TRANSFER', 'Auth token found, testing validation');
    
    // Test token validation
    return fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: authToken })
    })
    .then(response => {
      this.log('NETWORK', 'Validation response received', {
        status: response.status,
        ok: response.ok
      });
      return response.json();
    })
    .then(data => {
      this.log('AUTH_TRANSFER', 'Validation result', data);
      return { success: data.success && data.valid, data };
    })
    .catch(error => {
      this.log('ERROR', 'Validation error', error.message);
      return { success: false, error: error.message };
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      logs: this.logs,
      environment: this.checkEnvironment(),
      components: this.checkAuthTransferHandler(),
      summary: {
        totalLogs: this.logs.length,
        errors: this.logs.filter(log => log.category === 'ERROR').length,
        warnings: this.logs.filter(log => log.category === 'WARNING').length,
        authTransferLogs: this.logs.filter(log => log.category === 'AUTH_TRANSFER').length
      }
    };
    
    this.log('INFO', 'Debug report generated', report.summary);
    
    // Store report in localStorage
    try {
      localStorage.setItem('authTransferDebugReport', JSON.stringify(report));
    } catch (e) {
      this.log('ERROR', 'Failed to store debug report', e.message);
    }
    
    return report;
  }

  displayReport() {
    const report = this.generateReport();
    
    console.group('🔍 Authentication Transfer Debug Report');
    console.log('📊 Summary:', report.summary);
    console.log('🌐 Environment:', report.environment);
    console.log('⚛️ Components:', report.components);
    console.log('📝 Recent Logs:', this.logs.slice(-10));
    console.groupEnd();
    
    // Create visual report in DOM
    this.createVisualReport(report);
    
    return report;
  }

  createVisualReport(report) {
    // Remove existing report
    const existingReport = document.getElementById('auth-debug-report');
    if (existingReport) {
      existingReport.remove();
    }
    
    // Create new report element
    const reportElement = document.createElement('div');
    reportElement.id = 'auth-debug-report';
    reportElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: #1a1a1a;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    reportElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong>🔍 Auth Debug</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="background: #ff4757; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
      <div><strong>URL:</strong> ${window.location.href}</div>
      <div><strong>Auth Param:</strong> ${report.environment.hasAuthParam ? '✅ Present' : '❌ Missing'}</div>
      <div><strong>Errors:</strong> ${report.summary.errors}</div>
      <div><strong>Warnings:</strong> ${report.summary.warnings}</div>
      <div><strong>Auth Logs:</strong> ${report.summary.authTransferLogs}</div>
      <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
        Check console for detailed logs
      </div>
    `;
    
    document.body.appendChild(reportElement);
  }
}

// Create global instance
window.browserDebugger = new BrowserDebugger();

// Auto-start monitoring if we're in the auction app (disabled for production)
// if (window.location.port === '3000') {
//   window.browserDebugger.log('INFO', 'Auto-starting authentication transfer monitoring');
//   window.browserDebugger.monitorAuthTransfer();
//   
//   // Check environment immediately
//   window.browserDebugger.checkEnvironment();
//   
//   // Display report after a short delay
//   setTimeout(() => {
//     window.browserDebugger.displayReport();
//   }, 2000);
// }

export default BrowserDebugger;
