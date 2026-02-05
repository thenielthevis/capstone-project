import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import {
  LeaderboardFilters,
  LeaderboardList,
  UserRankCard,
  TopPerformersCarousel,
  NearbyCompetitors,
  AchievementCelebration,
} from '../../components/leaderboard';
import {
  getMyStats,
  refreshMyStats,
  getLeaderboard,
  getNearbyCompetitors,
  checkAchievements,
  LeaderboardStats,
  LeaderboardEntry,
} from '../../api/leaderboardApi';

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
type Category = 'global' | 'age_group' | 'gender' | 'fitness_level' | 'friends';
type Metric = 'score' | 'calories_burned' | 'activity_minutes' | 'streak';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myStats, setMyStats] = useState<LeaderboardStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [nearbyCompetitors, setNearbyCompetitors] = useState<any[]>([]);
  const [celebrationAchievement, setCelebrationAchievement] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Filters
  const [period, setPeriod] = useState<Period>('weekly');
  const [category, setCategory] = useState<Category>('global');
  const [metric, setMetric] = useState<Metric>('score');
  
  // Load data
  const loadData = useCallback(async () => {
    try {
      const [statsResult, leaderboardData, nearbyData] = await Promise.all([
        getMyStats(),
        getLeaderboard({ period, category, metric, limit: 20 }),
        getNearbyCompetitors(period),
      ]);
      
      setMyStats(statsResult.stats);
      setLeaderboard(leaderboardData.leaderboard);
      setCurrentUserEntry(leaderboardData.currentUserRank);
      setNearbyCompetitors(nearbyData.nearby || []);
      
      // Show celebration for new achievements
      if (statsResult.newAchievements && statsResult.newAchievements.length > 0) {
        setCelebrationAchievement(statsResult.newAchievements[0]);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, category, metric]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Refresh data - getMyStats automatically updates stats and checks achievements
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing:', error);
      setRefreshing(false);
    }
  }, [loadData]);
  
  const handleUserPress = (userId: string) => {
    // Future: Navigate to user profile
    console.log('User pressed:', userId);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ 
            color: theme.colors.textSecondary, 
            marginTop: 16,
            fontFamily: theme.fonts.body 
          }}>
            Loading leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ 
          color: theme.colors.text, 
          fontSize: 20, 
          fontFamily: theme.fonts.heading 
        }}>
          Leaderboard
        </Text>
        <TouchableOpacity onPress={() => router.push('/screens/leaderboard/achievements' as Href)}>
          <View style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 18, 
            backgroundColor: theme.colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons name="trophy" size={20} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Current User Rank Card */}
        {currentUserEntry && myStats && (
          <UserRankCard
            entry={currentUserEntry}
            stats={myStats}
            period={period}
          />
        )}
        
        {/* Filters */}
        <View style={{ marginTop: 16 }}>
          <LeaderboardFilters
            period={period}
            category={category}
            metric={metric}
            onPeriodChange={setPeriod}
            onCategoryChange={setCategory}
            onMetricChange={setMetric}
          />
        </View>
        
        {/* Nearby Competitors */}
        {nearbyCompetitors.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingHorizontal: 16,
              marginBottom: 12 
            }}>
              <Ionicons name="people" size={20} color={theme.colors.accent} />
              <Text style={{ 
                color: theme.colors.text, 
                fontSize: 16, 
                fontFamily: theme.fonts.heading,
                marginLeft: 8 
              }}>
                Nearby Competitors
              </Text>
            </View>
            <NearbyCompetitors
              competitors={nearbyCompetitors}
              period={period}
            />
          </View>
        )}
        
        {/* Main Leaderboard */}
        <View style={{ marginTop: 16 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16,
            marginBottom: 12 
          }}>
            <Ionicons name="podium" size={20} color={theme.colors.primary} />
            <Text style={{ 
              color: theme.colors.text, 
              fontSize: 16, 
              fontFamily: theme.fonts.heading,
              marginLeft: 8 
            }}>
              Rankings
            </Text>
          </View>
          
          {leaderboard.length > 0 ? (
            <LeaderboardList
              entries={leaderboard}
              metric={metric}
              onUserPress={handleUserPress}
            />
          ) : (
            <View style={{ 
              paddingVertical: 48, 
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              marginHorizontal: 16,
              borderRadius: 16
            }}>
              <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={{ 
                color: theme.colors.textSecondary, 
                fontSize: 16,
                fontFamily: theme.fonts.body,
                marginTop: 16,
                textAlign: 'center' 
              }}>
                No rankings available yet.{'\n'}Start logging to appear on the leaderboard!
              </Text>
            </View>
          )}
        </View>
        
        {/* Bottom padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
      
      {/* Achievement Celebration Modal */}
      {celebrationAchievement && (
        <AchievementCelebration
          visible={showCelebration}
          achievement={celebrationAchievement}
          onComplete={() => {
            setShowCelebration(false);
            setCelebrationAchievement(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
