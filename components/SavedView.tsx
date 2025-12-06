import React from 'react';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';

interface SavedViewProps {
  savedItems: NewsItem[];
  onRemoveItem: (id: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({ savedItems, onRemoveItem }) => {
  return (
    <div className="px-4 py-4 max-w-2xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Saved for later</h2>
      
      {savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
             </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved stories</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            Swipe right on articles in your feed to save them here for later reading.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400 mb-2">Swipe left to remove from saved</p>
          {savedItems.map(item => (
            <NewsCard 
              key={item.id} 
              item={item} 
              onDismiss={onRemoveItem}
              isSavedView={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
