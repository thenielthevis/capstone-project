import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Text,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapLibreGL, { Logger } from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { Ionicons, AntDesign, Entypo } from "@expo/vector-icons";
import ActivityDrawer from "../../components/ActivityDrawer";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useActivityMetrics } from "../../context/ActivityMetricsContext";
import { useUser } from "../../context/UserContext";
import { createGeoSession } from "../../api/geoSessionApi";
import { getTodayCalorieBalance } from "../../api/userApi";

Logger.setLogCallback(log => {
  const { message } = log;
  if (message.match('Request failed due to a permanent error: Canceled')) {
    return true;
  }
  return false;
});

// safer Constants access (fixes common runtime/manifest differences)
const MAPTILER_KEY =
  Constants?.expoConfig?.extra?.MAPTILER_KEY ||
  process.env.EXPO_PUBLIC_MAPTILER_KEY;

export default function TestMap() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const {
    speed: contextSpeed,
    distance: contextDistance,
    time: contextTime,
    recording: contextRecording,
    activityType,
    setSpeed: setContextSpeed,
    setDistance: setContextDistance,
    setTime: setContextTime,
    setRecording: setContextRecording,
    addSplit,
    resetMetrics,
    calculateCaloriesBurned,
  } = useActivityMetrics();

  const [location, setLocation] = useState<[number, number] | null>(null);
  // Store the route as an array of [lon, lat]
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [heading, setHeading] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(true); // camera follows user by default
  const [mapBearing, setMapBearing] = useState<number>(0); // 0 = north-up, -1 = compass-follow
  const [mapPitch, setMapPitch] = useState<number>(80); // default pitch

  // Track previous location and timestamp for calculations
  const prevLocationRef = useRef<[number, number] | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const totalDistanceRef = useRef<number>(0);
  const lastKmMarkerRef = useRef<number>(0); // Track last km milestone
  const kmStartTimeRef = useRef<number>(0); // Track when current km started
  const timeRef = useRef<number>(0); // Track current time for timer

  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const locSubRef = useRef<any>(null);
  const headSubRef = useRef<any>(null);
  const compassAnim = useRef(new Animated.Value(0)).current;

  // flag to avoid treating programmatic camera moves as user interactions
  const isProgrammaticRef = useRef(false);

  // request permissions, get initial location and start watchers
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!mounted) return;
      setLocation([initial.coords.longitude, initial.coords.latitude]);
      setHeading(initial.coords.heading ?? 0);
      setMapBearing(0);
      setLoading(false);

      locSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0.5,
        },
        (pos) => {
          const coords: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];

          setLocation(coords);
          // Track route while recording
          if (contextRecording) {
            setRouteCoords((prev) => [...prev, coords]);
          }

          // Calculate speed and distance only when recording
          if (contextRecording) {
            const currentTimestamp = Date.now();
            const currentLat = pos.coords.latitude;
            const currentLon = pos.coords.longitude;

            // Check if we have a previous location to calculate from
            if (prevLocationRef.current && prevTimestampRef.current) {
              const [prevLon, prevLat] = prevLocationRef.current;

              // Calculate distance between previous and current location
              const segmentDistance = calculateDistance(
                prevLat,
                prevLon,
                currentLat,
                currentLon
              );

              // Only accumulate distance if movement is significant (filter out GPS noise)
              if (segmentDistance > 0.001) { // ~100 meters threshold
                totalDistanceRef.current += segmentDistance;
                const newDistance = totalDistanceRef.current;
                setContextDistance(newDistance);

                // Check if we've completed a new kilometer
                const currentKm = Math.floor(newDistance);
                if (currentKm > lastKmMarkerRef.current) {
                  // Calculate split time for the completed km
                  const kmTime = contextTime - kmStartTimeRef.current;
                  const kmPace = kmTime; // seconds per km

                  addSplit({
                    km: currentKm,
                    time: kmTime,
                    pace: kmPace,
                  });

                  lastKmMarkerRef.current = currentKm;
                  kmStartTimeRef.current = contextTime;
                }

                // Calculate speed: distance (km) / time (hours) = km/h
                const timeDiff = (currentTimestamp - prevTimestampRef.current) / 1000 / 3600; // Convert to hours
                if (timeDiff > 0) {
                  const calculatedSpeed = segmentDistance / timeDiff;
                  // Filter out unrealistic speeds (e.g., > 200 km/h for running/cycling)
                  setContextSpeed(Math.min(calculatedSpeed, 200));
                }
              }
            }

            // Update previous location and timestamp
            prevLocationRef.current = coords;
            prevTimestampRef.current = currentTimestamp;

          } else {
            // Reset when not recording
            prevLocationRef.current = null;
            prevTimestampRef.current = null;
            // Optionally, stop adding to route but do not clear it here
          }

          // only auto-center while "following" is true (user hasn't panned away)
          if (following && cameraRef.current) {
            try {
              isProgrammaticRef.current = true;
              cameraRef.current.setCamera({
                centerCoordinate: coords,
                zoomLevel: undefined, // preserve current zoom
                animationDuration: 500,
                heading: mapBearing !== 0 ? mapBearing : undefined,
              });
              setTimeout(() => (isProgrammaticRef.current = false), 650);
            } catch (e) {
              isProgrammaticRef.current = false;
            }
          }
        }
      );

      headSubRef.current = await Location.watchHeadingAsync((h) => {
        const newHeading = h.trueHeading ?? h.magHeading ?? 0;
        setHeading(newHeading);
        // animate top-right compass icon
        Animated.timing(compassAnim, {
          toValue: newHeading,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // if in compass-follow mode, rotate map to heading
        if (following && mapBearing === -1) {
          if (cameraRef.current) {
            try {
              isProgrammaticRef.current = true;
              cameraRef.current.setCamera({
                heading: newHeading,
                animationDuration: 300,
              });
              setTimeout(() => (isProgrammaticRef.current = false), 350);
            } catch (e) {
              isProgrammaticRef.current = false;
            }
          }
        }
      });
    })();

    return () => {
      mounted = false;
      if (locSubRef.current) locSubRef.current.remove();
      if (headSubRef.current) headSubRef.current.remove();
    };
  }, [following, mapBearing, contextRecording]);

  // helper: check whether user's location is within current visible bounds
  const isLocationVisible = async (): Promise<boolean> => {
    if (!mapRef.current || !location) return false;
    try {
      // MapLibreGL.MapView#getVisibleBounds -> [[minLon,minLat],[maxLon,maxLat]]
      const bounds = await mapRef.current.getVisibleBounds();
      if (!bounds || bounds.length < 2) return false;
      const [[minLon, minLat], [maxLon, maxLat]] = bounds;
      const [lon, lat] = location;
      const visible =
        lon >= Math.min(minLon, maxLon) &&
        lon <= Math.max(minLon, maxLon) &&
        lat >= Math.min(minLat, maxLat) &&
        lat <= Math.max(minLat, maxLat);
      return visible;
    } catch (e) {
      // fallback: assume visible (avoid forcing recenter if uncertain)
      return true;
    }
  };

  // helper: try to read current zoom (best-effort), fallback to 20
  const getCurrentZoom = async (): Promise<number> => {
    try {
      if (mapRef.current?.getZoom) {
        const z = await mapRef.current.getZoom();
        if (typeof z === "number") return z;
      }
      if (cameraRef.current?.getZoom) {
        const z = await cameraRef.current.getZoom();
        if (typeof z === "number") return z;
      }
    } catch (e) { }
    return 20;
  };

  // main dual-purpose button handler
  const handlePrimaryButton = async () => {
    if (!location || !cameraRef.current) return;

    const visible = await isLocationVisible();

    if (!visible) {
      // bring map back to the user location while preserving zoom
      try {
        const zoom = await getCurrentZoom();
        isProgrammaticRef.current = true;
        cameraRef.current.setCamera({
          centerCoordinate: location,
          zoomLevel: zoom,
          animationDuration: 600,
        });
        // when bringing user back, re-enable following but do NOT force rotation
        setFollowing(true);
        setMapBearing(0);
        setTimeout(() => (isProgrammaticRef.current = false), 700);
      } catch (e) {
        isProgrammaticRef.current = false;
      }
    } else {
      // location is visible -> toggle between north-up (0) and compass-follow (-1)
      if (mapBearing === 0) {
        setMapBearing(-1);
        setFollowing(true);
        try {
          isProgrammaticRef.current = true;
          cameraRef.current.setCamera({
            heading: heading,
            animationDuration: 300,
          });
          setTimeout(() => (isProgrammaticRef.current = false), 350);
        } catch (e) {
          isProgrammaticRef.current = false;
        }
      } else {
        // reset to north-up
        setMapBearing(0);
        try {
          isProgrammaticRef.current = true;
          cameraRef.current.setCamera({
            heading: 0,
            animationDuration: 300,
          });
          setTimeout(() => (isProgrammaticRef.current = false), 350);
        } catch (e) {
          isProgrammaticRef.current = false;
        }
      }
    }
  };

  // floating button to toggle pitch between 0 and 80
  const handlePitchToggle = () => {
    const newPitch = mapPitch === 0 ? 80 : 0;
    setMapPitch(newPitch);
    if (cameraRef.current) {
      isProgrammaticRef.current = true;
      cameraRef.current.setCamera({
        pitch: newPitch,
        animationDuration: 400,
      });
      setTimeout(() => (isProgrammaticRef.current = false), 450);
    }
  };

  // map region changes initiated by user should disable following
  const onRegionWillChange = () => {
    // if the change is not programmatic, user likely panned/zoomed -> stop following
    if (!isProgrammaticRef.current) {
      setFollowing(false);
    }
  };

  // Sync timeRef with contextTime
  useEffect(() => {
    timeRef.current = contextTime;
  }, [contextTime]);

  // Timer effect - continues from where it left off when paused/resumed
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (contextRecording) {
      interval = setInterval(() => {
        timeRef.current += 1;
        setContextTime(timeRef.current);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contextRecording, setContextTime]);

  // Format time helper function
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };


  // Handle recording state changes from ActivityDrawer
  const handleRecordingChange = (isRecording: boolean) => {
    setContextRecording(isRecording);
    // When starting recording, initialize previous location if we have current location
    if (isRecording && location) {
      prevLocationRef.current = location;
      prevTimestampRef.current = Date.now();
      kmStartTimeRef.current = contextTime || 0;
      lastKmMarkerRef.current = Math.floor(contextDistance || 0);
      // Start new route if not already started
      if (routeCoords.length === 0) {
        setRouteCoords([location]);
      }
    }
    // Note: Timer continues from where it left off (doesn't reset on pause)
    // Distance and speed also persist when paused
  };

  // Handle finish action - save activity session and update calorie balance
  const handleFinish = async () => {
    try {
      // Get user weight for calorie calculation (default 70kg if not available)
      const userWeight = user?.physicalMetrics?.weight?.value || 70;
      const caloriesBurned = calculateCaloriesBurned(userWeight);

      // Only save if there was actual activity
      if (contextTime > 0 && contextDistance > 0) {
        // Calculate average pace (min/km)
        const avgPace = contextDistance > 0 ? (contextTime / 60) / contextDistance : 0;

        // Prepare route coordinates for saving
        const routeForSave = routeCoords.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }));

        // Create geo session with activity data
        const sessionPayload = {
          activity_type: getActivityId(activityType), // Map activity type to ID
          distance_km: contextDistance,
          avg_pace: avgPace,
          moving_time_sec: contextTime,
          route_coordinates: routeForSave,
          calories_burned: caloriesBurned,
          started_at: new Date(Date.now() - contextTime * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        };

        const response = await createGeoSession(sessionPayload);
        console.log('[Activity] Session saved successfully, calories burned:', caloriesBurned);

        // Refresh calorie balance after saving
        try {
          await getTodayCalorieBalance();
          console.log('[Activity] Calorie balance refreshed');
        } catch (error) {
          console.error('[Activity] Error refreshing calorie balance:', error);
        }

        // Prompt to share
        Alert.alert(
          "Session Saved",
          "Would you like to share this activity to your feed?",
          [
            {
              text: "No, thanks",
              onPress: () => {
                // Reset all metrics
                resetMetrics();
                // Reset local refs
                totalDistanceRef.current = 0;
                lastKmMarkerRef.current = 0;
                kmStartTimeRef.current = 0;
                prevLocationRef.current = null;
                prevTimestampRef.current = null;
                setRouteCoords([]); // Clear route
                router.back();
              },
              style: "cancel"
            },
            {
              text: "Share",
              onPress: () => {
                // Reset all metrics
                resetMetrics();
                // Reset local refs
                totalDistanceRef.current = 0;
                lastKmMarkerRef.current = 0;
                kmStartTimeRef.current = 0;
                prevLocationRef.current = null;
                prevTimestampRef.current = null;
                setRouteCoords([]); // Clear route

                router.push({
                  pathname: "/screens/post/post_session",
                  params: {
                    type: "GeoSession",
                    id: response._id, // Ensure response has _id
                    title: activityType,
                    subtitle: `${contextDistance.toFixed(2)} km • ${formatTime(contextTime)}`
                  }
                });
              }
            }
          ]
        );
      } else {
        // No activity data
        resetMetrics();
        // Reset local refs
        totalDistanceRef.current = 0;
        lastKmMarkerRef.current = 0;
        kmStartTimeRef.current = 0;
        prevLocationRef.current = null;
        prevTimestampRef.current = null;
        setRouteCoords([]);
        router.back();
      }
    } catch (error) {
      console.error('[Activity] Error saving activity session:', error);
      Alert.alert('Note', 'Activity data could not be saved, but your session has ended.');
      // Still exit on error?
      resetMetrics();
      // Reset local refs
      totalDistanceRef.current = 0;
      lastKmMarkerRef.current = 0;
      kmStartTimeRef.current = 0;
      prevLocationRef.current = null;
      prevTimestampRef.current = null;
      setRouteCoords([]);
      router.back();
    }
    // Removed direct code here since it's handled in Alert callbacks now

  };

  // Map activity type to a placeholder activity ID (you may need to adjust based on your DB)
  const getActivityId = (type: string): string => {
    // These IDs should match your GeoActivity collection
    // For now, using placeholder - replace with actual IDs from your database
    const activityIds: Record<string, string> = {
      Running: '000000000000000000000001',
      Walking: '000000000000000000000002',
      Cycling: '000000000000000000000003',
    };
    return activityIds[type] || activityIds.Running;
  };

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  if (loading || !location) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // compass icon rotation interpolation
  const rotateInterpolate = compassAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="px-6 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 relative">
        <MapLibreGL.MapView
          ref={mapRef}
          style={{ flex: 1 }}
          mapStyle={
            theme.mode === "dark"
              ? "https://api.maptiler.com/maps/019b1d6d-f87f-771b-88b8-776fa8f37312/style.json?key=" + MAPTILER_KEY
              : `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
          }
          compassEnabled={false}
          logoEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          onRegionWillChange={onRegionWillChange}
          onPress={() => {
            if (!isProgrammaticRef.current) setFollowing(false);
          }}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            zoomLevel={19}
            centerCoordinate={location}
            animationMode="flyTo"
            pitch={mapPitch}
          />
          {/* Hide default UserLocation marker, use PointAnnotation for custom marker at polyline end */}
          {location && (
            <MapLibreGL.PointAnnotation id="user-location" coordinate={location}>
              <Animated.View
                className="w-16 h-16 items-center justify-center"
                style={{
                  transform: [
                    { rotate: `${(heading - mapBearing + 360) % 360}deg` },
                    { perspective: 800 },
                    { rotateX: `${-mapPitch * 0.6}deg` },
                  ],
                }}
              >
                {/* Accuracy halo */}
                <View
                  className="absolute w-14 h-14 rounded-full"
                  style={{
                    backgroundColor: theme.colors.primary + "1A",
                    borderWidth: 1,
                    borderColor: theme.colors.primary + "33",
                  }}
                />

                {/* Soft ambient glow */}
                <View
                  className="absolute w-12 h-12 rounded-full"
                  style={{
                    backgroundColor: theme.colors.primary + "0F",
                  }}
                />

                {/* Strava-style heading beam (outer soft layer) */}
                <View
                  style={{
                    position: "absolute",
                    top: -18,
                    width: 48,
                    height: 60,
                    backgroundColor: theme.colors.primary + "44",
                    opacity: 0.35,
                    transform: [
                      { translateY: -10 },
                      { scaleX: 1.2 },
                    ],
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                />

                {/* Middle beam */}
                <View
                  style={{
                    position: "absolute",
                    top: -18,
                    width: 34,
                    height: 52,
                    backgroundColor: theme.colors.primary + "66",
                    opacity: 0.45,
                    transform: [
                      { translateY: -10 },
                      { scaleX: 0.9 },
                    ],
                  }}
                />

                {/* Inner bright beam */}
                <View
                  style={{
                    position: "absolute",
                    top: -18,
                    width: 20,
                    height: 44,
                    backgroundColor: theme.colors.primary + "77",
                    opacity: 0.6,
                    transform: [
                      { translateY: -10 },
                      { scaleX: 0.6 },
                    ],
                  }}
                />
                {/* Main puck */}
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#fff",
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 8,
                  }}
                >
                  {/* Inner core */}
                  <View
                    className="w-6 h-6 rounded-full"
                    style={{
                      backgroundColor: theme.colors.primary,
                    }}
                  />
                </View>
              </Animated.View>
            </MapLibreGL.PointAnnotation>
          )}
          {/* Route Polyline */}
          {routeCoords.length > 1 && (
            <MapLibreGL.ShapeSource
              id="routeLine"
              shape={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: routeCoords,
                },
              }}
            >
              <MapLibreGL.LineLayer
                id="routeLineLayer"
                style={{
                  lineColor: theme.colors.primary,
                  lineWidth: 6,
                  lineCap: "round",
                  lineJoin: "round",
                  lineOpacity: 0.8,
                }}
              />
            </MapLibreGL.ShapeSource>
          )}
        </MapLibreGL.MapView>

        {/* Floating buttons: compass and pitch reset */}
        <View className="absolute right-4 top-4 items-center" pointerEvents="box-none">
          <TouchableOpacity
            onPress={handlePrimaryButton}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg mb-3"
          >
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Entypo
                name="compass"
                size={24}
                color={mapBearing === -1 ? "#000000" : theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePitchToggle}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <Ionicons
              name="layers-outline"
              size={24}
              color={mapPitch === 0 ? "#000000" : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
        <ActivityDrawer
          speed={contextSpeed}
          distance={contextDistance}
          time={contextTime}
          recording={contextRecording}
          onRecordingChange={handleRecordingChange}
          onFinish={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
}

