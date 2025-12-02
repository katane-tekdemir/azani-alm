export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  image?: string;
  isCode?: boolean;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface User {
  username: string;
  pin: string; // Basit PIN/Şifre
  avatar?: string;
}

export interface AppState {
  currentView: 'chat' | 'live' | 'notes' | 'code' | 'panel';
  notifications: string[];
  themeColor: string;
  logo: string | null;
  user: User | null;
}

export interface CodeExecutionResult {
  logs: string[];
  error: string | null;
}