import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWorkouts, Workout } from '../api/workoutApi';
import { getAllGeoActivities, GeoActivity } from '../api/geoActivityApi';
import { createProgram } from '../api/programApi';
import { generateProgram, ProgramPreferences } from '../services/geminiService';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import { ArrowLeft, Home } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function AutomatedProgram() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [geoActivities, setGeoActivities] = useState<GeoActivity[]>([]);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);

  const [preferences, setPreferences] = useState<ProgramPreferences>({
    selectedCategories: [],
    selectedTypes: [],
    selectedEquipment: [],
    goals: '',
    frequency: '',
    duration: '',
    experienceLevel: 'beginner',
    includeMapBased: false
  });

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Core'];
  const types = ['Upper Body', 'Lower Body', 'Full Body', 'HIIT', 'Yoga', 'Pilates'];
  const equipment = ['None', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Mat'];
  const experienceLevels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workoutsData, geoData] = await Promise.all([
        getAllWorkouts(),
        getAllGeoActivities()
      ]);
      setWorkouts(workoutsData);
      setGeoActivities(geoData);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load exercises'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (field: keyof ProgramPreferences, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value]
      };
    });
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result = await generateProgram(preferences, workouts, geoActivities);
      setGeneratedProgram(result);
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program generated successfully!'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to generate program'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!generatedProgram) return;

    try {
      setGenerating(true);
      await createProgram(generatedProgram);
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program saved successfully'
      });
      navigate('/programs');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save program'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: theme.colors.card, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/programs')}
                className="flex items-center gap-2 transition"
                style={{ color: theme.colors.textSecondary }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
                <h1 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>AI Program Generator</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
              style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.surface }}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="rounded-lg shadow-md p-6" style={{backgroundColor: theme.colors.surface}}>
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleSelection('selectedCategories', cat)}
                  className={`px-4 py-2 rounded-lg transition ${preferences.selectedCategories.includes(cat)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6" style={{backgroundColor: theme.colors.surface}}>
            <h2 className="text-xl font-semibold mb-4">Types</h2>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleSelection('selectedTypes', type)}
                  className={`px-4 py-2 rounded-lg transition ${preferences.selectedTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6" style={{backgroundColor: theme.colors.surface}}>
            <h2 className="text-xl font-semibold mb-4">Equipment</h2>
            <div className="flex flex-wrap gap-2">
              {equipment.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleSelection('selectedEquipment', eq)}
                  className={`px-4 py-2 rounded-lg transition ${preferences.selectedEquipment.includes(eq)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6" style={{backgroundColor: theme.colors.surface}}>
            <h2 className="text-xl font-semibold mb-4">Additional Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={preferences.experienceLevel}
                  onChange={(e) => setPreferences({ ...preferences, experienceLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goals (optional)
                </label>
                <input
                  type="text"
                  value={preferences.goals}
                  onChange={(e) => setPreferences({ ...preferences, goals: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Build muscle, lose weight, improve endurance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency (optional)
                </label>
                <input
                  type="text"
                  value={preferences.frequency}
                  onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3 times per week, daily"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration per session (optional)
                </label>
                <input
                  type="text"
                  value={preferences.duration}
                  onChange={(e) => setPreferences({ ...preferences, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 30 minutes, 1 hour"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mapBased"
                  checked={preferences.includeMapBased}
                  onChange={(e) => setPreferences({ ...preferences, includeMapBased: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="mapBased" className="text-sm font-medium text-gray-700">
                  Include outdoor activities (running, cycling, etc.)
                </label>
              </div>
            </div>
          </div>

          {!generatedProgram ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 font-semibold text-lg"
            >
              {generating ? 'Generating Program...' : '✨ Generate Program with AI'}
            </button>
          ) : (
            <div className="rounded-lg shadow-md p-6" style={{backgroundColor: theme.colors.surface}}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{generatedProgram.name}</h2>
              <p className="text-gray-600 mb-4">{generatedProgram.description}</p>

              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Workouts ({generatedProgram.workouts.length})</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {generatedProgram.workouts.map((w: any, i: number) => {
                    const workout = workouts.find(wo => wo._id === w.workout_id);
                    return <li key={i}>{workout?.name || 'Unknown'} - {w.sets.length} sets</li>;
                  })}
                </ul>
              </div>

              {generatedProgram.geo_activities.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2">Activities ({generatedProgram.geo_activities.length})</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {generatedProgram.geo_activities.map((a: any, i: number) => {
                      const activity = geoActivities.find(ga => ga._id === a.activity_id);
                      return <li key={i}>{activity?.name || 'Unknown'}</li>;
                    })}
                  </ul>
                </div>
              )}

              {generatedProgram.notes && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900">{generatedProgram.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setGeneratedProgram(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleSaveProgram}
                  disabled={generating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {generating ? 'Saving...' : 'Save Program'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
