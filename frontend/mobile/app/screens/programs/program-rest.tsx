import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, Animated, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import LottieView from "lottie-react-native";
import { Image } from "react-native";

type ProgramRestProps = {
    initialDuration: number;
    onComplete: () => void;
    onSkip: () => void;
    onAddSeconds: (seconds: number) => void;
    nextExerciseName?: string;
    nextExerciseInfo?: string;
    nextExerciseImage?: string;
    nextExerciseIsLottie?: boolean;
};

const { width } = Dimensions.get("window");

export default function ProgramRest({
    initialDuration,
    onComplete,
    onSkip,
    onAddSeconds,
    nextExerciseName,
    nextExerciseInfo,
    nextExerciseImage,
    nextExerciseIsLottie,
}: ProgramRestProps) {
    const { theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [customTime, setCustomTime] = useState(initialDuration.toString());

    useEffect(() => {
        setTimeLeft(initialDuration);
    }, [initialDuration]);

    useEffect(() => {
        if (isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [onComplete, isPaused]);

    const handleAdd30s = () => {
        onAddSeconds(30);
        setTimeLeft((prev) => prev + 30);
    };

    const handleCustomTimeSave = () => {
        const newTime = parseInt(customTime);
        if (!isNaN(newTime) && newTime > 0) {
            setTimeLeft(newTime);
            // Adjust logic if needed (e.g. notify parent of totally new absolute time)
            // For now we just update local countdown.
        }
        setShowEditModal(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "space-between" }}>

                {/* Header */}
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>
                    Rest & Recover
                </Text>

                {/* Timer Circle */}
                <View style={{
                    width: width * 0.7,
                    height: width * 0.7,
                    borderRadius: width * 0.35,
                    borderWidth: 8,
                    borderColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surface
                }}>
                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 80, color: theme.colors.primary }}>
                        {formatTime(timeLeft)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setIsPaused(!isPaused)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
                    >
                        <Ionicons name={isPaused ? "play" : "pause"} size={24} color={theme.colors.text + '99'} />
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.text + '99', marginLeft: 4 }}>
                            {isPaused ? "Resume" : "Pause"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Controls */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity
                        onPress={() => setShowEditModal(true)}
                        style={{
                            backgroundColor: theme.colors.surface,
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: 'center'
                        }}
                    >
                        <MaterialCommunityIcons name="pencil" size={24} color={theme.colors.text} />
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text, marginTop: 4 }}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleAdd30s}
                        style={{
                            backgroundColor: theme.colors.surface,
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: 'center'
                        }}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color={theme.colors.text} />
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text, marginTop: 4 }}>+30s</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onSkip}
                        style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: 'center'
                        }}
                    >
                        <MaterialCommunityIcons name="skip-next" size={24} color="#FFFFFF" />
                        <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: "#FFFFFF", marginTop: 4 }}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Up Next Card */}
                {(nextExerciseName) && (
                    <View style={{
                        width: width * 0.9,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 24, // pushed up by timer
                    }}>
                        {/* Visual Config */}
                        <View style={{
                            width: 60, height: 60, borderRadius: 12, overflow: 'hidden',
                            backgroundColor: theme.colors.background, marginRight: 16,
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            {nextExerciseImage ? (
                                nextExerciseIsLottie ? (
                                    <LottieView
                                        source={{ uri: nextExerciseImage }}
                                        autoPlay
                                        loop
                                        style={{ width: 60, height: 60 }}
                                    />
                                ) : (
                                    <Image
                                        source={{ uri: nextExerciseImage }}
                                        style={{ width: 60, height: 60 }}
                                        resizeMode="cover"
                                    />
                                )
                            ) : (
                                <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.text + "99"} />
                            )}
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.text + "99", marginBottom: 2 }}>
                                Up Next
                            </Text>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }} numberOfLines={1}>
                                {nextExerciseName}
                            </Text>
                            {nextExerciseInfo && (
                                <Text style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.primary, marginTop: 2 }}>
                                    {nextExerciseInfo}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onSkip} style={{ padding: 8 }}>
                            <Ionicons name="play" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Edit Time Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        width: '80%',
                        padding: 24,
                        borderRadius: 24
                    }}>
                        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text, marginBottom: 16 }}>
                            Set Rest Time
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <TextInput
                                value={customTime}
                                onChangeText={setCustomTime}
                                keyboardType="number-pad"
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 24,
                                    fontFamily: theme.fonts.heading,
                                    color: theme.colors.text,
                                    textAlign: 'center'
                                }}
                            />
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text + '99', marginLeft: 12 }}>
                                sec
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                                style={{ flex: 1, padding: 16, alignItems: 'center' }}
                            >
                                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 16, color: theme.colors.text + '99' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCustomTimeSave}
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.colors.primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 16, color: '#FFFFFF' }}>Set</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
