import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { useUser } from './UserContext';
import { getAllGeoActivities, GeoActivity } from "../api/geoActivityApi";
import { saveToCache, loadFromCache, withTimeout } from "../utils/cacheStorage";
import { saveInProgressSession, clearInProgressSession } from "../utils/offlineSessionQueue";

// ─── Types ─────────────────────────────────────────────────────
export type Split = {
  km: number;
  time: number; // time in seconds for this km
  pace: number; // pace in seconds per km
};

type ActivityType = string;

/**
 * Refs for high-frequency data that recording logic writes to.
 * UI never reads these directly — it reads the throttled state.
 */
export type MetricsRefs = {
  speed: React.MutableRefObject<number>;
  distance: React.MutableRefObject<number>;
  time: React.MutableRefObject<number>;
  recording: React.MutableRefObject<boolean>;
  routeCoords: React.MutableRefObject<Array<[number, number]>>;
  splits: React.MutableRefObject<Split[]>;
};

type ActivityMetricsContextType = {
  // ── Throttled state for UI (re-renders at ~2 s intervals) ──
  speed: number;
  distance: number;
  time: number;
  recording: boolean;
  splits: Split[];
  activityType: ActivityType;
  activities: GeoActivity[];
  SPLIT_DISTANCE_KM: number;
  isDistanceBased: boolean;

  // ── Refs for recording engine (no re-renders) ──
  refs: MetricsRefs;

  // ── Setters ──
  setActivityType: (type: ActivityType) => void;
  /** Prefer writing to refs.speed.current during recording; this triggers re-render */
  setSpeed: (speed: number) => void;
  setDistance: (distance: number) => void;
  setTime: (time: number) => void;
  setRecording: (recording: boolean) => void;
  addSplit: (split: Split) => void;
  resetMetrics: () => void;
  /** Push current ref values → state (call on a timer, e.g. every 2 s) */
  flushToState: () => void;
  calculateCaloriesBurned: (weightKg?: number) => number;
  refreshActivities: () => Promise<void>;
};

const ActivityMetricsContext = createContext<ActivityMetricsContextType | undefined>(undefined);

// Throttle interval in ms for flushing ref → state
const UI_FLUSH_INTERVAL = 2000;
// How often to persist in-progress session to disk (crash recovery)
const PERSIST_INTERVAL = 10000;

