export type MoodType =
  | 'peaceful'
  | 'reflective'
  | 'energized'
  | 'anxious'
  | 'optimistic'
  | 'grateful'
  | 'melancholy'
  | 'motivated'
  | 'overwhelmed'
  | 'neutral';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalReflection {
  summary: string;
  mood: MoodType | string;
  topics: string[];
  recurringConcerns: string[];
  goals: string[];
  actionItems: string[];
  keyReflection: string;
}

export interface JournalEntry extends JournalReflection {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface HolisticInsights {
  dominantThemes: string[];
  emotionalTrajectory: string;
  recurringPatterns: string[];
  keyActionProgress: string[];
  growthTakeaways: string[];
  analyzedSessionsCount: number;
}
