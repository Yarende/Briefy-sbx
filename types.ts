export interface NewsSource {
  title: string;
  uri: string;
}

export type NewsItemType = 'briefing' | 'article';

export interface NewsItem {
  id: string;
  type: NewsItemType;
  headline: string;
  summary: string;
  sources: NewsSource[];
  timestamp: string;
}

export enum Topic {
  HEADLINES = 'Top Headlines',
  TECH = 'Technology',
  BUSINESS = 'Business',
  SCIENCE = 'Science',
  ENTERTAINMENT = 'Entertainment',
  GAMING = 'Gaming'
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export type AppView = 'home' | 'saved' | 'settings';

export interface AppSettings {
  darkMode: boolean;
  autoRefreshInterval: number; // in minutes, 0 for off
  customSources: string[];
}