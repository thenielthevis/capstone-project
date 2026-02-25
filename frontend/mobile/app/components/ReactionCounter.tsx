import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { REACTIONS } from "./ReactionButton";

interface Reaction {
    user: string | { _id: string };
    type: string;
}

interface ReactionCounterProps {
    reactions?: Reaction[];
    onReactionPress?: (reactionType: string) => void;
}

export default function ReactionCounter({ reactions = [], onReactionPress }: ReactionCounterProps) {
    const { theme } = useTheme();
    const [modalVisible, setModalVisible] = React.useState(false);
    const [selectedReactionType, setSelectedReactionType] = React.useState<string | null>(null);

    // Reaction color mapping
    const reactionColors: { [key: string]: string } = {
        Love: '#FF0000',
        Fire: '#FF6B35',
        Zap: '#FFD700',
        Trophy: '#9C27B0',
        Apple: '#00C853',
        Dumbbell: '#00BCD4',
        Run: '#2196F3',
        Smile: '#FFC107',
        Leaf: '#4CAF50',
        Wind: '#9E9E9E',
        Water: '#03A9F4',
        Brain: '#E91E63',
        Progress: '#FF9800',
        Steps: '#795548',
    };

    // Emoji mapping
    const emojiMap: { [key: string]: string } = {
        Love: '❤️',
        Fire: '🔥',
        Zap: '⚡',
        Trophy: '🏆',
        Apple: '🍎',
        Dumbbell: '💪',
        Run: '🏃',
        Smile: '😊',
        Leaf: '🍃',
        Wind: '💨',
        Water: '💧',
        Brain: '🧠',
        Progress: '📊',
        Steps: '👣',
    };

    // Group reactions by type
    const reactionCounts = React.useMemo(() => {
        const counts: { [key: string]: { type: string; count: number; users: string[] } } = {};

        reactions?.forEach((reaction) => {
            const reactionType = reaction.type;
            const userId = typeof reaction.user === 'string' ? reaction.user : reaction.user._id;

            if (!counts[reactionType]) {
                counts[reactionType] = { type: reactionType, count: 0, users: [] };
            }
            counts[reactionType].count++;
            counts[reactionType].users.push(userId);
        });

        return Object.values(counts).sort((a, b) => b.count - a.count);
    }, [reactions]);

    if (reactionCounts.length === 0) {
        return null;
    }

    const renderReactionIcon = (reactionType: string, size: number = 14) => {
        const reaction = REACTIONS.find(r => r.type === reactionType);
        if (!reaction) return null;

        if (reaction.library === "ionicons") {
            return <Ionicons name={reaction.icon as any} size={size} color={theme.colors.text} />;
        } else {
            return <MaterialCommunityIcons name={reaction.icon as any} size={size} color={theme.colors.text} />;
        }
    };

    const handleReactionPress = (reactionType: string) => {
        setSelectedReactionType(reactionType);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedReactionType(null);
    };

    const totalReactions = reactions.length;
    const topThree = reactionCounts.slice(0, 3);
    const hasMore = reactionCounts.length > 3;

    return (
        <>
            {/* Reactions Row - Shows top 3 emojis + total count */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible(true)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    backgroundColor: theme.colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}
            >
                {/* Top 3 Reaction Emojis */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {topThree.map((reaction) => (
                        <Text
                            key={reaction.type}
                            style={{
                                fontSize: 14,
                                fontWeight: '500',
                            }}
                        >
                            {emojiMap[reaction.type] || '👍'}
                        </Text>
                    ))}
                </View>

                {/* Total Count */}
                <Text
                    style={{
                        fontFamily: 'System',
                        fontSize: 12,
                        fontWeight: '600',
                        color: theme.colors.textSecondary,
                        marginLeft: 4,
                    }}
                >
                    {totalReactions}
                </Text>
            </TouchableOpacity>

            {/* Modal showing all reactions with counts */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 16,
                            paddingVertical: 16,
                            width: '85%',
                            maxHeight: '70%',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Modal Header */}
                        <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.text + '11' }}>
                            <Text
                                style={{
                                    fontFamily: 'System',
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.colors.text,
                                }}
                            >
                                Reactions
                            </Text>
                        </View>

                        {/* Reactions List */}
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                            {reactionCounts.map((reaction) => {
                                const isSelected = selectedReactionType === reaction.type;
                                return (
                                    <TouchableOpacity
                                        key={reaction.type}
                                        onPress={() => {
                                            if (onReactionPress) {
                                                onReactionPress(reaction.type);
                                            }
                                            closeModal();
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 12,
                                            paddingHorizontal: 12,
                                            marginVertical: 4,
                                            borderRadius: 8,
                                            backgroundColor: isSelected ? theme.colors.primary + '15' : 'transparent',
                                            borderWidth: isSelected ? 1 : 0,
                                            borderColor: theme.colors.primary,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Text
                                                style={{
                                                    fontFamily: 'System',
                                                    fontSize: 18,
                                                    marginRight: 12,
                                                }}
                                            >
                                                {emojiMap[reaction.type] || '👍'}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontFamily: 'System',
                                                    fontSize: 14,
                                                    color: theme.colors.text,
                                                    flex: 1,
                                                }}
                                            >
                                                {reaction.type}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: reactionColors[reaction.type] || theme.colors.primary,
                                                borderRadius: 12,
                                                paddingVertical: 4,
                                                paddingHorizontal: 10,
                                                minWidth: 40,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: 'System',
                                                    fontSize: 13,
                                                    fontWeight: '600',
                                                    color: '#FFFFFF',
                                                }}
                                            >
                                                {reaction.count}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Close Button */}
                        <View style={{ paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.text + '11' }}>
                            <TouchableOpacity
                                onPress={closeModal}
                                style={{
                                    paddingVertical: 12,
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    backgroundColor: theme.colors.background,
                                    marginTop: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'System',
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: theme.colors.text,
                                    }}
                                >
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
