import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useHealthCheckup } from "../../context/HealthCheckupContext";
import HealthMetricCard from "../../components/HealthMetricCard";
import WaterIntakeProgress from "../../components/WaterIntakeProgress";
// Custom Slider component since @react-native-community/slider may not be installed
interface SliderProps {
    value: number;
    onValueChange: (value: number) => void;
    minimumValue: number;
    maximumValue: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    style?: any;
}

const CustomSlider: React.FC<SliderProps> = ({
    value,
    onValueChange,
    minimumValue,
    maximumValue,
    minimumTrackTintColor = '#3b82f6',
    maximumTrackTintColor = '#e5e7eb',
    thumbTintColor = '#3b82f6',
    style
}) => {
    const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

    return (
        <View style={[{ height: 40, justifyContent: 'center' }, style]}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: maximumTrackTintColor, position: 'relative' }}>
                <View style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: minimumTrackTintColor,
                    borderRadius: 4,
                }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <TouchableOpacity
                        key={num}
                        onPress={() => onValueChange(num)}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: value >= num ? minimumTrackTintColor : maximumTrackTintColor,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{
                            fontFamily: 'Inter',
                            fontSize: 11,
                            color: value >= num ? '#fff' : '#666'
                        }}>
                            {num}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Stress source icons and labels
const STRESS_SOURCES = [
    { id: "work", label: "Work", icon: "briefcase" },
    { id: "personal", label: "Personal", icon: "account-heart" },
    { id: "health", label: "Health", icon: "heart-pulse" },
    { id: "financial", label: "Financial", icon: "cash" },
    { id: "other", label: "Other", icon: "dots-horizontal" },
];

// Sleep quality options
const SLEEP_QUALITIES = [
    { id: "poor", label: "Poor", color: "#ef4444" },
    { id: "fair", label: "Fair", color: "#f97316" },
    { id: "good", label: "Good", color: "#22c55e" },
    { id: "excellent", label: "Excellent", color: "#3b82f6" },
];

