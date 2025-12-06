import React, { useState, useRef } from 'react';
import { NewsItem } from '../types';

interface NewsCardProps {
  item: NewsItem;
  onSave?: (item: NewsItem) => void;
  onDismiss?: (id: string) => void;
  isSavedView?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onSave, onDismiss, isSavedView = false }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render Briefing Card (Compact)
  if (item.type === 'briefing') {
    const points = item.summary.split(/\n[\*\-]\s/).filter(p => p.trim().length > 0);
    return (
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-xl overflow-hidden shadow-sm text-white mb-3 relative z-10">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-2">
               <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-100">Top 10 Briefing</h3>
             </div>
             <span className="text-[10px] font-medium text-blue-200 bg-blue-800/50 px-1.5 py-0.5 rounded">2 Weeks</span>
          </div>
          
          <h2 className="text-sm font-bold mb-2">What's happening</h2>
          
          <ul className="space-y-1.5">
            {points.map((point, idx) => {
               const cleanPoint = point.replace(/^[\*\-]\s/, '').trim();
               if (!cleanPoint) return null;
               return (
                 <li key={idx} className="flex items-start text-xs leading-snug text-blue-50">
                    <span className="mr-2 mt-1 min-w-[3px] h-[3px] bg-blue-300 rounded-full"></span>
                    <span>{cleanPoint}</span>
                 </li>
               );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // Swipe Handlers for Standard Articles
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - dragStartX.current;
    
    // Limit drag range for visual effect
    if (Math.abs(delta) < 150) {
        setDragX(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragStartX.current === null) return;
    
    const threshold = 80; // Reduced threshold for easier swiping

    if (dragX > threshold) {
        // Swipe Right Logic: SAVE
        if (!isSavedView && onSave) {
            onSave(item);
        }
    } else if (dragX < -threshold) {
        // Swipe Left Logic: DISMISS
        if (onDismiss) {
            onDismiss(item.id);
        }
    }

    setDragX(0);
    setIsDragging(false);
    dragStartX.current = null;
  };

  const primarySource = item.sources[0];
  let primaryDomain = 'News';
  if (primarySource) {
    try {
      primaryDomain = new URL(primarySource.uri).hostname.replace('www.', '');
    } catch (e) {}
  }

  // Determine if the current drag action is valid for visual feedback
  const isRightSwipe = dragX > 0;
  const isLeftSwipe = dragX < 0;

  // Only show feedback if the action is allowed in the current view
  const showSaveFeedback = isRightSwipe && !isSavedView && !!onSave;
  const showDismissFeedback = isLeftSwipe && !!onDismiss;
  const showFeedback = showSaveFeedback || showDismissFeedback;

  // Calculate visuals
  const swipeOpacity = showFeedback ? Math.min(Math.abs(dragX) / 100, 1) : 0;
  const swipeColor = isRightSwipe ? 'bg-green-500' : 'bg-red-500';
  
  const swipeIcon = isRightSwipe ? (
      <div className="flex items-center text-white font-bold ml-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        <span className="text-sm">SAVE</span>
      </div>
  ) : (
      <div className="flex items-center text-white font-bold mr-4 justify-end w-full">
        <span className="text-sm">DISMISS</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
  );

  return (
    <div className="relative mb-3 select-none" ref={containerRef}>
      {/* Background for Swipe Actions */}
      <div 
        className={`absolute inset-0 rounded-xl flex items-center ${swipeColor} transition-colors duration-200`}
        style={{ opacity: isDragging ? swipeOpacity : 0 }}
      >
        {swipeIcon}
      </div>

      {/* Foreground Card */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative z-10 flex flex-col"
        style={{ 
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-3">
          {/* Header: Source & Time */}
          <div className="flex items-center justify-between mb-1.5">
             <div className="flex items-center space-x-2 truncate min-w-0">
               {primarySource && (
                 <img 
                    src={`https://www.google.com/s2/favicons?domain=${primarySource.uri}&sz=32`} 
                    alt="" 
                    className="w-3.5 h-3.5 rounded-sm opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               )}
               <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                 {primaryDomain}
               </span>
             </div>
             <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">{item.timestamp}</span>
          </div>
          
          {/* Headline */}
          {primarySource ? (
            <a 
                href={primarySource.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block"
                onTouchStart={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.headline}
                </h3>
            </a>
          ) : (
             <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1.5">
                {item.headline}
            </h3>
          )}
          
          {/* Summary */}
          <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-3 mb-2">
            {item.summary}
          </p>

          {/* Footer: Sources & Action */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
             <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                {item.sources.slice(0, 3).map((s, i) => (
                    <img 
                        key={i}
                        src={`https://www.google.com/s2/favicons?domain=${s.uri}&sz=32`}
                        alt={s.title}
                        title={s.title}
                        className="inline-block h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100"
                    />
                ))}
                {item.sources.length > 3 && (
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-[8px] font-medium text-gray-500">
                        +{item.sources.length - 3}
                    </span>
                )}
             </div>

             {primarySource && (
                <a 
                href={primarySource.uri}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm transition-colors"
                onTouchStart={(e) => e.stopPropagation()} 
                >
                READ STORY
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};