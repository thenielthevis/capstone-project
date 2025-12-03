import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, Zap } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Workout {
  _id?: string;
  category: string;
  type: string;
  name: string;
  description: string;
  animation_url?: string;
  equipment_needed: string;
}

const WORKOUT_TYPES = [
  'chest',
  'arms',
  'legs',
  'core',
  'back',
  'shoulders',
  'full_body',
  'stretching',
];

const CATEGORIES = [
  'bodyweight',
  'equipment',
];

export default function WorkoutForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Workout>({
    category: 'bodyweight',
    type: 'chest',
    name: '',
    description: '',
    equipment_needed: '',
  });

  const [animationFile, setAnimationFile] = useState<File | null>(null);
  const [animationPreview, setAnimationPreview] = useState<string>('');

  useEffect(() => {
    if (isEdit) {
      fetchWorkout();
    }
  }, [id]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/workouts/getWorkoutById/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workout');
      }
      
      const data = await response.json();
      setFormData(data);
      if (data.animation_url) {
        setAnimationPreview(data.animation_url);
      }
    } catch (err: any) {
      console.error('Error fetching workout:', err);
      setError(err.message || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimationFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAnimationPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Workout name is required');
      return;
    }

    if (!formData.type) {
      setError('Workout type is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('equipment_needed', formData.equipment_needed || '');

      if (animationFile) {
        formDataToSend.append('animation', animationFile);
        console.log('[WorkoutForm] Adding animation file:', animationFile.name);
      }

      const url = isEdit
        ? `${API_URL}/workouts/updateWorkout/${id}`
        : `${API_URL}/workouts/createWorkout`;

      const method = isEdit ? 'PATCH' : 'POST';

      console.log(`[WorkoutForm] Submitting ${isEdit ? 'UPDATE' : 'CREATE'}`);
      console.log(`[WorkoutForm] URL: ${url}`);
      console.log(`[WorkoutForm] Method: ${method}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log(`[WorkoutForm] Response status: ${response.status}`);

      const responseText = await response.text();
      console.log('[WorkoutForm] Raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        console.error('[WorkoutForm] Server error details:', errorData);
        throw new Error(errorData.message || errorData.error || `Failed to save workout (${response.status})`);
      }

      const responseData = JSON.parse(responseText);
      console.log('[WorkoutForm] Success! Updated data:', responseData);
      
      setSuccess(true);
      console.log('[WorkoutForm] Update/Create successful, redirecting...');
      
      setTimeout(() => {
        navigate('/admin/workouts', { replace: true });
        window.location.href = '/admin/workouts';
      }, 1500);
    } catch (err: any) {
      console.error('[WorkoutForm] Catch block error:', err);
      const errorMessage = err.message || 'Failed to save workout';
      console.error('[WorkoutForm] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <AdminSidebar activeNav="workouts" onSidebarToggle={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/workouts')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Workouts
            </button>
            <h1 className="text-4xl font-bold text-gray-800">
              {isEdit ? 'Edit Workout' : 'Create New Workout'}
            </h1>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {!loading && (
            <Card className="bg-white shadow-lg max-w-2xl">
              <CardHeader>
                <CardTitle>{isEdit ? 'Edit Workout Details' : 'Workout Information'}</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    ✓ Workout {isEdit ? 'updated' : 'created'} successfully! Redirecting...
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {WORKOUT_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Workout Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Push-ups, Squats, Deadlifts"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the workout exercise..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Equipment Needed */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Equipment Needed
                    </label>
                    <input
                      type="text"
                      name="equipment_needed"
                      value={formData.equipment_needed}
                      onChange={handleInputChange}
                      placeholder="e.g., Dumbbells, Barbell, None"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Animation Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Animation/Video {isEdit ? '(optional - leave blank to keep current)' : ''}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="video/*,.gif"
                        className="hidden"
                        id="animation-input"
                      />
                      <label htmlFor="animation-input" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Click to upload video or animation
                        </span>
                        <span className="text-xs text-gray-500">MP4, WebM, GIF</span>
                      </label>
                    </div>

                    {animationPreview && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                        <video
                          src={animationPreview}
                          className="w-full max-w-sm h-48 bg-gray-100 rounded-lg object-cover"
                          controls
                          muted
                        />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => navigate('/admin/workouts')}
                      className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold py-2 rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Zap size={18} />
                      {submitting ? `${isEdit ? 'Updating' : 'Creating'}...` : `${isEdit ? 'Update' : 'Create'} Workout`}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
