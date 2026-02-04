import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface BadgeDisplayProps {
  achievements: Achievement[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showProgress?: boolean;
}

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#06b6d4',
  diamond: '#8b5cf6',
};

const SIZE_CONFIG = {
  small: { badge: 32, icon: 16, text: 10 },
  medium: { badge: 44, icon: 22, text: 12 },
  large: { badge: 56, icon: 28, text: 14 },
};

export default function BadgeDisplay({
  achievements,
  maxDisplay = 5,
  size = 'medium',
  onPress,
  showProgress = false,
}: BadgeDisplayProps) {
  const { theme } = useTheme();
  const completedAchievements = achievements.filter((a) => a.completed);
  const displayAchievements = completedAchievements.slice(0, maxDisplay);
  const extraCount = completedAchievements.length - maxDisplay;
  const config = SIZE_CONFIG[size];
  
  if (completedAchievements.length === 0) {
    if (!showProgress) return null;
    
    // Show in-progress badge
    const inProgress = achievements
      .filter((a) => !a.completed && a.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)[0];
    
    if (!inProgress) return null;
    
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: 9999,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
        disabled={!onPress}
      >
        <View
          style={{
            width: config.badge,
            height: config.badge,
            borderRadius: config.badge / 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            backgroundColor: theme.colors.border,
            opacity: 0.7,
          }}
        >
          <Text style={{ fontSize: config.icon }}>🔒</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: theme.colors.textSecondary, fontSize: config.text }}
            numberOfLines={1}
          >
            {inProgress.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={{ 
              flex: 1, 
              height: 4, 
              backgroundColor: theme.colors.border, 
              borderRadius: 9999, 
              overflow: 'hidden', 
              marginRight: 8 
            }}>
              <View
                style={{ 
                  height: '100%', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: 9999,
                  width: `${inProgress.percentage}%` 
                }}
              />
            </View>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 10 }}>{inProgress.percentage}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center' }}
      disabled={!onPress}
    >
      {displayAchievements.map((achievement, index) => (
        <View
          key={achievement.id}
          style={{
            width: config.badge,
            height: config.badge,
            borderRadius: config.badge / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: TIER_COLORS[achievement.tier],
            marginLeft: index > 0 ? -config.badge / 4 : 0,
            zIndex: displayAchievements.length - index,
            borderWidth: 2,
            borderColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontSize: config.icon }}>{achievement.icon}</Text>
        </View>
      ))}
      
      {extraCount > 0 && (
        <View
          style={{
            width: config.badge,
            height: config.badge,
            borderRadius: config.badge / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.border,
            marginLeft: -config.badge / 4,
            borderWidth: 2,
            borderColor: theme.colors.surface,
          }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: config.text }}>
            +{extraCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Compact horizontal badge list
export function BadgeList({
  achievements,
  onAchievementPress,
}: {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
}) {
  const { theme } = useTheme();
  const completed = achievements.filter((a) => a.completed);
  
  if (completed.length === 0) {
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <Ionicons name="ribbon-outline" size={32} color={theme.colors.textSecondary} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }}>No badges earned yet</Text>
      </View>
    );
  }
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {completed.map((achievement) => (
        <TouchableOpacity
          key={achievement.id}
          onPress={() => onAchievementPress?.(achievement)}
          style={{ alignItems: 'center', marginRight: 16 }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: TIER_COLORS[achievement.tier],
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Text style={{ fontSize: 28 }}>{achievement.icon}</Text>
          </View>
          <Text
            style={{ 
              color: theme.colors.textSecondary, 
              fontSize: 12, 
              marginTop: 4, 
              textAlign: 'center',
              maxWidth: 60 
            }}
            numberOfLines={1}
          >
            {achievement.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Mini badge count for headers
export function BadgeCount({
  count,
  onPress,
}: {
  count: number;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
      disabled={!onPress}
    >
      <Ionicons name="trophy" size={14} color="#fbbf24" />
      <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>{count}</Text>
    </TouchableOpacity>
  );
}
