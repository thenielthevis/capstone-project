import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLeaderboard, LeaderboardEntry } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface LeaderboardWidgetProps {
  showTopCount?: number;
}

export default function LeaderboardWidget({ showTopCount = 3 }: LeaderboardWidgetProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  
  useEffect(() => {
    loadTopUsers();
  }, []);
  
  const loadTopUsers = async () => {
    try {
      const data = await getLeaderboard({ period: 'weekly', limit: showTopCount });
      setTopUsers(data.leaderboard.slice(0, showTopCount));
      setCurrentUserRank(data.currentUserRank);
    } catch (error) {
      console.error('Error loading leaderboard widget:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const goToLeaderboard = () => {
    router.push('/screens/leaderboard/' as any);
  };
  
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', color: '#fbbf24' };
      case 2:
        return { emoji: '🥈', color: '#9ca3af' };
      case 3:
        return { emoji: '🥉', color: '#cd7f32' };
      default:
        return { emoji: `#${rank}`, color: theme.colors.textSecondary };
    }
  };
  
  if (loading) {
    return (
      <View style={{ 
        marginHorizontal: 16, 
        marginVertical: 8, 
        backgroundColor: theme.colors.surface, 
        borderRadius: 16, 
        padding: 16 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trophy" size={20} color="#fbbf24" />
            <Text style={{ color: theme.colors.text, fontWeight: '600', marginLeft: 8 }}>Leaderboard</Text>
          </View>
        </View>
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={goToLeaderboard}
      style={{ 
        marginHorizontal: 16, 
        marginVertical: 8, 
        backgroundColor: theme.colors.surface, 
        borderRadius: 16, 
        overflow: 'hidden' 
      }}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="trophy" size={20} color="#fbbf24" />
          <Text style={{ color: theme.colors.text, fontWeight: '600', marginLeft: 8 }}>Weekly Leaderboard</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginRight: 4 }}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </View>
      </View>
      
      {/* Top Users */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {topUsers.map((user, index) => {
          const badge = getRankBadge(user.rank);
          return (
            <View
              key={user.user.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: index !== 0 ? 1 : 0,
                borderTopColor: theme.colors.border + '50',
              }}
            >
              {/* Rank Badge */}
              <View style={{ width: 32, alignItems: 'center' }}>
                {user.rank <= 3 ? (
                  <Text style={{ fontSize: 20 }}>{badge.emoji}</Text>
                ) : (
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold' }}>{user.rank}</Text>
                )}
              </View>
              
              {/* Avatar */}
              {user.user.profilePicture ? (
                <Image
                  source={{ uri: user.user.profilePicture }}
                  style={{ width: 32, height: 32, borderRadius: 16, marginHorizontal: 8 }}
                />
              ) : (
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: theme.colors.background, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginHorizontal: 8 
                }}>
                  <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
                </View>
              )}
              
              {/* Username */}
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: user.isCurrentUser ? theme.colors.accent : theme.colors.text,
                  fontWeight: user.isCurrentUser ? '500' : '400',
                }}
                numberOfLines={1}
              >
                {user.user.username}
                {user.isCurrentUser && ' (You)'}
              </Text>
              
              {/* Score */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={{ color: '#fbbf24', fontSize: 14, fontWeight: '500', marginLeft: 4 }}>
                  {user.stats.score.toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
        
        {/* Current User Rank (if not in top list) */}
        {currentUserRank && !topUsers.some(u => u.isCurrentUser) && (
          <>
            <View style={{ paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>• • •</Text>
            </View>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingVertical: 8,
              backgroundColor: theme.colors.accent + '20',
              marginHorizontal: -16,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}>
              <View style={{ width: 32, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>{currentUserRank.rank}</Text>
              </View>
              {currentUserRank.user.profilePicture ? (
                <Image
                  source={{ uri: currentUserRank.user.profilePicture }}
                  style={{ width: 32, height: 32, borderRadius: 16, marginHorizontal: 8 }}
                />
              ) : (
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: theme.colors.accent + '40', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginHorizontal: 8 
                }}>
                  <Ionicons name="person" size={16} color={theme.colors.accent} />
                </View>
              )}
              <Text style={{ flex: 1, color: theme.colors.accent, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                {currentUserRank.user.username} (You)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={{ color: '#fbbf24', fontSize: 14, fontWeight: '500', marginLeft: 4 }}>
                  {currentUserRank.stats.score.toLocaleString()}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
      
      {/* Motivational Footer */}
      {currentUserRank && (
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 8, 
          backgroundColor: theme.colors.background + '80',
          borderTopWidth: 1,
          borderTopColor: theme.colors.border
        }}>
          {currentUserRank.rank <= 10 ? (
            <Text style={{ color: theme.colors.accent, fontSize: 12, textAlign: 'center' }}>
              🎉 You're #{currentUserRank.rank} this week! Keep it up!
            </Text>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
              Log more activities to climb the ranks! 💪
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
