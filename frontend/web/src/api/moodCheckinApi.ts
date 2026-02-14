/**
 * Mood Check-in API Service
 * Handles quick mood check-in CRUD operations for web
 */

import axiosInstance from './axiosInstance';

// Types
export type MoodEmoji = '😢' | '😔' | '😐' | '🙂' | '😊';
export type MoodLabel = 'terrible' | 'bad' | 'okay' | 'good' | 'great';
export type CheckInType = 'morning' | 'afternoon' | 'evening';
export type ContributingFactor = 'exercise' | 'diet' | 'sleep' | 'mood' | 'work' | 'social' | 'health' | 'weather' | 'stress' | 'relaxation';

export interface MoodData {
    value: number; // 1-5
    emoji: MoodEmoji;
    label: MoodLabel;
}

export interface MoodCheckin {
    _id: string;
    user: string;
    mood: MoodData;
    contributingFactors: ContributingFactor[];
    checkInType: CheckInType;
    notes?: string;
    timestamp: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

export interface CheckinStatus {
    completedTypes: CheckInType[];
    currentPeriod: CheckInType;
    isDue: boolean;
    totalCompleted: number;
    checkins: MoodCheckin[];
}

export interface CheckinHistoryStats {
    averageMood: number;
    totalCheckins: number;
    topContributingFactors: Array<{ factor: ContributingFactor; count: number }>;
}

// Emoji to value mapping helper
export const MOOD_MAP: Record<MoodEmoji, { value: number; label: MoodLabel }> = {
    '😢': { value: 1, label: 'terrible' },
    '😔': { value: 2, label: 'bad' },
    '😐': { value: 3, label: 'okay' },
    '🙂': { value: 4, label: 'good' },
    '😊': { value: 5, label: 'great' }
};

// Value to emoji mapping helper
export const VALUE_TO_EMOJI: Record<number, MoodEmoji> = {
    1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😊'
};

// Contributing factor labels with Lucide icons
export const CONTRIBUTING_FACTOR_LABELS: Record<ContributingFactor, { label: string; icon: string }> = {
    exercise: { label: 'Exercise', icon: 'Dumbbell' },
    diet: { label: 'Diet', icon: 'Apple' },
    sleep: { label: 'Sleep', icon: 'Moon' },
    mood: { label: 'Mood', icon: 'Smile' },
    work: { label: 'Work', icon: 'Briefcase' },
    social: { label: 'Social', icon: 'Users' },
    health: { label: 'Health', icon: 'Heart' },
    weather: { label: 'Weather', icon: 'Sun' },
    stress: { label: 'Stress', icon: 'AlertCircle' },
    relaxation: { label: 'Relaxation', icon: 'Coffee' }
};

/**
 * Create a mood check-in
 */
export const createCheckin = async (
    emoji?: MoodEmoji,
    mood?: number,
    contributingFactors?: ContributingFactor[],
    notes?: string
): Promise<{ success: boolean; checkin: MoodCheckin; updated?: boolean; created?: boolean }> => {
    const response = await axiosInstance.post('/mood-checkins', {
        emoji,
        mood,
        contributingFactors,
        notes
    });
    return response.data;
};

/**
 * Get today's check-ins
 */
export const getTodayCheckins = async (): Promise<{
    success: boolean;
    checkins: MoodCheckin[];
    status: CheckinStatus;
}> => {
    const response = await axiosInstance.get('/mood-checkins/today');
    return response.data;
};

/**
 * Get check-in status
 */
export const getCheckinStatus = async (): Promise<CheckinStatus & { success: boolean }> => {
    const response = await axiosInstance.get('/mood-checkins/status');
    return response.data;
};

/**
 * Get check-in history
 */
export const getCheckinHistory = async (days: number = 7): Promise<{
    success: boolean;
    history: MoodCheckin[];
    stats: CheckinHistoryStats;
}> => {
    const response = await axiosInstance.get(`/mood-checkins/history?days=${days}`);
    return response.data;
};

/**
 * Delete a check-in
 */
export const deleteCheckin = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/mood-checkins/${id}`);
    return response.data;
};

export const moodCheckinApi = {
    createCheckin,
    getTodayCheckins,
    getCheckinStatus,
    getCheckinHistory,
    deleteCheckin,
    MOOD_MAP,
    VALUE_TO_EMOJI,
    CONTRIBUTING_FACTOR_LABELS
};

export default moodCheckinApi;
