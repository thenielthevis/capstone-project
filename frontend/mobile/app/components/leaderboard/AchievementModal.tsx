import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Achievement } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface AchievementModalProps {
  visible: boolean;
  achievement: Achievement;
  onClose: () => void;
}

const TIER_COLORS = {
  bronze: {
    bg: '#92400e',
    border: '#b45309',
    text: '#fbbf24',
    glow: '#f59e0b',
  },
  silver: {
    bg: '#374151',
    border: '#6b7280',
    text: '#d1d5db',
    glow: '#9ca3af',
  },
  gold: {
    bg: '#854d0e',
    border: '#ca8a04',
    text: '#fef08a',
    glow: '#eab308',
  },
  platinum: {
    bg: '#164e63',
    border: '#0891b2',
    text: '#67e8f9',
    glow: '#06b6d4',
  },
  diamond: {
    bg: '#4c1d95',
    border: '#7c3aed',
    text: '#c4b5fd',
    glow: '#8b5cf6',
  },
};

const TIER_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestone',
  workout: 'Workout',
  nutrition: 'Nutrition',
  streak: 'Streak',
  health: 'Social',
  program: 'Program',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AchievementModal({
  visible,
  achievement,
  onClose,
}: AchievementModalProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const tierStyle = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      
      // Entry animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        achievement.completed
          ? Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          : Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
      
      // Glow animation for completed achievements
      if (achievement.completed) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [visible, achievement.completed]);
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });
  
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={{ flex: 1 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <TouchableOpacity activeOpacity={1}>
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }, { rotate }],
                width: SCREEN_WIDTH - 48,
              }}
            >
              {/* Glow Effect */}
              {achievement.completed && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 24,
                    backgroundColor: tierStyle.glow,
                    opacity: glowOpacity,
                    transform: [{ scale: 1.05 }],
                  }}
                />
              )}
              
              {/* Card */}
              <View
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: achievement.completed ? tierStyle.bg : theme.colors.surface,
                  borderWidth: 2,
                  borderColor: achievement.completed ? tierStyle.border : theme.colors.border,
                }}
              >
                {/* Close Button */}
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
                
                {/* Icon Section */}
                <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 16 }}>
                  <View style={{ position: 'relative' }}>
                    <Text style={{ fontSize: 80 }}>
                      {achievement.completed ? achievement.icon : '🔒'}
                    </Text>
                    {achievement.completed && (
                      <View style={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: [{ translateX: -30 }],
                      }}>
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: tierStyle.border,
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                            {TIER_LABELS[achievement.tier].toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Content */}
                <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 }}>
                  {/* Title */}
                  <Text
                    style={{
                      fontSize: 24,
                      fontFamily: theme.fonts.heading,
                      textAlign: 'center',
                      color: achievement.completed ? '#fff' : theme.colors.text,
                    }}
                    numberOfLines={2}
                  >
                    {achievement.name}
                  </Text>
                  
                  {/* Category Badge */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                        {CATEGORY_LABELS[achievement.category] || achievement.category}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Description */}
                  <Text
                    style={{
                      textAlign: 'center',
                      marginTop: 16,
                      lineHeight: 24,
                      color: achievement.completed ? tierStyle.text : theme.colors.textSecondary,
                    }}
                  >
                    {achievement.description}
                  </Text>
                  
                  {/* Progress Section */}
                  <View style={{
                    marginTop: 24,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 16,
                    padding: 16,
                  }}>
                    {achievement.completed ? (
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
                          <Text style={{ color: theme.colors.accent, fontWeight: 'bold', marginLeft: 8 }}>
                            Completed!
                          </Text>
                        </View>
                        {achievement.completed_at && (
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                            Earned on {new Date(achievement.completed_at).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Progress</Text>
                          <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                            {achievement.progress} / {achievement.target}
                          </Text>
                        </View>
                        <View style={{
                          height: 12,
                          backgroundColor: theme.colors.border,
                          borderRadius: 6,
                          overflow: 'hidden',
                        }}>
                          <View
                            style={{
                              height: '100%',
                              borderRadius: 6,
                              width: `${achievement.percentage}%`,
                              backgroundColor: tierStyle.border,
                            }}
                          />
                        </View>
                        <Text style={{
                          color: theme.colors.textSecondary,
                          fontSize: 12,
                          textAlign: 'center',
                          marginTop: 8,
                        }}>
                          {achievement.percentage}% complete
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Points */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                    <Ionicons name="star" size={20} color="#fbbf24" />
                    <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>
                      {achievement.points} Points
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}
