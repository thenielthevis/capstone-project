/**
 * Day Rating Modal Component
 * Single overall day rating question (1-5 scale)
 */

import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface DayRatingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, notes?: string) => Promise<boolean>;
}

// Rating options with colors and labels
const RATING_OPTIONS = [
    { value: 1, label: "Poor", emoji: "😞", color: "#DC2626", bgColor: "#FEE2E2" },
    { value: 2, label: "Fair", emoji: "😕", color: "#F97316", bgColor: "#FFEDD5" },
    { value: 3, label: "Okay", emoji: "😐", color: "#FBBF24", bgColor: "#FEF3C7" },
    { value: 4, label: "Good", emoji: "🙂", color: "#22C55E", bgColor: "#DCFCE7" },
    { value: 5, label: "Great", emoji: "🌟", color: "#8B5CF6", bgColor: "#EDE9FE" }
];

export const DayRatingModal: React.FC<DayRatingModalProps> = ({
    visible,
    onClose,
    onSubmit
}) => {
    const { theme } = useTheme();
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedOption = RATING_OPTIONS.find(r => r.value === selectedRating);

    const handleSubmit = async () => {
        if (!selectedRating) return;

        setIsSubmitting(true);
        try {
            const success = await onSubmit(selectedRating, notes.trim() || undefined);
            if (success) {
                setSelectedRating(null);
                setNotes("");
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedRating(null);
        setNotes("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
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
                    paddingBottom: 40
                }}>
                    {/* Handle bar */}
                    <View style={{
                        width: 40,
                        height: 4,
                        backgroundColor: theme.colors.text + "30",
                        borderRadius: 2,
                        alignSelf: "center",
                        marginBottom: 20
                    }} />

                    {/* Header */}
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 24,
                        marginBottom: 24
                    }}>
                        <View>
                            <Text style={{
                                fontFamily: theme.fonts.heading,
                                fontSize: 22,
                                color: theme.colors.text
                            }}>
                                Rate Your Day
                            </Text>
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: 14,
                                color: theme.colors.text + "99",
                                marginTop: 4
                            }}>
                                How would you rate today overall?
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={theme.colors.text + "77"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Rating Selection */}
                    <View style={{
                        paddingHorizontal: 24,
                        marginBottom: 24
                    }}>
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "space-between"
                        }}>
                            {RATING_OPTIONS.map((option) => {
                                const isSelected = selectedRating === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setSelectedRating(option.value)}
                                        style={{
                                            alignItems: "center",
                                            flex: 1
                                        }}
                                    >
                                        <View style={{
                                            width: isSelected ? 64 : 52,
                                            height: isSelected ? 64 : 52,
                                            borderRadius: isSelected ? 32 : 26,
                                            backgroundColor: isSelected ? option.bgColor : theme.colors.surface,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: isSelected ? 3 : 2,
                                            borderColor: isSelected ? option.color : theme.colors.text + "15"
                                        }}>
                                            <Text style={{ fontSize: isSelected ? 28 : 22 }}>
                                                {option.emoji}
                                            </Text>
                                        </View>
                                        <Text style={{
                                            fontFamily: isSelected ? theme.fonts.bodyBold : theme.fonts.body,
                                            fontSize: 11,
                                            color: isSelected ? option.color : theme.colors.text + "77",
                                            marginTop: 6
                                        }}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Selected rating feedback */}
                    {selectedRating && selectedOption && (
                        <View style={{
                            marginHorizontal: 24,
                            marginBottom: 20,
                            padding: 16,
                            backgroundColor: selectedOption.bgColor,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: selectedOption.color + "30"
                        }}>
                            <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: 15,
                                color: selectedOption.color,
                                textAlign: "center"
                            }}>
                                Today was {selectedOption.label.toLowerCase()} {selectedOption.emoji}
                            </Text>
                        </View>
                    )}

                    {/* Notes */}
                    <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                        <Text style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: 14,
                            color: theme.colors.text + "AA",
                            marginBottom: 8
                        }}>
                            Any reflections? (optional)
                        </Text>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="What made today special or challenging?"
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
                    </View>

                    {/* Submit Button */}
                    <View style={{ paddingHorizontal: 24 }}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!selectedRating || isSubmitting}
                            style={{
                                backgroundColor: selectedRating
                                    ? (selectedOption?.color || theme.colors.primary)
                                    : theme.colors.text + "30",
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: "center",
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                        >
                            <Text style={{
                                fontFamily: theme.fonts.heading,
                                fontSize: 16,
                                color: "#FFFFFF"
                            }}>
                                {isSubmitting ? "Saving..." : "Save Rating"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default DayRatingModal;
