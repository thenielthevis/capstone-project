import axiosInstance from './axiosInstance';

export interface SentimentDistribution {
  _id: string;
  count: number;
  avgPositive: number;
  avgNegative: number;
  avgNeutral: number;
  avgConfidence: number;
}

export interface EmotionDistribution {
  _id: string;
  count: number;
  avgJoy: number;
  avgSadness: number;
  avgAnger: number;
  avgFear: number;
  avgSurprise: number;
  avgNeutral: number;
}

export interface StressDistribution {
  _id: string;
  count: number;
  avgScore: number;
  avgAnxietyScore: number;
}

export interface SentimentOverview {
  totalAssessments: number;
  sentiment: { distribution: SentimentDistribution[]; total: number };
  emotion: { distribution: EmotionDistribution[]; total: number };
  stress: { distribution: StressDistribution[]; total: number };
}

export interface TimelinePoint {
  date: string;
  count: number;
  avgPositive: number;
  avgNegative: number;
  avgNeutral: number;
  avgStress: number;
  avgAnxiety: number;
  dominantEmotion: string;
  dominantSentiment: string;
  emotionBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
}

export interface HeatmapCell {
  day: string;
  dayIndex: number;
  hour: number;
  count: number;
  avgPositive: number;
  avgNegative: number;
  avgStress: number;
  intensity: number;
}

export interface TagCloudWord {
  word: string;
  count: number;
  sentiment: string;
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
}

export interface TopicData {
  category: string;
  count: number;
  avgPositive: number;
  avgNegative: number;
  avgNeutral: number;
  avgStress: number;
  emotionBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
}

export interface AffinityItem {
  _id: { emotion: string; category: string };
  count: number;
  avgStress: number;
  avgConfidence: number;
}

export interface UserPattern {
  userId: string;
  username: string;
  totalAssessments: number;
  avgPositive: number;
  avgNegative: number;
  avgStress: number;
  dominantEmotion: string;
  dominantSentiment: string;
}

export interface NarrativeData {
  narrative: string[];
  stats: {
    total: number;
    uniqueUsers: number;
    highStressCount: number;
    avgPositive: number;
    avgNegative: number;
    avgNeutral: number;
    avgStress: number;
    avgAnxiety: number;
  };
  breakdown: {
    bySentiment: Array<{ _id: string; count: number }>;
    byEmotion: Array<{ _id: string; count: number }>;
    byStressLevel: Array<{ _id: string; count: number }>;
    byCategory: Array<{ _id: string; count: number }>;
  };
  timeframe: string;
}

export interface SentimentPost {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    age?: number;
    gender?: string;
  };
  question: string;
  category: string;
  difficulty: string;
  sentimentResult?: {
    selectedChoice?: { id: string; text: string; value: number };
    userTextInput?: string;
    timestamp: string;
  };
  sentimentAnalysis?: {
    sentiment?: { primary: string; positive: number; negative: number; neutral: number; confidence: number };
    emotion?: { primary: string; confidence: number; breakdown: Record<string, number> };
    stress?: { level: string; score: number; anxiety?: { level: string; score: number } };
  };
  createdAt: string;
}

export interface AssessmentUser {
  userId: string;
  username: string;
  email: string;
  assessmentCount: number;
}

export async function getSentimentOverview(params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<SentimentOverview> {
  const response = await axiosInstance.get('/sentiment-dashboard/overview', { params });
  return response.data;
}

export async function getSentimentTimeline(params?: {
  days?: number;
  userId?: string;
}): Promise<{ timeline: TimelinePoint[]; days: number }> {
  const response = await axiosInstance.get('/sentiment-dashboard/timeline', { params });
  return response.data;
}

export async function getSentimentHeatmap(params?: {
  days?: number;
  userId?: string;
}): Promise<{ heatmap: HeatmapCell[] }> {
  const response = await axiosInstance.get('/sentiment-dashboard/heatmap', { params });
  return response.data;
}

export async function getTagCloud(params?: {
  days?: number;
  userId?: string;
}): Promise<{ tagCloud: TagCloudWord[]; totalTexts: number }> {
  const response = await axiosInstance.get('/sentiment-dashboard/tag-cloud', { params });
  return response.data;
}

export async function getTopics(params?: {
  days?: number;
  userId?: string;
}): Promise<{ topics: TopicData[] }> {
  const response = await axiosInstance.get('/sentiment-dashboard/topics', { params });
  return response.data;
}

export async function getAffinity(params?: {
  days?: number;
}): Promise<{ emotionCategoryAffinity: AffinityItem[]; userPatterns: UserPattern[] }> {
  const response = await axiosInstance.get('/sentiment-dashboard/affinity', { params });
  return response.data;
}

export async function getNarrative(params?: {
  days?: number;
}): Promise<NarrativeData> {
  const response = await axiosInstance.get('/sentiment-dashboard/narrative', { params });
  return response.data;
}

export async function getSentimentPosts(params?: {
  page?: number;
  limit?: number;
  sentiment?: string;
  emotion?: string;
  stressLevel?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  posts: SentimentPost[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const response = await axiosInstance.get('/sentiment-dashboard/posts', { params });
  return response.data;
}

export async function getAssessmentUsers(): Promise<{ users: AssessmentUser[] }> {
  const response = await axiosInstance.get('/sentiment-dashboard/users');
  return response.data;
}
