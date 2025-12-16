
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { createOrUpdateDailyCalorieBalance, getTodayCalorieBalance } from "../api/userApi";
import { tokenStorage } from "../../utils/tokenStorage";
import { useFocusEffect } from "expo-router";

export default function Record() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<any>(null);

  // Initial fetch or create entry
  useEffect(() => {
    const fetchOrCreateEntry = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (!token) throw new Error("No authentication token found");
        const res = await createOrUpdateDailyCalorieBalance(token);
        setEntry(res.data.entry);
      } catch (err: any) {
        Alert.alert("Error", err?.response?.data?.message || err.message || "Failed to create daily calorie balance entry.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrCreateEntry();
  }, []);

  // Refresh calorie balance when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshCalorieBalance = async () => {
        try {
          const response = await getTodayCalorieBalance();
          if (response.entry) {
            setEntry(response.entry);
          }
        } catch (error) {
          console.error('[Record] Error refreshing calorie balance:', error);
        }
      };

      // Only refresh if not in initial loading state
      if (!loading) {
        refreshCalorieBalance();
      }
    }, [loading])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16 }}>Loading daily calorie balance...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 22,
          color: theme.colors.primary,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Ready to record?
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.body,
          color: theme.colors.text + "CC",
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        Tap the Record tab icon below to quickly log food or track an activity.
      </Text>
      {entry && (
        <View
          style={{
            marginTop: 32,
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.primary, marginBottom: 8 }}>
            Today's Calorie Balance
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 8 }}>
            Goal: <Text style={{ fontWeight: 'bold' }}>{entry.goal_kcal} kcal</Text>
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 8 }}>
            Consumed: <Text style={{ fontWeight: 'bold' }}>{entry.consumed_kcal} kcal</Text> | Burned: <Text style={{ fontWeight: 'bold' }}>{entry.burned_kcal} kcal</Text>
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 8 }}>
            Net: <Text style={{ fontWeight: 'bold' }}>{entry.net_kcal} kcal</Text> ({entry.status.replace('_', ' ')})
          </Text>
          {/* Progress bar */}
          <View style={{ height: 16, backgroundColor: theme.colors.input, borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
            <View
              style={{
                width: `${Math.min(100, Math.round((entry.net_kcal / entry.goal_kcal) * 100))}%`,
                height: '100%',
                backgroundColor:
                  entry.status === 'under'
                    ? theme.colors.text
                    : entry.status === 'on_target'
                    ? theme.colors.success
                    : theme.colors.error,
                borderRadius: 8,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
