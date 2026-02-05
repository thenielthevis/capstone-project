import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry, LeaderboardStats } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface UserRankCardProps {
  entry: LeaderboardEntry;
  stats: LeaderboardStats;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

const getPeriodLabel = (period: string): string => {
  switch (period) {
    case 'daily':
      return "Today's";
    case 'weekly':
      return "This Week's";
    case 'monthly':
      return "This Month's";
    case 'all_time':
      return 'All-Time';
    default:
      return '';
  }
};

const getRankSuffix = (rank: number): string => {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

export default function UserRankCard({ entry, stats, period }: UserRankCardProps) {
  const { theme } = useTheme();
  const rank = entry.rank;
  const isTopTen = rank <= 10;
  const isTopThree = rank <= 3;
  
  const getStreakColor = () => {
    const streak = stats.streaks.current_logging_streak;
    if (streak >= 30) return '#c084fc'; // purple
    if (streak >= 14) return '#fb923c'; // orange
    if (streak >= 7) return '#fbbf24'; // yellow
    return theme.colors.textSecondary;
  };
  
  const getCardColor = () => {
    if (isTopThree) return '#d97706'; // amber
    if (isTopTen) return '#16a34a'; // green
    return theme.colors.surface;
  };
  
  return (
    <View style={{ 
      marginHorizontal: 16, 
      marginTop: 16, 
      borderRadius: 16, 
      overflow: 'hidden' 
    }}>
      {/* Gradient Background */}
      <View style={{
        padding: 16,
        backgroundColor: getCardColor(),
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{ position: 'relative' }}>
            {entry.user.profilePicture ? (
              <Image
                source={{ uri: entry.user.profilePicture }}
                style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 32,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
              />
            ) : (
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 32, 
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.3)'
              }}>
                <Ionicons name="person" size={32} color={theme.colors.text} />
              </View>
            )}
            {/* Rank Badge */}
            <View
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isTopThree ? '#fbbf24' : isTopTen ? '#22c55e' : theme.colors.textSecondary,
              }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>{rank}</Text>
            </View>
          </View>
          
          {/* User Info */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: 12,
              fontFamily: theme.fonts.body
            }}>
              {getPeriodLabel(period)} Rank
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ 
                color: '#fff', 
                fontSize: 28, 
                fontFamily: theme.fonts.heading 
              }}>
                {rank}
              </Text>
              <Text style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 16, 
                marginLeft: 2 
              }}>
                {getRankSuffix(rank)}
              </Text>
            </View>
            <Text style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontFamily: theme.fonts.body,
              fontWeight: '500',
              marginTop: 4 
            }}>
              {entry.user.username}
            </Text>
          </View>
          
          {/* Score */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: 12,
              fontFamily: theme.fonts.body 
            }}>Score</Text>
            <Text style={{ 
              color: '#fff', 
              fontSize: 22, 
              fontFamily: theme.fonts.heading 
            }}>
              {entry.stats.score.toLocaleString()}
            </Text>
            <Text style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: 12,
              fontFamily: theme.fonts.body 
            }}>points</Text>
          </View>
        </View>
      </View>
      
      {/* Stats Row */}
      <View style={{ 
        backgroundColor: theme.colors.surface, 
        flexDirection: 'row' 
      }}>
        {/* Streak */}
        <View style={{ 
          flex: 1, 
          paddingVertical: 12, 
          alignItems: 'center',
          borderRightWidth: 1,
          borderRightColor: theme.colors.border
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="flame" size={16} color="#f97316" />
            <Text style={{ 
              marginLeft: 4, 
              fontWeight: 'bold',
              color: getStreakColor() 
            }}>
              {stats.streaks.current_logging_streak}
            </Text>
          </View>
          <Text style={{ 
            color: theme.colors.textSecondary, 
            fontSize: 11, 
            marginTop: 4 
          }}>Day Streak</Text>
        </View>
        
        {/* Calories Burned */}
        <View style={{ 
          flex: 1, 
          paddingVertical: 12, 
          alignItems: 'center',
          borderRightWidth: 1,
          borderRightColor: theme.colors.border
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="flash" size={16} color="#22c55e" />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#4ade80' }}>
              {period === 'all_time'
                ? (stats.all_time.total_calories_burned / 1000).toFixed(1) + 'k'
                : stats[period]?.calories_burned?.toLocaleString() || 0}
            </Text>
          </View>
          <Text style={{ 
            color: theme.colors.textSecondary, 
            fontSize: 11, 
            marginTop: 4 
          }}>Cal Burned</Text>
        </View>
        
        {/* Activity */}
        <View style={{ 
          flex: 1, 
          paddingVertical: 12, 
          alignItems: 'center',
          borderRightWidth: 1,
          borderRightColor: theme.colors.border
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time" size={16} color="#3b82f6" />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#60a5fa' }}>
              {period === 'all_time'
                ? Math.round(stats.all_time.total_activity_minutes / 60) + 'h'
                : (stats[period]?.activity_minutes || 0) + 'm'}
            </Text>
          </View>
          <Text style={{ 
            color: theme.colors.textSecondary, 
            fontSize: 11, 
            marginTop: 4 
          }}>Activity</Text>
        </View>
        
        {/* Workouts */}
        <View style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="barbell" size={16} color="#a855f7" />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#c084fc' }}>
              {period === 'all_time'
                ? stats.all_time.total_workouts_completed
                : stats[period]?.workouts_completed || 0}
            </Text>
          </View>
          <Text style={{ 
            color: theme.colors.textSecondary, 
            fontSize: 11, 
            marginTop: 4 
          }}>Workouts</Text>
        </View>
      </View>
    </View>
  );
}
