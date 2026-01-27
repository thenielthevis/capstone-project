import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, Modal, FlatList } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getReminderSettings, updateReminderSettings } from "../../api/healthCheckupApi";
import { scheduleHealthCheckupReminders, cancelAllHealthCheckupReminders } from "../../../utils/healthCheckupNotifications";

// Custom Time Picker Modal Component
const TimePickerModal = ({
    visible,
    onClose,
    onSelect,
    initialTime,
    theme,
    title
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (time: string) => void;
    initialTime: string;
    theme: any;
    title: string;
}) => {
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [isPM, setIsPM] = useState(false);

    useEffect(() => {
        if (initialTime) {
            const [h, m] = initialTime.split(":").map(Number);
            setIsPM(h >= 12);
            setSelectedHour(h % 12 || 12);
            setSelectedMinute(m);
        }
    }, [initialTime, visible]);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const handleConfirm = () => {
        let hour24 = selectedHour;
        if (isPM && selectedHour !== 12) hour24 = selectedHour + 12;
        if (!isPM && selectedHour === 12) hour24 = 0;
        const timeStr = `${hour24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
        onSelect(timeStr);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
            }}>
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 24,
                    padding: 24,
                    width: '85%',
                    maxWidth: 340,
                }}>
                    <Text style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 18,
                        color: theme.colors.text,
                        textAlign: 'center',
                        marginBottom: 20,
                    }}>
                        {title}
                    </Text>

                    {/* Time Selection */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        {/* Hours */}
                        <View style={{ height: 150, width: 60 }}>
                            <FlatList
                                data={hours}
                                keyExtractor={(item) => item.toString()}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={40}
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingVertical: 55 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => setSelectedHour(item)}
                                        style={{
                                            height: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{
                                            fontFamily: selectedHour === item ? theme.fonts.heading : theme.fonts.body,
                                            fontSize: selectedHour === item ? 24 : 18,
                                            color: selectedHour === item ? theme.colors.primary : theme.colors.text + '55',
                                        }}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <Text style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: 24,
                            color: theme.colors.text,
                            marginHorizontal: 8,
                        }}>:</Text>

                        {/* Minutes */}
                        <View style={{ height: 150, width: 60 }}>
                            <FlatList
                                data={minutes}
                                keyExtractor={(item) => item.toString()}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={40}
                                decelerationRate="fast"
                                contentContainerStyle={{ paddingVertical: 55 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => setSelectedMinute(item)}
                                        style={{
                                            height: 40,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{
                                            fontFamily: selectedMinute === item ? theme.fonts.heading : theme.fonts.body,
                                            fontSize: selectedMinute === item ? 24 : 18,
                                            color: selectedMinute === item ? theme.colors.primary : theme.colors.text + '55',
                                        }}>
                                            {item.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* AM/PM */}
                        <View style={{ marginLeft: 16 }}>
                            <TouchableOpacity
                                onPress={() => setIsPM(false)}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    backgroundColor: !isPM ? theme.colors.primary : 'transparent',
                                    borderRadius: 8,
                                    marginBottom: 4,
                                }}
                            >
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 14,
                                    color: !isPM ? '#fff' : theme.colors.text + '77',
                                }}>AM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsPM(true)}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    backgroundColor: isPM ? theme.colors.primary : 'transparent',
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 14,
                                    color: isPM ? '#fff' : theme.colors.text + '77',
                                }}>PM</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.background,
                                paddingVertical: 14,
                                borderRadius: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 15,
                                color: theme.colors.text,
                            }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.primary,
                                paddingVertical: 14,
                                borderRadius: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 15,
                                color: '#fff',
                            }}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function HealthCheckupSettingsScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [morningTime, setMorningTime] = useState("08:00");
    const [eveningTime, setEveningTime] = useState("19:00");

    const [showMorningPicker, setShowMorningPicker] = useState(false);
    const [showEveningPicker, setShowEveningPicker] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await getReminderSettings();
            if (response.success) {
                setEnabled(response.settings.enabled);
                setMorningTime(response.settings.morningTime);
                setEveningTime(response.settings.eveningTime);
            }
        } catch (error) {
            console.error("Error loading reminder settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeDisplay = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await updateReminderSettings({
                enabled,
                morningTime,
                eveningTime,
            });

            if (response.success) {
                if (enabled) {
                    await scheduleHealthCheckupReminders({
                        enabled,
                        morningTime,
                        eveningTime,
                    });
                } else {
                    await cancelAllHealthCheckupReminders();
                }

                Alert.alert("Success", "Reminder settings saved successfully!");
                router.back();
            }
        } catch (error) {
            console.error("Error saving reminder settings:", error);
            Alert.alert("Error", "Failed to save reminder settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>Loading...</Text>
            </SafeAreaView>
        );
    }

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
                        fontSize: 24,
                        color: theme.colors.text,
                    }}>
                        Checkup Reminders
                    </Text>
                </View>

                {/* Enable Toggle */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: theme.colors.primary + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}>
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 16,
                                color: theme.colors.text,
                            }}>
                                Daily Reminders
                            </Text>
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 13,
                                color: theme.colors.text + '77',
                            }}>
                                Get notified to log health data
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: theme.colors.text + '22', true: theme.colors.primary + '55' }}
                        thumbColor={enabled ? theme.colors.primary : '#f4f3f4'}
                    />
                </View>

                {/* Time Settings */}
                {enabled && (
                    <>
                        <Text style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: 13,
                            color: theme.colors.primary,
                            marginBottom: 12,
                            marginLeft: 4,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            Reminder Times
                        </Text>

                        {/* Morning Time */}
                        <TouchableOpacity
                            onPress={() => setShowMorningPicker(true)}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#fbbf24' + '20',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}>
                                <MaterialCommunityIcons name="weather-sunny" size={24} color="#fbbf24" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 15,
                                    color: theme.colors.text,
                                }}>
                                    Morning Reminder
                                </Text>
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 12,
                                    color: theme.colors.text + '77',
                                }}>
                                    Remind to log last night's sleep
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 10,
                            }}>
                                <Text style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 15,
                                    color: theme.colors.primary,
                                }}>
                                    {formatTimeDisplay(morningTime)}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Evening Time */}
                        <TouchableOpacity
                            onPress={() => setShowEveningPicker(true)}
                            activeOpacity={0.7}
                            style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#8b5cf6' + '20',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}>
                                <MaterialCommunityIcons name="weather-night" size={24} color="#8b5cf6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 15,
                                    color: theme.colors.text,
                                }}>
                                    Evening Reminder
                                </Text>
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 12,
                                    color: theme.colors.text + '77',
                                }}>
                                    Log water, stress & weight
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 10,
                            }}>
                                <Text style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 15,
                                    color: theme.colors.primary,
                                }}>
                                    {formatTimeDisplay(eveningTime)}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Info Card */}
                        <View style={{
                            backgroundColor: theme.colors.primary + '10',
                            borderRadius: 14,
                            padding: 14,
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginTop: 8,
                        }}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 13,
                                color: theme.colors.text + '99',
                                flex: 1,
                                lineHeight: 18,
                            }}>
                                Morning reminders prompt you to log sleep. Evening reminders are for water, stress, and weight tracking.
                            </Text>
                        </View>
                    </>
                )}

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginTop: 32,
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    <Text style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 16,
                        color: '#FFFFFF',
                    }}>
                        {saving ? "Saving..." : "Save Settings"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Time Picker Modals */}
            <TimePickerModal
                visible={showMorningPicker}
                onClose={() => setShowMorningPicker(false)}
                onSelect={setMorningTime}
                initialTime={morningTime}
                theme={theme}
                title="Morning Reminder Time"
            />
            <TimePickerModal
                visible={showEveningPicker}
                onClose={() => setShowEveningPicker(false)}
                onSelect={setEveningTime}
                initialTime={eveningTime}
                theme={theme}
                title="Evening Reminder Time"
            />
        </SafeAreaView>
    );
}
