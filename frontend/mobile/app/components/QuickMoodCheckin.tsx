/**
 * Quick Mood Check-in Component
 * Beautiful emoji-based mood selection with optional contributing factors
 */

import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    TextInput,
    ScrollView,
    Dimensions
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useMoodCheckin } from "../context/MoodCheckinContext";
import {
    MoodEmoji,
    ContributingFactor,
    MOOD_MAP,
    CONTRIBUTING_FACTOR_LABELS
} from "../api/moodCheckinApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface QuickMoodCheckinProps {
    visible?: boolean;
    onClose?: () => void;
    onSubmit?: (success: boolean) => void;
}

// Mood options with colors
const MOOD_OPTIONS: Array<{
    emoji: MoodEmoji;
    label: string;
    color: string;
    bgColor: string;
}> = [
        { emoji: "😢", label: "Terrible", color: "#DC2626", bgColor: "#FEE2E2" },
        { emoji: "😔", label: "Bad", color: "#F97316", bgColor: "#FFEDD5" },
        { emoji: "😐", label: "Okay", color: "#FBBF24", bgColor: "#FEF3C7" },
        { emoji: "🙂", label: "Good", color: "#22C55E", bgColor: "#DCFCE7" },
        { emoji: "😊", label: "Great", color: "#10B981", bgColor: "#D1FAE5" }
    ];

// All contributing factors
const ALL_FACTORS: ContributingFactor[] = [
    'exercise', 'diet', 'sleep', 'work', 'social', 'health', 'weather', 'stress', 'relaxation'
];

