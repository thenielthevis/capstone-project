import React, { useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Linking, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from "expo-constants";
import MapLibreGL from '@maplibre/maplibre-react-native';
import LottieView from "lottie-react-native";
import { ActivityIcon } from '../../components/ActivityIcon';

const MAPTILER_KEY =
    Constants?.expoConfig?.extra?.MAPTILER_KEY ||
    process.env.EXPO_PUBLIC_MAPTILER_KEY;

// --- Helper Components from Food.tsx ---

const StatCard = ({
    icon,
    label,
    value,
    color,
    theme,
    suffix = '',
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    theme: any;
    suffix?: string;
}) => (
    <View style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: color + '20'
    }}>
        <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: color + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        }}>
            <MaterialCommunityIcons name={icon as any} size={18} color={color} />
        </View>
        <Text style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text
        }}>
            {value}{suffix}
        </Text>
        <Text style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.text + '77',
            marginTop: 2,
            textAlign: 'center',
        }}>
            {label}
        </Text>
    </View>
);

const NutrientBar = ({ label, value, unit, max, color, icon, theme }: any) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{label}</Text>
                </View>
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                    {value}{unit} <Text style={{ color: theme.colors.text + '55', fontSize: 10 }}>/ {max}{unit}</Text>
                </Text>
            </View>
            <View style={{ height: 6, backgroundColor: color + '20', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
            </View>
        </View>
    );
};

