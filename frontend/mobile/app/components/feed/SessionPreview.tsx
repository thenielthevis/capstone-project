import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import MapView, { Polyline } from 'react-native-maps'; // REPLACED with MapLibre or image equivalent
// Since we want a static preview, and MapLibre might be heavy for a list, 
// STRATEGY: If the backend provides a static map image, use that.
// If not, we might need to render a small map.
// However, Strava usually generates a static image on the backend.
// The user request said: "For GeoSession, the 1st picture must be the map with polyline."
// This implies the map view should be rendered.
// Given MapLibre, let's try to use a simplified view or just a placeholder if it's too heavy, 
// but the user wants "imitate Strava". 
// Strava behaves by showing the map. 
// Let's use a non-interactive map.

import Constants from "expo-constants";
import MapLibreGL from '@maplibre/maplibre-react-native';

const MAPTILER_KEY =
    Constants?.expoConfig?.extra?.MAPTILER_KEY ||
    process.env.EXPO_PUBLIC_MAPTILER_KEY;

// Types
type SessionPreviewProps = {
    reference: {
        item_id: any;
        item_type: 'GeoSession' | 'ProgramSession' | 'FoodLog';
    };
    style?: any;
    extraParams?: any;
};

export default function SessionPreview({ reference, style, extraParams }: SessionPreviewProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const { item_id: session, item_type } = reference;

    if (!session) return null;

    const handlePress = () => {
        router.push({
            pathname: "/components/feed/SessionDetails",
            params: {
                sessionType: item_type,
                sessionData: JSON.stringify(session),
                ...extraParams
            }
        });
    };

    // --- GeoSession Render ---
    if (item_type === 'GeoSession') {
        let coordinates = [];
        if (session.route_coordinates && session.route_coordinates.length > 0) {
            coordinates = session.route_coordinates.map((c: any) => [c.longitude, c.latitude]);
        }

        // Bounds for camera
        let cameraBounds: { ne: [number, number]; sw: [number, number]; paddingBottom?: number; paddingLeft?: number; paddingRight?: number; paddingTop?: number } | undefined;

        if (coordinates.length > 0) {
            const lons = coordinates.map((c: any) => c[0]);
            const lats = coordinates.map((c: any) => c[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            cameraBounds = {
                ne: [maxLon, maxLat],
                sw: [minLon, minLat],
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 20,
                paddingBottom: 20
            };
        }

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className="mr-3 overflow-hidden rounded-xl bg-gray-100 relative"
                style={[{ width: 300, height: 256, backgroundColor: theme.colors.surface }, style]}
            >
                {/* Map View or Static Preview */}
                {session.preview_image ? (
                    <Image
                        source={{ uri: session.preview_image }}
                        style={{ flex: 1, width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    coordinates.length > 0 ? (
                        <MapLibreGL.MapView
                            style={{ flex: 1 }}
                            mapStyle={
                                theme.mode === "dark"
                                    ? "https://api.maptiler.com/maps/019b1d6d-f87f-771b-88b8-776fa8f37312/style.json?key=" + MAPTILER_KEY
                                    : `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
                            }
                            logoEnabled={false}
                            attributionEnabled={false}
                            scrollEnabled={false}
                            pitchEnabled={false}
                            rotateEnabled={false}
                            zoomEnabled={false}
                            compassEnabled={false}
                        >
                            <MapLibreGL.Camera
                                defaultSettings={!cameraBounds ? { centerCoordinate: [0, 0], zoomLevel: 1 } : undefined}
                                bounds={cameraBounds}
                                animationDuration={0}
                            />
                            <MapLibreGL.ShapeSource id="routeSource" shape={{ type: 'Feature', geometry: { type: 'LineString', coordinates: coordinates }, properties: {} }}>
                                <MapLibreGL.LineLayer id="routeFill" style={{ lineColor: theme.colors.primary, lineWidth: 4, lineCap: 'round', lineJoin: 'round', lineOpacity: 0.8 }} />
                            </MapLibreGL.ShapeSource>
                        </MapLibreGL.MapView>
                    ) : (
                        <View className="flex-1 items-center justify-center bg-gray-200">
                            <Ionicons name="map-outline" size={48} color={theme.colors.text + '33'} />
                        </View>
                    )
                )}

                {/* Overlay Info */}
                <View className="absolute bottom-0 left-0 right-0 p-3" style={{ backgroundColor: theme.colors.surface + 'CC' }}>
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
                                {session.activity_type?.name || "Activity"}
                            </Text>
                            <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 12 }}>
                                {new Date(session.started_at).toLocaleDateString()} • {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View className="bg-primary/20 p-2 rounded-full" style={{ backgroundColor: theme.colors.primary + '20' }}>
                            <Ionicons name="location" size={16} color={theme.colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // --- FoodLog Render ---
    if (item_type === 'FoodLog') {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className="mr-3 overflow-hidden rounded-xl relative"
                style={[{ width: 300, height: 256, backgroundColor: theme.colors.surface }, style]}
            >
                <Image
                    source={{ uri: session.imageUrl || 'https://via.placeholder.com/300' }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
                {/* Kcal Overlay */}
                <View className="absolute top-4 left-3 px-3 py-1 rounded-full" style={{ backgroundColor: theme.colors.background + 'EE' }}>
                    <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary, fontSize: 14 }}>
                        {session.calories} kcal
                    </Text>
                </View>

                {/* Bottom Info */}
                <View className="absolute bottom-0 left-0 right-0 p-3" style={{ backgroundColor: theme.colors.surface + 'CC' }}>
                    <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 16 }}>
                        {session.foodName}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 12, marginRight: 8 }}>
                            Protein: {session.nutrients?.protein}g
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 12, marginRight: 8 }}>
                            Carbs: {session.nutrients?.carbs}g
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99', fontSize: 12 }}>
                            Fat: {session.nutrients?.fat}g
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // --- ProgramSession Render ---
    if (item_type === 'ProgramSession') {
        const workouts = session.workouts || [];
        const geoActivities = session.geo_activities || [];

        // Get unique exercise types from both workouts and geo activities
        const exerciseTypes = [
            ...workouts.map((w: any) => w.exercise_type || w.type || w.workout_id?.type).filter(Boolean),
            ...geoActivities.map((g: any) => g.exercise_type || g.type || g.activity_id?.type).filter(Boolean)
        ];
        const uniqueTypes = [...new Set(exerciseTypes)].slice(0, 3); // Limit to 3 types

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className="mr-3 overflow-hidden rounded-xl p-4 justify-between"
                style={[{ width: 300, height: 256, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.overlay + '20' }, style]}
            >
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
                            <Ionicons name="barbell" size={24} color={theme.colors.primary} />
                        </View>
                    </View>

                    <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text, fontSize: 20, marginBottom: 8 }}>
                        {session.program_name || session.title || "Workout Session"}
                    </Text>

                    {/* Exercise Type Badges */}
                    {uniqueTypes.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {uniqueTypes.map((type, idx) => (
                                <View key={idx} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.colors.primary + '15' }}>
                                    <Text style={{ fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.primary }}>
                                        {type}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View>
                    <View className="flex-row items-center justify-between py-2 border-b" style={{ borderBottomColor: theme.colors.overlay + '10' }}>
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>Duration</Text>
                        <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
                            {session.total_duration_minutes} min
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between py-2 border-b" style={{ borderBottomColor: theme.colors.overlay + '10' }}>
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>Volume</Text>
                        <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
                            {workouts.length + geoActivities.length} Exercises
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between py-2">
                        <Text style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>Calories</Text>
                        <Text style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
                            {session.total_calories_burned} kcal
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return null;
}
