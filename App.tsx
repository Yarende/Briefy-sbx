import React, { useState, useEffect, useCallback } from 'react';
import { AppBar } from './components/AppBar';
import { TopicSelector } from './components/TopicSelector';
import { NewsCard } from './components/NewsCard';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ErrorMessage } from './components/ErrorMessage';
import { SettingsView } from './components/SettingsView';
import { SavedView } from './components/SavedView';
import { Topic, NewsItem, AppView, AppSettings } from './types';
import { fetchNewsByTopic } from './services/geminiService';

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  autoRefreshInterval: 0,
  customSources: []
};

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeTopic, setActiveTopic] = useState<string>(Topic.HEADLINES);
  
  // Data State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [savedArticles, setSavedArticles] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('savedArticles');
    return saved ? JSON.parse(saved) : [];
  });
  
  // UI/Settings State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Effects for Persistence and Theming
  useEffect(() => {
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Fetch Logic
  const loadNews = useCallback(async (topic: string) => {
    setIsLoading(true);
    setError(null);
    setNews([]); 
    
    try {
      const items = await fetchNewsByTopic(topic, settings.customSources);
      setNews(items);
    } catch (err) {
      console.error(err);
      setError("We couldn't fetch the latest updates. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  }, [settings.customSources]);

  // Initial Load & Auto Refresh
  useEffect(() => {
    loadNews(activeTopic);

    if (settings.autoRefreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadNews(activeTopic);
      }, settings.autoRefreshInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [activeTopic, loadNews, settings.autoRefreshInterval]);

  // Handlers
  const handleSaveArticle = (item: NewsItem) => {
    if (!savedArticles.some(saved => saved.id === item.id)) {
      setSavedArticles([item, ...savedArticles]);
    }
    // Remove from home feed (Inbox Zero style)
    setNews(prev => prev.filter(n => n.id !== item.id));
  };

  const handleDismissArticle = (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
  };

  const handleRemoveSaved = (id: string) => {
    setSavedArticles(prev => prev.filter(item => item.id !== id));
  };

  const handleCustomSearch = (query: string) => {
    setActiveTopic(query);
    setCurrentView('home');
  };

  const renderHome = () => (
    <>
      <TopicSelector 
        selectedTopic={activeTopic} 
        onSelectTopic={(topic) => setActiveTopic(topic)} 
      />

      <div className="px-5 py-4 flex items-end justify-between">
         <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Briefing</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeTopic}</h2>
         </div>
         {!isLoading && !error && (
           <button 
             onClick={() => loadNews(activeTopic)}
             className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 transition-colors flex items-center"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
             Refresh
           </button>
         )}
      </div>

      <div className="px-4 space-y-3">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => loadNews(activeTopic)} />
        ) : news.length === 0 ? (
           <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <p>No stories found. Try another topic.</p>
              <button 
                onClick={() => setActiveTopic(Topic.HEADLINES)}
                className="mt-4 text-blue-600 dark:text-blue-400 font-medium"
              >
                Return to Headlines
              </button>
           </div>
        ) : (
          <>
             {/* Hint for gestures on first load could go here */}
             {news.map((item) => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onSave={handleSaveArticle}
                onDismiss={handleDismissArticle}
              />
            ))}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <AppBar onSearch={handleCustomSearch} />
      
      <main className="max-w-2xl mx-auto">
        {currentView === 'home' && renderHome()}
        {currentView === 'saved' && (
          <SavedView 
            savedItems={savedArticles} 
            onRemoveItem={handleRemoveSaved} 
          />
        )}
        {currentView === 'settings' && (
          <SettingsView 
            settings={settings} 
            onUpdateSettings={setSettings}
            installPrompt={installPrompt}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-3 pb-safe z-30 transition-colors duration-300">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          <button 
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center transition-colors ${currentView === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
               <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-medium mt-1">Home</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('saved')}
            className={`flex flex-col items-center transition-colors ${currentView === 'saved' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={currentView === 'saved' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {savedArticles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {savedArticles.length > 9 ? '9+' : savedArticles.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Saved</span>
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`flex flex-col items-center transition-colors ${currentView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-1">Settings</span>
          </button>
        </div>
      </nav>
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default App;