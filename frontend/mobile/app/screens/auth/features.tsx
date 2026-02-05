import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Animated,
    StatusBar,
    Dimensions,
    FlatList,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../../context/UserContext";
import { tokenStorage } from "../../../utils/tokenStorage";
import { lightTheme, darkTheme, oceanTheme } from "../../../design/tokens";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const themeOptions = [
    {
        key: "light",
        label: "Light",
        description: "Clean & bright",
        icon: "white-balance-sunny",
        theme: lightTheme,
    },
    {
        key: "dark",
        label: "Dark",
        description: "Easy on the eyes",
        icon: "moon-waning-crescent",
        theme: darkTheme,
    },
    {
        key: "ocean",
        label: "Ocean",
        description: "Calm & serene",
        icon: "waves",
        theme: oceanTheme,
    },
];

// Features with multiple images support
const features = [
    {
        id: "geo",
        icon: "navigate-outline",
        title: "Geolocation",
        subtitle: "Track your activities",
        description: "Track user activities such as walking, running, or cycling using real-time location data.",
        images: [
            require("../../../assets/images/features/carousel-geo1.jpg"),
        ],
        color: "#38b6ff",
        guestPath: "/screens/record/Activity"
    },
    {
        id: "programs",
        icon: "fitness-outline",
        title: "Health Programs",
        subtitle: "Personalized Coaching",
        description: "Curated health programs and AI coaching to help you reach your fitness goals.",
        images: [
            require("../../../assets/images/features/carousel-program1.jpg"),
        ],
        color: "#6366f1",
        guestPath: "/screens/programs/create-program"
    },
    {
        id: "food",
        icon: "camera-outline",
        title: "Food Scanner",
        subtitle: "AI-Powered Nutrition",
        description: "Snap a photo to instantly log meals and get detailed nutritional insights.",
        images: [
            require("../../../assets/images/features/carousel-foodlog1.jpg"),
            require("../../../assets/images/features/carousel-foodlog2.jpg"),
        ],
        color: "#10b981",
        guestPath: "/screens/record/Food"
    },
    {
        id: "analysis",
        icon: "sparkles-outline",
        title: "AI Analysis",
        subtitle: "Smart Health Insights",
        description: "Get personalized feedback and trend analysis powered by advanced AI.",
        images: [
            require("../../../assets/images/features/carousel-analysis1.jpg"),
            require("../../../assets/images/features/carousel-analysis2.jpg"),
        ],
        color: "#8b5cf6",
    },
    {
        id: "avatar",
        icon: "body-outline",
        title: "Virtual Avatar",
        subtitle: "Your Digital Twin",
        description: "A 3D avatar that evolves with your wellness journey, reflecting your progress.",
        images: [
            require("../../../assets/images/features/carousel-avatar1.jpg"),
        ],
        color: "#f59e0b",
    },
    {
        id: "community",
        icon: "people-outline",
        title: "Community",
        subtitle: "Social Wellness",
        description: "Connect, share achievements, and participate in challenges with friends.",
        images: [
            require("../../../assets/images/features/carousel-network1.jpg"),
            require("../../../assets/images/features/carousel-network2.jpg"),
            require("../../../assets/images/features/carousel-network3.jpg"),
        ],
        color: "#ec4899",
    },
];

// Auto-rotating images with fade transition
const AutoRotatingImages = ({ images, featureId }: { images: any[]; featureId: string }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const imageHeight = SCREEN_HEIGHT * 0.55;

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {
                // Switch image
                setActiveIndex((prev) => (prev + 1) % images.length);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [images.length, featureId]);

    // Reset index when feature changes
    useEffect(() => {
        setActiveIndex(0);
        fadeAnim.setValue(1);
    }, [featureId]);

    return (
        <View style={{ height: imageHeight, width: SCREEN_WIDTH }}>
            <Animated.Image
                source={images[activeIndex]}
                style={{
                    width: SCREEN_WIDTH,
                    height: imageHeight,
                    opacity: fadeAnim,
                }}
                resizeMode="contain"
            />
        </View>
    );
};

