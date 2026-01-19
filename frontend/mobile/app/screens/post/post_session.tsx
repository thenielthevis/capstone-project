import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
// import { useUser } from "../../context/UserContext"; // Not using context to ensure fresh data
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { postApi } from "../../api/postApi";
import { getUserProfile, UserProfile } from "../../api/userApi";
import * as ImagePicker from 'expo-image-picker';

type VisibilityOption = "public" | "friends" | "private";

// Helper to format strings like "moderately_active" -> "Moderately Active"
const formatTag = (str: string) => {
    if (!str) return "";
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function PostSessionScreen() {
    const { theme } = useTheme();
    // const { user } = useUser();
    const router = useRouter();
    const params = useLocalSearchParams();

    const { type, id, title: initialTitle, subtitle, imageUri, postId, initialContent, initialImages, initialVisibility, initialTags } = params;

    const isEditing = !!postId;

    const [postTitle, setPostTitle] = useState(initialTitle as string || "");
    const [content, setContent] = useState(initialContent as string || "");
    // Use initialImages if editing, otherwise empty array. Parse if it's a JSON string which params sometimes are.
    const [images, setImages] = useState<string[]>(
        initialImages ? (Array.isArray(initialImages) ? initialImages : [initialImages as string]) : []
    );
    // Separate state for original images we might want to keep (hosted URLs)
    const [keepImages, setKeepImages] = useState<string[]>(
        initialImages ? (Array.isArray(initialImages) ? initialImages : [initialImages as string]).filter(img => img.startsWith('http')) : []
    );

    const [visibility, setVisibility] = useState<VisibilityOption>((initialVisibility as VisibilityOption) || "public");
    const [posting, setPosting] = useState(false);

    // Tagging System
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Initialize selectedTags with existing post tags when editing
    const [selectedTags, setSelectedTags] = useState<string[]>(() => {
        if (initialTags && typeof initialTags === 'string') {
            try {
                return JSON.parse(initialTags);
            } catch (e) {
                console.error('[PostSession] Failed to parse initialTags:', e);
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getUserProfile();
                console.log('[PostSession] Fetched user profile structure:', Object.keys(response));
                // Handle response structure { profile: ... } vs direct object
                const profileData = response.profile || response;
                setUserProfile(profileData);
                console.log('[PostSession] Set profile data. Keys:', Object.keys(profileData));
            } catch (error) {
                console.error('[PostSession] Failed to fetch user profile for tags:', error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    // Generate suggested tags from user profile
    const suggestedTags = useMemo(() => {
        if (!userProfile) return [];
        const tags = new Set<string>();

        // --- Gamification (Batteries) ---
        if (userProfile.gamification?.batteries && userProfile.gamification.batteries.length > 0) {
            const battery = userProfile.gamification.batteries[0];
            if (battery.sleep) tags.add(`Sleep Battery: ${battery.sleep}%`);
            if (battery.activity) tags.add(`Activity Battery: ${battery.activity}%`);
            if (battery.nutrition) tags.add(`Nutrition Battery: ${battery.nutrition}%`);
            if (battery.health) tags.add(`Health Battery: ${battery.health}%`);
        }

        // --- Physical Metrics ---
        if (userProfile.physicalMetrics?.bmi) {
            tags.add(`BMI: ${userProfile.physicalMetrics.bmi.toFixed(1)}`);
        }
        if (userProfile.physicalMetrics?.targetWeight && userProfile.physicalMetrics?.targetWeight > 0) {
            tags.add("Weight Goal");
        }

        // --- Lifestyle ---
        if (userProfile.lifestyle?.activityLevel) {
            tags.add(formatTag(userProfile.lifestyle.activityLevel));
        }
        if (userProfile.lifestyle?.sleepHours) {
            tags.add(`Sleep: ${userProfile.lifestyle.sleepHours} hrs`);
        }

        // --- Dietary Profile ---
        if (userProfile.dietaryProfile?.preferences && Array.isArray(userProfile.dietaryProfile.preferences)) {
            userProfile.dietaryProfile.preferences.forEach((pref: string) => tags.add(formatTag(pref)));
        }
        if (userProfile.dietaryProfile?.allergies && Array.isArray(userProfile.dietaryProfile.allergies)) {
            userProfile.dietaryProfile.allergies.forEach((allergy: string) => tags.add(`Allergy: ${formatTag(allergy)}`));
        }
        if (userProfile.dietaryProfile?.dailyWaterIntake) {
            tags.add(`Water: ${userProfile.dietaryProfile.dailyWaterIntake}L`);
        }
        if (userProfile.dietaryProfile?.mealFrequency) {
            tags.add(`Meals/Day: ${userProfile.dietaryProfile.mealFrequency}`);
        }

        // --- Health Profile ---
        if (userProfile.healthProfile?.currentConditions && Array.isArray(userProfile.healthProfile.currentConditions)) {
            userProfile.healthProfile.currentConditions.forEach((cond: string) => tags.add(formatTag(cond)));
        }
        if (userProfile.healthProfile?.bloodType) {
            tags.add(`Blood Type: ${userProfile.healthProfile.bloodType}`);
        }
        if (userProfile.healthProfile?.medications && Array.isArray(userProfile.healthProfile.medications)) {
            userProfile.healthProfile.medications.forEach((med: string) => tags.add(`Meds: ${formatTag(med)}`));
        }

        // --- Risk Factors ---
        if (userProfile.riskFactors?.stressLevel) {
            tags.add(`${formatTag(userProfile.riskFactors.stressLevel)} Stress`);
        }

        // --- Environmental ---
        if (userProfile.environmentalFactors?.occupationType) {
            tags.add(`Occupation: ${formatTag(userProfile.environmentalFactors.occupationType)}`);
        }

        const result = Array.from(tags);
        console.log('[PostSession] Generated tags:', result);
        return result;
    }, [userProfile]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    if (!isEditing && (!type || !id)) {
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
        const imageToRemove = images[index];
        setImages(images.filter((_, i) => i !== index));
        // If it was a kept image, remove it from keepImages too
        if (imageToRemove.startsWith('http')) {
            setKeepImages(keepImages.filter(img => img !== imageToRemove));
        }
    };

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Empty Post", "Please write something about your activity!");
            return;
        }

        try {
            setPosting(true);

            if (isEditing) {
                // Determine which images are new (local URIs)
                const newImages = images.filter(img => !img.startsWith('http'));

                await postApi.updatePost(postId as string, {
                    content,
                    title: postTitle,
                    visibility,
                    images: newImages,
                    keepImages: keepImages, // Only keep the ones user didn't remove
                    tags: selectedTags
                });
                Alert.alert("Success", "Post updated!", [
                    { text: "OK", onPress: () => router.push("/(tabs)/Home") }
                ]);
            } else {
                await postApi.createPost(
                    content,
                    {
                        item_id: id as string,
                        item_type: type as "GeoSession" | "ProgramSession" | "FoodLog"
                    },
                    postTitle || undefined,
                    images.length > 0 ? images : undefined,
                    visibility,
                    selectedTags
                );
                Alert.alert("Success", "Posted to your feed!", [
                    { text: "OK", onPress: () => router.push("/(tabs)/Home") }
                ]);
            }
        } catch (error) {
            console.error(isEditing ? "Update failed" : "Post failed", error);
            Alert.alert("Error", `Failed to ${isEditing ? "update" : "post"}. Please try again.`);
        } finally {
            setPosting(false);
        }
    };

    const handleSkip = () => {
        router.back();
    };

    const visibilityOptions: { key: VisibilityOption; label: string; icon: string }[] = [
        { key: "public", label: "Public", icon: "earth" },
        { key: "friends", label: "Friends", icon: "people" },
        { key: "private", label: "Only Me", icon: "lock-closed" },
    ];

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between border-b relative" style={{ borderBottomColor: theme.colors.text + '11' }}>
                <TouchableOpacity onPress={handleSkip} style={{ zIndex: 10 }}>
                    <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }} className="text-base">Cancel</Text>
                </TouchableOpacity>

                <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center" pointerEvents="none">
                    <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }} className="text-lg">
                        {isEditing ? "Edit Post" : "Share Activity"}
                    </Text>
                </View>

                <TouchableOpacity onPress={handlePost} disabled={posting} style={{ backgroundColor: theme.colors.primary, padding: 5, borderRadius: 10, width: 70, height: 30, justifyContent: "center", alignItems: "center", zIndex: 10 }}>
                    {posting ? <ActivityIndicator color="#FFF" size="small" /> :
                        <Text style={{ fontFamily: theme.fonts.heading, color: "#FFF" }} className="text-base">
                            {isEditing ? "Update" : "Post"}
                        </Text>}
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
                            {type === "FoodLog" ? (
                                <Ionicons name="fast-food" size={30} color={theme.colors.primary} />
                            ) : type === "ProgramSession" ? (
                                <Ionicons name="barbell" size={30} color={theme.colors.primary} />
                            ) : (
                                <MaterialCommunityIcons name="map-marker-radius-outline" size={30} color={theme.colors.primary} />
                            )}
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

                {/* Tag Selection */}
                {/* Always render, show loading or empty states */}
                <View className="mb-5">
                    <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-2">
                        Profile Tags (Optional)
                    </Text>

                    {loadingProfile ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start', marginLeft: 10 }} />
                    ) : suggestedTags.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 8
                            }}
                        >
                            {suggestedTags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <TouchableOpacity
                                        key={tag}
                                        onPress={() => toggleTag(tag)}
                                        style={{
                                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: isSelected ? theme.colors.primary : theme.colors.text + '20',
                                        }}
                                    >
                                        <Text style={{
                                            fontFamily: theme.fonts.body,
                                            color: isSelected ? '#FFF' : theme.colors.text,
                                            fontSize: 13
                                        }}>
                                            {tag}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={{
                            fontFamily: theme.fonts.body,
                            color: theme.colors.text + '60',
                            fontSize: 13,
                            fontStyle: 'italic'
                        }}>
                            Complete your profile to get personalized tags.
                        </Text>
                    )}
                </View>

                {/* Image Gallery - Always Visible */}
                <View className="mb-5">
                    <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }} className="mb-2">
                        Preview Images ({images.length > 0 ? images.length + 1 : 1}/10)
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-2"
                        contentContainerStyle={{ paddingTop: 8, paddingRight: 8 }}
                    >
                        {/* Static Placeholder Preview in Gallery */}
                        <View className="mr-2 relative" style={{ width: 120, height: 120 }}>
                            <Image
                                source={
                                    type === "FoodLog" ? require('../../../assets/images/food-placeholder.jpg') :
                                        type === "ProgramSession" ? require('../../../assets/images/program-placeholder.jpg') :
                                            require('../../../assets/images/outdoor-placeholder.jpg')
                                }
                                className="w-full h-full rounded-lg opacity-30 border-2"
                                resizeMode="cover"
                                style={{ borderColor: theme.colors.primary }}
                            />
                            <View className="absolute bottom-1 right-1 bg-black/50 px-2 py-0.5 rounded">
                                <Text style={{ color: 'white', fontSize: 10, fontFamily: theme.fonts.body }}>Sample Cover</Text>
                            </View>
                        </View>

                        {images.map((uri, index) => (
                            <View key={index} className="mr-2 relative" style={{ width: 120, height: 120 }}>
                                <Image source={{ uri }} className="w-full h-full rounded-lg" resizeMode="cover" />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className="absolute -top-1 -right-1 rounded-full w-6 h-6 items-center justify-center"
                                    style={{ backgroundColor: theme.colors.primary, zIndex: 10, elevation: 5 }}
                                >
                                    <Ionicons name="close" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

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
                <View className="flex-row gap-2 mb-10">
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