export default function HealthCheckup() {
    const { theme } = useTheme();
    const router = useRouter();
    const {
        entry,
        isLoading,
        completionPercentage,
        isComplete,
        refreshCheckup,
        addWater,
        logSleep,
        logStress,
        logWeight,
        streakInfo,
        refreshStats,
    } = useHealthCheckup();

    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [sleepModalVisible, setSleepModalVisible] = useState(false);
    const [stressModalVisible, setStressModalVisible] = useState(false);
    const [weightModalVisible, setWeightModalVisible] = useState(false);
    const [waterModalVisible, setWaterModalVisible] = useState(false);

    // Form states
    const [sleepHours, setSleepHours] = useState("");
    const [sleepQuality, setSleepQuality] = useState<string>("");
    const [stressLevel, setStressLevel] = useState(5);
    const [stressSource, setStressSource] = useState<string>("");
    const [stressNotes, setStressNotes] = useState("");
    const [weightValue, setWeightValue] = useState("");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
    const [customWater, setCustomWater] = useState("");

    useEffect(() => {
        refreshCheckup();
        refreshStats();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshCheckup(), refreshStats()]);
        setRefreshing(false);
    }, [refreshCheckup, refreshStats]);

    // Handle quick water add
    const handleWaterAdd = async (amount: number) => {
        if (amount === -1) {
            // Open custom input modal
            setWaterModalVisible(true);
            return;
        }
        const success = await addWater(amount);
        if (!success) {
            Alert.alert("Error", "Failed to add water intake");
        }
    };

    // Handle custom water add
    const handleCustomWaterAdd = async () => {
        const amount = parseInt(customWater);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid amount");
            return;
        }
        const success = await addWater(amount);
        if (success) {
            setCustomWater("");
            setWaterModalVisible(false);
        }
    };

    // Handle sleep log
    const handleSleepSubmit = async () => {
        const hours = parseFloat(sleepHours);
        if (isNaN(hours) || hours < 0 || hours > 24) {
            Alert.alert("Invalid Input", "Please enter valid sleep hours (0-24)");
            return;
        }
        const success = await logSleep(hours, sleepQuality as any || undefined);
        if (success) {
            setSleepHours("");
            setSleepQuality("");
            setSleepModalVisible(false);
        }
    };

    // Handle stress log
    const handleStressSubmit = async () => {
        const success = await logStress(stressLevel, stressSource || undefined, stressNotes || undefined);
        if (success) {
            setStressLevel(5);
            setStressSource("");
            setStressNotes("");
            setStressModalVisible(false);
        }
    };

    // Handle weight log
    const handleWeightSubmit = async () => {
        const value = parseFloat(weightValue);
        if (isNaN(value) || value <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid weight");
            return;
        }
        const success = await logWeight(value, weightUnit);
        if (success) {
            setWeightValue("");
            setWeightModalVisible(false);
        }
    };

    // Get stress level color
    const getStressColor = (level: number) => {
        if (level <= 3) return "#22c55e"; // Low - Green
        if (level <= 6) return "#f97316"; // Medium - Orange
        return "#ef4444"; // High - Red
    };

    // Get stress emoji
    const getStressEmoji = (level: number) => {
        if (level <= 2) return "😊";
        if (level <= 4) return "🙂";
        if (level <= 6) return "😐";
        if (level <= 8) return "😟";
        return "😰";
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: theme.colors.surface,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, alignItems: "center" }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>
                                Daily Checkup
                            </Text>
                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + "77" }}>
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                </View>

                {/* Streak & Progress Banner */}
                <View
                    style={{
                        marginHorizontal: 20,
                        marginTop: 8,
                        backgroundColor: isComplete ? "#22c55e15" : theme.colors.primary + "15",
                        borderRadius: 20,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: isComplete ? "#22c55e25" : theme.colors.primary + "25",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 14,
                        }}
                    >
                        <MaterialCommunityIcons
                            name={isComplete ? "check-circle" : "fire"}
                            size={28}
                            color={isComplete ? "#22c55e" : theme.colors.primary}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text }}>
                            {isComplete ? "All Done for Today! 🎉" : `${Math.round(completionPercentage)}% Complete`}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text + "77" }}>
                            {streakInfo?.currentStreak ? `🔥 ${streakInfo.currentStreak} day streak` : "Start your streak today!"}
                        </Text>
                    </View>
                    {!isComplete && (
                        <View
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                borderWidth: 4,
                                borderColor: theme.colors.primary,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 14, color: theme.colors.primary }}>
                                {Math.round(completionPercentage)}%
                            </Text>
                        </View>
                    )}
                </View>

                {/* Water Intake Section */}
                <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                    <WaterIntakeProgress
                        current={entry?.water?.amount || 0}
                        goal={entry?.water?.goal || 2000}
                        unit={(entry?.water?.unit as "ml" | "oz") || "ml"}
                        onQuickAdd={handleWaterAdd}
                        theme={theme}
                    />
                </View>

                {/* Other Metrics Grid */}
                <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text, marginBottom: 12 }}>
                        Health Metrics
                    </Text>

                    {/* Sleep Card */}
                    <HealthMetricCard
                        icon="sleep"
                        iconColor="#8b5cf6"
                        label="Sleep"
                        value={entry?.sleep?.hours?.toFixed(1) || "--"}
                        unit="hours"
                        subtitle={entry?.sleep?.quality ? `Quality: ${entry.sleep.quality}` : "Tap to log"}
                        isCompleted={entry?.completedMetrics?.sleep || false}
                        onPress={() => setSleepModalVisible(true)}
                        theme={theme}
                    />

                    {/* Stress Card */}
                    <View style={{ marginTop: 12 }}>
                        <HealthMetricCard
                            icon="head-snowflake"
                            iconColor={getStressColor(entry?.stress?.level || 5)}
                            label="Stress Level"
                            value={entry?.stress?.level ? `${entry.stress.level}/10 ${getStressEmoji(entry.stress.level)}` : "--"}
                            subtitle={entry?.stress?.source ? `Source: ${entry.stress.source}` : "Tap to log"}
                            isCompleted={entry?.completedMetrics?.stress || false}
                            onPress={() => setStressModalVisible(true)}
                            theme={theme}
                        />
                    </View>

                    {/* Weight Card */}
                    <View style={{ marginTop: 12 }}>
                        <HealthMetricCard
                            icon="scale-bathroom"
                            iconColor="#f97316"
                            label="Weight"
                            value={entry?.weight?.value?.toFixed(1) || "--"}
                            unit="kg"
                            subtitle="Tap to log"
                            isCompleted={entry?.completedMetrics?.weight || false}
                            onPress={() => setWeightModalVisible(true)}
                            theme={theme}
                        />
                    </View>
                </View>

                {/* Complete Daily Checkup Button */}
                {!isComplete && completionPercentage > 0 && (
                    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                // Navigate to the first uncompleted metric
                                if (!entry?.completedMetrics?.sleep) setSleepModalVisible(true);
                                else if (!entry?.completedMetrics?.stress) setStressModalVisible(true);
                                else if (!entry?.completedMetrics?.weight) setWeightModalVisible(true);
                            }}
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                            }}
                        >
                            <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#fff" />
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: "#fff", marginLeft: 8 }}>
                                Complete Daily Checkup
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Sleep Modal */}
            <Modal visible={sleepModalVisible} transparent animationType="slide" onRequestClose={() => setSleepModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" }}>
                        <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>Log Sleep</Text>
                                <TouchableOpacity onPress={() => setSleepModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text + "77"} />
                                </TouchableOpacity>
                            </View>

                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "77", marginBottom: 8 }}>
                                Hours of Sleep
                            </Text>
                            <TextInput
                                value={sleepHours}
                                onChangeText={setSleepHours}
                                placeholder="e.g., 7.5"
                                placeholderTextColor={theme.colors.text + "55"}
                                keyboardType="decimal-pad"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 18,
                                    fontFamily: theme.fonts.body,
                                    color: theme.colors.text,
                                    marginBottom: 16,
                                }}
                            />

                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "77", marginBottom: 8 }}>
                                Sleep Quality
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
                                {SLEEP_QUALITIES.map((q) => (
                                    <TouchableOpacity
                                        key={q.id}
                                        onPress={() => setSleepQuality(q.id)}
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 20,
                                            backgroundColor: sleepQuality === q.id ? q.color + "20" : theme.colors.background,
                                            borderWidth: sleepQuality === q.id ? 2 : 0,
                                            borderColor: q.color,
                                            marginRight: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: sleepQuality === q.id ? q.color : theme.colors.text }}>
                                            {q.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={handleSleepSubmit}
                                style={{
                                    backgroundColor: "#8b5cf6",
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: "#fff" }}>Save Sleep Log</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Stress Modal */}
            <Modal visible={stressModalVisible} transparent animationType="slide" onRequestClose={() => setStressModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" }}>
                        <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>Log Stress Level</Text>
                                <TouchableOpacity onPress={() => setStressModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text + "77"} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ alignItems: "center", marginBottom: 16 }}>
                                <Text style={{ fontSize: 48 }}>{getStressEmoji(stressLevel)}</Text>
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 32, color: getStressColor(stressLevel) }}>
                                    {stressLevel}/10
                                </Text>
                            </View>

                            <CustomSlider
                                value={stressLevel}
                                onValueChange={(val: number) => setStressLevel(Math.round(val))}
                                minimumValue={1}
                                maximumValue={10}
                                step={1}
                                minimumTrackTintColor={getStressColor(stressLevel)}
                                maximumTrackTintColor={theme.colors.text + "22"}
                                thumbTintColor={getStressColor(stressLevel)}
                                style={{ marginBottom: 20 }}
                            />

                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "77", marginBottom: 8 }}>
                                Stress Source
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
                                {STRESS_SOURCES.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        onPress={() => setStressSource(s.id)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingHorizontal: 14,
                                            paddingVertical: 10,
                                            borderRadius: 20,
                                            backgroundColor: stressSource === s.id ? getStressColor(stressLevel) + "20" : theme.colors.background,
                                            borderWidth: stressSource === s.id ? 2 : 0,
                                            borderColor: getStressColor(stressLevel),
                                            marginRight: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <MaterialCommunityIcons name={s.icon as any} size={16} color={stressSource === s.id ? getStressColor(stressLevel) : theme.colors.text + "77"} />
                                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 13, color: stressSource === s.id ? getStressColor(stressLevel) : theme.colors.text, marginLeft: 6 }}>
                                            {s.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                value={stressNotes}
                                onChangeText={setStressNotes}
                                placeholder="Add a note (optional)"
                                placeholderTextColor={theme.colors.text + "55"}
                                multiline
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    fontFamily: theme.fonts.body,
                                    color: theme.colors.text,
                                    marginBottom: 20,
                                    minHeight: 60,
                                    textAlignVertical: "top",
                                }}
                            />

                            <TouchableOpacity
                                onPress={handleStressSubmit}
                                style={{
                                    backgroundColor: getStressColor(stressLevel),
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: "#fff" }}>Save Stress Log</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Weight Modal */}
            <Modal
                visible={weightModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setWeightModalVisible(false)}
                statusBarTranslucent
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "padding"}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setWeightModalVisible(false)}
                        style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" }}
                    >
                        <View
                            style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>Log Weight</Text>
                                <TouchableOpacity onPress={() => setWeightModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text + "77"} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: "row", marginBottom: 16 }}>
                                <TouchableOpacity
                                    onPress={() => setWeightUnit("kg")}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: weightUnit === "kg" ? theme.colors.primary + "20" : theme.colors.background,
                                        borderWidth: weightUnit === "kg" ? 2 : 1,
                                        borderColor: weightUnit === "kg" ? theme.colors.primary : theme.colors.text + "22",
                                        alignItems: "center",
                                        marginRight: 8,
                                    }}
                                >
                                    <Text style={{ fontFamily: theme.fonts.bodyBold, color: weightUnit === "kg" ? theme.colors.primary : theme.colors.text }}>
                                        Kilograms (kg)
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setWeightUnit("lbs")}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: weightUnit === "lbs" ? theme.colors.primary + "20" : theme.colors.background,
                                        borderWidth: weightUnit === "lbs" ? 2 : 1,
                                        borderColor: weightUnit === "lbs" ? theme.colors.primary : theme.colors.text + "22",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ fontFamily: theme.fonts.bodyBold, color: weightUnit === "lbs" ? theme.colors.primary : theme.colors.text }}>
                                        Pounds (lbs)
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                value={weightValue}
                                onChangeText={setWeightValue}
                                placeholder={weightUnit === "kg" ? "e.g., 70.5" : "e.g., 155"}
                                placeholderTextColor={theme.colors.text + "55"}
                                keyboardType="decimal-pad"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 24,
                                    fontFamily: theme.fonts.heading,
                                    color: theme.colors.text,
                                    marginBottom: 20,
                                    textAlign: "center",
                                }}
                            />

                            <TouchableOpacity
                                onPress={handleWeightSubmit}
                                style={{
                                    backgroundColor: "#f97316",
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: "#fff" }}>Save Weight</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Water Modal */}
            <Modal visible={waterModalVisible} transparent animationType="slide" onRequestClose={() => setWaterModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" }}>
                        <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>Add Water</Text>
                                <TouchableOpacity onPress={() => setWaterModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text + "77"} />
                                </TouchableOpacity>
                            </View>

                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "77", marginBottom: 8 }}>
                                Amount (ml)
                            </Text>
                            <TextInput
                                value={customWater}
                                onChangeText={setCustomWater}
                                placeholder="e.g., 350"
                                placeholderTextColor={theme.colors.text + "55"}
                                keyboardType="number-pad"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    fontSize: 24,
                                    fontFamily: theme.fonts.heading,
                                    color: theme.colors.text,
                                    marginBottom: 20,
                                    textAlign: "center",
                                }}
                            />

                            <TouchableOpacity
                                onPress={handleCustomWaterAdd}
                                style={{
                                    backgroundColor: "#0ea5e9",
                                    borderRadius: 12,
                                    paddingVertical: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: "#fff" }}>Add Water</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
