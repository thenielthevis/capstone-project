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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import {
  AchievementCard,
  AchievementModal,
} from '../../components/leaderboard';
import {
  getAchievements,
  checkAchievements,
  Achievement,
  AchievementSummary,
} from '../../api/leaderboardApi';

type CategoryFilter = 'all' | 'milestone' | 'workout' | 'nutrition' | 'streak' | 'health' | 'program' | 'leaderboard' | 'social';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  milestone: 'Milestone',
  workout: 'Workout',
  nutrition: 'Nutrition',
  streak: 'Streak',
  health: 'Health',
  program: 'Programs',
  leaderboard: 'Leaderboard',
  social: 'Social',
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Achievement[]>>({});
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Load achievements
  const loadAchievements = useCallback(async () => {
    try {
      const data = await getAchievements();
      setAchievements(data.achievements);
      setGrouped(data.grouped);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);
  
  // Refresh and check for new achievements
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await checkAchievements();
      if (result.count > 0) {
        // Show celebration for newly earned achievements
        setSelectedAchievement(result.newlyEarned[0]);
        setModalVisible(true);
      }
      await loadAchievements();
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      setRefreshing(false);
    }
  }, [loadAchievements]);
  
  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) {
      return false;
    }
    if (!showCompleted && achievement.completed) {
      return false;
    }
    return true;
  });
  
  // Sort achievements: incomplete first, then by progress percentage
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return b.percentage - a.percentage;
  });
  
  const openAchievementModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
    setSelectedAchievement(null);
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
            Loading achievements...
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
          Achievements
        </Text>
        <View style={{ width: 24 }} />
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
        {/* Summary Card */}
        {summary && (
          <View style={{ 
            marginHorizontal: 16, 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: theme.colors.surface, 
            borderRadius: 16 
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 16 
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  fontSize: 28, 
                  fontFamily: theme.fonts.heading, 
                  color: '#fbbf24' 
                }}>
                  {summary.completed}
                </Text>
                <Text style={{ 
                  color: theme.colors.textSecondary, 
                  fontSize: 12, 
                  marginTop: 4 
                }}>Completed</Text>
              </View>
              <View style={{ height: 48, width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  fontSize: 28, 
                  fontFamily: theme.fonts.heading, 
                  color: theme.colors.text 
                }}>
                  {summary.total}
                </Text>
                <Text style={{ 
                  color: theme.colors.textSecondary, 
                  fontSize: 12, 
                  marginTop: 4 
                }}>Total</Text>
              </View>
              <View style={{ height: 48, width: 1, backgroundColor: theme.colors.border }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  fontSize: 28, 
                  fontFamily: theme.fonts.heading, 
                  color: theme.colors.accent 
                }}>
                  {summary.total_points}
                </Text>
                <Text style={{ 
                  color: theme.colors.textSecondary, 
                  fontSize: 12, 
                  marginTop: 4 
                }}>Points</Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={{ 
              height: 12, 
              backgroundColor: theme.colors.border, 
              borderRadius: 6, 
              overflow: 'hidden' 
            }}>
              <View
                style={{ 
                  height: '100%', 
                  backgroundColor: '#fbbf24', 
                  borderRadius: 6,
                  width: `${summary.progress_percentage}%` 
                }}
              />
            </View>
            <Text style={{ 
              color: theme.colors.textSecondary, 
              fontSize: 12, 
              textAlign: 'center', 
              marginTop: 8 
            }}>
              {summary.progress_percentage}% Complete
            </Text>
          </View>
        )}
        
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: categoryFilter === cat 
                  ? '#fbbf24' 
                  : theme.colors.surface,
                borderWidth: categoryFilter === cat ? 0 : 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: theme.fonts.body,
                  color: categoryFilter === cat 
                    ? '#000' 
                    : theme.colors.textSecondary,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Show/Hide Completed Toggle */}
        <TouchableOpacity
          onPress={() => setShowCompleted(!showCompleted)}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            marginTop: 16 
          }}
        >
          <Ionicons
            name={showCompleted ? 'checkbox' : 'square-outline'}
            size={20}
            color="#fbbf24"
          />
          <Text style={{ 
            color: theme.colors.textSecondary, 
            fontSize: 14, 
            marginLeft: 8 
          }}>Show completed</Text>
        </TouchableOpacity>
        
        {/* Achievements Grid */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, paddingBottom: 32 }}>
          {sortedAchievements.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {sortedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onPress={() => openAchievementModal(achievement)}
                />
              ))}
            </View>
          ) : (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={{ 
                color: theme.colors.textSecondary, 
                fontSize: 16, 
                marginTop: 16, 
                textAlign: 'center',
                fontFamily: theme.fonts.body
              }}>
                No achievements in this category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementModal
          visible={modalVisible}
          achievement={selectedAchievement}
          onClose={closeModal}
        />
      )}
    </SafeAreaView>
  );
}