export default function SessionDetails() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { sessionType } = params;

    // Parse session data safely
    const session = useMemo(() => {
        try {
            return params.sessionData ? JSON.parse(params.sessionData as string) : null;
        } catch (e) {
            console.error("Failed to parse session data", e);
            return null;
        }
    }, [params.sessionData]);

    const images = useMemo(() => {
        try {
            return params.images ? JSON.parse(params.images as string) : [];
        } catch (e) { return []; }
    }, [params.images]);

    const postId = params.postId as string;

    const handleOpenImages = () => {
        if (images && images.length > 0 && postId) {
            router.replace({
                pathname: '/screens/post/image-max',
                params: {
                    images: params.images, // Pass as is (string)
                    index: "0",
                    postId: postId
                }
            });
        }
    };

    // Bottom Sheet Ref & SnapPoints
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%', '100%'], []);

    if (!session) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.colors.text }}>Session data not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // --- RENDER BACKGROUND CONTENT (Behind Bottom Sheet) ---
    const renderBackground = () => {
        if (sessionType === 'GeoSession') {
            const coordinates = session.route_coordinates?.map((c: any) => [c.longitude, c.latitude]) || [];

            // Bounds calculation
            let cameraBounds;
            if (coordinates.length > 0) {
                const lons = coordinates.map((c: any) => c[0]);
                const lats = coordinates.map((c: any) => c[1]);
                cameraBounds = {
                    ne: [Math.max(...lons), Math.max(...lats)],
                    sw: [Math.min(...lons), Math.min(...lats)],
                    paddingLeft: 100, paddingRight: 100, paddingTop: 40, paddingBottom: 100
                };
            }

            return (
                <View style={{ height: '60%' }}>
                    <TouchableOpacity activeOpacity={images.length > 0 ? 0.9 : 1} onPress={handleOpenImages} style={{ flex: 1 }}>
                        {coordinates.length > 0 ? (
                            <MapLibreGL.MapView
                                style={{ flex: 1 }}
                                mapStyle={theme.mode === "dark"
                                    ? "https://api.maptiler.com/maps/019b1d6d-f87f-771b-88b8-776fa8f37312/style.json?key=" + MAPTILER_KEY
                                    : `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`}
                                logoEnabled={true} attributionEnabled={true} scrollEnabled={true} pitchEnabled={false} rotateEnabled={true} zoomEnabled={true} compassEnabled={false}
                            >
                                <MapLibreGL.Camera
                                    defaultSettings={!cameraBounds ? { centerCoordinate: [0, 0], zoomLevel: 1 } : undefined}
                                    bounds={cameraBounds} animationDuration={1000}
                                />
                                <MapLibreGL.ShapeSource id="routeSource" shape={{ type: 'Feature', geometry: { type: 'LineString', coordinates: coordinates }, properties: {} }}>
                                    <MapLibreGL.LineLayer id="routeFill" style={{ lineColor: theme.colors.primary, lineWidth: 6, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.8 }} />
                                </MapLibreGL.ShapeSource>
                            </MapLibreGL.MapView>
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="map-outline" size={64} color={theme.colors.text} />
                            </View>
                        )}
                    </TouchableOpacity>
                    {/* Header Overlay */}
                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: theme.colors.background, borderRadius: 20 }}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        {images.length > 0 && (
                            <TouchableOpacity onPress={handleOpenImages} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                                <Ionicons name="images" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
                                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: theme.colors.primary }}>View Images</Text>
                            </TouchableOpacity>
                        )}
                    </SafeAreaView>
                </View>
            );
        }

        if (sessionType === 'FoodLog') {
            return (
                <View style={{ flex: 1 }}>
                    <TouchableOpacity activeOpacity={images.length > 0 ? 0.9 : 1} onPress={handleOpenImages} style={{ flex: 1, height: '55%' }}>
                        <Image source={{ uri: session.imageUrl || 'https://via.placeholder.com/400' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </TouchableOpacity>
                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        {images.length > 0 && (
                            <TouchableOpacity onPress={handleOpenImages} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                                <Ionicons name="images" size={16} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: "#FFF" }}>View Images</Text>
                            </TouchableOpacity>
                        )}
                    </SafeAreaView>
                </View>
            );
        }

        if (sessionType === 'ProgramSession') {
            return (
                <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', backgroundColor: theme.colors.primary + '20' }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="barbell" size={120} color={theme.colors.primary} />
                        </View>
                    </View>
                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: theme.colors.background, borderRadius: 20 }}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        {images.length > 0 && (
                            <TouchableOpacity onPress={handleOpenImages} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                                <Ionicons name="images" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
                                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: theme.colors.primary }}>View Images</Text>
                            </TouchableOpacity>
                        )}
                    </SafeAreaView>
                </View>
            );
        }
        return null;
    };

    // --- RENDER BOTTOM SHEET CONTENT ---
    const renderContent = () => {
        if (sessionType === 'GeoSession') {
            return (
                <View style={{ padding: 24, paddingBottom: 50 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <View>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>{session.activity_type?.name || "Activity"}</Text>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}>{new Date(session.started_at).toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <View style={{ width: '48%', marginBottom: 16, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16 }}>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}>Distance</Text>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>{session.distance_km?.toFixed(2)} <Text style={{ fontSize: 14 }}>km</Text></Text>
                        </View>
                        <View style={{ width: '48%', marginBottom: 16, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16 }}>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}>Duration</Text>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>{Math.floor((session.moving_time_sec || 0) / 60)} <Text style={{ fontSize: 14 }}>min</Text></Text>
                        </View>
                        <View style={{ width: '48%', marginBottom: 16, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16 }}>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}>Avg Pace</Text>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>{session.avg_pace?.toFixed(2)} <Text style={{ fontSize: 14 }}>/km</Text></Text>
                        </View>
                        <View style={{ width: '48%', marginBottom: 16, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16 }}>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}>Calories</Text>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.primary }}>{session.calories_burned} <Text style={{ fontSize: 14 }}>kcal</Text></Text>
                        </View>
                    </View>
                </View>
            );
        }

        if (sessionType === 'FoodLog') {
            const result = session; // Alias for easier copy-paste
            return (
                <View style={{ padding: 24, paddingBottom: 50 }}>
                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 28, color: theme.colors.text, marginBottom: 8 }}>
                        {result.foodName}
                    </Text>

                    {/* Serving Size */}
                    {result.servingSize && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <MaterialCommunityIcons name="scale" size={16} color={theme.colors.text + '77'} />
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77', marginLeft: 6 }}>
                                Serving: {result.servingSize}
                            </Text>
                        </View>
                    )}

                    {/* Calorie Display */}
                    <View style={{
                        backgroundColor: theme.colors.background, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24
                    }}>
                        <View style={{
                            width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.primary + '15',
                            alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: theme.colors.primary,
                        }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 28, color: theme.colors.primary }}>{result.calories}</Text>
                            <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + '77' }}>kcal</Text>
                        </View>
                    </View>

                    {/* Macros Stats */}
                    {result.nutrients && (
                        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                            {result.nutrients.protein > 0 && <StatCard icon="arm-flex" label="Protein" value={result.nutrients.protein} suffix="g" color="#3b82f6" theme={theme} />}
                            {result.nutrients.carbs > 0 && <StatCard icon="bread-slice" label="Carbs" value={result.nutrients.carbs} suffix="g" color="#8b5cf6" theme={theme} />}
                            {result.nutrients.fat > 0 && <StatCard icon="water" label="Fat" value={result.nutrients.fat} suffix="g" color="#ec4899" theme={theme} />}
                        </View>
                    )}

                    {/* Nutrition Breakdown */}
                    {result.nutrients && (
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16 }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text, marginBottom: 16 }}>Nutrition Facts</Text>
                            <NutrientBar label="Protein" value={result.nutrients.protein} unit="g" max={50} color="#3b82f6" icon="arm-flex" theme={theme} />
                            <NutrientBar label="Carbohydrates" value={result.nutrients.carbs} unit="g" max={300} color="#8b5cf6" icon="bread-slice" theme={theme} />
                            <NutrientBar label="Total Fat" value={result.nutrients.fat} unit="g" max={78} color="#ec4899" icon="water" theme={theme} />
                        </View>
                    )}

                    {/* Healthy Alternatives */}
                    {result.healthyAlternatives?.length > 0 && (
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.success} />
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.success, marginLeft: 8 }}>Healthier Alternatives</Text>
                            </View>
                            {result.healthyAlternatives.map((alt: any, index: number) => (
                                <View key={index} style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }}>{alt.name}</Text>
                                        <Text style={{ color: theme.colors.success, fontSize: 12 }}>-{alt.caloriesSaved} kcal</Text>
                                    </View>
                                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + '99' }}>{alt.reason}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recipe Ideas */}
                    {result.recipeLinks?.length > 0 && (
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 24, padding: 20, marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <MaterialCommunityIcons name="chef-hat" size={20} color={theme.colors.primary} />
                                <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.primary, marginLeft: 8 }}>Recipe Ideas</Text>
                            </View>
                            {result.recipeLinks.map((recipe: any, index: number) => (
                                <TouchableOpacity key={index} onPress={() => Linking.openURL(recipe.url)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface, borderRadius: 12, marginBottom: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>{recipe.title}</Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.text + '77' }}>{recipe.source}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Allergy Warning */}
                    {result.allergyWarnings?.detected?.length > 0 && (
                        <View style={{ backgroundColor: '#fee2e2', borderRadius: 24, padding: 16, flexDirection: 'row' }}>
                            <Ionicons name="warning" size={24} color="#ef4444" style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: theme.fonts.heading, color: '#991b1b', marginBottom: 4 }}>Allergy Warning</Text>
                                <Text style={{ color: '#b91c1c' }}>Contains: {result.allergyWarnings.detected.join(', ')}</Text>
                            </View>
                        </View>
                    )}
                </View>
            );
        }

        if (sessionType === 'ProgramSession') {
            const workouts = session.workouts || [];
            const geoActivities = session.geo_activities || [];

            // Combine all items
            const allItems = [
                ...workouts.map((w: any) => ({ ...w, _type: 'workout' })),
                ...geoActivities.map((g: any) => ({ ...g, _type: 'geo' }))
            ];

            return (
                <View style={{ padding: 24 }}>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.text }}>{session.program_name || session.title || "Workout Session"}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.text + '77'} />
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77', marginLeft: 6 }}>
                                {new Date(session.performed_at).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, backgroundColor: theme.colors.background, padding: 16, borderRadius: 16 }}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>{session.total_duration_minutes}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text + '77' }}>Minutes</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: theme.colors.text + '20' }} />
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text }}>{allItems.length}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text + '77' }}>Exercises</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: theme.colors.text + '20' }} />
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.primary }}>{session.total_calories_burned}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text + '77' }}>Calories</Text>
                        </View>
                    </View>

                    <Text style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text, marginBottom: 16 }}>Exercises Performed</Text>

                    {allItems.map((item: any, index: number) => {
                        const isWorkout = item._type === 'workout';

                        let name, type, animationUrl, icon;

                        if (isWorkout) {
                            name = item.name || item.workout_id?.name || "Exercise";
                            type = item.exercise_type || item.type || item.workout_id?.type;
                            animationUrl = item.animation_url || item.workout_id?.animation_url;
                        } else {
                            name = item.name || item.activity_id?.name || "Activity";
                            type = item.exercise_type || item.type || item.activity_id?.type;
                            // icon = item.activity_id?.icon; // Unused in mobile now, prefer ActivityIcon
                        }

                        return (
                            <View key={index} style={{ marginBottom: 16, padding: 16, backgroundColor: theme.colors.background, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.text + '20' }}>
                                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                                    {/* Animation or Icon */}
                                    <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        {isWorkout && animationUrl ? (
                                            <LottieView source={{ uri: animationUrl }} autoPlay loop style={{ width: '100%', height: '100%' }} />
                                        ) : !isWorkout ? (
                                            <ActivityIcon
                                                activityName={type || 'Other Sports'}
                                                activityType={type}
                                                size={32}
                                                color={theme.colors.primary}
                                            />
                                        ) : (
                                            <Ionicons name="barbell" size={32} color={theme.colors.primary} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>{name}</Text>
                                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 14 }}>{type}</Text>
                                    </View>
                                </View>

                                {/* Sets (Workouts) */}
                                {isWorkout && item.sets && item.sets.length > 0 && (
                                    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12 }}>
                                        {item.sets.map((set: any, setIdx: number) => (
                                            <View key={setIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={{ width: 20, color: theme.colors.text + '55', fontSize: 12 }}>{setIdx + 1}</Text>
                                                {set.reps ? <Text style={{ marginRight: 12, fontFamily: theme.fonts.body, color: theme.colors.text }}><Text style={{ fontFamily: theme.fonts.bodyBold }}>{set.reps}</Text> reps</Text> : null}
                                                {set.weight_kg ? <Text style={{ marginRight: 12, fontFamily: theme.fonts.body, color: theme.colors.text }}><Text style={{ fontFamily: theme.fonts.bodyBold }}>{set.weight_kg}</Text> kg</Text> : null}
                                                {set.time_seconds ? <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}><Text style={{ fontFamily: theme.fonts.bodyBold }}>{set.time_seconds}</Text> sec</Text> : null}
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Stats (Geo) */}
                                {!isWorkout && (
                                    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-around' }}>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>{item.distance_km}</Text>
                                            <Text style={{ fontSize: 10, color: theme.colors.text + '77' }}>km</Text>
                                        </View>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>{Math.floor((item.moving_time_sec || 0) / 60)}</Text>
                                            <Text style={{ fontSize: 10, color: theme.colors.text + '77' }}>min</Text>
                                        </View>
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 16, color: theme.colors.text }}>{item.avg_pace || '-'}</Text>
                                            <Text style={{ fontSize: 10, color: theme.colors.text + '77' }}>/km</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {renderBackground()}

                    <BottomSheet
                        ref={bottomSheetRef}
                        index={0} // Start at 50%
                        snapPoints={snapPoints}
                        backgroundStyle={{ backgroundColor: theme.colors.surface }}
                        handleIndicatorStyle={{ backgroundColor: theme.colors.text + '33' }}
                    >
                        <BottomSheetScrollView>
                            {renderContent()}
                        </BottomSheetScrollView>
                    </BottomSheet>
                </View>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
}
