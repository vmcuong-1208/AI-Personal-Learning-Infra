export type LearningTopic = {
  id: string;
  name: string;
  mastery: number;
  color: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  topics: string[];
  confidence: number;
  minutes: number;
  mood: "focused" | "curious" | "stuck" | "confident";
};

export type AiInsight = {
  id: string;
  title: string;
  body: string;
  relatedEntryId?: string;
};

export type QuizQuestion = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type AnalyticsSummary = {
  streak: number;
  weeklyMinutes: number;
  recallAccuracy: number;
  entriesThisWeek: number;
};

export type SearchResult = JournalEntry & {
  score: number;
};
