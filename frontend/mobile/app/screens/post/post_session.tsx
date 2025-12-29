import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { postApi } from "../../api/postApi";
import * as ImagePicker from 'expo-image-picker';

type VisibilityOption = "public" | "friends" | "private";

export default function PostSessionScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();

    const { type, id, title: initialTitle, subtitle, imageUri } = params;

    const [postTitle, setPostTitle] = useState(initialTitle as string || "");
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [visibility, setVisibility] = useState<VisibilityOption>("public");
    const [posting,

        setPosting] = useState(false);

    if (!type || !id) {
        console.warn("Missing type or id for post session");
    }

    const pickImages = async () => {
        if (images.length >= 10) {
            Alert.alert("Limit Reached", "You can only add up to 10 images");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 10 - images.length,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages([...images, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Empty Post", "Please write something about your activity!");
            return;
        }

        try {
            setPosting(true);
            await postApi.createPost(
                content,
                {
                    item_id: id as string,
                    item_type: type as "GeoSession" | "ProgramSession" | "FoodLog"
                },
                postTitle || undefined,
                images.length > 0 ? images : undefined,
                visibility
            );

            Alert.alert("Success", "Posted to your feed!", [
                { text: "OK", onPress: () => router.push("/(tabs)/Home") }
            ]);
        } catch (error) {
            console.error("Post failed", error);
            Alert.alert("Error", "Failed to post. Please try again.");
        } finally {
            setPosting(false);
        }
    };

    const handleSkip = () => {
        router.push("/(tabs)/Home");
    };

    const visibilityOptions: { key: VisibilityOption; label: string; icon: string }[] = [
        { key: "public", label: "Public", icon: "earth" },
        { key: "friends", label: "Friends", icon: "people" },
        { key: "private", label: "Only Me", icon: "lock-closed" },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: theme.colors.text + '11' }}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="text-base">Skip</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-lg">Share Activity</Text>
                <TouchableOpacity onPress={handlePost} disabled={posting}>
                    {posting ? <ActivityIndicator color={theme.colors.primary} /> :
                        <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }} className="text-base">Post</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                {/* Activity Preview Card */}
                <View className="rounded-2xl p-4 mb-5 flex-row items-center" style={{
                    backgroundColor: theme.colors.surface,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                }}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri as string }} className="w-15 h-15 rounded-lg mr-4" />
                    ) : (
                        <View className="w-15 h-15 rounded-lg items-center justify-center mr-4" style={{ backgroundColor: theme.colors.primary + '20' }}>
                            <Ionicons name={type === "FoodLog" ? "fast-food" : type === "ProgramSession" ? "barbell" : "map"} size={30} color={theme.colors.primary} />
                        </View>
                    )}
                    <View className="flex-1">
                        <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-base">{initialTitle || "Activity"}</Text>
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }} className="text-sm">{subtitle || "Completed"}</Text>
                    </View>
                </View>

                {/* Title Input */}
                <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-2">Post Title</Text>
                <TextInput
                    className="rounded-xl p-4 mb-5"
                    style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                        fontSize: 16
                    }}
                    placeholder="Give your post a title..."
                    placeholderTextColor={theme.colors.text + '66'}
                    value={postTitle}
                    onChangeText={setPostTitle}
                />

                {/* Content Input */}
                <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-2">What's on your mind?</Text>
                <TextInput
                    className="rounded-xl p-4 mb-5"
                    style={{
                        backgroundColor: theme.colors.surface,
                        minHeight: 120,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                        textAlignVertical: 'top'
                    }}
                    placeholder="Share your thoughts, feelings, or experience..."
                    placeholderTextColor={theme.colors.text + '66'}
                    multiline
                    value={content}
                    onChangeText={setContent}
                />

                {/* Image Gallery */}
                {images.length > 0 && (
                    <View className="mb-5">
                        <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-2">
                            Images ({images.length}/10)
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                            {images.map((uri, index) => (
                                <View key={index} className="mr-2 relative">
                                    <Image source={{ uri }} className="w-25 h-25 rounded-lg" />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 items-center justify-center"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    >
                                        <Ionicons name="close" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Add Images Button */}
                <TouchableOpacity
                    onPress={pickImages}
                    className="rounded-xl p-4 mb-5 flex-row items-center justify-center border border-dashed"
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.primary + '33'
                    }}
                >
                    <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary} />
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.primary }} className="ml-2 text-base">
                        Add Photos ({images.length}/10)
                    </Text>
                </TouchableOpacity>

                {/* Visibility Selector */}
                <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-3">Who can see this?</Text>
                <View className="flex-row gap-2 mb-5">
                    {visibilityOptions.map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            onPress={() => setVisibility(option.key)}
                            className="flex-1 rounded-xl p-3 items-center"
                            style={{
                                backgroundColor: visibility === option.key ? theme.colors.primary : theme.colors.surface,
                                borderWidth: visibility === option.key ? 0 : 1,
                                borderColor: theme.colors.text + '22'
                            }}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={20}
                                color={visibility === option.key ? "#FFFFFF" : theme.colors.text}
                            />
                            <Text style={{
                                fontFamily: theme.fonts.body,
                                color: visibility === option.key ? "#FFFFFF" : theme.colors.text,
                            }} className="text-xs mt-1">
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
