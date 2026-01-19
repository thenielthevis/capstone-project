import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForegroundPermissions } from 'expo-location';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useMediaLibraryPermissions } from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

// Reusing SettingsItem from list.tsx for consistency
const SettingsItem = ({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    theme,
    status, // 'granted', 'denied', 'undetermined'
}: {
    icon: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    theme: any;
    status?: string | boolean;
}) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 16,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        }}
    >
        <View style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: iconColor + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
        }}>
            <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        </View>

        <View style={{ flex: 1 }}>
            <Text style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: 15,
                color: theme.colors.text,
            }}>
                {title}
            </Text>
            {subtitle && (
                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 12,
                    color: theme.colors.text + '77',
                    marginTop: 2,
                }}>
                    {subtitle}
                </Text>
            )}
        </View>

        {/* Status Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: 13,
                color: status === 'granted' || status === true
                    ? theme.colors.success
                    : status === 'denied' || status === false
                        ? theme.colors.error
                        : theme.colors.text + '60',
                marginRight: 8,
            }}>
                {status === 'granted' || status === true ? 'Allowed' :
                    status === 'denied' || status === false ? 'Denied' : 'Ask'}
            </Text>
            <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text + '44'}
            />
        </View>
    </TouchableOpacity>
);

const SectionHeader = ({ title, theme }: { title: string; theme: any }) => (
    <Text style={{
        fontFamily: theme.fonts.heading,
        fontSize: 13,
        color: theme.colors.primary,
        marginBottom: 12,
        marginTop: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }}>
        {title}
    </Text>
);

export default function PermissionsScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    // Use hooks for permissions where available
    const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission, getMicPermission] = useMicrophonePermissions();
    const [locationPermission, requestLocationPermission, getLocationPermission] = useForegroundPermissions();
    const [photoPermission, requestPhotoPermission, getPhotoPermission] = useMediaLibraryPermissions();

    // Manual state for Notifications since no hook is available
    const [notificationPermission, setNotificationPermission] = useState<Notifications.NotificationPermissionsStatus | null>(null);

    const refreshNotificationPermission = useCallback(async () => {
        const status = await Notifications.getPermissionsAsync();
        setNotificationPermission(status);
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        const status = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status);
        return status;
    }, []);

    // Refresh permissions when screen comes into focus (e.g. back from settings)
    useFocusEffect(
        useCallback(() => {
            // Safely call get methods if they exist to refresh status
            if (getCameraPermission) getCameraPermission();
            if (getMicPermission) getMicPermission();
            if (getLocationPermission) getLocationPermission();
            if (getPhotoPermission) getPhotoPermission();
            refreshNotificationPermission();
        }, [
            getCameraPermission,
            getMicPermission,
            getLocationPermission,
            getPhotoPermission,
            refreshNotificationPermission
        ])
    );

    const handlePermissionPress = async (
        permission: any,
        requestFn: () => Promise<any>
    ) => {
        // If permission is already determined (granted or denied), open settings
        if (permission?.granted || (permission?.status === 'denied' && !permission?.canAskAgain)) {
            Linking.openSettings();
            return;
        }

        // Otherwise request permission
        try {
            await requestFn();
        } catch (error) {
            console.error("Error requesting permission:", error);
            Alert.alert("Error", "Failed to request permission");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: 8,
                    paddingBottom: 24,
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: theme.colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 28,
                        color: theme.colors.text,
                    }}>
                        Permissions
                    </Text>
                </View>

                <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 14,
                    color: theme.colors.text + '80',
                    marginBottom: 24,
                    lineHeight: 20,
                }}>
                    Manage which features Lifora can access. To revoke a permission, tap 'Allowed' to open system settings.
                </Text>

                {/* Essential Permissions */}
                <SectionHeader title="Essential" theme={theme} />

                <SettingsItem
                    icon="camera-outline"
                    iconColor="#3b82f6"
                    title="Camera"
                    subtitle="For taking photos and AR features"
                    status={cameraPermission?.status}
                    onPress={() => handlePermissionPress(cameraPermission, requestCameraPermission)}
                    theme={theme}
                />

                <SettingsItem
                    icon="microphone-outline"
                    iconColor="#f59e0b"
                    title="Microphone"
                    subtitle="For voice commands and video"
                    status={micPermission?.status}
                    onPress={() => handlePermissionPress(micPermission, requestMicPermission)}
                    theme={theme}
                />

                <SettingsItem
                    icon="image-outline"
                    iconColor="#ec4899"
                    title="Photo Library"
                    subtitle="To upload and save photos"
                    status={photoPermission?.status}
                    onPress={() => handlePermissionPress(photoPermission, requestPhotoPermission)}
                    theme={theme}
                />

                {/* Location & Services */}
                <SectionHeader title="Services" theme={theme} />

                <SettingsItem
                    icon="map-marker-outline"
                    iconColor="#10b981"
                    title="Location"
                    subtitle="For mapping and activity tracking"
                    status={locationPermission?.status}
                    onPress={() => handlePermissionPress(locationPermission, requestLocationPermission)}
                    theme={theme}
                />

                <SettingsItem
                    icon="bell-outline"
                    iconColor="#8b5cf6"
                    title="Notifications"
                    subtitle="Updates, reminders and messages"
                    status={notificationPermission?.status}
                    onPress={() => handlePermissionPress(notificationPermission, requestNotificationPermission)}
                    theme={theme}
                />

            </ScrollView>
        </SafeAreaView>
    );
}
