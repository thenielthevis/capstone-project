import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView, TextInput } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

type ReactionType = "Heart" | "Fire" | "Zap" | "Trophy" | "Apple" | "Dumbbell" | "Run" | "Smile" | "Leaf" | "Wind" | "Water" | "Brain" | "Progress" | "Steps";

interface ReactionButtonProps {
    userReaction?: string;
    reactionCount: number;
    onReact: (type: string) => void;
    compact?: boolean;
}

export const REACTIONS: { type: ReactionType; icon: string; library: "ionicons" | "material" }[] = [
    { type: "Heart", icon: "heart", library: "ionicons" },
    { type: "Fire", icon: "flame", library: "ionicons" },
    { type: "Zap", icon: "flash", library: "ionicons" },
    { type: "Trophy", icon: "trophy", library: "ionicons" },
    { type: "Apple", icon: "nutrition", library: "ionicons" },
    { type: "Dumbbell", icon: "dumbbell", library: "material" },
    { type: "Run", icon: "run", library: "material" },
    { type: "Smile", icon: "emoticon-happy-outline", library: "material" },
    { type: "Leaf", icon: "leaf", library: "ionicons" },
    { type: "Wind", icon: "wind", library: "ionicons" },
    { type: "Water", icon: "water", library: "ionicons" },
    { type: "Brain", icon: "brain", library: "material" },
    { type: "Progress", icon: "stats-chart", library: "ionicons" },
    { type: "Steps", icon: "walk", library: "material" },
];

const QUICK_REACTIONS = [
    { type: "Heart", icon: "heart", library: "ionicons" },
    { type: "Fire", icon: "flame", library: "ionicons" },
    { type: "Zap", icon: "flash", library: "ionicons" },
    { type: "Trophy", icon: "trophy", library: "ionicons" },
    { type: "Apple", icon: "nutrition", library: "ionicons" },
];

export default function ReactionButton({ userReaction, reactionCount, onReact, compact = false }: ReactionButtonProps) {
    const { theme } = useTheme();
    const [quickVisible, setQuickVisible] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
    const buttonRef = React.useRef<View>(null);

    const filteredReactions = useMemo(() => {
        if (!searchText.trim()) return REACTIONS;
        return REACTIONS.filter(r => 
            r.type.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText]);

    const handleLongPress = () => {
        setPickerVisible(true);
    };

    const handlePress = () => {
        if (userReaction) {
            // If already reacted, tapping toggles (removes) it
            onReact(userReaction);
        } else {
            // Show quick reactions
            setQuickVisible(!quickVisible);
        }
    };

    const handleReactionSelect = (type: string) => {
        onReact(type);
        setQuickVisible(false);
        setPickerVisible(false);
        setSearchText("");
    };

    const reactionData = userReaction ? REACTIONS.find(r => r.type === userReaction) : null;

    // Sizes based on compact mode
    const iconSize = compact ? 14 : 22;

    const renderReactionIcon = (reaction: typeof REACTIONS[0], size: number = 24) => {
        if (reaction.library === "ionicons") {
            return <Ionicons name={reaction.icon as any} size={size} color={theme.colors.text} />;
        } else {
            return <MaterialCommunityIcons name={reaction.icon as any} size={size} color={theme.colors.text} />;
        }
    };

    return (
        <>
            <View ref={buttonRef} collapsable={false}>
                <TouchableOpacity
                    onPress={handlePress}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: compact ? 2 : 0 }}
                >
                    {reactionData ? (
                        renderReactionIcon(reactionData, iconSize)
                    ) : (
                        <Ionicons
                            name="add-circle-outline"
                            size={iconSize}
                            color={theme.colors.text + '66'}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Quick Reactions */}
            {quickVisible && !userReaction && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 35,
                        left: 0,
                        right: 0,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginHorizontal: 20,
                        elevation: 5,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                    }}
                >
                    {QUICK_REACTIONS.map((reaction) => (
                        <TouchableOpacity
                            key={reaction.type}
                            onPress={() => handleReactionSelect(reaction.type)}
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                backgroundColor: theme.colors.background,
                            }}
                        >
                            {renderReactionIcon(reaction as { type: ReactionType; icon: string; library: "ionicons" | "material" }, 24)}
                        </TouchableOpacity>
                    ))}
                    {/* Plus button for full picker */}
                    <TouchableOpacity
                        onPress={() => {
                            setQuickVisible(false);
                            setPickerVisible(true);
                        }}
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: theme.colors.background,
                        }}
                    >
                        <Ionicons name="add-circle" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Full Reaction Picker */}
            <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => {
                setPickerVisible(false);
                setSearchText("");
            }}>
                <TouchableWithoutFeedback onPress={() => {
                    setPickerVisible(false);
                    setSearchText("");
                }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
                        <View
                            style={{
                                width: '90%',
                                maxHeight: '80%',
                                backgroundColor: theme.colors.surface,
                                borderRadius: 12,
                                elevation: 5,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Search Bar */}
                            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                                <TextInput
                                    placeholder="Search reactions..."
                                    placeholderTextColor={theme.colors.text + '66'}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        backgroundColor: theme.colors.background,
                                        color: theme.colors.text,
                                        fontSize: 14,
                                    }}
                                />
                            </View>

                            {/* Reactions Grid */}
                            <ScrollView
                                contentContainerStyle={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    padding: 12,
                                    justifyContent: 'center',
                                }}
                                scrollEnabled={true}
                            >
                                {filteredReactions.length > 0 ? (
                                    filteredReactions.map((reaction) => (
                                        <TouchableOpacity
                                            key={reaction.type}
                                            onPress={() => handleReactionSelect(reaction.type)}
                                            style={{
                                                width: '25%',
                                                aspectRatio: 1,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                                borderRadius: 8,
                                                backgroundColor: theme.colors.background,
                                            }}
                                        >
                                            <View style={{ alignItems: 'center' }}>
                                                {renderReactionIcon(reaction, 32)}
                                                <Text
                                                    style={{
                                                        fontSize: 10,
                                                        color: theme.colors.text,
                                                        marginTop: 4,
                                                        textAlign: 'center',
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {reaction.type}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: theme.colors.text + '66' }}>No reactions found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