export default function FeaturesScreen() {
    const router = useRouter();
    const { theme, themeKey, setThemeKey } = useTheme();
    const { setUser } = useUser();
    const [currentStep, setCurrentStep] = useState(0);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Total steps = 1 (theme) + number of features
    const totalSteps = 1 + features.length;
    const isDark = theme.mode === "dark";

    const animateTransition = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
        setTimeout(callback, 120);
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            animateTransition(() => setCurrentStep(currentStep + 1));
        } else {
            router.push("/screens/auth/register");
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            animateTransition(() => setCurrentStep(currentStep - 1));
        } else {
            router.back();
        }
    };

    const handleSkip = () => {
        router.push("/screens/auth/register");
    };

    const startGuestSession = async (path: string) => {
        const guestUser = { isGuest: true, name: "Guest User", email: "guest@lifora.com" };
        await tokenStorage.saveUser(guestUser);
        setUser(guestUser);
        router.replace(path as any);
    };

    // Step 0: Theme Selection
    const renderThemeStep = () => (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={{ alignItems: "center", marginBottom: 32 }}>
                <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    backgroundColor: theme.colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                }}>
                    <MaterialCommunityIcons name="palette-outline" size={40} color={theme.colors.primary} />
                </View>
                <Text style={{
                    fontSize: 28,
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.text,
                    marginBottom: 10,
                    textAlign: "center",
                }}>
                    Choose Your Theme
                </Text>
                <Text style={{
                    fontSize: 15,
                    fontFamily: theme.fonts.body,
                    color: theme.colors.text + "70",
                    textAlign: "center",
                    lineHeight: 22,
                    paddingHorizontal: 20,
                }}>
                    Select a visual style that suits you best. You can change this later in settings.
                </Text>
            </View>

            {themeOptions.map((option) => {
                const isSelected = themeKey === option.key;
                return (
                    <TouchableOpacity
                        key={option.key}
                        onPress={() => setThemeKey(option.key as any)}
                        activeOpacity={0.7}
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 20,
                            padding: 18,
                            marginBottom: 14,
                            borderWidth: 2.5,
                            borderColor: isSelected ? theme.colors.primary : "transparent",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: isSelected ? 0.12 : 0.05,
                            shadowRadius: 10,
                            elevation: isSelected ? 4 : 2,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{
                                width: 54,
                                height: 54,
                                borderRadius: 16,
                                backgroundColor: option.theme.colors.primary + "18",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 16,
                            }}>
                                <MaterialCommunityIcons
                                    name={option.icon as any}
                                    size={28}
                                    color={option.theme.colors.primary}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: 17,
                                    color: theme.colors.text,
                                    marginBottom: 3,
                                }}>
                                    {option.label}
                                </Text>
                                <Text style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: 13,
                                    color: theme.colors.text + "70",
                                }}>
                                    {option.description}
                                </Text>
                            </View>

                            {/* Color Preview */}
                            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
                                {[option.theme.colors.background, option.theme.colors.surface, option.theme.colors.primary, option.theme.colors.accent].map((color, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: color,
                                            borderWidth: 2,
                                            borderColor: theme.colors.text + "12",
                                            marginRight: -8,
                                            zIndex: i + 1,
                                        }}
                                    />
                                ))}
                            </View>

                            {/* Selection Indicator */}
                            <View style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: isSelected ? theme.colors.primary : "transparent",
                                borderWidth: 2.5,
                                borderColor: isSelected ? theme.colors.primary : theme.colors.text + "25",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: 10,
                            }}>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    // Feature Step (step 1 onwards)
    const renderFeatureStep = (featureIndex: number) => {
        const feature = features[featureIndex];

        return (
            <View style={{ flex: 1 }}>
                {/* Full-width Image Carousel */}
                <View style={{ position: "relative" }}>
                    <AutoRotatingImages images={feature.images} featureId={feature.id} />

                    {/* Gradient overlay for text readability */}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)"]}
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 140,
                        }}
                    />
                </View>

                {/* Content Section */}
                <View style={{
                    flex: 1,
                    paddingHorizontal: 24,
                    paddingTop: 24,
                    backgroundColor: theme.colors.background,
                }}>
                    {/* Feature Badge */}
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                    }}>
                        <View style={{
                            backgroundColor: feature.color + "20",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 24,
                            flexDirection: "row",
                            alignItems: "center",
                        }}>
                            <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                            <Text style={{
                                marginLeft: 8,
                                fontSize: 13,
                                color: feature.color,
                                fontFamily: theme.fonts.heading,
                                textTransform: "uppercase",
                                letterSpacing: 0.8,
                            }}>
                                {feature.subtitle}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={{
                        fontSize: 30,
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text,
                        marginBottom: 10,
                    }}>
                        {feature.title}
                    </Text>

                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        fontFamily: theme.fonts.body,
                        color: theme.colors.text + "80",
                        lineHeight: 24,
                        marginBottom: 24,
                    }}>
                        {feature.description}
                    </Text>

                    {/* Try as Guest Button */}
                    {feature.guestPath && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => startGuestSession(feature.guestPath!)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 14,
                                paddingHorizontal: 24,
                                borderRadius: 14,
                                borderWidth: 2,
                                borderColor: feature.color,
                            }}
                        >
                            <Ionicons name="play-circle-outline" size={20} color={feature.color} style={{ marginRight: 8 }} />
                            <Text style={{
                                fontSize: 15,
                                color: feature.color,
                                fontFamily: theme.fonts.heading,
                            }}>
                                Try as Guest
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle={currentStep === 0 ? (isDark ? "light-content" : "dark-content") : "light-content"} translucent backgroundColor="transparent" />

            {/* Header - positioned absolutely for feature steps */}
            <View style={{
                position: currentStep > 0 ? "absolute" : "relative",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 50,
                paddingBottom: 16,
            }}>
                <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.7}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        backgroundColor: currentStep > 0 ? theme.colors.border : theme.colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="chevron-back" size={22} color={currentStep > 0 ? theme.colors.text : theme.colors.text} />
                </TouchableOpacity>

                {/* Step Indicators */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <View
                            key={index}
                            style={{
                                width: index === currentStep ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: index === currentStep
                                    ? (currentStep > 0 ? "#FFFFFF" : theme.colors.primary)
                                    : (currentStep > 0 ? "rgba(255,255,255,0.4)" : theme.colors.text + "25"),
                                marginHorizontal: 3,
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                    <Text style={{
                        fontSize: 14,
                        color: currentStep > 0 ? theme.colors.text : theme.colors.primary,
                        fontFamily: theme.fonts.heading,
                    }}>
                        Skip
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {currentStep === 0 && renderThemeStep()}
                {currentStep > 0 && renderFeatureStep(currentStep - 1)}
            </Animated.View>

            {/* Bottom Navigation */}
            <View style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 24,
                paddingBottom: 40,
                paddingTop: 16,
                backgroundColor: theme.colors.background,
            }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleNext}
                    style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        elevation: 6,
                    }}
                >
                    <LinearGradient
                        colors={[theme.colors.primary, "#0891b2"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            paddingVertical: 16,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{
                            fontSize: 16,
                            color: "#FFFFFF",
                            fontFamily: theme.fonts.heading,
                            marginRight: 8,
                        }}>
                            {currentStep === totalSteps - 1 ? "Sign Up" : "Next"}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}
