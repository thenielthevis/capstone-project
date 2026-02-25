import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ListRenderItemInfo, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  metric: 'score' | 'calories_burned' | 'activity_minutes' | 'streak';
  onUserPress: (userId: string) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
}

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#fbbf24'; // Gold
    case 2:
      return '#9ca3af'; // Silver
    case 3:
      return '#cd7f32'; // Bronze
    default:
      return '#6b7280'; // Gray
  }
};

const getRankIcon = (rank: number): string | null => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
};

const getMetricValue = (
  entry: LeaderboardEntry,
  metric: 'score' | 'calories_burned' | 'activity_minutes' | 'streak'
): string => {
  switch (metric) {
    case 'score':
      return `${entry.stats.score.toLocaleString()} pts`;
    case 'calories_burned':
      return `${entry.stats.calories_burned.toLocaleString()} kcal`;
    case 'activity_minutes':
      return `${entry.stats.activity_minutes} min`;
    case 'streak':
      return `${entry.stats.current_streak} days`;
    default:
      return '';
  }
};

const getMetricIcon = (
  metric: 'score' | 'calories_burned' | 'activity_minutes' | 'streak'
): string => {
  switch (metric) {
    case 'score':
      return 'star';
    case 'calories_burned':
      return 'flame';
    case 'activity_minutes':
      return 'time';
    case 'streak':
      return 'calendar';
    default:
      return 'star';
  }
};

const LeaderboardCard = memo(function LeaderboardCard({
  entry,
  metric,
  onPress,
  theme,
}: {
  entry: LeaderboardEntry;
  metric: 'score' | 'calories_burned' | 'activity_minutes' | 'streak';
  onPress: () => void;
  theme: any;
}) {
  const rankIcon = getRankIcon(entry.rank);
  const rankColor = getRankColor(entry.rank);
  const isTopThree = entry.rank <= 3;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: entry.isCurrentUser 
          ? theme.colors.accent + '20' 
          : isTopThree 
            ? theme.colors.surface + '80' 
            : 'transparent',
        borderLeftWidth: entry.isCurrentUser ? 3 : 0,
        borderLeftColor: theme.colors.accent,
      }}
    >
      {/* Rank */}
      <View style={{ width: 44, minWidth: 44, alignItems: 'center', marginRight: 8 }}>
        {rankIcon ? (
          <Text style={{ fontSize: 22 }}>{rankIcon}</Text>
        ) : (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: entry.isCurrentUser ? theme.colors.accent : theme.colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: entry.isCurrentUser ? '#fff' : theme.colors.text,
              }}
            >
              {entry.rank}
            </Text>
          </View>
        )}
      </View>
      
      {/* Avatar */}
      <View style={{ marginRight: 12 }}>
        {entry.user.profilePicture ? (
          <Image
            source={{ uri: entry.user.profilePicture }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: isTopThree ? 2 : 0,
              borderColor: rankColor,
            }}
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isTopThree ? 2 : 0,
              borderColor: rankColor,
            }}
          >
            <Ionicons name="person" size={24} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>
      
      {/* User Info */}
      <View style={{ flex: 1, flexShrink: 1, marginRight: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontWeight: '600',
              color: entry.isCurrentUser ? theme.colors.accent : theme.colors.text,
              fontFamily: theme.fonts.body,
              flexShrink: 1,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {entry.user.username}
          </Text>
          {entry.isCurrentUser && (
            <Text style={{ color: theme.colors.accent, fontSize: 12, marginLeft: 4, flexShrink: 0 }}>(You)</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
            {entry.demographics?.fitness_level} • {entry.demographics?.age_group}
          </Text>
        </View>
      </View>
      
      {/* Metric Value */}
      <View style={{ alignItems: 'flex-end', flexShrink: 0, minWidth: 80 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={getMetricIcon(metric) as any}
            size={16}
            color={isTopThree ? rankColor : theme.colors.textSecondary}
          />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: 'bold',
              color: isTopThree ? rankColor : theme.colors.text,
            }}
          >
            {getMetricValue(entry, metric)}
          </Text>
        </View>
        {metric === 'score' && entry.stats.current_streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="flame" size={12} color="#f97316" />
            <Text style={{ color: '#fb923c', fontSize: 12, marginLeft: 4 }}>
              {entry.stats.current_streak} day streak
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const ITEM_HEIGHT = 73; // approximate height of each card + separator

export default function LeaderboardList({
  entries,
  metric,
  onUserPress,
  onEndReached,
  loadingMore,
}: LeaderboardListProps) {
  const { theme } = useTheme();
  
  const keyExtractor = useCallback((item: LeaderboardEntry) => item.user.id, []);
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);
  
  const renderItem = useCallback(({ item }: ListRenderItemInfo<LeaderboardEntry>) => (
    <LeaderboardCard
      entry={item}
      metric={metric}
      onPress={() => onUserPress(item.user.id)}
      theme={theme}
    />
  ), [metric, onUserPress, theme]);
  
  const ItemSeparator = useCallback(() => (
    <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 64 }} />
  ), [theme.colors.border]);
  
  const metricLabel = useMemo(() => {
    switch (metric) {
      case 'score': return 'Score';
      case 'calories_burned': return 'Calories Burned';
      case 'activity_minutes': return 'Activity Time';
      case 'streak': return 'Streak';
      default: return '';
    }
  }, [metric]);
  
  const ListHeader = useMemo(() => (
    <>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8,
        backgroundColor: theme.colors.surface + '80'
      }}>
        <View style={{ width: 48 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' }}>#</Text>
        </View>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 12 }}>User</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
          {metricLabel}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
    </>
  ), [theme.colors.surface, theme.colors.textSecondary, theme.colors.border, metricLabel]);
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      {ListHeader}
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
        scrollEnabled={false}
      />
    </View>
  );
}
