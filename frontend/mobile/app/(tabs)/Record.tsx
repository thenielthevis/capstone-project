
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert, ScrollView, Dimensions, RefreshControl } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useDailyLog } from "../context/DailyLogContext";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({
  consumed,
  goal,
  status,
  theme
}: {
  consumed: number;
  goal: number;
  status: string;
  theme: any;
}) => {
  const percentage = Math.min((consumed / goal) * 100, 100);
  const statusColor = status === 'under' ? '#22c55e' :
    status === 'over' ? '#ef4444' : theme.colors.primary;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 12,
        borderColor: statusColor + '30',
        position: 'relative',
      }}>
        {/* Progress arc simulation with overlay */}
        <View style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 90,
          borderWidth: 12,
          borderColor: 'transparent',
          borderTopColor: statusColor,
          borderRightColor: percentage > 25 ? statusColor : 'transparent',
          borderBottomColor: percentage > 50 ? statusColor : 'transparent',
          borderLeftColor: percentage > 75 ? statusColor : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }} />

        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontFamily: theme.fonts.heading,
            fontSize: 42,
            color: theme.colors.text,
            lineHeight: 48,
          }}>
            {consumed}
          </Text>
          <Text style={{
            fontFamily: theme.fonts.body,
            fontSize: 14,
            color: theme.colors.text + '88',
            marginTop: 2,
          }}>
            of {goal} kcal
          </Text>
        </View>
      </View>
    </View>
  );
};

// Stat Card Component
const StatCard = ({
  icon,
  label,
  value,
  color,
  theme,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  theme: any;
  subtitle?: string;
}) => (
  <View style={{
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  }}>
    <View style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: color + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    }}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
    </View>
    <Text style={{
      fontFamily: theme.fonts.heading,
      fontSize: 24,
      color: theme.colors.text,
      marginBottom: 2,
    }}>
      {value}
    </Text>
    <Text style={{
      fontFamily: theme.fonts.body,
      fontSize: 12,
      color: theme.colors.text + '77',
      textAlign: 'center',
    }}>
      {label}
    </Text>
    {subtitle && (
      <Text style={{
        fontFamily: theme.fonts.body,
        fontSize: 10,
        color: color,
        marginTop: 4,
      }}>
        {subtitle}
      </Text>
    )}
  </View>
);

// Quick Tip Component
const QuickTip = ({ theme }: { theme: any }) => {
  const tips = [
    { icon: 'lightbulb-outline', text: 'Tap the Record tab to log food or track activity' },
    { icon: 'target', text: 'Stay within your calorie goal for best results' },
    { icon: 'water', text: 'Remember to stay hydrated throughout the day' },
    { icon: 'walk', text: 'Regular activity helps maintain a healthy balance' },
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '10',
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <MaterialCommunityIcons name={randomTip.icon as any} size={18} color={theme.colors.primary} />
      </View>
      <Text style={{
        flex: 1,
        fontFamily: theme.fonts.body,
        fontSize: 13,
        color: theme.colors.text + 'CC',
        lineHeight: 18,
      }}>
        {randomTip.text}
      </Text>
    </View>
  );
};

