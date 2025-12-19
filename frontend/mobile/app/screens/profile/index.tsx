import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { getUserProfile, updateProfilePicture, UserProfile } from "../../api/userApi";
import { tokenStorage } from "../../../utils/tokenStorage";

// Profile Section Component
const ProfileSection = ({
  title,
  icon,
  iconColor,
  children,
  theme,
}: {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
  theme: any;
}) => (
  <View
    style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconColor + "15",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 16,
          color: theme.colors.text,
        }}
      >
        {title}
      </Text>
    </View>
    {children}
  </View>
);

// Profile Info Row Component
const InfoRow = ({
  label,
  value,
  theme,
}: {
  label: string;
  value: string | number | null | undefined;
  theme: any;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background,
    }}
  >
    <Text
      style={{
        fontFamily: theme.fonts.body,
        fontSize: 14,
        color: theme.colors.text + "88",
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontFamily: theme.fonts.bodyBold,
        fontSize: 14,
        color: value ? theme.colors.text : theme.colors.text + "44",
      }}
    >
      {value || "Not set"}
    </Text>
  </View>
);

// Tag Component for arrays
const Tag = ({ text, color, theme }: { text: string; color: string; theme: any }) => (
  <View
    style={{
      backgroundColor: color + "15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <Text
      style={{
        fontFamily: theme.fonts.body,
        fontSize: 12,
        color: color,
      }}
    >
      {text}
    </Text>
  </View>
);

// Stat Card Component
const StatCard = ({
  icon,
  label,
  value,
  unit,
  color,
  theme,
}: {
  icon: string;
  label: string;
  value: string | number | null;
  unit?: string;
  color: string;
  theme: any;
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 4,
      alignItems: "center",
    }}
  >
    <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    <Text
      style={{
        fontFamily: theme.fonts.heading,
        fontSize: 20,
        color: theme.colors.text,
        marginTop: 8,
      }}
    >
      {value ?? "--"}
      {unit && (
        <Text style={{ fontSize: 12, color: theme.colors.text + "77" }}> {unit}</Text>
      )}
    </Text>
    <Text
      style={{
        fontFamily: theme.fonts.body,
        fontSize: 11,
        color: theme.colors.text + "77",
        marginTop: 4,
      }}
    >
      {label}
    </Text>
  </View>
);

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, setUser } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await getUserProfile();
      setProfile(response.profile);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again.");
        router.replace("/");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        fetchProfile();
      }
    }, [loading])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleChangeProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await updateProfilePicture(base64Image);
        
        // Update local profile and user context
        setProfile((prev) =>
          prev ? { ...prev, profilePicture: response.profilePicture } : null
        );
        
        // Update user context
        if (user) {
          const updatedUser = { ...user, profilePicture: response.profilePicture };
          setUser(updatedUser);
          await tokenStorage.saveUser(updatedUser);
        }
        
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  const formatActivityLevel = (level: string | null) => {
    if (!level) return null;
    return level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
    if (bmi < 25) return { label: "Normal", color: "#22c55e" };
    if (bmi < 30) return { label: "Overweight", color: "#f97316" };
    return { label: "Obese", color: "#ef4444" };
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.text,
            marginTop: 16,
          }}
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  const bmiCategory = getBMICategory(profile?.physicalMetrics.bmi || null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 28,
              color: theme.colors.text,
            }}
          >
            Profile
          </Text>
        </View>

        {/* Profile Header Card */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* Profile Picture */}
          <TouchableOpacity onPress={handleChangeProfilePicture} activeOpacity={0.8}>
            <View style={{ position: "relative" }}>
              {profile?.profilePicture ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 4,
                    borderColor: theme.colors.primary + "30",
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: theme.colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: theme.colors.primary + "30",
                  }}
                >
                  <Ionicons name="person" size={48} color={theme.colors.primary} />
                </View>
              )}
              {uploadingImage ? (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: theme.colors.background,
                  }}
                >
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: theme.colors.surface,
                  }}
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Name & Email */}
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 24,
              color: theme.colors.text,
              marginTop: 16,
            }}
          >
            {profile?.username || "User"}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 14,
              color: theme.colors.text + "77",
              marginTop: 4,
            }}
          >
            {profile?.email}
          </Text>

          {/* Profile Completion */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
              backgroundColor: theme.colors.background,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <View
              style={{
                width: 120,
                height: 6,
                backgroundColor: theme.colors.text + "15",
                borderRadius: 3,
                marginRight: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${profile?.profileCompletion || 0}%`,
                  height: "100%",
                  backgroundColor:
                    (profile?.profileCompletion || 0) >= 80
                      ? "#22c55e"
                      : (profile?.profileCompletion || 0) >= 50
                      ? "#f97316"
                      : "#ef4444",
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: 13,
                color: theme.colors.text,
              }}
            >
              {profile?.profileCompletion || 0}% complete
            </Text>
          </View>

          {/* Member Since */}
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 12,
              color: theme.colors.text + "55",
              marginTop: 12,
            }}
          >
            Member for {profile?.daysSinceRegistration || 0} days
          </Text>
        </View>

        {/* Physical Stats */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <ProfileSection
            title="Physical Stats"
            icon="human"
            iconColor="#3b82f6"
            theme={theme}
          >
            <View style={{ flexDirection: "row", marginHorizontal: -4, marginBottom: 16 }}>
              <StatCard
                icon="human-male-height"
                label="Height"
                value={profile?.physicalMetrics.height ?? null}
                unit="cm"
                color="#3b82f6"
                theme={theme}
              />
              <StatCard
                icon="scale-bathroom"
                label="Weight"
                value={profile?.physicalMetrics.weight ?? null}
                unit="kg"
                color="#8b5cf6"
                theme={theme}
              />
              <StatCard
                icon="target"
                label="Target"
                value={profile?.physicalMetrics.targetWeight ?? null}
                unit="kg"
                color="#22c55e"
                theme={theme}
              />
            </View>

            {/* BMI Display */}
            {profile?.physicalMetrics.bmi && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: theme.colors.background,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="speedometer"
                    size={20}
                    color={bmiCategory?.color || theme.colors.text}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 14,
                      color: theme.colors.text,
                      marginLeft: 10,
                    }}
                  >
                    BMI
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 18,
                      color: theme.colors.text,
                      marginRight: 8,
                    }}
                  >
                    {profile.physicalMetrics.bmi}
                  </Text>
                  {bmiCategory && (
                    <View
                      style={{
                        backgroundColor: bmiCategory.color + "15",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.bodyBold,
                          fontSize: 11,
                          color: bmiCategory.color,
                        }}
                      >
                        {bmiCategory.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ProfileSection>

          {/* Personal Info */}
          <ProfileSection
            title="Personal Information"
            icon="account-details"
            iconColor="#8b5cf6"
            theme={theme}
          >
            <InfoRow
              label="Gender"
              value={
                profile?.gender
                  ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                  : null
              }
              theme={theme}
            />
            <InfoRow label="Age" value={profile?.age ? `${profile.age} years` : null} theme={theme} />
            <InfoRow
              label="Birthday"
              value={formatDate(profile?.birthdate || null)}
              theme={theme}
            />
            <InfoRow label="Blood Type" value={profile?.healthProfile.bloodType} theme={theme} />
          </ProfileSection>

          {/* Lifestyle */}
          <ProfileSection
            title="Lifestyle"
            icon="run"
            iconColor="#22c55e"
            theme={theme}
          >
            <InfoRow
              label="Activity Level"
              value={formatActivityLevel(profile?.lifestyle.activityLevel || null)}
              theme={theme}
            />
            <InfoRow
              label="Sleep Hours"
              value={profile?.lifestyle.sleepHours ? `${profile.lifestyle.sleepHours} hrs/night` : null}
              theme={theme}
            />
            <InfoRow
              label="Stress Level"
              value={
                profile?.riskFactors.stressLevel
                  ? profile.riskFactors.stressLevel.charAt(0).toUpperCase() +
                    profile.riskFactors.stressLevel.slice(1)
                  : null
              }
              theme={theme}
            />
            <InfoRow
              label="Water Intake"
              value={
                profile?.dietaryProfile.dailyWaterIntake
                  ? `${profile.dietaryProfile.dailyWaterIntake} L/day`
                  : null
              }
              theme={theme}
            />
          </ProfileSection>

          {/* Dietary Preferences */}
          <ProfileSection
            title="Dietary Profile"
            icon="food-apple"
            iconColor="#f97316"
            theme={theme}
          >
            {(profile?.dietaryProfile.preferences?.length || 0) > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + "77",
                    marginBottom: 8,
                  }}
                >
                  Preferences
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {profile?.dietaryProfile.preferences.map((pref, idx) => (
                    <Tag key={idx} text={pref} color="#22c55e" theme={theme} />
                  ))}
                </View>
              </View>
            )}

            {(profile?.dietaryProfile.allergies?.length || 0) > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + "77",
                    marginBottom: 8,
                  }}
                >
                  Allergies
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {profile?.dietaryProfile.allergies.map((allergy, idx) => (
                    <Tag key={idx} text={allergy} color="#ef4444" theme={theme} />
                  ))}
                </View>
              </View>
            )}

            <InfoRow
              label="Meal Frequency"
              value={
                profile?.dietaryProfile.mealFrequency
                  ? `${profile.dietaryProfile.mealFrequency} meals/day`
                  : null
              }
              theme={theme}
            />
          </ProfileSection>

          {/* Health Profile */}
          <ProfileSection
            title="Health Profile"
            icon="heart-pulse"
            iconColor="#ef4444"
            theme={theme}
          >
            {(profile?.healthProfile.currentConditions?.length || 0) > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + "77",
                    marginBottom: 8,
                  }}
                >
                  Current Conditions
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {profile?.healthProfile.currentConditions.map((cond, idx) => (
                    <Tag key={idx} text={cond} color="#ef4444" theme={theme} />
                  ))}
                </View>
              </View>
            )}

            {(profile?.healthProfile.medications?.length || 0) > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + "77",
                    marginBottom: 8,
                  }}
                >
                  Medications
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {profile?.healthProfile.medications.map((med, idx) => (
                    <Tag key={idx} text={med} color="#3b82f6" theme={theme} />
                  ))}
                </View>
              </View>
            )}

            {(profile?.healthProfile.familyHistory?.length || 0) > 0 && (
              <View>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + "77",
                    marginBottom: 8,
                  }}
                >
                  Family History
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {profile?.healthProfile.familyHistory.map((hist, idx) => (
                    <Tag key={idx} text={hist} color="#8b5cf6" theme={theme} />
                  ))}
                </View>
              </View>
            )}

            {(profile?.healthProfile.currentConditions?.length || 0) === 0 &&
              (profile?.healthProfile.medications?.length || 0) === 0 &&
              (profile?.healthProfile.familyHistory?.length || 0) === 0 && (
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 14,
                    color: theme.colors.text + "55",
                    textAlign: "center",
                    paddingVertical: 20,
                  }}
                >
                  No health information added yet
                </Text>
              )}
          </ProfileSection>

          {/* Last Prediction */}
          {profile?.lastPrediction && (
            <ProfileSection
              title="Latest Health Analysis"
              icon="chart-line"
              iconColor={theme.colors.primary}
              theme={theme}
            >
              <View
                style={{
                  backgroundColor: theme.colors.background,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                {profile.lastPrediction.disease?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 12,
                        color: theme.colors.text + "77",
                        marginBottom: 8,
                      }}
                    >
                      Risk Areas
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {profile.lastPrediction.disease.map((d, idx) => (
                        <Tag key={idx} text={d} color={theme.colors.primary} theme={theme} />
                      ))}
                    </View>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 12,
                      color: theme.colors.text + "77",
                    }}
                  >
                    Analyzed on {formatDate(profile.lastPrediction.predictedAt)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.colors.primary + "15",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: 11,
                        color: theme.colors.primary,
                      }}
                    >
                      {profile.lastPrediction.source}
                    </Text>
                  </View>
                </View>
              </View>
            </ProfileSection>
          )}

          {/* Environment */}
          <ProfileSection
            title="Environment"
            icon="earth"
            iconColor="#10b981"
            theme={theme}
          >
            <InfoRow
              label="Occupation Type"
              value={
                profile?.environmentalFactors.occupationType
                  ? profile.environmentalFactors.occupationType.charAt(0).toUpperCase() +
                    profile.environmentalFactors.occupationType.slice(1)
                  : null
              }
              theme={theme}
            />
            <InfoRow
              label="Pollution Exposure"
              value={
                profile?.environmentalFactors.pollutionExposure
                  ? profile.environmentalFactors.pollutionExposure.charAt(0).toUpperCase() +
                    profile.environmentalFactors.pollutionExposure.slice(1)
                  : null
              }
              theme={theme}
            />
          </ProfileSection>

          {/* Account Info */}
          <ProfileSection
            title="Account"
            icon="shield-account"
            iconColor="#6b7280"
            theme={theme}
          >
            <InfoRow
              label="Member Since"
              value={formatDate(profile?.registeredDate || null)}
              theme={theme}
            />
            <InfoRow
              label="Account Status"
              value={profile?.verified ? "Verified" : "Not Verified"}
              theme={theme}
            />
            <InfoRow label="Role" value={profile?.role?.toUpperCase()} theme={theme} />
          </ProfileSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
