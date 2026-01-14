import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";
import { usePrograms } from "../../context/ProgramContext";

export default function ProgramRecordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { programs, refreshPrograms } = usePrograms();
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fabOptionsTranslateY = useSharedValue(60); // Start hidden below FAB
  const fabOptionsOpacity = useSharedValue(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPrograms();
    setRefreshing(false);
  }, [refreshPrograms]);

  useEffect(() => {
    if (fabOpen) {
      fabOptionsTranslateY.value = withSpring(-20, { damping: 12 });
      fabOptionsOpacity.value = withTiming(1, { duration: 250 });
    } else {
      fabOptionsTranslateY.value = withTiming(60, { duration: 250 });
      fabOptionsOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [fabOpen]);

  const animatedOptionsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabOptionsTranslateY.value }],
    opacity: fabOptionsOpacity.value,
  }));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity onPress={() => router.push("/screens/programs/program-history")} className="flex-row items-center"
          style={{
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <MaterialCommunityIcons name="history" size={18} color={theme.colors.primary} />
          <Text
            className="ml-2"
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.primary,
              marginLeft: 4,
            }}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 120,
        }}
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
        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 28,
            color: theme.colors.primary,
            marginBottom: 8,
          }}
        >
          My Programs
        </Text>
        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99", marginBottom: 24 }}>
          Programs you've created or generated will appear here. Create one using the + button below to create more programs or record map-based activities immediately.
        </Text>
        {programs.length === 0 ? (
          <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.primary, marginBottom: 24 }}>
            You have no programs yet.
          </Text>
        ) : (
          programs.map((program) => (
            <View
              key={program._id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 18,
                padding: 18,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.colors.primary + "22",
              }}
            >
              <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary, fontSize: 18 }}>{program.name}</Text>
              <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + "99", marginBottom: 6 }}>{program.description}</Text>
              <TouchableOpacity
                style={{ alignSelf: "flex-end", marginTop: 4 }}
                onPress={() => router.push(`/screens/programs/program-overview?id=${program._id}`)}
              >
                <Text style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button - fixed position */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={{ position: "absolute", right: 24, bottom: 32, alignItems: "flex-end", width: 64 }}>
          {/* FAB Options - animated above FAB */}
          <Animated.View style={[{ position: "absolute", bottom: 60, right: 0, alignItems: "flex-end", width: 220 }, animatedOptionsStyle]} pointerEvents={fabOpen ? "auto" : "none"}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 24,
                paddingVertical: 10,
                paddingHorizontal: 18,
                marginBottom: 10,
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => {
                setFabOpen(false);
                router.push("/screens/programs/create-program");
              }}
            >
              <FontAwesome6 name="pencil" size={18} color="#e4a149ff" />
              <Text style={{ color: "#fff", fontFamily: theme.fonts.body, marginLeft: 8 }}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 24,
                paddingVertical: 10,
                paddingHorizontal: 18,
                marginBottom: 10,
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => {
                setFabOpen(false);
                router.push("/screens/programs/automated-program");
              }}
            >
              <MaterialCommunityIcons name="robot-happy-outline" size={22} color="#00B894" />
              <Text style={{ color: "#fff", fontFamily: theme.fonts.body, marginLeft: 8 }}>Automate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.secondary,
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 24,
                paddingVertical: 10,
                paddingHorizontal: 18,
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
              onPress={() => {
                setFabOpen(false);
                router.push("/screens/record/Activity");
              }}
            >
              <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color="#f1566aff" />
              <Text style={{ color: "#fff", fontFamily: theme.fonts.body, marginLeft: 8 }}>Map</Text>
            </TouchableOpacity>
          </Animated.View>
          {/* Main FAB */}
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={() => setFabOpen((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Ionicons name={fabOpen ? "close" : "add"} size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

