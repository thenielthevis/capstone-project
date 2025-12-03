import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, RotateCcw, Search, X, AlertCircle } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Workout {
  _id: string;
  name: string;
  category: string;
  type: string;
}

interface Program {
  _id: string;
  name: string;
  description: string;
  workouts: Array<{
    workout_id: Workout;
    sets: Array<{
      reps: string;
      time_seconds: string;
      weight_kg: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedWorkoutId: '',
    sets: [{ reps: '', time_seconds: '', weight_kg: '' }],
  });

  useEffect(() => {
    fetchPrograms();
    fetchWorkouts();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      console.log('[PROGRAMS] Fetching programs with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/programs/getUserPrograms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[PROGRAMS] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PROGRAMS] Error response:', errorText);
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();
      console.log('[PROGRAMS] Fetched programs:', data);
      console.log('[PROGRAMS] Number of programs:', Array.isArray(data) ? data.length : 0);
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching programs:', err);
      setError(err.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${API_URL}/workouts/getAllWorkouts`);
      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }
      const data = await response.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching workouts:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSetChange = (index: number, field: string, value: string) => {
    const newSets = [...formData.sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      sets: newSets,
    }));
  };

  const addSet = () => {
    setFormData(prev => ({
      ...prev,
      sets: [...prev.sets, { reps: '', time_seconds: '', weight_kg: '' }],
    }));
  };

  const removeSet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Program name is required');
      return;
    }

    if (!formData.selectedWorkoutId) {
      setError('Please select at least one workout');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const newProgram = {
        name: formData.name.trim(),
        description: formData.description || '',
        workouts: [
          {
            workout_id: formData.selectedWorkoutId,
            sets: formData.sets.filter(s => s.reps || s.time_seconds || s.weight_kg),
          },
        ],
        geo_activities: [],
      };

      const response = await fetch(`${API_URL}/programs/createProgram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProgram),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create program');
      }

      const createdProgram = await response.json();
      setPrograms([...programs, createdProgram]);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        selectedWorkoutId: '',
        sets: [{ reps: '', time_seconds: '', weight_kg: '' }],
      });
      // Refresh programs to ensure consistency
      setTimeout(() => fetchPrograms(), 500);
    } catch (err: any) {
      console.error('Error creating program:', err);
      setError(err.message || 'Failed to create program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/programs/deleteProgram/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete program');
      }

      setPrograms(programs.filter(p => p._id !== id));
    } catch (err: any) {
      console.error('Error deleting program:', err);
      setError(err.message || 'Failed to delete program');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      selectedWorkoutId: program.workouts?.[0]?.workout_id?._id || '',
      sets: program.workouts?.[0]?.sets || [{ reps: '', time_seconds: '', weight_kg: '' }],
    });
    setShowEditModal(true);
  };

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingProgram) return;
    if (!formData.name.trim()) {
      setError('Program name is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const updatedProgramData = {
        name: formData.name.trim(),
        description: formData.description || '',
        workouts: [
          {
            workout_id: formData.selectedWorkoutId,
            sets: formData.sets.filter(s => s.reps || s.time_seconds || s.weight_kg),
          },
        ],
        geo_activities: [],
      };

      const response = await fetch(`${API_URL}/programs/updateProgram/${editingProgram._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProgramData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update program');
      }

      const updatedProgram = await response.json();
      setPrograms(programs.map(p => p._id === editingProgram._id ? updatedProgram : p));
      setShowEditModal(false);
      setEditingProgram(null);
      setFormData({
        name: '',
        description: '',
        selectedWorkoutId: '',
        sets: [{ reps: '', time_seconds: '', weight_kg: '' }],
      });
    } catch (err: any) {
      console.error('Error updating program:', err);
      setError(err.message || 'Failed to update program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      selectedWorkoutId: '',
      sets: [{ reps: '', time_seconds: '', weight_kg: '' }],
    });
  };

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <AdminSidebar activeNav="programs" onSidebarToggle={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Programs</h1>
                <p className="text-gray-600">Manage workout programs and routines</p>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                 className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Create Program
              </Button>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search programs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <Button
              onClick={fetchPrograms}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Refresh
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPrograms.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                {searchTerm ? 'No programs match your search' : 'No programs yet'}
              </p>
            </div>
          )}

          {/* Programs Grid */}
          {!loading && filteredPrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program._id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-800 mb-2">{program.name}</CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-2">{program.description || 'No description'}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-semibold">Workouts:</span> {program.workouts?.length || 0}
                      </p>
                      {program.workouts && program.workouts.length > 0 && (
                        <div className="space-y-1">
                          {program.workouts.map((workout, idx) => (
                            <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {typeof workout.workout_id === 'string'
                                ? workout.workout_id
                                : (workout.workout_id as any).name || 'Unnamed Workout'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditProgram(program)}
                         className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteProgram(program._id, program.name)}
                        disabled={deleting === program._id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                        {deleting === program._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Program Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-800">Create New Program</CardTitle>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <CardContent className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Program Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Full Body Workout, Cardio Program"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                    placeholder="Describe the program..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Select Workout */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Workout *
                  </label>
                  <select
                    name="selectedWorkoutId"
                    value={formData.selectedWorkoutId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">Choose a workout...</option>
                    {workouts.map(workout => (
                      <option key={workout._id} value={workout._id}>
                        {workout.name} ({workout.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sets */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sets (Optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.sets.map((set, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <input
                          type="text"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Time (sec)"
                          value={set.time_seconds}
                          onChange={(e) => handleSetChange(index, 'time_seconds', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Weight (kg)"
                          value={set.weight_kg}
                          onChange={(e) => handleSetChange(index, 'weight_kg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        {formData.sets.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeSet(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={addSet}
                    className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    + Add Set
                  </Button>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                   className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
             >
                    {submitting ? 'Creating...' : 'Create Program'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && editingProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-800">Edit Program</CardTitle>
              <button
                onClick={handleCloseEditModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <CardContent className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateProgram} className="space-y-4">
                {/* Program Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Full Body Workout, Cardio Program"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                    placeholder="Describe the program..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Select Workout */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Workout *
                  </label>
                  <select
                    name="selectedWorkoutId"
                    value={formData.selectedWorkoutId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="">Choose a workout...</option>
                    {workouts.map(workout => (
                      <option key={workout._id} value={workout._id}>
                        {workout.name} ({workout.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sets */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sets (Optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.sets.map((set, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <input
                          type="text"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Time (sec)"
                          value={set.time_seconds}
                          onChange={(e) => handleSetChange(index, 'time_seconds', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Weight (kg)"
                          value={set.weight_kg}
                          onChange={(e) => handleSetChange(index, 'weight_kg', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        {formData.sets.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeSet(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={addSet}
                    className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    + Add Set
                  </Button>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Updating...' : 'Update Program'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