export const QuickMoodCheckin: React.FC<QuickMoodCheckinProps> = ({
    visible: externalVisible,
    onClose: externalOnClose,
    onSubmit
}) => {
    const { theme } = useTheme();
    const {
        isCheckinModalOpen,
        showContributingFactors,
        currentQuestion,
        submitCheckin,
        closeCheckinModal,
        toggleContributingFactors,
        isLoading
    } = useMoodCheckin();

    // Use external or internal state
    const isVisible = externalVisible !== undefined ? externalVisible : isCheckinModalOpen;
    const handleClose = externalOnClose || closeCheckinModal;

    // Local state for selection
    const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
    const [selectedFactors, setSelectedFactors] = useState<ContributingFactor[]>([]);
    const [notes, setNotes] = useState("");
    const [showFactors, setShowFactors] = useState(showContributingFactors);

    // Animation values
    const [scaleAnim] = useState(new Animated.Value(1));

    // Handle mood selection
    const handleMoodSelect = (emoji: MoodEmoji) => {
        setSelectedMood(emoji);

        // Animate selection
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 100,
                useNativeDriver: true
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
            })
        ]).start();
    };

    // Toggle factor selection
    const toggleFactor = (factor: ContributingFactor) => {
        setSelectedFactors(prev =>
            prev.includes(factor)
                ? prev.filter(f => f !== factor)
                : [...prev, factor]
        );
    };

    // Handle submission
    const handleSubmit = async () => {
        if (!selectedMood) return;

        const success = await submitCheckin(
            selectedMood,
            selectedFactors.length > 0 ? selectedFactors : undefined,
            notes.trim() || undefined
        );

        if (success) {
            // Reset state
            setSelectedMood(null);
            setSelectedFactors([]);
            setNotes("");
            setShowFactors(false);
            onSubmit?.(true);
        } else {
            onSubmit?.(false);
        }
    };

    // Handle close and reset
    const handleCloseAndReset = () => {
        setSelectedMood(null);
        setSelectedFactors([]);
        setNotes("");
        setShowFactors(false);
        handleClose();
    };

    const selectedMoodOption = MOOD_OPTIONS.find(m => m.emoji === selectedMood);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={handleCloseAndReset}
        >
            <View style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end"
            }}>
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingTop: 12,
                    maxHeight: "90%"
                }}>
                    {/* Handle bar */}
                    <View style={{
                        width: 40,
                        height: 4,
                        backgroundColor: theme.colors.text + "30",
                        borderRadius: 2,
                        alignSelf: "center",
                        marginBottom: 16
                    }} />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {/* Header */}
                        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 24,
                                    color: theme.colors.text
                                }}>
                                    Quick Check-in
                                </Text>
                                <TouchableOpacity onPress={handleCloseAndReset}>
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={24}
                                        color={theme.colors.text + "77"}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 16,
                                color: theme.colors.text + "99",
                                marginTop: 8
                            }}>
                                {currentQuestion}
                            </Text>
                        </View>

                        {/* Mood Selection */}
                        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                            <View style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                {MOOD_OPTIONS.map((mood) => {
                                    const isSelected = selectedMood === mood.emoji;
                                    return (
                                        <TouchableOpacity
                                            key={mood.emoji}
                                            onPress={() => handleMoodSelect(mood.emoji)}
                                            style={{
                                                alignItems: "center",
                                                padding: 8
                                            }}
                                        >
                                            <Animated.View style={{
                                                width: isSelected ? 64 : 56,
                                                height: isSelected ? 64 : 56,
                                                borderRadius: 32,
                                                backgroundColor: isSelected ? mood.bgColor : theme.colors.surface,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: isSelected ? 3 : 1,
                                                borderColor: isSelected ? mood.color : theme.colors.text + "20",
                                                transform: isSelected ? [{ scale: scaleAnim }] : undefined
                                            }}>
                                                <Text style={{ fontSize: isSelected ? 32 : 28 }}>
                                                    {mood.emoji}
                                                </Text>
                                            </Animated.View>
                                            <Text style={{
                                                fontFamily: isSelected ? theme.fonts.bodyBold : theme.fonts.body,
                                                fontSize: 12,
                                                color: isSelected ? mood.color : theme.colors.text + "77",
                                                marginTop: 6
                                            }}>
                                                {mood.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Selected mood feedback */}
                        {selectedMood && selectedMoodOption && (
                            <View style={{
                                marginHorizontal: 24,
                                marginBottom: 20,
                                padding: 16,
                                backgroundColor: selectedMoodOption.bgColor,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: selectedMoodOption.color + "30"
                            }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 15,
                                    color: selectedMoodOption.color,
                                    textAlign: "center"
                                }}>
                                    You're feeling {selectedMoodOption.label.toLowerCase()} {selectedMoodOption.emoji}
                                </Text>
                            </View>
                        )}

                        {/* What contributed toggle */}
                        {selectedMood && (
                            <TouchableOpacity
                                onPress={() => setShowFactors(!showFactors)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingVertical: 12,
                                    marginHorizontal: 24,
                                    marginBottom: 16,
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: 12
                                }}
                            >
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 14,
                                    color: theme.colors.primary
                                }}>
                                    {showFactors ? "Hide factors" : "What contributed to this?"}
                                </Text>
                                <MaterialCommunityIcons
                                    name={showFactors ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={theme.colors.primary}
                                />
                            </TouchableOpacity>
                        )}

                        {/* Contributing Factors */}
                        {showFactors && (
                            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 14,
                                    color: theme.colors.text + "AA",
                                    marginBottom: 12
                                }}>
                                    Select all that apply:
                                </Text>
                                <View style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 10
                                }}>
                                    {ALL_FACTORS.map((factor) => {
                                        const isSelected = selectedFactors.includes(factor);
                                        const factorInfo = CONTRIBUTING_FACTOR_LABELS[factor];
                                        return (
                                            <TouchableOpacity
                                                key={factor}
                                                onPress={() => toggleFactor(factor)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 14,
                                                    backgroundColor: isSelected
                                                        ? theme.colors.primary + "20"
                                                        : theme.colors.surface,
                                                    borderRadius: 20,
                                                    borderWidth: 1,
                                                    borderColor: isSelected
                                                        ? theme.colors.primary
                                                        : theme.colors.text + "20"
                                                }}
                                            >
                                                <MaterialCommunityIcons
                                                    name={factorInfo.icon as any}
                                                    size={16}
                                                    color={isSelected ? theme.colors.primary : theme.colors.text + "77"}
                                                />
                                                <Text style={{
                                                    fontFamily: isSelected ? theme.fonts.bodyBold : theme.fonts.body,
                                                    fontSize: 13,
                                                    color: isSelected ? theme.colors.primary : theme.colors.text + "AA",
                                                    marginLeft: 6
                                                }}>
                                                    {factorInfo.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Optional notes */}
                        {showFactors && (
                            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 14,
                                    color: theme.colors.text + "AA",
                                    marginBottom: 8
                                }}>
                                    Add a note (optional):
                                </Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="How are things going today?"
                                    placeholderTextColor={theme.colors.text + "55"}
                                    multiline
                                    maxLength={200}
                                    style={{
                                        fontFamily: theme.fonts.body,
                                        fontSize: 14,
                                        color: theme.colors.text,
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: 12,
                                        padding: 14,
                                        minHeight: 80,
                                        textAlignVertical: "top",
                                        borderWidth: 1,
                                        borderColor: theme.colors.text + "15"
                                    }}
                                />
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 11,
                                    color: theme.colors.text + "55",
                                    textAlign: "right",
                                    marginTop: 4
                                }}>
                                    {notes.length}/200
                                </Text>
                            </View>
                        )}

                        {/* Submit Button */}
                        <View style={{ paddingHorizontal: 24 }}>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!selectedMood || isLoading}
                                style={{
                                    backgroundColor: selectedMood
                                        ? (selectedMoodOption?.color || theme.colors.primary)
                                        : theme.colors.text + "30",
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    alignItems: "center",
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                <Text style={{
                                    fontFamily: theme.fonts.heading,
                                    fontSize: 16,
                                    color: "#FFFFFF"
                                }}>
                                    {isLoading ? "Saving..." : "Save Check-in"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Skip for now */}
                        <TouchableOpacity
                            onPress={handleCloseAndReset}
                            style={{
                                alignItems: "center",
                                marginTop: 16,
                                paddingVertical: 8
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 14,
                                color: theme.colors.text + "77"
                            }}>
                                Skip for now
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default QuickMoodCheckin;
