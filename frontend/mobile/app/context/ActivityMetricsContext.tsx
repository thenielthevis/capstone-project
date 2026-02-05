import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useUser } from './UserContext';
import { getAllGeoActivities, GeoActivity } from "../api/geoActivityApi";
import { saveToCache, loadFromCache, withTimeout } from "../utils/cacheStorage";

type Split = {
  km: number;
  time: number; // time in seconds for this km
  pace: number; // pace in seconds per km
};

type ActivityType = string;

type ActivityMetricsContextType = {
  speed: number;
  distance: number;
  time: number;
  recording: boolean;
  splits: Split[];
  activityType: ActivityType;
  activities: GeoActivity[]; // Global list of activities
  setActivityType: (type: ActivityType) => void;
  setSpeed: (speed: number) => void;
  setDistance: (distance: number) => void;
  setTime: (time: number) => void;
  setRecording: (recording: boolean) => void;
  addSplit: (split: Split) => void;
  resetMetrics: () => void;
  calculateCaloriesBurned: (weightKg?: number) => number;
  refreshActivities: () => Promise<void>;
  SPLIT_DISTANCE_KM: number;
  isDistanceBased: boolean;
};

const ActivityMetricsContext = createContext<ActivityMetricsContextType | undefined>(undefined);

export const ActivityMetricsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [recording, setRecording] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>("Select");
  const [activities, setActivities] = useState<GeoActivity[]>([]);

  // Cache key
  const ACTIVITIES_CACHE_KEY = "offline_geo_activities";

  useEffect(() => {
    if (user) {
      initActivities();
    }
  }, [user]);

  const initActivities = async () => {
    try {
      // Load from cache first for immediate display
      const cached = await loadFromCache<GeoActivity[]>(ACTIVITIES_CACHE_KEY);
      if (cached && cached.length > 0) {
        console.log("[Context] Loaded activities from cache:", cached.length);
        setActivities(cached);
        // Ensure valid selection if not set
        if (!activityType) setActivityType(cached[0].name);
      }

      // Always try to refresh from API to get latest activities
      console.log("[Context] Refreshing activities from API");
      await refreshActivities();
    } catch (e) {
      console.log("[Context] Init failed", e);
    }
  };

  const refreshActivities = async () => {
    try {
      // Use timeout to prevent hanging on slow/offline connections
      const data = await withTimeout(getAllGeoActivities(), 8000);
      if (data && data.length > 0) {
        setActivities(data);
        await saveToCache(ACTIVITIES_CACHE_KEY, data);

        // Update default selection if needed
        if (!activityType && data[0]?.name) {
          setActivityType(data[0].name);
        }
      }
    } catch (e) {
      // Timeout or network error - silent fail, rely on cache
      console.log("[Context] Failed to refresh activities:", e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const addSplit = (split: Split) => {
    setSplits((prev) => [...prev, split]);
  };

  // Calculate calories burned using MET formula
  // Calories = MET × weight(kg) × time(hours)
  const calculateCaloriesBurned = (weightKg: number = 70): number => {
    // Default MET values fallback
    let met = 9.8; // Running default

    // Try to find specific MET from loaded activities
    const activityObj = activities.find(a => a.name === activityType);
    if (activityObj && activityObj.met) {
      met = activityObj.met;
    } else {
      // Fallback logic if activities not loaded yet
      if (activityType === 'Walking') met = 3.5;
      else if (activityType === 'Cycling') met = 7.5;
    }

    const timeInHours = time / 3600;
    const calories = Math.round(met * weightKg * timeInHours);
    return calories;
  };

  const resetMetrics = () => {
    setSpeed(0);
    setDistance(0);
    setTime(0);
    setRecording(false);
    setSplits([]);
  };

  // Configurable split distance
  const SPLIT_DISTANCE_KM = 0.1;

  return (
    <ActivityMetricsContext.Provider
      value={{
        speed,
        distance,
        time,
        recording,
        splits,
        activityType,
        activities,
        SPLIT_DISTANCE_KM, // Exposed constant
        // Helper to check if current activity is distance-based
        isDistanceBased: (() => {
          const activity = activities.find(a => a.name === activityType);
          const type = activity?.type || 'Other Sports';
          // Only these types record distance/speed/splits
          return ['Foot Sports', 'Cycle Sports', 'Water Sports'].includes(type);
        })(),
        setActivityType,
        setSpeed,
        setDistance,
        setTime,
        setRecording,
        addSplit,
        resetMetrics,
        calculateCaloriesBurned,
        refreshActivities
      }}
    >
      {children}
    </ActivityMetricsContext.Provider>
  );
};

export const useActivityMetrics = () => {
  const context = useContext(ActivityMetricsContext);
  if (!context) {
    throw new Error('useActivityMetrics must be used within ActivityMetricsProvider');
  }
  return context;
};

