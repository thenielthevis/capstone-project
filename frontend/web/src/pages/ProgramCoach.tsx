import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProgramById } from '../api/programApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import logoImg from '@/assets/logo.png';

export default function ProgramCoach() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (id) {
      fetchProgram();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((time) => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timer]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await getProgramById(id!);
      setProgram(response);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load program'
      });
      navigate('/programs');
    } finally {
      setLoading(false);
    }
  };

  const allItems = [
    ...(program?.workouts || []).map((w: any) => ({ ...w, type: 'workout' })),
    ...(program?.geo_activities || []).map((a: any) => ({ ...a, type: 'geo' }))
  ];

  const currentItem = allItems[currentIndex];
  const totalItems = allItems.length;

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimer(0);
      setIsActive(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTimer(0);
      setIsActive(false);
    }
  };

  const handleComplete = () => {
    const newCompleted = new Set(completedItems);
    newCompleted.add(currentIndex);
    setCompletedItems(newCompleted);
    if (currentIndex < totalItems - 1) {
      handleNext();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    setIsActive(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!program || totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No exercises in this program</h2>
          <Button onClick={() => navigate(`/programs/overview/${id}`)}>
            Edit Program
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: theme.colors.card, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/programs/overview/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
                <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedItems.size} / {totalItems} completed</span>
          </div>
          <div className="w-full bg-white rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedItems.size / totalItems) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Exercise */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Exercise {currentIndex + 1} of {totalItems}
              </CardTitle>
              {completedItems.has(currentIndex) && (
                <span className="flex items-center gap-2 text-green-600 font-semibold">
                  <Check className="w-5 h-5" />
                  Completed
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentItem.type === 'workout' 
                    ? currentItem.workout_id?.name 
                    : currentItem.activity_id?.name
                  }
                </h3>
                {currentItem.type === 'workout' && (
                  <p className="text-gray-600">
                    {currentItem.workout_id?.type} • {currentItem.workout_id?.category}
                  </p>
                )}
              </div>

              {/* Timer Display */}
              {timer > 0 && (
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-4">
                    {formatTime(timer)}
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setIsActive(!isActive)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={() => {
                        setTimer(0);
                        setIsActive(false);
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Exercise Details */}
              {currentItem.type === 'workout' && currentItem.sets && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sets:</h4>
                  <div className="space-y-2">
                    {currentItem.sets.map((set: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium">Set {idx + 1}</span>
                        <div className="flex gap-4 text-sm text-gray-600">
                          {set.reps && <span>Reps: {set.reps}</span>}
                          {set.time_seconds && (
                            <button
                              onClick={() => startTimer(set.time_seconds)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                              <Play className="w-4 h-4" />
                              {set.time_seconds}s
                            </button>
                          )}
                          {set.weight_kg && <span>Weight: {set.weight_kg}kg</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentItem.type === 'geo' && currentItem.preferences && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Activity Details:</h4>
                  <div className="space-y-2 text-gray-700">
                    {currentItem.preferences.distance_km && (
                      <p>Distance: {currentItem.preferences.distance_km} km</p>
                    )}
                    {currentItem.preferences.avg_pace && (
                      <p>Target Pace: {currentItem.preferences.avg_pace}</p>
                    )}
                    {currentItem.preferences.countdown_seconds && (
                      <button
                        onClick={() => startTimer(Number(currentItem.preferences.countdown_seconds))}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        Start Timer ({currentItem.preferences.countdown_seconds}s)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {completedItems.has(currentIndex) ? 'Next' : 'Complete & Next'}
          </Button>
        </div>

        {completedItems.size === totalItems && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                Workout Complete!
              </h3>
              <p className="text-green-800 mb-4">
                Great job! You've completed all exercises in this program.
              </p>
              <Button onClick={() => navigate('/programs')} className="bg-green-600 hover:bg-green-700">
                Back to Programs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
