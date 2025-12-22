import React, { createContext, useContext, useState, ReactNode } from 'react';

type Split = {
  km: number;
  time: number; // time in seconds for this km
  pace: number; // pace in seconds per km
};

type ActivityType = 'Running' | 'Walking' | 'Cycling';

type ActivityMetricsContextType = {
  speed: number;
  distance: number;
  time: number;
  recording: boolean;
  splits: Split[];
  activityType: ActivityType;
  setActivityType: (type: ActivityType) => void;
  setSpeed: (speed: number) => void;
  setDistance: (distance: number) => void;
  setTime: (time: number) => void;
  setRecording: (recording: boolean) => void;
  addSplit: (split: Split) => void;
  resetMetrics: () => void;
  calculateCaloriesBurned: (weightKg?: number) => number;
};

const ActivityMetricsContext = createContext<ActivityMetricsContextType | undefined>(undefined);

// MET values for different activities
const MET_VALUES: Record<ActivityType, number> = {
  Running: 9.8,    // Running at moderate pace (~8 km/h)
  Walking: 3.5,    // Walking at moderate pace (~5 km/h)
  Cycling: 7.5,    // Cycling at moderate pace (~16-19 km/h)
};

export const ActivityMetricsProvider = ({ children }: { children: ReactNode }) => {
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [recording, setRecording] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>("Walking");

  const addSplit = (split: Split) => {
    setSplits((prev) => [...prev, split]);
  };

  // Calculate calories burned using MET formula
  // Calories = MET × weight(kg) × time(hours)
  const calculateCaloriesBurned = (weightKg: number = 70): number => {
    const met = MET_VALUES[activityType];
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
    setActivityType("Walking");
  };

  return (
    <ActivityMetricsContext.Provider
      value={{
        speed,
        distance,
        time,
        recording,
        splits,
        activityType,
        setActivityType,
        setSpeed,
        setDistance,
        setTime,
        setRecording,
        addSplit,
        resetMetrics,
        calculateCaloriesBurned,
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

