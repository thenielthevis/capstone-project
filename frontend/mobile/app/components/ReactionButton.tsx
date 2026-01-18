import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

type ReactionType = "Like" | "Love" | "Haha" | "Wow" | "Sad" | "Angry";

interface ReactionButtonProps {
    userReaction?: string;
    reactionCount: number;
    onReact: (type: string) => void;
    compact?: boolean;
}

export const REACTIONS: { type: ReactionType; emoji: string }[] = [
    { type: "Like", emoji: "👍" },
    { type: "Love", emoji: "❤️" },
    { type: "Haha", emoji: "😆" },
    { type: "Wow", emoji: "😮" },
    { type: "Sad", emoji: "😢" },
    { type: "Angry", emoji: "😡" },
];

export default function ReactionButton({ userReaction, reactionCount, onReact, compact = false }: ReactionButtonProps) {
    const { theme } = useTheme();
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
    const buttonRef = React.useRef<View>(null);

    const handleLongPress = () => {
        buttonRef.current?.measureInWindow((x, y, width, height) => {
            setPickerPosition({ x: x - 20, y: y - 60 });
            setPickerVisible(true);
        });
    };

    const handlePress = () => {
        if (userReaction) {
            // If already reacted, tapping toggles (removes) it
            onReact(userReaction);
        } else {
            // If empty, simple tap OPENS the picker
            handleLongPress();
        }
    };

    const handleReactionSelect = (type: string) => {
        onReact(type);
        setPickerVisible(false);
    };

    const reactionEmoji = userReaction ? REACTIONS.find(r => r.type === userReaction)?.emoji : null;
    const reactionType = userReaction ? REACTIONS.find(r => r.type === userReaction)?.type : null;

    // Sizes based on compact mode
    const emojiSize = compact ? 12 : 16;
    const iconSize = compact ? 14 : 22;

    return (
        <>
            <View ref={buttonRef} collapsable={false}>
                <TouchableOpacity
                    onPress={handlePress}
                    onLongPress={handleLongPress}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: compact ? 2 : 0 }}
                >
                    {reactionEmoji ? (
                        <Text style={{ fontSize: emojiSize, marginBottom: compact ? 0 : 2, color: theme.colors.text }}>{reactionEmoji}</Text>
                    ) : (
                        <Ionicons
                            name="add-circle-outline"
                            size={iconSize}
                            color={theme.colors.text + '66'}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={{ flex: 1 }}>
                        <View
                            style={{
                                position: 'absolute',
                                top: pickerPosition.y,
                                left: 20,
                                backgroundColor: theme.colors.surface,
                                flexDirection: 'row',
                                padding: 8,
                                borderRadius: 30,
                                elevation: 5,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                gap: 15
                            }}
                        >
                            {REACTIONS.map((reaction) => (
                                <TouchableOpacity
                                    key={reaction.type}
                                    onPress={() => handleReactionSelect(reaction.type)}
                                >
                                    <Text style={{ fontSize: 28 }}>{reaction.emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
