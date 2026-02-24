import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import {
    updateProfileVisibility,
    updateBio,
    getPublicProfile,
} from "../../api/profileApi";

type VisibilityOption = "public" | "mutuals" | "hidden";

const visibilityOptions: {
    key: VisibilityOption;
    label: string;
    description: string;
    icon: string;
    color: string;
}[] = [
    {
        key: "public",
        label: "Public",
        description: "Anyone can see your profile and posts",
        icon: "earth",
        color: "#10b981",
    },
    {
        key: "mutuals",
        label: "Mutuals Only",
        description: "Only users you both follow can see your profile",
        icon: "people",
        color: "#3b82f6",
    },
    {
        key: "hidden",
        label: "Hidden",
        description: "No one can see your profile or posts",
        icon: "eye-off",
        color: "#ef4444",
    },
];

export default function ProfileVisibilityScreen() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const userId = user?._id || user?.id;

    const [visibility, setVisibility] = useState<VisibilityOption>("public");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCurrentSettings();
    }, []);

    const loadCurrentSettings = async () => {
        try {
            if (userId) {
                const profile = await getPublicProfile(userId);
                // Infer visibility from response - if profile is the user's own, we can set it
                setBio(profile.bio || "");
            }
        } catch (error) {
            console.error("Error loading profile settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: VisibilityOption) => {
        setSaving(true);
        try {
            await updateProfileVisibility(newVisibility);
            setVisibility(newVisibility);
            Alert.alert("Success", "Profile visibility updated");
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to update visibility");
        } finally {
            setSaving(false);
        }
    };

    const handleBioSave = async () => {
        setSaving(true);
        try {
            await updateBio(bio);
            Alert.alert("Success", "Bio updated");
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to update bio");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingTop: 8,
                        paddingBottom: 24,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
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
                            fontSize: 24,
                            color: theme.colors.text,
                        }}
                    >
                        Profile Privacy
                    </Text>
                </View>

                {/* Bio Section */}
                <Text
                    style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 13,
                        color: theme.colors.primary,
                        marginBottom: 12,
                        marginLeft: 4,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                    }}
                >
                    Bio
                </Text>
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 24,
                    }}
                >
                    <TextInput
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Write something about yourself..."
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        maxLength={150}
                        style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 15,
                            color: theme.colors.text,
                            minHeight: 80,
                            textAlignVertical: "top",
                        }}
                    />
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                            }}
                        >
                            {bio.length}/150
                        </Text>
                        <TouchableOpacity
                            onPress={handleBioSave}
                            disabled={saving}
                            style={{
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 20,
                                paddingVertical: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 13,
                                    color: "#fff",
                                }}
                            >
                                Save Bio
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Visibility Section */}
                <Text
                    style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 13,
                        color: theme.colors.primary,
                        marginBottom: 12,
                        marginLeft: 4,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                    }}
                >
                    Profile Visibility
                </Text>

                {visibilityOptions.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        onPress={() => handleVisibilityChange(option.key)}
                        disabled={saving}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.colors.surface,
                            padding: 16,
                            borderRadius: 16,
                            marginBottom: 10,
                            borderWidth: visibility === option.key ? 2 : 0,
                            borderColor: option.color,
                        }}
                    >
                        <View
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: option.color + "15",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 14,
                            }}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={22}
                                color={option.color}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 15,
                                    color: theme.colors.text,
                                }}
                            >
                                {option.label}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 12,
                                    color: theme.colors.textSecondary,
                                    marginTop: 2,
                                }}
                            >
                                {option.description}
                            </Text>
                        </View>

                        {visibility === option.key && (
                            <Ionicons
                                name="checkmark-circle"
                                size={24}
                                color={option.color}
                            />
                        )}
                    </TouchableOpacity>
                ))}

                {saving && (
                    <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                        style={{ marginTop: 16 }}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
