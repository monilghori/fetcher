'use client';

import { useState, useEffect } from 'react';

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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          clientId
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Failed to update credentials' });
        return;
      }
      
      setMessage({ type: 'success', text: 'Credentials updated successfully!' });
      
      // Clear form
      setAccessToken('');
      setClientId('');
      
      // Refresh current settings
      await fetchCurrentSettings();
      
      // Close modal after 2 seconds
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Dhan API Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Current Settings Info */}
        {currentSettings && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Current Configuration:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentSettings.hasAccessToken ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-white">Access Token: {currentSettings.hasAccessToken ? currentSettings.accessTokenPreview : 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentSettings.hasClientId ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-white">Client ID: {currentSettings.hasClientId ? currentSettings.clientIdPreview : 'Not set'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dhan Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your Dhan access token"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from your Dhan account settings
            </p>
          </div>
          
          {/* Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dhan Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Dhan client ID"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your unique Dhan client identifier
            </p>
          </div>
          
          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-900/20 border border-green-800 text-green-400' 
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isSaving
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Credentials'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="text-sm text-blue-300">
            <div className="font-semibold mb-2">ℹ️ How to get Dhan API credentials:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Log in to your Dhan account</li>
              <li>Go to Settings → API Management</li>
              <li>Generate or copy your Access Token and Client ID</li>
              <li>Paste them here and save</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
