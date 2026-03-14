export type User = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  clientName: string;
  clientTitle: string;
  clientCompany: string;
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  persona: string;
};

export type TranscriptEntry = {
  role: 'user' | 'assistant';
  text: string;
};

export type Conversation = {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioName: string;
  clientName: string;
  transcript: string;
  duration: number;
  status: 'in_progress' | 'completed';
  startedAt: string;
  endedAt?: string;
};

export type Score = {
  conversationId: string;
  overallScore: number;
  rapport: number;
  discovery: number;
  presentation: number;
  objectionHandling: number;
  closing: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  analyzedAt: string;
};

export type Analytics = {
  totalSessions: number;
  avgOverallScore: number;
  avgRapport: number;
  avgDiscovery: number;
  avgPresentation: number;
  avgObjectionHandling: number;
  avgClosing: number;
  teamAvgOverallScore: number;
  teamAvgRapport: number;
  teamAvgDiscovery: number;
  teamAvgPresentation: number;
  teamAvgObjectionHandling: number;
  teamAvgClosing: number;
  recentScores: { conversationId: string; overallScore: number; date: string; scenarioName: string }[];
  percentile: number;
};

export type LeaderboardEntry = {
  userId: string;
  email: string;
  name: string;
  avgScore: number;
  totalSessions: number;
};

export type Guideline = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type TrainingState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';
