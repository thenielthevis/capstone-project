import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { tokenStorage } from '@/utils/tokenStorage';
import {
  enqueueSession,
  clearInProgressSession,
  startAutoSync,
  flushQueue,
} from "../../utils/offlineSessionQueue";
import NetInfo from "@react-native-community/netinfo";
import {
  downloadTilesForRecording,
  expandIfNeeded,
  cleanupOldPacks,
  getMapStyleURL,
} from "../../utils/offlineTileManager";

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
  const { user, setUser } = useUser();
  const {
    speed: contextSpeed,
    distance: contextDistance,
    time: contextTime,
    recording: contextRecording,
    activityType,
    activities,
    refs, // ← high-frequency refs
    setSpeed: setContextSpeed,
    setDistance: setContextDistance,
    setTime: setContextTime,
    setRecording: setContextRecording,
    addSplit,
    resetMetrics,
    calculateCaloriesBurned,
    flushToState,
    SPLIT_DISTANCE_KM,
    isDistanceBased,
    programMode,
    programGeoPreferences,
    setProgramGeoResult,
  } = useActivityMetrics();

  const [location, setLocation] = useState<[number, number] | null>(null);
  // Route coords stored in ref (no re-renders on every GPS tick)
  // A throttled GeoJSON state is used only for map rendering
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [heading, setHeading] = useState<number>(0);
  const headingRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean>(true);
  const [mapBearing, setMapBearing] = useState<number>(0);
  const [mapPitch, setMapPitch] = useState<number>(80);
  const currentSpeedRef = useRef<number>(0);
  const latestCoordsRef = useRef<[number, number] | null>(null);

  // Stable refs for values used inside location/heading callbacks
  // This prevents tearing down the watcher on every state change
  const followingRef = useRef(following);
  const mapBearingRef = useRef(mapBearing);
  followingRef.current = following;
  mapBearingRef.current = mapBearing;

  // Constants - Removed local SPLIT_DISTANCE_KM definition as it is now in context

  // Track previous location and timestamp for calculations
  const prevLocationRef = useRef<[number, number] | null>(null);
  const prevTimestampRef = useRef<number | null>(null);
  const totalDistanceRef = useRef<number>(0);
  const lastSplitIndexRef = useRef<number>(0);
  const splitStartTimeRef = useRef<number>(0);

  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const locSubRef = useRef<any>(null);
  const headSubRef = useRef<any>(null);
  const compassAnim = useRef(new Animated.Value(0)).current;

  // flag to avoid treating programmatic camera moves as user interactions
  const isProgrammaticRef = useRef(false);

  // Centralised map style URL (shared with offline tile manager)
  const mapStyleURL = getMapStyleURL(theme.mode as "dark" | "light", MAPTILER_KEY);

  // ── Start auto-sync + clean up old tile packs on mount ──
  useEffect(() => {
    startAutoSync(createGeoSession);
    flushQueue(createGeoSession);
    cleanupOldPacks();
  }, []);

  // ── Tell MapLibreGL about connectivity so it stops retrying tile loads offline ──
  // This is the #1 fix for offline lag: without it the map queues hundreds of
  // failing HTTP requests for tiles, each timing out and jamming the JS thread.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      try {
        (MapLibreGL as any).setConnected(!!state.isConnected);
      } catch (_) {
        // setConnected may not be available in all MapLibre RN versions
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Throttled UI updater: marker, camera, route polyline (every 2 s while recording) ──
  // Batching these prevents per-tick re-renders that jam the JS thread
  // when the map can't load tiles (offline).
  useEffect(() => {
    if (!contextRecording) return;
    const id = setInterval(() => {
      // 1. Update map marker position + heading
      const latest = latestCoordsRef.current;
      if (latest) {
        setLocation(latest);
      }
      setHeading(headingRef.current);
      Animated.timing(compassAnim, {
        toValue: headingRef.current,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // 2. Update route polyline
      const route = refs.routeCoords.current;
      if (route.length > 1) {
        setRouteGeoJSON({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route,
          },
        });
      }

      // 3. Expand offline tile coverage if user is near the edge of cached area
      if (latest) {
        expandIfNeeded(latest[0], latest[1], mapStyleURL).catch(() => {});
      }

      // 4. Camera follow (smooth animation spans the full 2 s interval)
      if (latest && followingRef.current && cameraRef.current) {
        try {
          isProgrammaticRef.current = true;
          cameraRef.current.setCamera({
            centerCoordinate: latest,
            animationDuration: 1800,
            heading: mapBearingRef.current !== 0 ? mapBearingRef.current : undefined,
          });
          setTimeout(() => (isProgrammaticRef.current = false), 1900);
        } catch (e) {
          isProgrammaticRef.current = false;
        }
      }
    }, 2000);
    return () => clearInterval(id);
  }, [contextRecording]);

  // ── GPS + heading watchers (mounted ONCE, use refs for all mutable deps) ──
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
          distanceInterval: 2,
        },
        (pos) => {
          const coords: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];

          // Always store latest position in ref (UI update throttled to 2 s while recording)
          latestCoordsRef.current = coords;

          // ── Recording logic (writes to REFS only — zero re-renders) ──
          if (refs.recording.current) {
            // Filter out points with poor accuracy (> 20 m)
            if (pos.coords.accuracy && pos.coords.accuracy > 20) {
              return;
            }

            // Append to route ref (no state update — GeoJSON throttled separately)
            refs.routeCoords.current.push(coords);

            const currentTimestamp = Date.now();
            const currentLat = pos.coords.latitude;
            const currentLon = pos.coords.longitude;

            let instantaneousSpeed = (pos.coords.speed ?? 0) * 3.6;
            if (instantaneousSpeed < 0) instantaneousSpeed = 0;

            if (prevLocationRef.current && prevTimestampRef.current) {
              const [prevLon, prevLat] = prevLocationRef.current;
              const segmentDistance = calculateDistance(prevLat, prevLon, currentLat, currentLon);
              const MOVEMENT_THRESHOLD = 0.001; // 1 meter in km

              if (segmentDistance > MOVEMENT_THRESHOLD) {
                totalDistanceRef.current += segmentDistance;
                // Write to ref — state flushed on interval
                refs.distance.current = totalDistanceRef.current;

                prevLocationRef.current = coords;
                prevTimestampRef.current = currentTimestamp;

                // Split detection
                const currentSplitIndex = Math.floor(totalDistanceRef.current / SPLIT_DISTANCE_KM);
                if (currentSplitIndex > lastSplitIndexRef.current) {
                  const splitTime = refs.time.current - splitStartTimeRef.current;
                  const splitPace = splitTime / SPLIT_DISTANCE_KM;
                  const splitLabel = currentSplitIndex * SPLIT_DISTANCE_KM;

                  console.log(`[Split] Completed split ${currentSplitIndex}: ${splitLabel.toFixed(2)}km, time=${splitTime}s, pace=${splitPace.toFixed(1)}s/km`);

                  addSplit({
                    km: Number(splitLabel.toFixed(2)),
                    time: splitTime,
                    pace: splitPace,
                  });

                  lastSplitIndexRef.current = currentSplitIndex;
                  splitStartTimeRef.current = refs.time.current;
                }
              }

              // Fallback speed from distance if OS speed unavailable
              if (instantaneousSpeed === 0 && segmentDistance > MOVEMENT_THRESHOLD) {
                const timeDiff = (currentTimestamp - (prevTimestampRef.current || currentTimestamp)) / 1000 / 3600;
                if (timeDiff > 0) instantaneousSpeed = segmentDistance / timeDiff;
              }
            } else if (!prevLocationRef.current) {
              prevLocationRef.current = coords;
              prevTimestampRef.current = currentTimestamp;
            }

            // EMA smoothing → write to ref
            const alpha = 0.2;
            currentSpeedRef.current = alpha * instantaneousSpeed + (1 - alpha) * currentSpeedRef.current;
            refs.speed.current = currentSpeedRef.current < 1.0 ? 0 : Math.min(currentSpeedRef.current, 120);

          } else {
            // Not recording — update marker immediately + reset trackers
            setLocation(coords);
            prevLocationRef.current = null;
            prevTimestampRef.current = null;
            currentSpeedRef.current = 0;

            // Camera follow (while recording this is handled by the 2 s throttle)
            if (followingRef.current && cameraRef.current) {
              try {
                isProgrammaticRef.current = true;
                cameraRef.current.setCamera({
                  centerCoordinate: coords,
                  zoomLevel: undefined,
                  animationDuration: 500,
                  heading: mapBearingRef.current !== 0 ? mapBearingRef.current : undefined,
                });
                setTimeout(() => (isProgrammaticRef.current = false), 650);
              } catch (e) {
                isProgrammaticRef.current = false;
              }
            }
          }
        }
      );

      headSubRef.current = await Location.watchHeadingAsync((h) => {
        const newHeading = h.trueHeading ?? h.magHeading ?? 0;
        headingRef.current = newHeading;

        // During recording, heading is flushed to state every 2 s
        // by the throttled UI updater. Only update immediately when
        // NOT recording (marker updates are realtime then).
        if (!refs.recording.current) {
          setHeading(newHeading);
          Animated.timing(compassAnim, {
            toValue: newHeading,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }

        // Camera heading follow (compass mode) — always immediate
        if (followingRef.current && mapBearingRef.current === -1) {
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
  }, []); // ← mounted ONCE — no more teardown on every state change

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
    if (!isProgrammaticRef.current) {
      setFollowing(false);
    }
  };

  // Timer effect — ticks every 1 s into the ref, NO state updates here.
  // The context auto-flush interval handles pushing to state every 2 s.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (contextRecording) {
      interval = setInterval(() => {
        // Auto-pause: only count "moving time" (like Strava)
        // refs.speed.current is 0 when EMA-smoothed speed < 1 km/h
        if (refs.speed.current > 0) {
          refs.time.current += 1;
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contextRecording]);

  // Format time helper function
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };


  const handleRecordingChange = (isRecording: boolean) => {
    setContextRecording(isRecording);
    // When starting recording, initialize previous location if we have current location
    if (isRecording && location) {
      prevLocationRef.current = location;
      prevTimestampRef.current = Date.now();
      splitStartTimeRef.current = refs.time.current;
      lastSplitIndexRef.current = Math.floor((refs.distance.current || 0) / SPLIT_DISTANCE_KM);
      // Start new route if not already started
      if (refs.routeCoords.current.length === 0) {
        refs.routeCoords.current = [location];
      }
      // Pre-download tiles around starting location for offline use
      downloadTilesForRecording(
        location[0],
        location[1],
        mapStyleURL,
        (pct) => console.log(`[OfflineTiles] ${pct}%`)
      ).catch(() => {});
    }
    // Note: Timer continues from where it left off (doesn't reset on pause)
    // Distance and speed also persist when paused
  };

  // Handle finish action - save activity session with offline-first approach
  const handleFinish = async () => {
    if (user?.isGuest) {
      Alert.alert(
        "Guest Mode",
        "You are in guest mode. Please log in to save your activity.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => { setUser(null); router.replace("/screens/auth/guest"); } }
        ]
      );
      return;
    }

    // Flush latest ref values to state so we capture accurate final numbers
    flushToState();

    try {
      const userWeight = user?.physicalMetrics?.weight?.value || 70;
      const caloriesBurned = calculateCaloriesBurned(userWeight);
      const finalDistance = refs.distance.current;
      const finalTime = refs.time.current;

      if (finalTime > 0 && (finalDistance > 0 || !isDistanceBased)) {
        const avgPace = (isDistanceBased && finalDistance > 0) ? (finalTime / 60) / finalDistance : 0;

        // Build route from ref
        const routeForSave = refs.routeCoords.current.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }));

        // Capture map snapshot
        let snapshotUri: string | null = null;
        if (mapRef.current) {
          try {
            snapshotUri = await mapRef.current.takeSnap(true);
            console.log('[Activity] Map Snapshot taken:', snapshotUri);
          } catch (e) {
            console.warn('[Activity] Failed to take map snapshot', e);
          }
        }

        const formData = new FormData();
        formData.append("activity_type", getActivityId(activityType));
        formData.append("distance_km", finalDistance.toString());
        formData.append("avg_pace", avgPace.toString());
        formData.append("moving_time_sec", finalTime.toString());
        formData.append("calories_burned", caloriesBurned.toString());
        formData.append("started_at", new Date(Date.now() - finalTime * 1000).toISOString());
        formData.append("ended_at", new Date().toISOString());
        formData.append("route_coordinates", JSON.stringify(routeForSave));

        if (snapshotUri) {
          const filename = snapshotUri.split('/').pop() || "map_snapshot.png";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/png`;
          formData.append("preview_image", { uri: snapshotUri, name: filename, type } as any);
        }

        // ── Offline-first: check connectivity ──
        const net = await NetInfo.fetch();
        let response: any = null;
        let savedOffline = false;

        if (net.isConnected) {
          try {
            response = await createGeoSession(formData);
            console.log('[Activity] Session saved online, calories:', caloriesBurned);
            // Refresh calorie balance
            getTodayCalorieBalance().catch(() => { });
          } catch {
            // Network call failed — queue offline
            await enqueueSession(formData, snapshotUri);
            savedOffline = true;
            console.log('[Activity] Online save failed, queued offline');
          }
        } else {
          await enqueueSession(formData, snapshotUri);
          savedOffline = true;
          console.log('[Activity] No connection, queued offline');
        }

        // Clear crash-recovery data
        await clearInProgressSession();

        // Helper to reset everything
        const cleanupAndReset = () => {
          resetMetrics();
          totalDistanceRef.current = 0;
          lastSplitIndexRef.current = 0;
          splitStartTimeRef.current = 0;
          prevLocationRef.current = null;
          prevTimestampRef.current = null;
          setRouteGeoJSON(null);
        };

        // Program mode: store result in context and navigate back to program coach
        if (programMode) {
          const routeForResult = refs.routeCoords.current.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));

          setProgramGeoResult({
            activity_id: getActivityId(activityType),
            distance_km: finalDistance,
            avg_pace: (isDistanceBased && finalDistance > 0) ? (finalTime / 60) / finalDistance : 0,
            moving_time_sec: finalTime,
            route_coordinates: routeForResult,
            calories_burned: caloriesBurned,
            started_at: new Date(Date.now() - finalTime * 1000).toISOString(),
            ended_at: new Date().toISOString(),
            geo_session_id: response?._id,
          });

          cleanupAndReset();
          router.back();
          return;
        }

        if (savedOffline) {
          Alert.alert(
            "Saved Offline",
            "Your activity will be synced automatically when you're back online.",
            [{
              text: "OK", onPress: () => {
                cleanupAndReset();
                router.back();
              }
            }]
          );
        } else {
          // Prompt to share
          Alert.alert(
            "Session Saved",
            "Would you like to share this activity to your feed?",
            [
              {
                text: "No, thanks",
                style: "cancel",
                onPress: () => {
                  cleanupAndReset();
                  router.back();
                },
              },
              {
                text: "Share",
                onPress: () => {
                  const savedDistance = finalDistance;
                  const savedTime = finalTime;
                  cleanupAndReset();
                  router.push({
                    pathname: "/screens/post/post_session",
                    params: {
                      type: "GeoSession",
                      id: response?._id,
                      title: activityType,
                      subtitle: `${savedDistance.toFixed(2)} km • ${formatTime(savedTime)}`
                    }
                  });
                },
              }
            ]
          );
        }
      } else {
        Alert.alert(
          "Session Discarded",
          isDistanceBased
            ? "No distance was recorded for this session."
            : "No time was recorded for this session.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('[Activity] Error saving activity session:', error);
      // Last-resort: still try to queue offline
      try { await enqueueSession({}, null); } catch { }
      Alert.alert(
        'Saved Offline',
        'Your activity will be synced when you reconnect.',
        [{ text: 'OK' }]
      );
    }
  };

  // Map activity type name to actual activity ID from the loaded activities
  const getActivityId = (type: string): string => {
    // Use activities from context (already destructured above)
    const activity = activities.find(a => a.name === type);
    if (activity?._id) {
      return activity._id;
    }
    // Fallback to first activity if available
    if (activities.length > 0 && activities[0]._id) {
      return activities[0]._id;
    }
    // Last resort fallback
    console.warn('[Activity] No activity ID found for:', type);
    return '000000000000000000000001';
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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <TouchableOpacity onPress={() => user?.isGuest ? router.push("/screens/auth/guest") : router.back()} className="flex-row items-center mb-4">
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
          mapStyle={mapStyleURL}
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

                {/* Directional beam - triangle/cone shape */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 15,
                    width: 0,
                    height: 0,
                    backgroundColor: "transparent",
                    borderStyle: "solid",
                    borderLeftWidth: 30,      // Left side of triangle
                    borderRightWidth: 30,     // Right side of triangle
                    borderTopWidth: 100,   // Height of triangle (beam length)
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderTopColor: theme.colors.primary + "66", // Beam color with transparency
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
          {/* Route Polyline — uses throttled GeoJSON (updated every 2 s) */}
          {routeGeoJSON && (
            <MapLibreGL.ShapeSource
              id="routeLine"
              shape={routeGeoJSON}
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
          recording={contextRecording}
          onRecordingChange={handleRecordingChange}
          onFinish={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
}

