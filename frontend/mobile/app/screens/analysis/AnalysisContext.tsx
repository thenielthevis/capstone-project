import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useUser } from '@/app/context/UserContext';
import { getUserProfile, UserProfile } from '@/app/api/userApi';
import {
    getCheckupHistory,
    getTodayCheckup,
    HealthCheckupEntry,
    MetricType
} from '@/app/api/healthCheckupApi';
import axiosInstance from '@/app/api/axiosInstance';

// Types for the Analysis context
export interface HistoryDataPoint {
    date: string;
    value: number;
    label: string;
}

export interface MetricHistory {
    bmi: HistoryDataPoint[];
    activity: HistoryDataPoint[];
    sleep: HistoryDataPoint[];
    water: HistoryDataPoint[];
    stress: HistoryDataPoint[];
    dietary: HistoryDataPoint[];
    healthStatus: HistoryDataPoint[];
    environmental: HistoryDataPoint[];
    addiction: HistoryDataPoint[];
    diseaseRisk: HistoryDataPoint[];
}

export interface AnalysisContextType {
    // User data
    userData: UserProfile | null;
    predictions: Array<{ name: string; probability: number }> | null;
    userLoading: boolean;

    // History data
    entries: HealthCheckupEntry[];
    history: MetricHistory;
    weeklyHistory: MetricHistory; // Pre-calculated weekly averages
    monthlyHistory: MetricHistory; // Pre-calculated monthly averages
    historyLoading: boolean;
    historyError: string | null;

    // Today's checkup
    todayCheckup: HealthCheckupEntry | null;

    // Actions
    refreshAll: () => Promise<void>;
    refreshHistory: () => Promise<void>;
    refreshTodayCheckup: () => Promise<void>;
    refreshUserData: () => Promise<void>;

    // Theme (colors object for direct access)
    theme: {
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            background: string;
            surface: string;
            text: string;
            textSecondary: string;
            input: string;
            border: string;
            overlay: string;
            error: string;
            success: string;
        };
    };
}

const defaultHistory: MetricHistory = {
    bmi: [],
    activity: [],
    sleep: [],
    water: [],
    stress: [],
    dietary: [],
    healthStatus: [],
    environmental: [],
    addiction: [],
    diseaseRisk: [],
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};

const aggregateByWeek = (data: HistoryDataPoint[]): HistoryDataPoint[] => {
    if (!data.length) return [];
    // Last 30 days daily data grouped by week
    const weeksMap = new Map<number, { sum: number; count: number; start: Date; end: Date }>();

    // Get current date and go back 35 days (5 weeks) to ensure we have enough full weeks
    const now = new Date();
    const startTime = now.getTime() - (35 * 24 * 60 * 60 * 1000);

    for (const point of data) {
        const date = new Date(point.date);
        if (date.getTime() < startTime) continue;

        // Group by week of year
        const weekKey = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
        if (!weeksMap.has(weekKey)) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            weeksMap.set(weekKey, { sum: 0, count: 0, start, end });
        }
        const current = weeksMap.get(weekKey)!;
        current.sum += point.value;
        current.count += 1;
    }

    const result: HistoryDataPoint[] = [];
    const entries = Array.from(weeksMap.entries()).sort((a, b) => a[0] - b[0]);
    for (const [, { sum, count, start }] of entries) {
        result.push({
            date: start.toISOString(),
            value: Math.round((sum / count) * 10) / 10,
            label: `${start.getMonth() + 1}/${start.getDate()}`
        });
    }
    return result.slice(-5); // Show last 5 weeks
};

// Internal helper for monthly aggregation
const aggregateByMonth = (data: HistoryDataPoint[]): HistoryDataPoint[] => {
    if (!data.length) return [];
    const monthMap = new Map<string, { sum: number; count: number }>();

    for (const point of data) {
        const date = new Date(point.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { sum: 0, count: 0 });
        }
        const current = monthMap.get(monthKey)!;
        current.sum += point.value;
        current.count += 1;
    }

    const result: HistoryDataPoint[] = [];
    const entries = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [key, { sum, count }] of entries) {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        result.push({
            date: date.toISOString(),
            value: Math.round((sum / count) * 10) / 10,
            label: `${month}/${date.getDate()}`
        });
    }
    return result.slice(-12);
};

interface AnalysisProviderProps {
    children: ReactNode;
    initialUserData?: UserProfile | null;
    initialPredictions?: Array<{ name: string; probability: number }> | null;
}

