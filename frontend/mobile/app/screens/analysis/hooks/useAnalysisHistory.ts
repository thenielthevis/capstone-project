import { useState, useEffect, useCallback } from 'react';
import { getCheckupHistory, MetricType } from '@/app/api/healthCheckupApi';

export interface HistoryDataPoint {
    date: string;
    value: number;
    label: string;
}

export const useAnalysisHistory = (metric: MetricType) => {
    const [data, setData] = useState<HistoryDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const endDate = new Date().toISOString();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);

            const response = await getCheckupHistory({
                startDate: startDate.toISOString(),
                endDate,
                limit: 365
            });

            if (response.success && response.data) {
                // Map history entries to data points
                const points: HistoryDataPoint[] = response.data
                    .map(entry => {
                        let value = 0;
                        switch (metric) {
                            case 'sleep': value = entry.sleep?.hours || 0; break;
                            case 'water': value = entry.water?.amount || 0; break;
                            case 'stress': value = entry.stress?.level || 0; break;
                            case 'weight': value = entry.weight?.value || 0; break;
                            case 'bmi': value = entry.bmi?.value || 0; break;
                            case 'activityLevel': value = entry.activityLevel?.pal || 0; break;
                            case 'dietary': value = entry.dietary?.mealFrequency || 0; break;
                            case 'healthStatus': value = entry.healthStatus?.score || 0; break;
                            case 'environmental': value = entry.environmental?.score || 0; break;
                            case 'addictionRisk': value = entry.addictionRisk?.score || 0; break;
                            case 'diseaseRisk': value = entry.diseaseRisk?.highRiskCount || 0; break;
                        }
                        const date = new Date(entry.date);
                        return {
                            date: entry.date,
                            value,
                            label: `${date.getMonth() + 1}/${date.getDate()}`,
                        };
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setData(points);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch history');
        } finally {
            setLoading(false);
        }
    }, [metric]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { data, loading, error, refresh: fetchHistory };
};

export const useMonthlyHistory = (metric: MetricType) => {
    const { data: rawData, loading, error, refresh } = useAnalysisHistory(metric);
    const [monthlyData, setMonthlyData] = useState<HistoryDataPoint[]>([]);

    useEffect(() => {
        if (!rawData.length) return;

        // Group by month
        const monthGroups = new Map<string, { sum: number; count: number }>();

        rawData.forEach(point => {
            const date = new Date(point.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const current = monthGroups.get(key) || { sum: 0, count: 0 };
            monthGroups.set(key, {
                sum: current.sum + point.value,
                count: current.count + 1
            });
        });

        // Convert to points
        const points: HistoryDataPoint[] = Array.from(monthGroups.entries())
            .map(([key, stats]) => {
                const [year, month] = key.split('-').map(Number);
                const date = new Date(year, month, 1);
                return {
                    date: date.toISOString(),
                    value: stats.sum / stats.count,
                    label: date.toLocaleString('default', { month: 'short' })
                };
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setMonthlyData(points);
    }, [rawData]);

    return { data: monthlyData, loading, error, refresh };
};
