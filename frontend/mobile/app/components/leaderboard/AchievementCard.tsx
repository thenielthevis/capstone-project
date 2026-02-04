import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Achievement } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface AchievementCardProps {
  achievement: Achievement;
  onPress: () => void;
}

const TIER_COLORS = {
  bronze: {
    bg: '#92400e',
    border: '#b45309',
    text: '#fbbf24',
  },
  silver: {
    bg: '#374151',
    border: '#6b7280',
    text: '#d1d5db',
  },
  gold: {
    bg: '#854d0e',
    border: '#ca8a04',
    text: '#fef08a',
  },
  platinum: {
    bg: '#164e63',
    border: '#0891b2',
    text: '#67e8f9',
  },
  diamond: {
    bg: '#4c1d95',
    border: '#7c3aed',
    text: '#c4b5fd',
  },
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 16px padding on each side + 16px gap

export default function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const { theme } = useTheme();
  const tierStyle = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;
  const tierIcon = TIER_ICONS[achievement.tier] || '🏆';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: cardWidth,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: achievement.completed ? tierStyle.bg : theme.colors.surface,
        borderWidth: 1,
        borderColor: achievement.completed ? tierStyle.border : theme.colors.border,
        opacity: achievement.completed ? 1 : 0.8,
      }}
    >
      {/* Icon Section */}
      <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 40 }}>
          {achievement.completed ? achievement.icon : '🔒'}
        </Text>
        {achievement.completed && (
          <View style={{ position: 'absolute', top: 8, right: 8 }}>
            <Text style={{ fontSize: 14 }}>{tierIcon}</Text>
          </View>
        )}
      </View>
      
      {/* Info Section */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Text
          style={{
            fontWeight: '600',
            textAlign: 'center',
            fontSize: 14,
            color: achievement.completed ? '#fff' : theme.colors.textSecondary,
            fontFamily: theme.fonts.body,
          }}
          numberOfLines={1}
        >
          {achievement.name}
        </Text>
        
        <Text
          style={{
            fontSize: 12,
            textAlign: 'center',
            marginTop: 4,
            color: achievement.completed ? tierStyle.text : theme.colors.textSecondary,
          }}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
        
        {/* Progress Bar */}
        {!achievement.completed && (
          <View style={{ marginTop: 8 }}>
            <View style={{ 
              height: 6, 
              backgroundColor: theme.colors.border, 
              borderRadius: 3, 
              overflow: 'hidden' 
            }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${achievement.percentage}%`,
                  backgroundColor: tierStyle.border,
                }}
              />
            </View>
            <Text style={{ 
              color: theme.colors.textSecondary, 
              fontSize: 11, 
              textAlign: 'center', 
              marginTop: 4 
            }}>
              {achievement.progress} / {achievement.target}
            </Text>
          </View>
        )}
        
        {/* Points Badge */}
        {achievement.completed && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: tierStyle.text }}>
              +{achievement.points} pts
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
