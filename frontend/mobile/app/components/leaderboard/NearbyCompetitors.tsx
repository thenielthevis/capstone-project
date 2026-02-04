import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNearbyCompetitors, NearbyCompetitor } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface NearbyCompetitorsProps {
  competitors?: NearbyCompetitor[];
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  onUserPress?: (userId: string) => void;
}

export default function NearbyCompetitors({
  competitors: propCompetitors,
  period,
  onUserPress,
}: NearbyCompetitorsProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(!propCompetitors);
  const [nearby, setNearby] = useState<NearbyCompetitor[]>(propCompetitors || []);
  const [currentRank, setCurrentRank] = useState<number>(0);
  
  useEffect(() => {
    if (propCompetitors) {
      setNearby(propCompetitors);
      const current = propCompetitors.find(c => c.isCurrentUser);
      if (current) setCurrentRank(current.rank);
      setLoading(false);
    } else {
      loadNearby();
    }
  }, [period, propCompetitors]);
  
  const loadNearby = async () => {
    try {
      setLoading(true);
      const data = await getNearbyCompetitors(period, 3);
      setNearby(data.nearby);
      setCurrentRank(data.currentUserRank);
    } catch (error) {
      console.error('Error loading nearby competitors:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={{ 
        marginHorizontal: 16, 
        marginVertical: 16, 
        backgroundColor: theme.colors.surface, 
        borderRadius: 16, 
        padding: 16, 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </View>
    );
  }
  
  if (nearby.length === 0) {
    return null;
  }
  
  // Get current user for calculations
  const currentUser = nearby.find(n => n.isCurrentUser);
  const userRank = currentUser?.rank || currentRank;
  
  return (
    <View style={{ 
      marginHorizontal: 16, 
      backgroundColor: theme.colors.surface, 
      borderRadius: 16, 
      overflow: 'hidden' 
    }}>
      {/* Competitors List */}
      {nearby.map((competitor, index) => (
        <TouchableOpacity
          key={`${competitor.user.id}-${index}`}
          onPress={() => onUserPress?.(competitor.user.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: competitor.isCurrentUser 
              ? theme.colors.accent + '20' 
              : 'transparent',
            borderBottomWidth: index !== nearby.length - 1 ? 1 : 0,
            borderBottomColor: theme.colors.border,
          }}
        >
          {/* Rank */}
          <View style={{ width: 40 }}>
            <Text
              style={{
                fontWeight: 'bold',
                textAlign: 'center',
                color: competitor.isCurrentUser ? theme.colors.accent : theme.colors.textSecondary,
              }}
            >
              #{competitor.rank}
            </Text>
          </View>
          
          {/* Rank Change Indicator */}
          <View style={{ width: 24, alignItems: 'center' }}>
            {competitor.rank < userRank && !competitor.isCurrentUser && (
              <Ionicons name="arrow-up" size={14} color={theme.colors.accent} />
            )}
            {competitor.rank > userRank && !competitor.isCurrentUser && (
              <Ionicons name="arrow-down" size={14} color="#ef4444" />
            )}
          </View>
          
          {/* Avatar */}
          {competitor.user.profilePicture ? (
            <Image
              source={{ uri: competitor.user.profilePicture }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <View style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: theme.colors.background, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
            </View>
          )}
          
          {/* Username */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontWeight: '500',
                color: competitor.isCurrentUser ? theme.colors.accent : theme.colors.text,
                fontFamily: theme.fonts.body,
              }}
            >
              {competitor.user.username}
              {competitor.isCurrentUser && ' (You)'}
            </Text>
          </View>
          
          {/* Score */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={{ color: '#fbbf24', fontWeight: 'bold', marginLeft: 4 }}>
              {competitor.score.toLocaleString()}
            </Text>
          </View>
          
          {/* Gap to Current User */}
          {!competitor.isCurrentUser && currentUser && (
            <View style={{ marginLeft: 12 }}>
              {competitor.rank < userRank ? (
                <Text style={{ color: '#ef4444', fontSize: 12 }}>
                  +{(competitor.score - currentUser.score).toLocaleString()}
                </Text>
              ) : (
                <Text style={{ color: theme.colors.accent, fontSize: 12 }}>
                  -{(currentUser.score - competitor.score).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
      
      {/* Motivational Footer */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: theme.colors.background + '80' 
      }}>
        {userRank <= 10 ? (
          <Text style={{ color: theme.colors.accent, fontSize: 12, textAlign: 'center' }}>
            🎉 You're in the top 10! Keep up the great work!
          </Text>
        ) : nearby.find(n => n.rank === userRank - 1) ? (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Only {(nearby.find(n => n.rank === userRank - 1)?.score || 0) - 
              (currentUser?.score || 0)} points to catch up to #{userRank - 1}!
          </Text>
        ) : (
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Keep logging to climb the leaderboard!
          </Text>
        )}
      </View>
    </View>
  );
}
