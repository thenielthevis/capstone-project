import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface BatteryIconProps {
  value: number;
  label: string;
}

const getBatteryColor = (value: number) => {
  if (value <= 25) return '#ef4444'; // Red
  if (value <= 50) return '#f97316'; // Orange
  if (value <= 75) return '#eab308'; // Yellow
  return '#22c55e'; // Green
};

export const BatteryIcon: React.FC<BatteryIconProps> = ({ value, label }) => {
  const { theme } = useTheme();
  const color = getBatteryColor(value);
  const clampedValue = Math.max(5, Math.min(value, 100));

  return (
    <div className="flex flex-col items-center mx-2">
      {/* Battery Nub (Top) */}
      <div
        className="w-3 h-1 rounded-t-sm mb-0.5"
        style={{ backgroundColor: theme.colors.text + '30' }}
      />

      {/* Main Battery Body */}
      <div
        className="w-8 h-20 border-2 rounded p-0.5 flex flex-col-reverse mb-2"
        style={{
          borderColor: theme.colors.text + '30',
        }}
      >
        {/* Fill */}
        <div
          className="w-full rounded transition-all"
          style={{
            height: `${clampedValue}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <p className="text-xs mb-1" style={{ color: theme.colors.text }}>
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color }}>
        {value}%
      </p>
    </div>
  );
};

export default BatteryIcon;
