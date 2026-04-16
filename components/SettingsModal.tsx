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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchCurrentSettings();
    }
  }, [isOpen]);
  
  const fetchCurrentSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrentSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };
  
  const handleSave = async () => {
    if (!accessToken || !clientId) {
      setMessage({ type: 'error', text: 'Both fields are required' });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
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
      
      setMessage({ type: 'success', text: 'Credentials updated successfully!' });
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
                  <div className="text-sm text-gray-400 mb-3 font-medium">Current Configuration</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${currentSettings.hasAccessToken ? 'bg-positive' : 'bg-negative'}`} />
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-white text-sm">
                        Access Token: {currentSettings.hasAccessToken ? (
                          <span className="text-positive font-mono">{currentSettings.accessTokenPreview}</span>
                        ) : (
                          <span className="text-negative">Not set</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${currentSettings.hasClientId ? 'bg-positive' : 'bg-negative'}`} />
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white text-sm">
                        Client ID: {currentSettings.hasClientId ? (
                          <span className="text-positive font-mono">{currentSettings.clientIdPreview}</span>
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
                          : 'bg-negative/10 border border-negative/30'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-positive" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-negative" />
                      )}
                      <span className={message.type === 'success' ? 'text-positive' : 'text-negative'}>
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
                    disabled={isSaving}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      isSaving
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
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
