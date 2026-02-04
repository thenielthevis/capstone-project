import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Achievement } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface AchievementCelebrationProps {
  visible: boolean;
  achievement: Achievement;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#06b6d4',
  diamond: '#8b5cf6',
};

// Create confetti particles
const createParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const initialX = Math.random() * SCREEN_WIDTH;
    return {
      id: i,
      x: new Animated.Value(initialX),
      initialX, // Store initial value for animation
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: ['#fbbf24', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316'][
        Math.floor(Math.random() * 6)
      ],
    };
  });
};

export default function AchievementCelebration({
  visible,
  achievement,
  onComplete,
}: AchievementCelebrationProps) {
  const { theme, themeKey } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const particles = useRef(createParticles(30)).current;
  
  const tierColor = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;
  const blurTint = themeKey === 'light' ? 'light' : 'dark';
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0);
      textOpacityAnim.setValue(0);
      particles.forEach((p) => {
        p.y.setValue(-50);
        p.x.setValue(Math.random() * SCREEN_WIDTH);
        p.rotate.setValue(0);
      });
      
      // Start animation sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Scale up badge with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        // Icon bounce
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        // Text fade in
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Confetti animation
      particles.forEach((particle, index) => {
        const delay = index * 50;
        
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.y, {
              toValue: SCREEN_HEIGHT + 100,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: particle.initialX + (Math.random() - 0.5) * 200,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotate, {
              toValue: 10,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
      
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={30} tint={blurTint} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.container,
            { opacity: opacityAnim },
          ]}
        >
          {/* Confetti Particles */}
          {particles.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  backgroundColor: particle.color,
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: particle.scale },
                    {
                      rotate: particle.rotate.interpolate({
                        inputRange: [0, 10],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
          
          {/* Achievement Card */}
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ scale: scaleAnim }],
                borderColor: tierColor,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            {/* Glow Ring */}
            <View style={[styles.glowRing, { backgroundColor: tierColor }]} />
            
            {/* Icon */}
            <Animated.View
              style={{
                transform: [{ scale: iconScaleAnim }],
              }}
            >
              <Text style={styles.icon}>{achievement.icon}</Text>
            </Animated.View>
            
            {/* Title */}
            <Animated.View style={{ opacity: textOpacityAnim }}>
              <Text style={styles.congratsText}>🎉 Achievement Unlocked! 🎉</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>{achievement.name}</Text>
              <Text style={[styles.tier, { color: tierColor }]}>
                {achievement.tier.toUpperCase()}
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{achievement.description}</Text>
              
              {/* Points */}
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>+{achievement.points} Points</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 44,
    opacity: 0.2,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  congratsText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  tier: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  pointsContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
