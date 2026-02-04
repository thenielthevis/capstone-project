import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TopPerformers } from '../../api/leaderboardApi';
import { useTheme } from '../../context/ThemeContext';

interface TopPerformersCarouselProps {
  data: TopPerformers;
  onUserPress: (userId: string) => void;
}

interface TopPerformerCardProps {
  title: string;
  icon: string;
  iconColor: string;
  entries: Array<{
    rank: number;
    user: { id: string; username: string; profilePicture: string | null };
    value: number;
  }>;
  valueFormatter: (value: number) => string;
  onUserPress: (userId: string) => void;
  theme: any;
}

function TopPerformerCard({
  title,
  icon,
  iconColor,
  entries,
  valueFormatter,
  onUserPress,
  theme,
}: TopPerformerCardProps) {
  if (entries.length === 0) return null;
  
  return (
    <View style={{ 
      width: 288, 
      marginRight: 16, 
      backgroundColor: theme.colors.surface, 
      borderRadius: 16, 
      padding: 16 
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={{ 
          color: theme.colors.text, 
          fontWeight: '600', 
          marginLeft: 8,
          fontFamily: theme.fonts.body
        }}>{title}</Text>
      </View>
      
      {/* Entries */}
      {entries.slice(0, 5).map((entry, index) => (
        <TouchableOpacity
          key={entry.user.id}
          onPress={() => onUserPress(entry.user.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderTopWidth: index !== 0 ? 1 : 0,
            borderTopColor: theme.colors.border,
          }}
        >
          {/* Rank */}
          <Text
            style={{
              width: 24,
              fontSize: 14,
              fontWeight: 'bold',
              color: index === 0
                ? '#fbbf24'
                : index === 1
                  ? '#9ca3af'
                  : index === 2
                    ? '#cd7f32'
                    : theme.colors.textSecondary,
            }}
          >
            {entry.rank}
          </Text>
          
          {/* Avatar */}
          {entry.user.profilePicture ? (
            <Image
              source={{ uri: entry.user.profilePicture }}
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
          <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14 }} numberOfLines={1}>
            {entry.user.username}
          </Text>
          
          {/* Value */}
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' }}>
            {valueFormatter(entry.value)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function TopPerformersCarousel({
  data,
  onUserPress,
}: TopPerformersCarouselProps) {
  const { theme } = useTheme();
  
  return (
    <View style={{ marginBottom: 16 }}>
      {/* Section Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        marginBottom: 12 
      }}>
        <Text style={{ 
          color: theme.colors.text, 
          fontFamily: theme.fonts.heading, 
          fontSize: 18 
        }}>Top Performers</Text>
        <Text style={{ 
          color: theme.colors.textSecondary, 
          fontSize: 14, 
          textTransform: 'capitalize' 
        }}>
          {data.period.replace('_', ' ')}
        </Text>
      </View>
      
      {/* Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <TopPerformerCard
          title="Top Scores"
          icon="trophy"
          iconColor="#fbbf24"
          entries={data.topByScore}
          valueFormatter={(v) => `${v.toLocaleString()} pts`}
          onUserPress={onUserPress}
          theme={theme}
        />
        
        <TopPerformerCard
          title="Most Calories Burned"
          icon="flame"
          iconColor="#f97316"
          entries={data.topByCaloriesBurned}
          valueFormatter={(v) => `${v.toLocaleString()} kcal`}
          onUserPress={onUserPress}
          theme={theme}
        />
        
        <TopPerformerCard
          title="Most Active"
          icon="time"
          iconColor="#3b82f6"
          entries={data.topByActivityMinutes}
          valueFormatter={(v) => {
            if (v >= 60) {
              return `${Math.floor(v / 60)}h ${v % 60}m`;
            }
            return `${v} min`;
          }}
          onUserPress={onUserPress}
          theme={theme}
        />
        
        <TopPerformerCard
          title="Longest Streaks"
          icon="calendar"
          iconColor="#a855f7"
          entries={data.topByStreak}
          valueFormatter={(v) => `${v} days`}
          onUserPress={onUserPress}
          theme={theme}
        />
      </ScrollView>
    </View>
  );
}
