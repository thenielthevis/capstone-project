import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapLibreGL, {Logger} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import ActivityDrawer from "../../components/ActivityDrawer";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";

Logger.setLogCallback(log => {
  const { message } = log;
    if (  message.match('Request failed due to a permanent error: Canceled')  ) {
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
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(true); // camera follows user by default
  const [mapBearing, setMapBearing] = useState<number>(0); // 0 = north-up, -1 = compass-follow
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState<number>(0);
  
  // Track previous location and timestamp for calculations
  const prevLocationRef = useRef<[number, number] | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const totalDistanceRef = useRef<number>(0);

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

          // Calculate speed and distance only when recording
          if (recording) {
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
                setDistance(totalDistanceRef.current);

                // Calculate speed: distance (km) / time (hours) = km/h
                const timeDiff = (currentTimestamp - prevTimestampRef.current) / 1000 / 3600; // Convert to hours
                if (timeDiff > 0) {
                  const calculatedSpeed = segmentDistance / timeDiff;
                  // Filter out unrealistic speeds (e.g., > 200 km/h for running/cycling)
                  setSpeed(Math.min(calculatedSpeed, 200));
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
  }, [following, mapBearing, recording]);

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
    } catch (e) {}
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

  // map region changes initiated by user should disable following
  const onRegionWillChange = () => {
    // if the change is not programmatic, user likely panned/zoomed -> stop following
    if (!isProgrammaticRef.current) {
      setFollowing(false);
    }
  };

  // Timer effect - continues from where it left off when paused/resumed
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (recording) {
      interval = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording]);

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
    setRecording(isRecording);
    
    // When starting recording, initialize previous location if we have current location
    if (isRecording && location) {
      prevLocationRef.current = location;
      prevTimestampRef.current = Date.now();
    }
    // Note: Timer continues from where it left off (doesn't reset on pause)
    // Distance and speed also persist when paused
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
      <View className="flex-1 items-center justify-center" style={styles.container}>
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
    <View className="flex-1 relative" style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`}
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
          pitch={80}
        />
        <MapLibreGL.UserLocation visible={false} showsUserHeadingIndicator={false} />
        <MapLibreGL.PointAnnotation id="user-location" coordinate={location}>
          <Animated.View
            style={[
              styles.markerWrapper,
              { transform: [{ rotate: `${heading}deg` }] },
            ]}
          >
            <View style={styles.accuracyCircle} />
            <View style={[styles.markerOuter, following ? styles.markerActive : null]}>
              <View style={styles.markerCenter} />
            </View>
            <View style={styles.markerPointer} />
          </Animated.View>
        </MapLibreGL.PointAnnotation>
      </MapLibreGL.MapView>

      <View style={styles.topRightContainer} pointerEvents="box-none">
        <TouchableOpacity
          onPress={handlePrimaryButton}
          className="bg-white rounded-full p-3 shadow-lg"
          style={styles.primaryButton}
        >
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Ionicons
              name="compass"
              size={22}
              color={mapBearing === -1 ? "#007AFF" : "#333"}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <ActivityDrawer 
        speed={speed}
        distance={distance}
        time={time}
        recording={recording}
        onRecordingChange={handleRecordingChange}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  /* marker layout */
  markerWrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  accuracyCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 122, 255, 0.16)",
    zIndex: 0,
  },
  markerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    elevation: 6,
    zIndex: 2,
  },
  markerActive: {
    backgroundColor: "#007AFF",
  },
  markerCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  /* front pointer triangle (pointing up). It will rotate with the wrapper. */
  markerPointer: {
    position: "absolute",
    top: 6, // sits above the circular body
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
    zIndex: 3,
    transform: [{ translateY: -18 }],
  },

  /* single floating button container (top-right) */
  topRightContainer: {
    position: "absolute",
    right: 14,
    top: 14,
    alignItems: "center",
  },
  primaryButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
});