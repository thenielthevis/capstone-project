import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Plus, Edit2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTheme } from '../context/ThemeContext';
import CloudinaryLottie from '../components/CloudinaryLottie';
import CloudinarySVG from '../components/CloudinarySVG';

interface ProgramRestProps {
    initialDuration: number;
    onComplete: () => void;
    onSkip: () => void;
    onAddSeconds: (seconds: number) => void;
    nextExerciseName?: string;
    nextExerciseInfo?: string;
    nextExerciseImage?: string;
    nextExerciseIsLottie?: boolean;
}

export default function ProgramRest({
    initialDuration,
    onComplete,
    onSkip,
    onAddSeconds,
    nextExerciseName,
    nextExerciseInfo,
    nextExerciseImage,
    nextExerciseIsLottie,
}: ProgramRestProps) {
    const { theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isPaused, setIsPaused] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [customTime, setCustomTime] = useState(initialDuration.toString());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setTimeLeft(initialDuration);
    }, [initialDuration]);

    useEffect(() => {
        if (isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [onComplete, isPaused]);

    const handleAdd30s = () => {
        onAddSeconds(30);
        setTimeLeft((prev) => prev + 30);
    };

    const handleCustomTimeSave = () => {
        const newTime = parseInt(customTime);
        if (!isNaN(newTime) && newTime > 0) {
            setTimeLeft(newTime);
        }
        setShowEditModal(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate percentage for circular progress
    const percentage = (timeLeft / initialDuration) * 100;
    const radius = 120; // Increased scale
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-12 px-6 overflow-hidden">
            <h2 className="text-4xl font-black mb-12 text-center" style={{ color: theme.colors.text }}>
                Rest & Recover
            </h2>

            {/* Timer Circle */}
            <div className="relative flex items-center justify-center w-80 h-80 mb-16">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        style={{ color: `${theme.colors.text}10` }}
                    />
                    <circle
                        cx="160"
                        cy="160"
                        r={radius}
                        stroke={theme.colors.primary}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s linear'
                        }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-8xl font-black" style={{ color: theme.colors.primary }}>
                        {formatTime(timeLeft)}
                    </span>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex items-center gap-3 mt-4 transition hover:scale-105 active:scale-95"
                        style={{ color: theme.colors.text, opacity: 0.5 }}
                    >
                        {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                        <span className="text-lg font-bold">{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-6 mb-16">
                <Button
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="flex flex-col h-24 w-24 rounded-3xl gap-1 shadow-sm border-2"
                    style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}
                >
                    <Edit2 size={28} />
                    <span className="text-xs uppercase font-black" style={{ opacity: 0.4 }}>Edit</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={handleAdd30s}
                    className="flex flex-col h-24 w-24 rounded-3xl gap-1 shadow-sm border-2"
                    style={{ borderColor: `${theme.colors.text}10`, color: theme.colors.text }}
                >
                    <Plus size={28} />
                    <span className="text-xs uppercase font-black" style={{ opacity: 0.4 }}>+30s</span>
                </Button>

                <Button
                    onClick={onSkip}
                    className="flex flex-col h-24 w-28 rounded-3xl gap-1 shadow-xl"
                    style={{ backgroundColor: theme.colors.primary }}
                >
                    <SkipForward size={28} />
                    <span className="text-xs uppercase font-black text-white">Skip</span>
                </Button>
            </div>

            {/* Up Next Card */}
            {nextExerciseName && (
                <Card className="w-full max-w-xl border-none shadow-2xl overflow-hidden rounded-[40px] shrink-0" style={{ backgroundColor: theme.colors.surface }}>
                    <CardContent className="p-6 flex items-center gap-6">
                        <div
                            className="w-24 h-24 rounded-3xl flex items-center justify-center overflow-hidden border-2"
                            style={{ backgroundColor: theme.colors.background, borderColor: `${theme.colors.text}05` }}
                        >
                            {nextExerciseImage ? (
                                nextExerciseIsLottie ? (
                                    <CloudinaryLottie src={nextExerciseImage} width="100%" height="100%" />
                                ) : (
                                    <CloudinarySVG src={nextExerciseImage} width={64} height={64} fallbackColor={theme.colors.primary} />
                                )
                            ) : (
                                <Clock className="w-12 h-12" style={{ color: theme.colors.text, opacity: 0.2 }} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs uppercase font-black block mb-1 tracking-widest" style={{ color: theme.colors.text, opacity: 0.3 }}>Coming Up Next</span>
                            <h3 className="text-2xl font-black truncate" style={{ color: theme.colors.text }}>{nextExerciseName}</h3>
                            {nextExerciseInfo && (
                                <p className="text-sm font-bold truncate mt-1" style={{ color: theme.colors.primary }}>
                                    {nextExerciseInfo}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-16 h-16 rounded-full"
                            onClick={onSkip}
                            style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }}
                        >
                            <Play size={32} fill="currentColor" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Edit Time Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm px-4">
                    <Card className="w-full max-w-sm rounded-[32px] p-8">
                        <h3 className="text-2xl font-bold mb-6 text-center">Set Rest Time</h3>
                        <div className="flex items-center gap-4 mb-8">
                            <Input
                                type="number"
                                value={customTime}
                                onChange={(e) => setCustomTime(e.target.value)}
                                className="text-center font-black h-20 rounded-2xl border-none"
                                style={{ color: theme.colors.text, backgroundColor: theme.colors.background, fontFamily: theme.fonts.body, fontSize: '4rem' }}
                            />
                            <span className="text-xl font-bold" style={{ color: theme.colors.text, opacity: 0.4 }}>sec</span>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                className="flex-1 h-14 rounded-xl transition"
                                style={{ color: theme.colors.text, opacity: 0.4 }}
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-14 rounded-xl font-bold text-lg"
                                style={{ backgroundColor: theme.colors.primary }}
                                onClick={handleCustomTimeSave}
                            >
                                Set
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