export const ActivityMetricsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  // ── Throttled UI state (updated every UI_FLUSH_INTERVAL) ──
  const [speed, _setSpeed] = useState<number>(0);
  const [distance, _setDistance] = useState<number>(0);
  const [time, _setTime] = useState<number>(0);
  const [recording, _setRecording] = useState<boolean>(false);
  const [splits, _setSplits] = useState<Split[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>("Select");
  const [activities, setActivities] = useState<GeoActivity[]>([]);

  // ── High-frequency refs (written to by GPS / timer callbacks) ──
  const speedRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const recordingRef = useRef<boolean>(false);
  const routeCoordsRef = useRef<Array<[number, number]>>([]);
  const splitsRef = useRef<Split[]>([]);

  const refs: MetricsRefs = useMemo(() => ({
    speed: speedRef,
    distance: distanceRef,
    time: timeRef,
    recording: recordingRef,
    routeCoords: routeCoordsRef,
    splits: splitsRef,
  }), []);

  // ── Flush ref values → state (single batch to minimise re-renders) ──
  const flushToState = useCallback(() => {
    _setSpeed(speedRef.current);
    _setDistance(distanceRef.current);
    _setTime(timeRef.current);
    // Only create new splits array reference when length changed
    _setSplits((prev) => {
      if (prev.length !== splitsRef.current.length) {
        return [...splitsRef.current];
      }
      return prev;
    });
  }, []);

  // ── Auto-flush on interval while recording ──
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(flushToState, UI_FLUSH_INTERVAL);
    return () => clearInterval(id);
  }, [recording, flushToState]);

  // ── Periodically persist in-progress session for crash recovery ──
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      saveInProgressSession({
        activityType,
        distance: distanceRef.current,
        time: timeRef.current,
        speed: speedRef.current,
        routeCoords: routeCoordsRef.current,
        splits: splitsRef.current,
        startedAt: new Date(Date.now() - timeRef.current * 1000).toISOString(),
        lastSavedAt: new Date().toISOString(),
      });
    }, PERSIST_INTERVAL);
    return () => clearInterval(id);
  }, [recording, activityType]);

  // ── Wrappers that write to BOTH ref and state (for non-recording callers) ──
  const setSpeed = useCallback((v: number) => { speedRef.current = v; _setSpeed(v); }, []);
  const setDistance = useCallback((v: number) => { distanceRef.current = v; _setDistance(v); }, []);
  const setTime = useCallback((v: number) => { timeRef.current = v; _setTime(v); }, []);
  const setRecording = useCallback((v: boolean) => {
    recordingRef.current = v;
    _setRecording(v);
    // Flush immediately on state toggle so UI reacts to play/pause
    if (!v) flushToState();
  }, [flushToState]);

  const addSplit = useCallback((split: Split) => {
    splitsRef.current = [...splitsRef.current, split];
    // Splits are important events — flush immediately
    _setSplits([...splitsRef.current]);
  }, []);

  // ── Cache key ──
  const ACTIVITIES_CACHE_KEY = "offline_geo_activities";

  useEffect(() => {
    if (user) {
      initActivities();
    }
  }, [user]);

  const initActivities = async () => {
    try {
      const cached = await loadFromCache<GeoActivity[]>(ACTIVITIES_CACHE_KEY);
      if (cached && cached.length > 0) {
        console.log("[Context] Loaded activities from cache:", cached.length);
        setActivities(cached);
        if (!activityType) setActivityType(cached[0].name);
      }
      console.log("[Context] Refreshing activities from API");
      await refreshActivities();
    } catch (e) {
      console.log("[Context] Init failed", e);
    }
  };

  const refreshActivities = async () => {
    try {
      const data = await withTimeout(getAllGeoActivities(), 8000);
      if (data && data.length > 0) {
        setActivities(data);
        await saveToCache(ACTIVITIES_CACHE_KEY, data);
        if (!activityType && data[0]?.name) {
          setActivityType(data[0].name);
        }
      }
    } catch (e) {
      console.log("[Context] Failed to refresh activities:", e instanceof Error ? e.message : 'Unknown error');
    }
  };

  // ── MET-based calorie calculation ──
  const calculateCaloriesBurned = useCallback((weightKg: number = 70): number => {
    let met = 9.8;
    const activityObj = activities.find(a => a.name === activityType);
    if (activityObj && activityObj.met) {
      met = activityObj.met;
    } else {
      if (activityType === 'Walking') met = 3.5;
      else if (activityType === 'Cycling') met = 7.5;
    }
    // Use ref for accurate real-time calculation
    const timeInHours = timeRef.current / 3600;
    return Math.round(met * weightKg * timeInHours);
  }, [activities, activityType]);

  const resetMetrics = useCallback(() => {
    speedRef.current = 0;
    distanceRef.current = 0;
    timeRef.current = 0;
    recordingRef.current = false;
    routeCoordsRef.current = [];
    splitsRef.current = [];
    _setSpeed(0);
    _setDistance(0);
    _setTime(0);
    _setRecording(false);
    _setSplits([]);
    clearInProgressSession();
  }, []);

  const SPLIT_DISTANCE_KM = 1;

  // Memoize isDistanceBased so it only recalculates when activityType/activities change
  const isDistanceBased = useMemo(() => {
    const activity = activities.find(a => a.name === activityType);
    const type = activity?.type || 'Other Sports';
    return ['Foot Sports', 'Cycle Sports', 'Water Sports'].includes(type);
  }, [activities, activityType]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    speed,
    distance,
    time,
    recording,
    splits,
    activityType,
    activities,
    SPLIT_DISTANCE_KM,
    isDistanceBased,
    refs,
    setActivityType,
    setSpeed,
    setDistance,
    setTime,
    setRecording,
    addSplit,
    resetMetrics,
    flushToState,
    calculateCaloriesBurned,
    refreshActivities,
  }), [
    speed, distance, time, recording, splits,
    activityType, activities, isDistanceBased,
    refs, setSpeed, setDistance, setTime, setRecording,
    addSplit, resetMetrics, flushToState, calculateCaloriesBurned,
  ]);

  return (
    <ActivityMetricsContext.Provider value={contextValue}>
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

