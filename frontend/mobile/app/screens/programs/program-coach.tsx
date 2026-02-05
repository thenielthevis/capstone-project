import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import * as Speech from "expo-speech";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import axiosInstance from "../../api/axiosInstance";
import { createProgramSession, ProgramSessionPayload } from "../../api/programSesssionApi";
import { getUserProfile } from "../../api/userApi";
import { Audio } from "expo-av";
import ProgramRest from "./program-rest";
import GamificationReward from '../../components/animation/gamification-reward';
import GamificationLoading from '../../components/animation/gamification-loading';
import { ActivityIcon } from "../../components/ActivityIcon";
import { usePrograms } from "../../context/ProgramContext";
import { useUser } from "../../context/UserContext";

type ExerciseItem = {
  type: 'workout' | 'geo';
  workout_id?: any;
  activity_id?: any;
  sets?: any[];
  preferences?: any;
};

export default function ProgramCoach() {
  const { theme } = useTheme();
  const { guestProgram } = usePrograms();
  const { user, setUser } = useUser();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [isRepExercise, setIsRepExercise] = useState(false);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [isLastExerciseDone, setIsLastExerciseDone] = useState(false);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const announcementKeyRef = useRef<string | null>(null);
  const isStartingRef = useRef(false);
  const pendingStartRef = useRef(false);
  const bellSound = useRef<Audio.Sound | null>(null);
  const whistleSound = useRef<Audio.Sound | null>(null);
  const clappingSound = useRef<Audio.Sound | null>(null);
  const onRestCompleteRef = useRef<(() => void) | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const sessionResponseRef = useRef<any>(null);

  // Gamification animation state
  const [showGamificationAnimation, setShowGamificationAnimation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [gamificationData, setGamificationData] = useState<{
    previousBattery: number;
    newBattery: number;
    coinsAwarded: number;
    totalCoins: number;
    label: string;
  }>({ previousBattery: 0, newBattery: 0, coinsAwarded: 0, totalCoins: 0, label: 'Activity' });

  const loadSound = async (path: any) => {
    const { sound } = await Audio.Sound.createAsync(path);
    return sound;
  };

  useEffect(() => {
    startTimeRef.current = new Date();
    fetchProgram();
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (exerciseTimer.current) clearInterval(exerciseTimer.current);
      if (restTimer.current) clearInterval(restTimer.current);
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (isPlaying && !isPaused && exercises.length > 0 && !cancelled) {
        await startExercise();
      }
    };

    run().catch((err) => console.error("Failed to initiate exercise flow:", err));

    return () => {
      cancelled = true;
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (exerciseTimer.current) clearInterval(exerciseTimer.current);
      if (restTimer.current) clearInterval(restTimer.current);
    };
  }, [isPlaying, isPaused, currentIndex, currentSet, exercises]);

  useEffect(() => {
    const loadSounds = async () => {
      bellSound.current = await loadSound(
        require("../../../assets/sounds/activity/bell-sound.mp3")
      );
      whistleSound.current = await loadSound(
        require("../../../assets/sounds/activity/whistle-sound.mp3")
      );
      clappingSound.current = await loadSound(
        require("../../../assets/sounds/activity/clapping-sound.mp3")
      );
    };

    loadSounds();

    return () => {
      bellSound.current?.unloadAsync();
      whistleSound.current?.unloadAsync();
    };
  }, []);

  // Reset last exercise done flag when not on the last exercise
  useEffect(() => {
    if (currentIndex !== exercises.length - 1 && isLastExerciseDone) {
      setIsLastExerciseDone(false);
    }
  }, [currentIndex, exercises.length, isLastExerciseDone]);

  const playBell = async () => {
    try {
      await bellSound.current?.replayAsync();
    } catch (e) {
      console.log("Bell play error:", e);
    }
  };

  const playWhistle = async () => {
    try {
      await whistleSound.current?.replayAsync();
    } catch (e) {
      console.log("Whistle play error:", e);
    }
  };

  const playClapping = async () => {
    try {
      await clappingSound.current?.replayAsync();
    } catch (e) {
      console.log("Clapping play error:", e);
    }
  };

  const fetchProgram = async () => {
    try {
      setLoading(true);

      let found: any = null;
      if (id === 'guest') {
        found = guestProgram;
      } else {
        const res = await axiosInstance.get(`/programs/getUserPrograms`);
        found = res.data.find((p: any) => p._id === id);
      }

      if (found) {
        setProgram(found);
        // Combine workouts and geo activities into a single exercises array
        const workoutExercises: ExerciseItem[] = (found.workouts || []).map((w: any) => ({
          type: 'workout' as const,
          workout_id: w.workout_id,
          sets: w.sets || [],
        }));
        const geoExercises: ExerciseItem[] = (found.geo_activities || []).map((g: any) => ({
          type: 'geo' as const,
          activity_id: g.activity_id,
          preferences: g.preferences || {},
        }));
        setExercises([...workoutExercises, ...geoExercises]);
      }
    } catch (err: any) {
      console.error("Failed to load program:", err);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const speakAsync = (text: string | null | undefined) =>
    new Promise<void>((resolve) => {
      if (!text) {
        resolve();
        return;
      }
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });

  const announceExercise = useCallback(
    async (exercise: ExerciseItem) => {
      if (!exercise) return;

      if (exercise.type === 'workout') {
        const sets = exercise.sets || [];
        if (!sets.length || currentSet >= sets.length) return;

        const workout = exercise.workout_id;
        const set = sets[currentSet];
        const details: string[] = [
          workout?.name || "Workout",
          `Set ${currentSet + 1}`,
        ];

        if (set.reps) {
          details.push(`${set.reps} repetitions`);
        }
        if (set.time_seconds) {
          details.push(`${set.time_seconds} seconds`);
        }
        if (set.weight_kg) {
          details.push(`${set.weight_kg} kilograms`);
        }

        await speakAsync(details.join(", "));
        return;
      }

      const activity = exercise.activity_id;
      const preferences = exercise.preferences || {};
      const details: string[] = [activity?.name || "Activity"];

      if (preferences.distance_km) {
        details.push(`${preferences.distance_km} kilometers`);
      }
      if (preferences.avg_pace) {
        details.push(`target pace ${preferences.avg_pace}`);
      }
      if (preferences.countdown_seconds) {
        details.push(`${preferences.countdown_seconds} seconds`);
      }

      await speakAsync(details.join(", "));
    },
    [currentSet]
  );

  // Helper to format seconds as mm:ss
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const toNumber = (value: any, fallback = 0) => {
    if (value === null || value === undefined || value === "") return fallback;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? fallback : numeric;
  };

  const toOptionalNumber = (value: any) => {
    const numeric = toNumber(value, NaN);
    return Number.isNaN(numeric) ? undefined : numeric;
  };

  const getEntityId = (entity: any): string | null => {
    if (!entity) return null;
    if (typeof entity === "string") return entity;
    if (typeof entity === "object") {
      if (entity._id) return entity._id;
      if (entity.id) return entity.id;
    }
    return null;
  };

  const buildProgramSessionPayload = (): ProgramSessionPayload => {
    const workoutSessions: ProgramSessionPayload["workouts"] = [];
    const geoSessions: ProgramSessionPayload["geo_activities"] = [];

    exercises.forEach((exercise) => {
      if (exercise.type === "workout") {
        const workoutId = getEntityId(exercise.workout_id);
        if (!workoutId) return;

        // Get snapshot data if available (handling both populated object and direct ID case safely)
        const wObj = typeof exercise.workout_id === 'object' ? exercise.workout_id : {};

        workoutSessions.push({
          workout_id: workoutId,
          name: wObj?.name,
          exercise_type: wObj?.type,
          animation_url: wObj?.animation_url,
          sets: (exercise.sets || []).map((set: any) => ({
            reps: toNumber(set?.reps),
            time_seconds: toNumber(set?.time_seconds),
            weight_kg: toNumber(set?.weight_kg),
          })),
        });
        return;
      }

      if (exercise.type === "geo") {
        const activityId = getEntityId(exercise.activity_id);
        if (!activityId) return;

        const aObj = typeof exercise.activity_id === 'object' ? exercise.activity_id : {};

        const preferences = exercise.preferences || {};
        const distance = toNumber(preferences.distance_km);
        const avgPace = toOptionalNumber(preferences.avg_pace);
        const movingTime = toNumber(preferences.countdown_seconds);

        geoSessions.push({
          activity_id: activityId,
          name: aObj?.name,
          exercise_type: aObj?.type, // e.g., "Run", "Bike"
          distance_km: distance,
          avg_pace: avgPace,
          moving_time_sec: movingTime,
          route_coordinates: [],
          calories_burned: 0,
          started_at: null,
          ended_at: null,
        });
      }
    });

    return {
      workouts: workoutSessions,
      geo_activities: geoSessions,
      program_name: program?.name || "Untitled Program",
      program_id: program?._id || undefined,
      group_id: program?.group_id || undefined,
      total_duration_minutes: startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current.getTime()) / 60000)
        : 0,
      total_calories_burned: 0, // Calculated on backend
      performed_at: startTimeRef.current ? startTimeRef.current.toISOString() : new Date().toISOString(),
      end_time: new Date().toISOString(),
    };
  };

  const startCountdown = (seconds: number, onComplete: () => void, shouldSpeak: boolean = false) => {
    setCountdown(seconds);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    // Speak the initial number if shouldSpeak is true
    if (shouldSpeak && seconds > 0) {
      speak(seconds.toString());
    }

    // Animate scale on countdown
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          playWhistle();
          if (shouldSpeak) {
            speak("Start!");
            setTimeout(() => {
              onComplete();
            }, 500);
          } else {
            onComplete();
          }
          return 0;
        }
        // Speak the number if shouldSpeak is true
        if (shouldSpeak) {
          speak((prev - 1).toString());
        }
        // Animate on each countdown
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        return prev - 1;
      });
    }, 1000);
  };

  const [viewMode, setViewMode] = useState<'exercise' | 'rest'>('exercise');

  useEffect(() => {
    let interval: any;

    if (viewMode === "rest") {
      // Logic handled in ProgramRest
    } else {
      // Normal Exercise Timer Logic
      if (isPlaying && !isPaused && !isRepExercise) {
        interval = setInterval(() => {
          setExerciseTime((prev) => prev + 1);
        }, 1000);
        exerciseTimer.current = interval;
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused, viewMode]);


  const startRest = (seconds: number = 30, onComplete?: () => void) => {
    if (exerciseTimer.current) clearInterval(exerciseTimer.current);

    setRestTime(seconds);
    if (onComplete) {
      onRestCompleteRef.current = onComplete;
    }
    setViewMode('rest');

    // Speech
    let speech = `Rest for ${seconds} seconds.`;

    // Check if up next is a new exercise
    const isSwitchingExercise = isWorkout ? currentSet >= sets.length - 1 : true;
    if (isSwitchingExercise && currentIndex < exercises.length - 1) {
      const nextEx = exercises[currentIndex + 1];
      const nextName = nextEx.type === 'workout' ? nextEx.workout_id?.name : nextEx.activity_id?.name;
      const nextDesc = nextEx.type === 'workout' ? nextEx.workout_id?.description : nextEx.activity_id?.description;

      if (nextName) {
        speech += ` Up next, ${nextName}.`;
      }
      if (nextDesc) {
        // Keep description short or maybe just name is enough? User asked for description.
        speech += ` ${nextDesc}`;
      }
    }

    Speech.speak(speech);
  };

  const finishRest = () => {
    setViewMode('exercise');
    setRestTime(0);

    // If a callback was provided (e.g., for Geo redirection), run it and skip default logic
    if (onRestCompleteRef.current) {
      onRestCompleteRef.current();
      onRestCompleteRef.current = null;
      // Don't auto-reset state or play if we're redirecting or handling custom logic
      return;
    }

    // Default: Proceed to next set or exercise logic
    if (isWorkout && sets.length > 0) {
      if (currentSet < sets.length - 1) {
        // Next set
        setCurrentSet((prev) => prev + 1);
        // Pre-emptively set rep/time state to avoid timer flash
        const nextSet = sets[currentSet + 1];
        if (nextSet.reps) {
          setIsRepExercise(true);
          setExerciseTime(0);
        } else {
          setIsRepExercise(false);
          setExerciseTime(nextSet.time_seconds ? Number(nextSet.time_seconds) : 0);
        }

      } else {
        // Next exercise
        if (currentIndex < exercises.length - 1) {
          // Pre-emptively set state for the NEXT exercise to prevent timer bug
          const nextEx = exercises[currentIndex + 1];
          if (nextEx.type === 'workout') {
            const nextSets = nextEx.sets || [];
            if (nextSets.length > 0) {
              const firstSet = nextSets[0];
              if (firstSet.reps) {
                setIsRepExercise(true);
                setExerciseTime(0);
              } else {
                setIsRepExercise(false);
                setExerciseTime(firstSet.time_seconds ? Number(firstSet.time_seconds) : 0);
              }
            }
          }
          nextExercise();
        } else {
          // Program Finished (Should be handled by check before rest, but failsafe)
          setIsLastExerciseDone(true);
          setIsPlaying(false);
        }
      }
    } else {
      // Geo/Simple activity next
      if (currentIndex < exercises.length - 1) {
        nextExercise();
      }
    }

    // Auto-start next
    setIsPaused(false);
    setIsPlaying(true);
  };

  const startTimedSet = async (duration: number) => {
    if (exerciseTimer.current) clearInterval(exerciseTimer.current);
    setExerciseTime(duration);
    exerciseTimer.current = setInterval(() => {
      setExerciseTime((prev) => {
        if (prev <= 1) {
          if (exerciseTimer.current) clearInterval(exerciseTimer.current);
          playBell();
          speak("Set complete.");

          // Check if this is the last set of the last exercise
          const isLastExercise = currentIndex === exercises.length - 1;
          const isLastSet = currentSet >= sets.length - 1;

          if (isLastExercise && isLastSet) {
            setIsLastExerciseDone(true);
            playClapping();
            speak("Program complete!");
            setIsPlaying(false);
          } else {
            startRest(30);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExercise = async () => {
    if (isStartingRef.current) {
      pendingStartRef.current = true;
      return;
    }
    if (!isPlaying || isPaused || exercises.length === 0) return;

    if (currentIndex >= exercises.length) {
      setIsPlaying(false);
      speak("Congratulations! You have completed the program.");
      return;
    }

    pendingStartRef.current = false;
    const exercise = exercises[currentIndex];
    const isWorkout = exercise.type === 'workout';
    const sets = isWorkout ? exercise.sets || [] : [];
    const hasSetToAnnounce = isWorkout ? sets.length > 0 && currentSet < sets.length : true;
    const announcementKey = isWorkout
      ? `${exercise.workout_id?._id || currentIndex}-${currentSet}`
      : `${exercise.activity_id?._id || currentIndex}-${currentIndex}`;

    isStartingRef.current = true;

    try {
      if (hasSetToAnnounce && announcementKeyRef.current !== announcementKey) {
        await announceExercise(exercise);
        announcementKeyRef.current = announcementKey;
      }

      if (isWorkout) {
        await handleWorkoutExercise(exercise);
      } else {
        await handleGeoExercise(exercise);
      }
    } finally {
      isStartingRef.current = false;
      if (pendingStartRef.current) {
        pendingStartRef.current = false;
        setTimeout(() => {
          startExercise().catch((err) => console.error("Failed to restart exercise flow:", err));
        }, 0);
      }
    }
  };

  const handleWorkoutExercise = async (exercise: ExerciseItem) => {
    const workout = exercise.workout_id;
    const sets = exercise.sets || [];

    if (sets.length === 0) {
      // Exercise with no sets - mark as done if it's the last exercise
      if (currentIndex === exercises.length - 1) {
        setIsLastExerciseDone(true);
      }
      await speakAsync(`Next exercise: ${workout?.name || 'Workout'}. ${workout?.description || ''}`);
      setTimeout(() => {
        announcementKeyRef.current = null;
        nextExercise();
      }, 5000);
      return;
    }

    if (currentSet >= sets.length) {
      // All sets completed, rest then move to next exercise
      // Check if this is the last exercise
      if (currentIndex === exercises.length - 1) {
        setIsLastExerciseDone(true);
      }
      setCurrentSet(0);
      setCurrentRep(0);
      setIsRepExercise(false);
      playBell();
      speak("Next exercise.");
      nextExercise();
      return;
    }

    const set = sets[currentSet];
    const reps = set.reps ? parseInt(set.reps) : 0;
    const timeSeconds = set.time_seconds ? parseInt(set.time_seconds) : 0;
    const weight = set.weight_kg || '';

    // Don't announce individual sets since all exercises were already announced upfront

    // Start exercise timer directly if time is specified
    if (timeSeconds > 0) {
      setIsRepExercise(false);
      setExerciseTime(timeSeconds);
      await new Promise<void>((resolve) => {
        startCountdown(3, () => {
          startTimedSet(timeSeconds);
          resolve();
        }, true);
      });
    } else if (reps > 0) {
      // Rep-based exercise - show rep count and Done button
      setIsRepExercise(true);
      setCurrentRep(reps); // Set to target reps for display (x14 format)
      setExerciseTime(0);
      // Don't start automatic counting, wait for user to press Done
    } else {
      // No reps or time, just show exercise
      setIsRepExercise(false);
      setTimeout(() => {
        announcementKeyRef.current = null;
        setCurrentSet((prev) => prev + 1);
      }, 5000);
    }
  };

  const handleDoneRepSet = () => {
    setIsRepExercise(false);
    setCurrentRep(0);
    playBell();
    speak("Set complete.");

    // Check if this is the last set of the last exercise
    const isLastExercise = currentIndex === exercises.length - 1;
    const isLastSet = currentSet >= sets.length - 1;

    if (isLastExercise && isLastSet) {
      setIsLastExerciseDone(true);
      playClapping();
      speak("Program complete!");
      setIsPlaying(false);
    } else {
      startRest(30);
    }
  };

  const handleGeoExercise = async (_exercise: ExerciseItem) => {
    startRest(30, () => {
      announcementKeyRef.current = null;
      router.push('/screens/record/Activity');
    });
  };

  const nextExercise = () => {
    announcementKeyRef.current = null;
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= exercises.length) {
        setIsPlaying(false);
        setIsLastExerciseDone(true);
        playClapping();
        speak("Program complete! Great job!");
        return prev;
      }
      // Reset last exercise done flag when moving away from last exercise
      setIsLastExerciseDone(false);
      setCurrentSet(0);
      setCurrentRep(0);
      setExerciseTime(0);
      setCountdown(0);
      setRestTime(0);
      setRestTime(0);

      // Determine if next exercise is rep-based to avoid timer flash
      const nextEx = exercises[next];
      if (nextEx.type === 'workout') {
        const nextSets = nextEx.sets || [];
        if (nextSets.length > 0) {
          const firstSet = nextSets[0];
          if (firstSet.reps) {
            setIsRepExercise(true);
          } else {
            setIsRepExercise(false);
          }
        } else {
          setIsRepExercise(false);
        }
      } else {
        setIsRepExercise(false);
      }

      return next;
    });
  };

  const previousExercise = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (exerciseTimer.current) clearInterval(exerciseTimer.current);
    if (restTimer.current) clearInterval(restTimer.current);
    Speech.stop();
    announcementKeyRef.current = null;

    setCurrentIndex((prev) => {
      if (prev <= 0) return prev;
      // Reset last exercise done flag when moving away from last exercise
      if (prev === exercises.length - 1) {
        setIsLastExerciseDone(false);
      }
      setCurrentSet(0);
      setCurrentRep(0);
      setExerciseTime(0);
      setCountdown(0);
      setRestTime(0);
      setIsRepExercise(false);
      return prev - 1;
    });
  };

  const togglePlayPause = () => {
    if (isRepExercise && currentRep > 0 && countdown === 0 && exerciseTime === 0 && restTime === 0) {
      // Rep-based exercise: treat play/pause as Done
      handleDoneRepSet();
      return;
    }
    if (!isPlaying) {
      announcementKeyRef.current = null;
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
      if (isPaused) {
        Speech.resume();
      } else {
        Speech.pause();
        if (countdownInterval.current) clearInterval(countdownInterval.current);
        if (exerciseTimer.current) clearInterval(exerciseTimer.current);
        if (restTimer.current) clearInterval(restTimer.current);
      }
    }
  };

  const skipExercise = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (exerciseTimer.current) clearInterval(exerciseTimer.current);
    if (restTimer.current) clearInterval(restTimer.current);
    Speech.stop();
    announcementKeyRef.current = null;
    setIsRepExercise(false);
    nextExercise();
  };


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: 18, textAlign: "center", marginBottom: 16 }}>
          No exercises in this program
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: theme.colors.primary,
          }}
        >
          <Text style={{ color: theme.colors.background, fontFamily: theme.fonts.body }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[currentIndex];
  const isWorkout = currentExercise?.type === 'workout';
  const workout = currentExercise?.workout_id;
  const activity = currentExercise?.activity_id;
  const sets = currentExercise?.sets || [];
  const currentSetData = sets[currentSet] || {};
  const totalExercises = exercises.length;
  const progress = ((currentIndex + 1) / totalExercises) * 100;
  const description = isWorkout ? workout?.description : activity?.description;

  // Check if the last exercise is completed
  const isLastExerciseCompleted = () => {
    // Must be on the last exercise
    if (currentIndex !== exercises.length - 1) return false;

    // Check if we've explicitly marked the last exercise as done
    if (isLastExerciseDone) {
      // Ensure no active timers or states before showing finish button
      return countdown === 0 && restTime === 0 && exerciseTime === 0 && !isRepExercise;
    }

    // For workout exercises, check if all sets are completed
    if (isWorkout) {
      const exerciseSets = sets || [];
      // No active timers or countdowns
      if (countdown > 0 || restTime > 0 || exerciseTime > 0 || isRepExercise) return false;

      if (exerciseSets.length === 0) {
        // Exercises with no sets are marked as done in handleWorkoutExercise
        return isLastExerciseDone;
      }
      // Check if all sets are completed
      return currentSet >= exerciseSets.length;
    }

    // For geo exercises, they redirect to Activity screen
    // Since they redirect, we can't easily track completion
    // Only show finish button if explicitly marked as done or if not in active state
    // and it's a geo exercise on the last index
    return countdown === 0 && restTime === 0;
  };

  const handleFinishProgram = async () => {
    if (isRecordingSession || !isLastExerciseCompleted()) return;

    if (user?.isGuest) {
      Alert.alert(
        "Session Complete!",
        "Great job! Since you are in guest mode, this session will not be saved or posted. Log in to track your progress and earn rewards!",
        [
          {
            text: "Go Back",
            onPress: () => router.back(),
            style: "cancel"
          },
          {
            text: "Sign In",
            onPress: () => {
              setUser(null);
              router.replace("/");
            }
          }
        ]
      );
      return;
    }

    const payload = buildProgramSessionPayload();
    if (payload.workouts.length === 0 && payload.geo_activities.length === 0) {
      Alert.alert("Nothing to record", "This program does not contain any workouts or activities to save.");
      return;
    }

    try {
      setIsRecordingSession(true);

      // 1. Get previous battery value
      const profileBefore = await getUserProfile();
      const prevActivityValue = profileBefore.profile?.gamification?.batteries?.[0]?.activity || 0;

      // 2. Save session
      const response = await createProgramSession(payload);
      sessionResponseRef.current = response;

      // 3. Wait for gamification update on backend
      setIsCalculating(true);
      setTimeout(async () => {
        try {
          // 4. Get new battery value
          const profileAfter = await getUserProfile();
          const newActivityValue = profileAfter.profile?.gamification?.batteries?.[0]?.activity || 0;

          // 5. Trigger animation
          const coins = profileAfter.profile?.gamification?.coins || 0;
          const coinsAwarded = Math.floor((newActivityValue - prevActivityValue) / 10);
          setGamificationData({
            previousBattery: prevActivityValue,
            newBattery: newActivityValue,
            coinsAwarded: coinsAwarded > 0 ? coinsAwarded : 0,
            totalCoins: coins,
            label: 'Activity'
          });
          setShowGamificationAnimation(true);

        } catch (err) {
          console.warn("Failed to fetch updated profile for animation:", err);
          // Fallback if profile fetch fails
          showSuccessAlert();
        } finally {
          setIsCalculating(false);
        }
      }, 2000);

    } catch (error) {
      console.error("Failed to record program session:", error);
      Alert.alert("Recording failed", "We couldn't save your session. Please try again.");
    } finally {
      setIsRecordingSession(false);
    }
  };

  const showSuccessAlert = () => {
    const response = sessionResponseRef.current;

    Alert.alert("Session Recorded", "Great job! Your program session has been saved. Would you like to share it?", [
      {
        text: "No, thanks",
        onPress: () => router.back(),
        style: "cancel"
      },
      {
        text: "Share",
        onPress: () => {
          if (response?._id) {
            router.push({
              pathname: "/screens/post/post_session",
              params: {
                type: "ProgramSession",
                id: response._id,
                title: program.title,
                subtitle: "Program Session"
              }
            });
          } else {
            router.back();
          }
        }
      }
    ]);
  };

  // Determine next exercise details for ProgramRest
  // Determine next exercise details for ProgramRest
  const getNextExerciseDetails = () => {
    if (isWorkout && sets.length > 0 && currentSet < sets.length - 1) {
      // Next set of same workout
      return {
        name: workout?.name,
        info: `Set ${currentSet + 2} of ${sets.length}`,
        image: workout?.animation_url,
        isLottie: true
      };
    } else if (currentIndex < exercises.length - 1) {
      // Next exercise
      const nextEx = exercises[currentIndex + 1];
      if (nextEx.type === 'workout') {
        const nextSets = nextEx.sets?.length || 0;
        return {
          name: nextEx.workout_id?.name,
          info: `${nextSets} Sets`,
          image: nextEx.workout_id?.animation_url,
          isLottie: true
        };
      } else {
        return {
          name: nextEx.activity_id?.name,
          info: "Geo Activity",
          image: nextEx.activity_id?.icon,
          isLottie: false
        };
      }
    }
    return { name: "Finish", info: "Program Complete" };
  };

  if (viewMode === 'rest') {
    const nextDetails = getNextExerciseDetails();
    return (
      <ProgramRest
        initialDuration={restTime}
        onComplete={finishRest}
        onSkip={finishRest}
        onAddSeconds={(s) => setRestTime(prev => prev + s)}
        nextExerciseName={nextDetails.name}
        nextExerciseInfo={nextDetails.info}
        nextExerciseImage={nextDetails.image}
        nextExerciseIsLottie={nextDetails.isLottie}
      />
    );
  }

  const nextDetails = getNextExerciseDetails();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} style={{ zIndex: 10 }}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 16, alignItems: 'center' }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ fontFamily: theme.fonts.heading, fontSize: 18, color: theme.colors.text }}
            >
              {program?.name || "Workout Coach"}
            </Text>
          </View>
          {/* Finish button - only show when last exercise is completed */}
          {isLastExerciseCompleted() ? (
            <TouchableOpacity
              onPress={handleFinishProgram}
              disabled={isRecordingSession}
              className="flex-row items-center justify-center"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: theme.colors.primary,
                opacity: isRecordingSession ? 0.7 : 1,
                minWidth: 80,
              }}
            >
              {isRecordingSession ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <>
                  <Ionicons name="stop" size={18} color={theme.colors.text} />
                  <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, marginLeft: 6, fontSize: 14, fontWeight: "600" }}>
                    Finish
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} /> // Placeholder to balance close button
          )}
        </View>

        {/* Progress Bar */}
        <View style={{ marginTop: 16, height: 4, backgroundColor: theme.colors.surface, borderRadius: 2, overflow: "hidden" }}>
          <View
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.text + "99", marginTop: 8, textAlign: "center" }}>
          Exercise {currentIndex + 1} of {totalExercises}
        </Text>
      </View>

      {/* Exercise Display */}
      <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }}>
        {/* Animation/Icon with Countdown Overlay */}
        <View style={{ marginBottom: 24, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "relative" }}>
            {isWorkout ? (
              workout?.animation_url ? (
                <LottieView
                  source={{ uri: workout.animation_url }}
                  autoPlay
                  loop
                  style={{ minHeight: 400, minWidth: 400, backgroundColor: "#FFFFFF" }}
                />
              ) : (
                <View style={{ width: 400, height: 400, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
                  <Ionicons name="barbell" size={120} color={theme.colors.primary} />
                </View>
              )
            ) : (

              /* Use ActivityIcon for consistent local SVGs */
              <View style={{ width: 400, height: 400, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
                <ActivityIcon
                  activityName={activity?.name || ""}
                  activityType={activity?.type}
                  size={240} // Scaled up for the large view (was 400 box, icon should slightly smaller to fit well or match previous large size)
                  color={theme.colors.primary}
                />
              </View>
            )}
            {countdown > 0 && (
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: "#00000066",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 72, color: "#FFFFFF", textAlign: "center" }}>
                    {countdown <= 3 ? countdown : formatTime(countdown)}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Exercise Name with Info Button */}
        <View className="flex-row items-center justify-center">
          <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, color: theme.colors.primary, textAlign: "center", marginRight: 8 }}>
            {isWorkout ? workout?.name : activity?.name}
          </Text>
          {description && (
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.expand()}
              style={{ padding: 4 }}
            >
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise Info Row: Set | Reps | Timer | Weight */}
        {isWorkout && sets.length > 0 && (
          <View className="flex-row items-center justify-center" style={{ flexWrap: "wrap", gap: 16 }}>
            {/* Set Info */}
            <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 14, color: theme.colors.text, marginRight: 4 }}>
                Set {currentSet + 1} of {sets.length}
              </Text>
            </View>

            {/* Reps */}
            {currentSetData.reps && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                <MaterialCommunityIcons name="repeat" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, marginLeft: 6 }}>
                  {currentSetData.reps}
                </Text>
              </View>
            )}

            {/* Timer */}
            {(currentSetData.time_seconds || exerciseTime > 0) && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                <MaterialCommunityIcons name="timer-sand" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, marginLeft: 6 }}>
                  {currentSetData.time_seconds ? `${currentSetData.time_seconds}s` : formatTime(exerciseTime)}
                </Text>
              </View>
            )}

            {/* Weight */}
            {currentSetData.weight_kg && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                <MaterialCommunityIcons name="weight-kilogram" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, marginLeft: 6 }}>
                  {currentSetData.weight_kg}kg
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Geo Activity Preferences */}
        {!isWorkout && currentExercise?.preferences && (
          <View className="flex-row items-center justify-center mb-6" style={{ flexWrap: "wrap", gap: 16 }}>
            {currentExercise.preferences.distance_km && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, marginLeft: 6 }}>
                  {currentExercise.preferences.distance_km} km
                </Text>
              </View>
            )}
            {currentExercise.preferences.avg_pace && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                <MaterialCommunityIcons name="speedometer" size={16} color={theme.colors.primary} />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text, marginLeft: 6 }}>
                  {currentExercise.preferences.avg_pace}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Exercise Timer (when playing) */}
        {exerciseTime > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 90, color: theme.colors.primary, textAlign: "center" }}>
              {formatTime(exerciseTime)}
            </Text>
          </View>
        )}

        {/* Rest Timer */}
        {restTime > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.text + "99", textAlign: "center", marginBottom: 8 }}>
              Rest
            </Text>
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 64, color: theme.colors.primary, textAlign: "center" }}>
              {formatTime(restTime)}
            </Text>
          </View>
        )}

        {/* Reps Display (Done handled by play/pause button) */}
        {isRepExercise && currentRep > 0 && countdown === 0 && exerciseTime === 0 && restTime === 0 && (
          <View style={{ marginBottom: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 90, color: theme.colors.primary, textAlign: "center", marginBottom: 24 }}>
              x{currentRep}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={{ padding: 24, paddingBottom: 32 }}>
        {/* Previous/Next Buttons */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={previousExercise}
            disabled={currentIndex === 0}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: currentIndex === 0 ? theme.colors.surface : theme.colors.primary + "22",
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? theme.colors.text + "66" : theme.colors.primary} />
            <Text style={{ color: currentIndex === 0 ? theme.colors.text + "66" : theme.colors.primary, fontFamily: theme.fonts.body, marginLeft: 4, fontSize: 14 }}>
              Prev
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={{
              paddingHorizontal: 26,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: theme.colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 160,
            }}
          >
            <Ionicons
              name={
                isRepExercise
                  ? "checkmark-sharp"
                  : isPaused
                    ? "play"
                    : isPlaying
                      ? "pause"
                      : "play"
              }
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />

            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: theme.fonts.heading,
                fontSize: 16,
              }}
            >
              {isRepExercise
                ? "Done"
                : isPaused
                  ? "Continue"
                  : isPlaying
                    ? "Pause"
                    : "Play"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipExercise}
            disabled={currentIndex >= exercises.length - 1}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: currentIndex >= exercises.length - 1 ? theme.colors.surface : theme.colors.primary + "22",
              opacity: currentIndex >= exercises.length - 1 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: currentIndex >= exercises.length - 1 ? theme.colors.text + "66" : theme.colors.primary, fontFamily: theme.fonts.body, marginRight: 4, fontSize: 14 }}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={currentIndex >= exercises.length - 1 ? theme.colors.text + "66" : theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text + "66" }}
      >
        <BottomSheetView>
          <View style={{ padding: 24 }}>
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: 20, color: theme.colors.text, marginBottom: 12 }}>
              {isWorkout ? workout?.name : activity?.name}
            </Text>
            {description ? (
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "99", lineHeight: 22 }}>
                {description}
              </Text>
            ) : (
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.text + "99" }}>
                No description available.
              </Text>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Gamification Animation Overlay */}
      <GamificationLoading visible={isCalculating} message="Analyzing Performance..." />
      <GamificationReward
        visible={showGamificationAnimation}
        previousBattery={gamificationData.previousBattery}
        newBattery={gamificationData.newBattery}
        coinsAwarded={gamificationData.coinsAwarded}
        totalCoins={gamificationData.totalCoins}
        label={gamificationData.label}
        onComplete={() => {
          setShowGamificationAnimation(false);
          showSuccessAlert();
        }}
      />
    </SafeAreaView >
  );
}