export const AnalysisProvider: React.FC<AnalysisProviderProps> = ({
    children,
    initialUserData = null,
    initialPredictions = null
}) => {
    const { theme } = useTheme();
    const { user } = useUser();

    const [userData, setUserData] = useState<UserProfile | null>(initialUserData);
    const [predictions, setPredictions] = useState<Array<{ name: string; probability: number }> | null>(initialPredictions);
    const [userLoading, setUserLoading] = useState(false);

    const [history, setHistory] = useState<MetricHistory>(defaultHistory);
    const [entries, setEntries] = useState<HealthCheckupEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [todayCheckup, setTodayCheckup] = useState<HealthCheckupEntry | null>(null);

    // Memoize weekly and monthly history to prevent re-calculations
    const weeklyHistory = useMemo((): MetricHistory => ({
        bmi: aggregateByWeek(history.bmi),
        activity: aggregateByWeek(history.activity),
        sleep: aggregateByWeek(history.sleep),
        water: aggregateByWeek(history.water),
        stress: aggregateByWeek(history.stress),
        dietary: aggregateByWeek(history.dietary),
        healthStatus: aggregateByWeek(history.healthStatus),
        environmental: aggregateByWeek(history.environmental),
        addiction: aggregateByWeek(history.addiction),
        diseaseRisk: aggregateByWeek(history.diseaseRisk),
    }), [history]);

    const monthlyHistory = useMemo((): MetricHistory => ({
        bmi: aggregateByMonth(history.bmi),
        activity: aggregateByMonth(history.activity),
        sleep: aggregateByMonth(history.sleep),
        water: aggregateByMonth(history.water),
        stress: aggregateByMonth(history.stress),
        dietary: aggregateByMonth(history.dietary),
        healthStatus: aggregateByMonth(history.healthStatus),
        environmental: aggregateByMonth(history.environmental),
        addiction: aggregateByMonth(history.addiction),
        diseaseRisk: aggregateByMonth(history.diseaseRisk),
    }), [history]);

    // Helper to format date for chart labels
    const formatDateLabel = (dateString: string): string => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // Helper to extract metric value from entry
    const extractMetricValue = (entry: HealthCheckupEntry, metric: MetricType): number | null => {
        switch (metric) {
            case 'sleep': return entry.sleep?.hours ?? null;
            case 'water': return entry.water?.amount ?? null;
            case 'stress': return entry.stress?.level ?? null;
            case 'weight': return entry.weight?.value ?? null;
            case 'bmi': return entry.bmi?.value ?? null;
            case 'activityLevel': return entry.activityLevel?.pal ?? null;
            case 'dietary': return entry.dietary?.mealFrequency ?? null;

            case 'healthStatus':
                if (entry.healthStatus?.score !== undefined) return entry.healthStatus.score;
                // Fallback score logic: Base 100 - (10 per condition)
                if (entry.healthStatus?.conditionsCount !== undefined) {
                    return Math.max(0, 100 - (entry.healthStatus.conditionsCount * 10));
                }
                return null;

            case 'environmental':
                if (entry.environmental?.score !== undefined) return entry.environmental.score;
                // Fallback map pollution string to number
                if (entry.environmental?.pollutionExposure) {
                    const level = entry.environmental.pollutionExposure.toLowerCase();
                    if (level === 'low') return 1;
                    if (level === 'moderate' || level === 'medium') return 2;
                    if (level === 'high') return 3;
                    return 1; // Default
                }
                return null;

            case 'addictionRisk':
                if (entry.addictionRisk?.score !== undefined) return entry.addictionRisk.score;
                // Fallback: 10 points * substance count
                if (entry.addictionRisk?.substancesCount !== undefined) {
                    return entry.addictionRisk.substancesCount * 10;
                }
                return null;

            case 'diseaseRisk':
                // Prefer averageRisk if available (0-100%)
                if (entry.diseaseRisk?.averageRisk !== undefined) return entry.diseaseRisk.averageRisk;
                // Fallback to high risk count
                if (entry.diseaseRisk?.highRiskCount !== undefined) {
                    return entry.diseaseRisk.highRiskCount;
                }
                return null;

            default: return null;
        }
    };

    // Actions
    const refreshUserData = useCallback(async () => {
        setUserLoading(true);
        try {
            const profileRes = await getUserProfile();
            if (profileRes.profile) {
                setUserData(profileRes.profile);
            }

            // Try to fetch predictions
            try {
                const predRes = await axiosInstance.get('/predict/cached');
                if (predRes.data?.predictions) {
                    setPredictions(predRes.data.predictions);
                } else if (predRes.data?.disease) {
                    // Fallback to mapping string array if predictions object array missing
                    setPredictions(predRes.data.disease.map((name: string) => ({ name, probability: 1 })));
                } else {
                    // If no cached prediction, trigger generation
                    console.log('[AnalysisContext] No cached predictions, generating...');
                    const genRes = await axiosInstance.post('/predict/me');
                    if (genRes.data?.predictions) {
                        setPredictions(genRes.data.predictions);
                    } else if (genRes.data?.disease) {
                        setPredictions(genRes.data.disease.map((name: string) => ({ name, probability: 1 })));
                    }
                }
            } catch (err) {
                console.log('[AnalysisContext] Error fetching/generating predictions', err);
            }
        } catch (error) {
            console.error('[AnalysisContext] Error fetching user profile:', error);
        } finally {
            setUserLoading(false);
        }
    }, []);

    const refreshHistory = useCallback(async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const endDate = new Date().toISOString();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);

            const [historyRes, sessionsRes] = await Promise.all([
                getCheckupHistory({
                    startDate: startDate.toISOString(),
                    endDate,
                    limit: 365
                }),
                axiosInstance.get('/history', { params: { limit: 100 } })
            ]);

            const entriesData = historyRes.success ? historyRes.data : [];
            const sessions = sessionsRes.data?.data || [];

            setEntries(entriesData);

            const newHistory: MetricHistory = {
                bmi: [], activity: [], sleep: [], water: [], stress: [],
                dietary: [], healthStatus: [], environmental: [], addiction: [], diseaseRisk: [],
            };

            const sortedEntries = [...entriesData].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Create set of dates that have manual activity logs
            const datesWithManualActivity = new Set();

            for (const entry of sortedEntries) {
                const label = formatDateLabel(entry.date);

                const bmi = extractMetricValue(entry, 'bmi');
                if (bmi !== null) newHistory.bmi.push({ date: entry.date, value: bmi, label });

                const activity = extractMetricValue(entry, 'activityLevel');
                if (activity !== null) {
                    newHistory.activity.push({ date: entry.date, value: activity, label });
                    datesWithManualActivity.add(new Date(entry.date).toDateString());
                }

                const sleep = extractMetricValue(entry, 'sleep');
                if (sleep !== null) newHistory.sleep.push({ date: entry.date, value: sleep, label });

                const water = extractMetricValue(entry, 'water');
                if (water !== null) newHistory.water.push({ date: entry.date, value: water, label });

                const stress = extractMetricValue(entry, 'stress');
                if (stress !== null) newHistory.stress.push({ date: entry.date, value: stress, label });

                const dietary = extractMetricValue(entry, 'dietary');
                if (dietary !== null) newHistory.dietary.push({ date: entry.date, value: dietary, label });

                const health = extractMetricValue(entry, 'healthStatus');
                if (health !== null) newHistory.healthStatus.push({ date: entry.date, value: health, label });

                const env = extractMetricValue(entry, 'environmental');
                if (env !== null) newHistory.environmental.push({ date: entry.date, value: env, label });

                const addiction = extractMetricValue(entry, 'addictionRisk');
                if (addiction !== null) newHistory.addiction.push({ date: entry.date, value: addiction, label });

                const disease = extractMetricValue(entry, 'diseaseRisk');
                if (disease !== null) newHistory.diseaseRisk.push({ date: entry.date, value: disease, label });
            }

            // Merge session activity for days without manual logs
            // Group sessions by date
            const sessionsByDate = new Map();
            for (const session of sessions) {
                const date = new Date(session.sortDate || session.performed_at || session.started_at);
                const dateStr = date.toDateString();
                const current = sessionsByDate.get(dateStr) || 0;
                sessionsByDate.set(dateStr, current + 1); // Increment count, or use duration if available
            }

            // Add session-inferred activity points
            sessionsByDate.forEach((count, dateStr) => {
                if (!datesWithManualActivity.has(dateStr)) {
                    const date = new Date(dateStr);
                    // Determine implied PAL based on session count
                    // 1 session -> 1.55 (Moderately Active)
                    // 2+ sessions -> 1.725 (Very Active)
                    const impliedPAL = count >= 2 ? 1.725 : 1.55;

                    newHistory.activity.push({
                        date: date.toISOString(),
                        value: impliedPAL,
                        label: formatDateLabel(date.toISOString())
                    });
                }
            });

            // Re-sort activity history
            newHistory.activity.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setHistory(newHistory);
        } catch (error: any) {
            setHistoryError(error.message || 'Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const refreshTodayCheckup = useCallback(async () => {
        try {
            const response = await getTodayCheckup();
            if (response.success && response.entry) {
                setTodayCheckup(response.entry);
            }
        } catch (error: any) {
            console.error('[AnalysisContext] Error fetching today checkup:', error);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            refreshUserData(),
            refreshHistory(),
            refreshTodayCheckup()
        ]);
    }, [refreshUserData, refreshHistory, refreshTodayCheckup]);

    // Load data only once on mount
    useEffect(() => {
        refreshAll();
    }, []);

    const value: AnalysisContextType = {
        userData,
        predictions,
        userLoading,
        entries,
        history,
        weeklyHistory,
        monthlyHistory,
        historyLoading,
        historyError,
        todayCheckup,
        refreshAll,
        refreshHistory,
        refreshTodayCheckup,
        refreshUserData,
        theme: theme as any,
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
};

export default AnalysisContext;
