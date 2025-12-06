import React from 'react';
import { Topic } from '../types';

interface TopicSelectorProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

const topics = Object.values(Topic);

export const TopicSelector: React.FC<TopicSelectorProps> = ({ selectedTopic, onSelectTopic }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 px-4 bg-white dark:bg-gray-900 sticky top-16 z-20 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="flex space-x-3">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => onSelectTopic(topic)}
            className={`
              whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${
                selectedTopic === topic
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
};
