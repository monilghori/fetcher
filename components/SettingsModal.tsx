'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, CheckCircle, AlertCircle, HelpCircle, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isTestingCurrent, setIsTestingCurrent] = useState(false);
  const [currentCredentialsStatus, setCurrentCredentialsStatus] = useState<'unknown' | 'valid' | 'invalid' | 'testing'>('unknown');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchCurrentSettings();
      setCurrentCredentialsStatus('unknown');
      setMessage(null);
    }
  }, [isOpen]);
  
  const fetchCurrentSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrentSettings(data);
        
        // Automatically validate existing credentials if they exist
        if (data.hasAccessToken && data.hasClientId) {
          await validateCurrentCredentials();
        } else {
          setCurrentCredentialsStatus('invalid');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };
  
  const validateCurrentCredentials = async () => {
    setIsTestingCurrent(true);
    setCurrentCredentialsStatus('testing');
    
    try {
      // Get the actual credentials from the database
      const res = await fetch('/api/settings');
      if (!res.ok) {
        setCurrentCredentialsStatus('invalid');
        return;
      }
      
      const data = await res.json();
      if (!data.hasAccessToken || !data.hasClientId) {
        setCurrentCredentialsStatus('invalid');
        return;
      }
      
      // Validate by making a test API call
      const validateRes = await fetch('/api/validate-current-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const validateData = await validateRes.json();
      
      if (validateData.valid) {
        setCurrentCredentialsStatus('valid');
      } else {
        setCurrentCredentialsStatus('invalid');
        
        // Show specific error message
        if (validateData.errorCode === 'TOKEN_EXPIRED') {
          setMessage({ 
            type: 'warning', 
            text: '⚠️ Current credentials expired. Please update with new token.' 
          });
        } else if (validateData.errorCode === 'INVALID_TOKEN') {
          setMessage({ 
            type: 'error', 
            text: '❌ Current credentials are invalid. Please update them.' 
          });
        }
      }
    } catch (error) {
      console.error('Failed to validate current credentials:', error);
      setCurrentCredentialsStatus('unknown');
    } finally {
      setIsTestingCurrent(false);
    }
  };
  
  const handleSave = async () => {
    if (!accessToken || !clientId) {
      setMessage({ type: 'error', text: 'Both fields are required' });
      return;
    }
    
    // First, let's test what the API actually returns
    setIsValidating(true);
    setMessage({ type: 'info', text: 'Testing API endpoints...' });
    
    try {
      const testRes = await fetch('/api/test-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, clientId })
      });
      
      const testData = await testRes.json();
      console.log('=== API Test Results ===');
      console.log(testData);
      
      // Check which endpoint worked
      const workingTest = testData.tests?.find((t: any) => t.status === 200);
      
      if (!workingTest) {
        setIsValidating(false);
        const firstError = testData.tests?.[0];
        if (firstError?.status === 403) {
          setMessage({ 
            type: 'error', 
            text: '🔒 Access Token Expired or Invalid. Response: ' + firstError.body 
          });
        } else if (firstError?.status === 401) {
          setMessage({ 
            type: 'error', 
            text: '❌ Authentication Failed. Response: ' + firstError.body 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: 'All API tests failed. Check console for details.' 
          });
        }
        return;
      }
      
      console.log('✓ Working endpoint:', workingTest.endpoint, workingTest.segment);
      setMessage({ type: 'success', text: `✓ Credentials validated using ${workingTest.endpoint}!` });
      
    } catch (error: any) {
      setIsValidating(false);
      setMessage({ type: 'error', text: 'Test failed: ' + error.message });
      return;
    }
    
    setIsValidating(false);
    setIsSaving(true);
    setMessage({ type: 'info', text: 'Saving credentials...' });
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, clientId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Failed to update credentials' });
        return;
      }
      
      setMessage({ type: 'success', text: '✓ Credentials validated and saved successfully!' });
      setAccessToken('');
      setClientId('');
      await fetchCurrentSettings();
      
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl max-w-2xl w-full border border-gray-800 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-white">Dhan API Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Configure your Dhan API credentials</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
            
            <div className="p-6 space-y-6">
              {currentSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-900/50 rounded-xl border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-400 font-medium">Current Configuration</div>
                    {currentCredentialsStatus === 'testing' && (
                      <div className="flex items-center gap-2 text-xs text-accent">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full"
                        />
                        Validating...
                      </div>
                    )}
                    {currentCredentialsStatus === 'valid' && (
                      <div className="flex items-center gap-2 text-xs text-positive">
                        <CheckCircle className="w-4 h-4" />
                        Valid & Working
                      </div>
                    )}
                    {currentCredentialsStatus === 'invalid' && (
                      <div className="flex items-center gap-2 text-xs text-negative">
                        <AlertCircle className="w-4 h-4" />
                        Invalid or Expired
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        currentCredentialsStatus === 'valid' ? 'bg-positive' : 
                        currentCredentialsStatus === 'invalid' ? 'bg-negative' : 
                        'bg-gray-500'
                      }`} />
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-white text-sm">
                        Access Token: {currentSettings.hasAccessToken ? (
                          <span className="text-gray-400 font-mono">{currentSettings.accessTokenPreview}</span>
                        ) : (
                          <span className="text-negative">Not set</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        currentCredentialsStatus === 'valid' ? 'bg-positive' : 
                        currentCredentialsStatus === 'invalid' ? 'bg-negative' : 
                        'bg-gray-500'
                      }`} />
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white text-sm">
                        Client ID: {currentSettings.hasClientId ? (
                          <span className="text-gray-400 font-mono">{currentSettings.clientIdPreview}</span>
                        ) : (
                          <span className="text-negative">Not set</span>
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Dhan Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your Dhan access token"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Get this from your Dhan account settings
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dhan Client ID
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Dhan client ID"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Your unique Dhan client identifier
                  </p>
                </div>
                
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-lg flex items-center gap-3 ${
                        message.type === 'success' 
                          ? 'bg-positive/10 border border-positive/30' 
                          : message.type === 'warning'
                          ? 'bg-warning/10 border border-warning/30'
                          : message.type === 'info'
                          ? 'bg-accent/10 border border-accent/30'
                          : 'bg-negative/10 border border-negative/30'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-positive flex-shrink-0" />
                      ) : message.type === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                      ) : message.type === 'info' ? (
                        <HelpCircle className="w-5 h-5 text-accent flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-negative flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        message.type === 'success' 
                          ? 'text-positive' 
                          : message.type === 'warning'
                          ? 'text-warning'
                          : message.type === 'info'
                          ? 'text-accent'
                          : 'text-negative'
                      }`}>
                        {message.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={isSaving || isValidating}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      isSaving || isValidating
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20'
                    }`}
                  >
                    {isValidating ? 'Validating...' : isSaving ? 'Saving...' : 'Validate & Save Credentials'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    disabled={isSaving || isValidating}
                    className="px-6 py-3 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
              
              <motion.div
                initial={false}
                animate={{ height: showHelp ? 'auto' : 48 }}
                className="overflow-hidden"
              >
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="w-full flex items-center justify-between p-4 bg-accent/10 border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent" />
                    <span className="text-accent font-semibold">How to get Dhan API credentials</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showHelp ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-accent rotate-90" />
                  </motion.div>
                </button>
                
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                  >
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                      <li>Log in to your Dhan account</li>
                      <li>Go to Settings → API Management</li>
                      <li>Generate or copy your Access Token and Client ID</li>
                      <li>Paste them here and save</li>
                    </ol>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
