import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Play, Pause, SkipBack, SkipForward, Timer, Dumbbell, MapPin, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProgramById } from '../api/programApi';
import { createProgramSession, ProgramSessionPayload } from '../api/programSessionApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import ProgramRest from './ProgramRest';
import CloudinaryLottie from '../components/CloudinaryLottie';
import CloudinarySVG from '../components/CloudinarySVG';

// Sound imports
import successSound from '@/assets/sounds/success-sound.mp3';
import bellSound from '@/assets/sounds/activity/bell-sound.mp3';
import whistleSound from '@/assets/sounds/activity/whistle-sound.mp3';
import clappingSound from '@/assets/sounds/activity/clapping-sound.mp3';

type ExerciseItem = {
  type: 'workout' | 'geo';
  workout_id?: any;
  activity_id?: any;
  sets?: any[];
  preferences?: any;
};

export default function ProgramCoach() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [isRepExercise, setIsRepExercise] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const exerciseTimer = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const announcementKeyRef = useRef<string | null>(null);

  // Audio refs
  const audioRefs = useRef<{
    success: HTMLAudioElement;
    bell: HTMLAudioElement;
    whistle: HTMLAudioElement;
    clapping: HTMLAudioElement;
  } | null>(null);

  useEffect(() => {
    audioRefs.current = {
      success: new Audio(successSound),
      bell: new Audio(bellSound),
      whistle: new Audio(whistleSound),
      clapping: new Audio(clappingSound),
    };
  }, []);

  const playSound = (type: keyof NonNullable<typeof audioRefs.current>) => {
    const audio = audioRefs.current?.[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play error:', e));
    }
  };

  useEffect(() => {
    startTimeRef.current = new Date();
    if (id) {
      fetchProgram();
    }
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (exerciseTimer.current) clearInterval(exerciseTimer.current);
      window.speechSynthesis.cancel();
    };
  }, [id]);

  useEffect(() => {
    // Only start if not completed, not showing rest, and is active
    if (isPlaying && !isPaused && exercises.length > 0 && !showRest && !isCompleted) {
      // If countdown or exercise timer is NOT running, start the exercise
      if (!countdownInterval.current && !exerciseTimer.current) {
        startExercise();
      }
    }
  }, [isPlaying, isPaused, currentIndex, currentSet, exercises, showRest, isCompleted]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const res = await getProgramById(id!);
      setProgram(res);

      if (res) {
        const workoutExercises: ExerciseItem[] = (res.workouts || []).map((w: any) => ({
          type: 'workout' as const,
          workout_id: w.workout_id,
          sets: w.sets || [],
        }));
        const geoExercises: ExerciseItem[] = (res.geo_activities || []).map((g: any) => ({
          type: 'geo' as const,
          activity_id: g.activity_id,
          preferences: g.preferences || {},
        }));
        setExercises([...workoutExercises, ...geoExercises]);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to load program'
      });
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const speakAsync = (text: string) =>
    new Promise<void>((resolve) => {
      if (!text) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
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

        if (set.reps) details.push(`${set.reps} repetitions`);
        if (set.time_seconds) details.push(`${set.time_seconds} seconds`);
        if (set.weight_kg) details.push(`${set.weight_kg} kilograms`);

        await speakAsync(details.join(", "));
        return;
      }

      const activity = exercise.activity_id;
      const preferences = exercise.preferences || {};
      const details: string[] = [activity?.name || "Activity"];

      if (preferences.distance_km) details.push(`${preferences.distance_km} kilometers`);
      if (preferences.countdown_seconds) details.push(`${preferences.countdown_seconds} seconds`);

      await speakAsync(details.join(", "));
    },
    [currentSet]
  );

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const startCountdown = (seconds: number, onComplete: () => void, shouldSpeak: boolean = false) => {
    setCountdown(seconds);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    if (shouldSpeak && seconds > 0) speak(seconds.toString());

    countdownInterval.current = setInterval(() => {
      if (isPaused) return; // FIX: Pause logic

      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          if (shouldSpeak) {
            playSound('whistle');
            speak("Start!");
            setTimeout(onComplete, 500);
          } else {
            onComplete();
          }
          return 0;
        }
        if (shouldSpeak) speak((prev - 1).toString());
        return prev - 1;
      });
    }, 1000);
  };

  const startTimedSet = (duration: number) => {
    if (exerciseTimer.current) clearInterval(exerciseTimer.current);
    setExerciseTime(duration);
    exerciseTimer.current = setInterval(() => {
      if (isPaused) return; // FIX: Pause logic

      setExerciseTime((prev) => {
        if (prev <= 1) {
          if (exerciseTimer.current) {
            clearInterval(exerciseTimer.current);
            exerciseTimer.current = null;
          }
          playSound('bell');
          speak("Set complete.");
          handleSetFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSetFinished = () => {
    const exercise = exercises[currentIndex];
    const isWorkout = exercise.type === 'workout';
    const sets = isWorkout ? exercise.sets || [] : [];

    const isLastExercise = currentIndex === exercises.length - 1;
    const isLastSet = isWorkout ? currentSet >= sets.length - 1 : true;

    if (isLastExercise && isLastSet) {
      finishProgram();
    } else {
      setShowRest(true);
      setRestTime(30);
    }
  };

  const startExercise = async () => {
    if (showRest || isCompleted || exercises.length === 0) return;

    const exercise = exercises[currentIndex];
    const announcementKey = exercise.type === 'workout'
      ? `${exercise.workout_id?._id}-${currentSet}`
      : `${exercise.activity_id?._id}-${currentIndex}`;

    if (announcementKeyRef.current !== announcementKey) {
      await announceExercise(exercise);
      announcementKeyRef.current = announcementKey;
    }

    if (exercise.type === 'workout') {
      const sets = exercise.sets || [];
      if (sets.length === 0) {
        nextExercise();
        return;
      }
      const set = sets[currentSet];
      const timeSeconds = set.time_seconds ? parseInt(set.time_seconds) : 0;
      const reps = set.reps ? parseInt(set.reps) : 0;

      if (timeSeconds > 0) {
        setIsRepExercise(false);
        setExerciseTime(timeSeconds);
        startCountdown(3, () => startTimedSet(timeSeconds), true);
      } else if (reps > 0) {
        setIsRepExercise(true);
        setExerciseTime(0);
      } else {
        nextExercise();
      }
    } else {
      const countdownSecs = exercise.preferences?.countdown_seconds ? parseInt(exercise.preferences.countdown_seconds) : 0;
      if (countdownSecs > 0) {
        setIsRepExercise(false);
        setExerciseTime(countdownSecs);
        startCountdown(3, () => startTimedSet(countdownSecs), true);
      } else {
        setIsRepExercise(true);
      }
    }
  };

  const handleDoneSet = () => {
    playSound('bell');
    speak("Set complete.");
    handleSetFinished();
  };

  const nextExercise = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (exerciseTimer.current) {
      clearInterval(exerciseTimer.current);
      exerciseTimer.current = null;
    }

    announcementKeyRef.current = null;
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSet(0);
      setExerciseTime(0);
      setCountdown(0);
    } else {
      finishProgram();
    }
  };

  const previousExercise = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (exerciseTimer.current) {
      clearInterval(exerciseTimer.current);
      exerciseTimer.current = null;
    }

    if (currentIndex > 0 || currentSet > 0) {
      if (currentSet > 0) {
        setCurrentSet(currentSet - 1);
      } else {
        setCurrentIndex(currentIndex - 1);
        setCurrentSet(0);
      }
      setExerciseTime(0);
      setCountdown(0);
      announcementKeyRef.current = null;
    }
  };

  const finishProgram = async () => {
    playSound('clapping');
    speak("Program complete! Great job!");
    setIsCompleted(true);
    setIsPlaying(false);
    await saveSession();
  };

  const saveSession = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const payload: ProgramSessionPayload = {
        program_id: program?._id,
        program_name: program?.name,
        workouts: exercises
          .filter(ex => ex.type === 'workout')
          .map(ex => ({
            workout_id: ex.workout_id?._id,
            sets: (ex.sets || []).map(s => ({
              reps: Number(s.reps || 0),
              time_seconds: Number(s.time_seconds || 0),
              weight_kg: Number(s.weight_kg || 0)
            }))
          })),
        geo_activities: exercises
          .filter(ex => ex.type === 'geo')
          .map(ex => ({
            activity_id: ex.activity_id?._id,
            distance_km: Number(ex.preferences?.distance_km || 0),
            moving_time_sec: Number(ex.preferences?.countdown_seconds || 0)
          })),
        total_duration_minutes: startTimeRef.current
          ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 60000)
          : 0,
        performed_at: startTimeRef.current?.toISOString() || new Date().toISOString()
      };
      await createProgramSession(payload);
      showToast({ type: 'success', text1: 'Success', text2: 'Program session saved!' });
    } catch (err: any) {
      showToast({ type: 'error', text1: 'Error', text2: 'Failed to save session' });
    } finally {
      setSaving(false);
    }
  };

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  if (!program || totalExercises === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ backgroundColor: theme.colors.background }}>
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>No exercises found for this program</h2>
          <Button onClick={() => navigate(`/programs/overview/${id}`)}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (showRest) {
    const isNextSet = currentSet < (exercises[currentIndex].sets?.length || 0) - 1;
    const upNext = isNextSet ? exercises[currentIndex] : exercises[currentIndex + 1];

    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <ProgramRest
          initialDuration={restTime}
          onComplete={() => {
            setShowRest(false);
            if (isNextSet) {
              setCurrentSet(currentSet + 1);
            } else {
              nextExercise();
            }
          }}
          onSkip={() => {
            setShowRest(false);
            if (isNextSet) {
              setCurrentSet(currentSet + 1);
            } else {
              nextExercise();
            }
          }}
          onAddSeconds={(sec: number) => setRestTime(prev => prev + sec)}
          nextExerciseName={upNext?.type === 'workout' ? upNext.workout_id?.name : upNext?.activity_id?.name}
          nextExerciseInfo={isNextSet ? `Set ${currentSet + 2}` : upNext?.type === 'workout' ? upNext.workout_id?.type : 'Outdoor Activity'}
          nextExerciseImage={upNext?.type === 'workout' ? upNext.workout_id?.animation_url : upNext?.activity_id?.icon_url}
          nextExerciseIsLottie={upNext?.type === 'workout'}
        />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: theme.colors.background }}>
        <Card className="w-full max-w-lg text-center p-12 rounded-[40px] shadow-xl border-none" style={{ backgroundColor: theme.colors.surface }}>
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-4xl font-black mb-4" style={{ color: theme.colors.text }}>Workout Complete!</h2>
          <p className="mb-8 text-lg font-medium" style={{ color: theme.colors.text, opacity: 0.6 }}>
            Great job! You've successfully finished all exercises in this program.
          </p>
          <div className="space-y-4">
            <Button
              className="w-full h-14 rounded-2xl text-xl font-bold"
              style={{ backgroundColor: theme.colors.primary }}
              onClick={() => navigate('/programs')}
            >
              Back to Programs
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl text-xl font-bold"
              onClick={() => navigate('/dashboard')}
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/programs/overview/${id}`)}
          className="p-3 rounded-full transition"
          style={{ color: theme.colors.text, backgroundColor: `${theme.colors.text}10` }}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.colors.text, opacity: 0.4 }}>
            Exercise {currentIndex + 1} of {totalExercises}
          </span>
          <h1 className="text-lg font-bold" style={{ color: theme.colors.text }}>{program.name}</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-3 rounded-full transition"
          style={{ color: theme.colors.text, backgroundColor: `${theme.colors.text}10` }}
        >
          <Home size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 max-w-4xl mx-auto w-full overflow-hidden">
        {/* Progress Bar */}
        <div
          className="w-full h-2 rounded-full mb-6 overflow-hidden shrink-0 mt-2"
          style={{ backgroundColor: `${theme.colors.primary}15` }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / totalExercises) * 100}%`,
              backgroundColor: theme.colors.primary
            }}
          />
        </div>

        {/* Animation/Icon Card */}
        <Card className="relative w-full flex-[1.5] max-w-[500px] mb-6 overflow-hidden rounded-[40px] border-none shadow-2xl shrink-0 group">
          <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.surface }}>
            {currentExercise.type === 'workout' ? (
              <CloudinaryLottie width="100%" height="100%" src={currentExercise.workout_id?.animation_url} />
            ) : (
              <CloudinarySVG src={currentExercise.activity_id?.icon_url} width={240} height={240} fallbackColor={theme.colors.primary} />
            )}
          </div>
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute top-4 right-4 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: `${theme.colors.text}15`, color: theme.colors.text }}
          >
            <Maximize2 size={20} />
          </button>
        </Card>

        {/* Exercise Info */}
        <div className="text-center mb-4 shrink-0">
          <h2 className="text-3xl font-black mb-1" style={{ color: theme.colors.text }}>
            {currentExercise.type === 'workout' ? currentExercise.workout_id?.name : currentExercise.activity_id?.name}
          </h2>
          <div className="flex items-center justify-center gap-3">
            {currentExercise.type === 'workout' && (
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider"
                style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}
              >
                <Dumbbell size={12} />
                Set {currentSet + 1} of {currentExercise.sets?.length}
              </span>
            )}
            <span
              className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider"
              style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, opacity: 0.6 }}
            >
              {currentExercise.type === 'workout' ? <Activity size={12} /> : <MapPin size={12} />}
              {currentExercise.type === 'workout' ? currentExercise.workout_id?.category : 'Outdoor'}
            </span>
          </div>
        </div>

        {/* Workout/Exercise Specific Displays */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 mb-6">
          {countdown > 0 ? (
            <div className="text-9xl font-black animate-bounce" style={{ color: theme.colors.primary }}>
              {countdown}
            </div>
          ) : exerciseTime > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-8xl font-black" style={{ color: theme.colors.primary }}>
                {formatTime(exerciseTime)}
              </div>
              <p className="font-bold uppercase tracking-widest" style={{ color: theme.colors.text, opacity: 0.4 }}>Time Remaining</p>
            </div>
          ) : isRepExercise ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold" style={{ color: theme.colors.text, opacity: 0.3 }}>x</span>
                <span className="text-8xl font-black" style={{ color: theme.colors.primary }}>
                  {currentExercise.type === 'workout' ? currentExercise.sets?.[currentSet]?.reps : 'Goal'}
                </span>
              </div>
              <Button
                className="h-20 w-48 rounded-[32px] text-2xl font-black shadow-xl"
                style={{ backgroundColor: theme.colors.success, color: 'white' }}
                onClick={handleDoneSet}
              >
                DONE
              </Button>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between pb-8 gap-6 shrink-0 mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-3xl"
            disabled={currentIndex === 0 && currentSet === 0}
            onClick={previousExercise}
            style={{ color: theme.colors.text }}
          >
            <SkipBack size={28} />
          </Button>

          <Button
            size="icon"
            className="w-20 h-20 rounded-[40px] shadow-xl"
            style={{
              backgroundColor: isPaused ? theme.colors.primary : theme.colors.surface,
              color: isPaused ? theme.colors.background : theme.colors.text
            }}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-3xl"
            onClick={nextExercise}
            style={{ color: theme.colors.text }}
          >
            <SkipForward size={28} />
          </Button>
        </div>
      </main>

      {/* Footer Details */}
      {currentExercise.type === 'workout' && currentExercise.sets?.[currentSet]?.weight_kg > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-full shadow-lg z-10 transition-transform" style={{ backgroundColor: theme.colors.text }}>
          <Timer className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <span className="text-sm font-bold" style={{ color: theme.colors.background }}>{currentExercise.sets?.[currentSet]?.weight_kg} kg weight</span>
        </div>
      )}
      {/* Full Screen Activity Overlay */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col p-4 md:p-8 overflow-hidden"
          style={{ backgroundColor: theme.colors.background }}
        >
          {/* Responsive Header */}
          <div className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest" style={{ color: theme.colors.text, opacity: 0.4 }}>Current Exercise</span>
              <h2 className="text-xl md:text-3xl font-black truncate max-w-[200px] md:max-w-none" style={{ color: theme.colors.text }}>
                {currentExercise.type === 'workout' ? currentExercise.workout_id?.name : currentExercise.activity_id?.name}
              </h2>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-3 md:p-4 rounded-2xl transition hover:scale-105"
              style={{ backgroundColor: `${theme.colors.text}10`, color: theme.colors.text }}
            >
              <Minimize2 size={24} />
            </button>
          </div>

          {/* Main Animation Area - Responsive Sizing */}
          <div className="flex-1 flex items-center justify-center min-h-0 rounded-[32px] md:rounded-[48px] shadow-inner mb-4 md:mb-8 overflow-hidden" style={{ backgroundColor: theme.colors.surface }}>
            <div className="w-full max-w-full md:max-w-[800px] aspect-square flex items-center justify-center p-4 md:p-12">
              {currentExercise.type === 'workout' ? (
                <CloudinaryLottie width="100%" height="100%" src={currentExercise.workout_id?.animation_url} />
              ) : (
                <CloudinarySVG src={currentExercise.activity_id?.icon_url} width="100%" height="100%" fallbackColor={theme.colors.primary} />
              )}
            </div>
          </div>

          {/* Stats Bar - Responsive Stacking/Sizing */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 shrink-0 mb-2 md:mb-4">
            <div className="flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl md:rounded-[32px]" style={{ backgroundColor: theme.colors.surface }}>
              <span className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: theme.colors.text, opacity: 0.4 }}>Progress</span>
              <div className="text-xl md:text-4xl font-black" style={{ color: theme.colors.primary }}>
                {currentExercise.type === 'workout' ? `${currentSet + 1}/${currentExercise.sets?.length}` : 'Outdoor'}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 order-first md:order-none flex flex-col items-center justify-center p-5 md:p-10 rounded-2xl md:rounded-[40px] shadow-2xl" style={{ backgroundColor: theme.colors.primary }}>
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1 text-white opacity-60">Status</span>
              <div className="text-3xl md:text-5xl font-black text-white">
                {countdown > 0 ? `Ready in ${countdown}` : exerciseTime > 0 ? formatTime(exerciseTime) : isRepExercise ? `${currentExercise.sets?.[currentSet]?.reps} Reps` : 'Active'}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl md:rounded-[32px]" style={{ backgroundColor: theme.colors.surface }}>
              <span className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: theme.colors.text, opacity: 0.4 }}>Next Set</span>
              <div className="text-lg md:text-3xl font-bold truncate w-full text-center" style={{ color: theme.colors.text }}>
                {currentExercise.type === 'workout' && currentSet < (currentExercise.sets?.length || 0) - 1 ? 'Go Next' : 'Finish'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