export default function Record() {
  const { theme } = useTheme();
  const { entry, isLoading: contextLoading, refreshDailyLog, error } = useDailyLog();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Handle errors from context
  useEffect(() => {
    if (error === "Missing user metrics for calorie goal calculation.") {
      Alert.alert(
        "Missing Information",
        "Please update your metrics to calculate calorie goals.",
        [
          {
            text: "Update Metrics",
            onPress: () => router.push("/screens/analysis_input/prediction_input")
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else if (error) {
      // Don't alert generic errors on every render, maybe just log or show toast
      // But for now, let's keep silence or minimal alert, logic was Alert.alert("Error", errorMessage)
      // We should be careful not to loop alerts.
      // Assuming context clears error on refresh or we handle it once.
      // For now, let's just log it to avoiding spamming user if it persists.
      console.log("DailyLog Error:", error);
    }
  }, [error, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDailyLog();
    setRefreshing(false);
  }, [refreshDailyLog]);

  if (contextLoading && !entry) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16, fontFamily: theme.fonts.body }}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'under': return 'On Track';
      case 'over': return 'Over Goal';
      case 'on_target': return 'On Target';
      default: return status.replace('_', ' ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under': return '#22c55e';
      case 'over': return '#ef4444';
      case 'on_target': return theme.colors.primary;
      default: return theme.colors.text;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 24,
          paddingBottom: 8,
          marginTop: 20,
        }}>
          <Text style={{
            fontFamily: theme.fonts.heading,
            fontSize: 28,
            color: theme.colors.text,
          }}>
            Today's Progress
          </Text>
          <Text style={{
            fontFamily: theme.fonts.body,
            fontSize: 14,
            color: theme.colors.text + '77',
            marginTop: 4,
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {entry && (
          <>
            {/* Main Progress Card */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 28,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}>
              {/* Status Badge */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  backgroundColor: getStatusColor(entry.status) + '15',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <MaterialCommunityIcons
                    name={entry.status === 'under' ? 'check-circle' :
                      entry.status === 'over' ? 'alert-circle' : 'star-circle'}
                    size={18}
                    color={getStatusColor(entry.status)}
                  />
                  <Text style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: 14,
                    color: getStatusColor(entry.status),
                    marginLeft: 6,
                  }}>
                    {getStatusText(entry.status)}
                  </Text>
                </View>
              </View>

              {/* Circular Progress */}
              <CircularProgress
                consumed={entry.consumed_kcal}
                goal={entry.goal_kcal}
                status={entry.status}
                theme={theme}
              />

              {/* Net Calories Info */}
              <View style={{
                alignItems: 'center',
                marginTop: 20,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: theme.colors.background,
              }}>
                <Text style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 13,
                  color: theme.colors.text + '77',
                }}>
                  Net Calories
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 28,
                  color: entry.net_kcal >= 0 ? getStatusColor(entry.status) : '#ef4444',
                  marginTop: 4,
                }}>
                  {entry.net_kcal} kcal
                </Text>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 14,
              marginTop: 16,
            }}>
              <StatCard
                icon="silverware-fork-knife"
                label="Consumed"
                value={entry.consumed_kcal}
                color="#f97316"
                theme={theme}
              />
              <StatCard
                icon="fire"
                label="Burned"
                value={entry.burned_kcal}
                color="#22c55e"
                theme={theme}
              />
              <StatCard
                icon="flag-checkered"
                label="Remaining"
                value={Math.max(0, entry.goal_kcal - entry.net_kcal)}
                color={theme.colors.primary}
                theme={theme}
              />
            </View>

            {/* Progress Bar Section */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 20,
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: 14,
                  color: theme.colors.text,
                }}>
                  Daily Goal Progress
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 14,
                  color: getStatusColor(entry.status),
                }}>
                  {Math.min(100, Math.round((entry.consumed_kcal / entry.goal_kcal) * 100))}%
                </Text>
              </View>

              <View style={{
                height: 12,
                backgroundColor: theme.colors.background,
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <View
                  style={{
                    width: `${Math.min(100, Math.round((entry.consumed_kcal / entry.goal_kcal) * 100))}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(entry.status),
                    borderRadius: 6,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 11,
                  color: theme.colors.text + '66',
                }}>
                  0 kcal
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 11,
                  color: theme.colors.text + '66',
                }}>
                  {entry.goal_kcal} kcal
                </Text>
              </View>
            </View>

            {/* Health Checkup Summary */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 16,
                  color: theme.colors.text,
                }}>
                  Health Checkup
                </Text>
                <View style={{
                  backgroundColor: theme.colors.primary + '15',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 11,
                    color: theme.colors.primary,
                  }}>
                    Tap + to log
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {/* Sleep Mini Card */}
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 16,
                  padding: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MaterialCommunityIcons name="sleep" size={16} color="#8b5cf6" />
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + '77', marginLeft: 6 }}>Sleep</Text>
                  </View>
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text }}>-- hrs</Text>
                </View>
                {/* Water Mini Card */}
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 16,
                  padding: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MaterialCommunityIcons name="water" size={16} color="#0ea5e9" />
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + '77', marginLeft: 6 }}>Water</Text>
                  </View>
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text }}>-- ml</Text>
                </View>
              </View>
            </View>

            {/* Quick Tip */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <QuickTip theme={theme} />
            </View>
          </>
        )}

        {!entry && (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingTop: 80,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <MaterialCommunityIcons name="chart-arc" size={40} color={theme.colors.primary} />
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 22,
                color: theme.colors.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              No data yet
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body,
                color: theme.colors.text + "99",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Start logging your meals and activities to see your daily progress here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

