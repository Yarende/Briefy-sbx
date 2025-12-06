import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  installPrompt?: any;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, installPrompt }) => {
  const [newSource, setNewSource] = useState('');

  const toggleDarkMode = () => {
    onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const handleRefreshChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, autoRefreshInterval: parseInt(e.target.value) });
  };

  const addSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSource.trim()) {
      onUpdateSettings({ 
        ...settings, 
        customSources: [...settings.customSources, newSource.trim()] 
      });
      setNewSource('');
    }
  };

  const removeSource = (sourceToRemove: string) => {
    onUpdateSettings({
      ...settings,
      customSources: settings.customSources.filter(s => s !== sourceToRemove)
    });
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* App Install Banner */}
      {installPrompt && (
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 shadow-lg text-white flex items-center justify-between">
            <div>
               <h3 className="font-bold text-lg">Install Briefly</h3>
               <p className="text-blue-100 text-sm">Get the full native experience.</p>
            </div>
            <button 
               onClick={handleInstallClick}
               className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold text-sm shadow hover:bg-gray-100 transition-colors"
            >
               Install
            </button>
         </div>
      )}

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${settings.darkMode ? 'bg-indigo-500' : 'bg-gray-200'}`}>
               {settings.darkMode ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               )}
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Preferences</h3>
        <div className="flex flex-col space-y-1">
          <label className="text-gray-700 dark:text-gray-300 font-medium mb-1">Auto Refresh Interval</label>
          <select 
            value={settings.autoRefreshInterval}
            onChange={handleRefreshChange}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Off (Manual only)</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
          </select>
        </div>
      </div>

      {/* Custom Sources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">My Sources</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add custom URLs to include in your news feed.</p>
        
        <form onSubmit={addSource} className="flex space-x-2 mb-4">
          <input 
            type="url" 
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="https://example.com/rss"
            required
            className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
           {settings.customSources.length === 0 && (
             <p className="text-sm text-gray-400 italic">No custom sources added yet.</p>
           )}
           {settings.customSources.map((source, idx) => (
             <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate mr-2">{source}</span>
                <button 
                  onClick={() => removeSource(source)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};