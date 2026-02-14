import React from 'react';
import { Zap, Coins, Trophy } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import BatteryIcon from './BatteryIcon';

interface GamificationStatsProps {
  points: number;
  coins: number;
  batteries?: Array<{
    sleep: number;
    activity: number;
    nutrition: number;
    health: number;
    total: number;
  }>;
}

export const GamificationStats: React.FC<GamificationStatsProps> = ({
  points,
  coins,
  batteries = [],
}) => {
  const { theme } = useTheme();
  // Get today's battery or create default zeros
  const currentBattery = batteries && batteries.length > 0 ? batteries[0] : {
    sleep: 0,
    activity: 0,
    nutrition: 0,
    health: 0,
    total: 0
  };

  return (
    <div
      className="rounded-2xl p-6 mb-4"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="flex items-center mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
          style={{ backgroundColor: '#FBBC05' + '15' }}
        >
          <Trophy className="w-5 h-5" style={{ color: '#FBBC05' }} />
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
        >
          Overview
        </h3>
      </div>

      {/* Points & Coins Section */}
      <div
        className="flex justify-around mb-6 p-4 rounded-lg"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Points */}
        <div className="flex flex-col items-center">
          <Trophy className="w-8 h-8 mb-2" style={{ color: '#FBBF24' }} />
          <p
            className="text-2xl font-bold mb-1"
            style={{ color: theme.colors.text }}
          >
            {points}
          </p>
          <p className="text-xs" style={{ color: theme.colors.text + '77' }}>
            Points
          </p>
        </div>

        {/* Divider */}
        <div
          className="w-px"
          style={{ backgroundColor: theme.colors.text + '20' }}
        />

        {/* Coins */}
        <div className="flex flex-col items-center">
          <Coins className="w-8 h-8 mb-2" style={{ color: '#F59E0B' }} />
          <p
            className="text-2xl font-bold mb-1"
            style={{ color: theme.colors.text }}
          >
            {coins}
          </p>
          <p className="text-xs" style={{ color: theme.colors.text + '77' }}>
            Coins
          </p>
        </div>
      </div>

      {/* Batteries Section */}
      <div>
        <p
          className="text-sm font-semibold mb-4"
          style={{ color: theme.colors.text + '99' }}
        >
          Today's Battery Status
        </p>
        <div
          className="rounded-lg p-4 flex justify-around items-end"
          style={{ backgroundColor: theme.colors.background }}
        >
          <BatteryIcon value={currentBattery.sleep} label="Sleep" />
          <BatteryIcon value={currentBattery.activity} label="Activity" />
          <BatteryIcon value={currentBattery.nutrition} label="Nutrition" />
          <BatteryIcon value={currentBattery.health} label="Health" />
        </div>
      </div>
    </div>
  );
};

export default GamificationStats;
