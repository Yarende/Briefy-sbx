import React, { useState } from 'react';

interface AppBarProps {
  onSearch: (query: string) => void;
}

export const AppBar: React.FC<AppBarProps> = ({ onSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
        {!isSearchOpen ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Briefly</h1>
            </div>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </>
        ) : (
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2 w-full">
            <input 
              type="text" 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specific topic..." 
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />
            <button 
              type="button" 
              onClick={() => setIsSearchOpen(false)}
              className="text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </header>
  );
};
