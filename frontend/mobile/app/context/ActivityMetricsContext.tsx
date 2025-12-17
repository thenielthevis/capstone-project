import React, { createContext, useContext, useState, ReactNode } from 'react';

type Split = {
  km: number;
  time: number; // time in seconds for this km
  pace: number; // pace in seconds per km
};

type ActivityMetricsContextType = {
  speed: number;
  distance: number;
  time: number;
  recording: boolean;
  splits: Split[];
  activityType: string;
  setActivityType: (type: string) => void;
  setSpeed: (speed: number) => void;
  setDistance: (distance: number) => void;
  setTime: (time: number) => void;
  setRecording: (recording: boolean) => void;
  addSplit: (split: Split) => void;
  resetMetrics: () => void;
};

const ActivityMetricsContext = createContext<ActivityMetricsContextType | undefined>(undefined);

export const ActivityMetricsProvider = ({ children }: { children: ReactNode }) => {
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [recording, setRecording] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [activityType, setActivityType] = useState<string>("");

  const addSplit = (split: Split) => {
    setSplits((prev) => [...prev, split]);
  };

  const resetMetrics = () => {
    setSpeed(0);
    setDistance(0);
    setTime(0);
    setRecording(false);
    setSplits([]);
    setActivityType("");
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

