import { useState, useEffect } from 'react';
import { Plus, Search, RotateCcw, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AdminSidebar from '@/components/AdminSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface FoodLog {
  _id: string;
  foodName: string;
  dishName?: string;
  calories: number;
  servingSize: string;
  notes?: string;
  imageUrl?: string;
  analyzedAt: string;
  inputMethod: string;
}

export default function FoodLogs() {
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLog | null>(null);

  const [formData, setFormData] = useState({
    foodName: '',
    dishName: '',
    calories: '',
    servingSize: '',
    notes: '',
    inputMethod: 'manual',
  });

  useEffect(() => {
    fetchFoodLogs();
  }, []);

  const fetchFoodLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      console.log('[FOOD_LOGS] Fetching food logs with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/food-logs/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[FOOD_LOGS] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FOOD_LOGS] Error response:', errorText);
        throw new Error('Failed to fetch food logs');
      }

      const data = await response.json();
      console.log('[FOOD_LOGS] Fetched data:', data);
      
      // Handle both direct array and paginated response
      const logs = data.foodLogs || (Array.isArray(data) ? data : []);
      console.log('[FOOD_LOGS] Number of food logs:', logs.length);
      setFoodLogs(Array.isArray(logs) ? logs : []);
    } catch (err: any) {
      console.error('Error fetching food logs:', err);
      setError(err.message || 'Failed to load food logs');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.foodName.trim()) {
      setError('Food name is required');
      return;
    }

    if (!formData.calories) {
      setError('Calories is required');
      return;
    }

    if (!formData.servingSize.trim()) {
      setError('Serving size is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const newFoodLog = {
        foodName: formData.foodName.trim(),
        dishName: formData.dishName.trim() || null,
        calories: parseInt(formData.calories),
        servingSize: formData.servingSize.trim(),
        notes: formData.notes.trim() || '',
        inputMethod: formData.inputMethod,
        nutrients: {},
        brandedProduct: {
          isBranded: false,
          brandName: null,
          productName: null,
          ingredients: null,
          purchaseLinks: { lazada: null, shopee: null, puregold: null }
        },
        allergyWarnings: {
          detected: [],
          mayContain: [],
          warning: null
        },
        userAllergies: [],
        healthyAlternatives: [],
        confidence: 'medium'
      };

      const response = await fetch(`${API_URL}/food-logs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newFoodLog),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create food log');
      }

      const createdLog = await response.json();
      console.log('[FOOD_LOGS] Created:', createdLog);
      
      // Add to list (handle both direct object and wrapped response)
      const logToAdd = createdLog.foodLog || createdLog;
      setFoodLogs([logToAdd, ...foodLogs]);
      setShowModal(false);
      setFormData({
        foodName: '',
        dishName: '',
        calories: '',
        servingSize: '',
        notes: '',
        inputMethod: 'manual',
      });
      setTimeout(() => fetchFoodLogs(), 500);
    } catch (err: any) {
      console.error('Error creating food log:', err);
      setError(err.message || 'Failed to create food log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFoodLog = async (id: string, foodName: string) => {
    if (!confirm(`Are you sure you want to delete "${foodName}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/food-logs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete food log');
      }

      setFoodLogs(foodLogs.filter(log => log._id !== id));
    } catch (err: any) {
      console.error('Error deleting food log:', err);
      setError(err.message || 'Failed to delete food log');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditFoodLog = (foodLog: FoodLog) => {
    setEditingFoodLog(foodLog);
    setFormData({
      foodName: foodLog.foodName,
      dishName: foodLog.dishName || '',
      calories: foodLog.calories.toString(),
      servingSize: foodLog.servingSize,
      notes: foodLog.notes || '',
      inputMethod: foodLog.inputMethod || 'manual',
    });
    setShowEditModal(true);
  };

  const handleUpdateFoodLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingFoodLog) return;
    if (!formData.foodName.trim()) {
      setError('Food name is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const updatedData = {
        foodName: formData.foodName.trim() || '',
        notes: formData.notes.trim() || '',
        dishName: formData.dishName.trim() || null,
        servingSize: formData.servingSize.trim(),
      };

      const response = await fetch(`${API_URL}/food-logs/${editingFoodLog._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update food log');
      }

      const updatedLog = await response.json();
      console.log('[FOOD_LOGS] Updated:', updatedLog);
      
      // Update in list (handle both direct object and wrapped response)
      const logToUpdate = updatedLog.foodLog || updatedLog;
      setFoodLogs(foodLogs.map(log => log._id === editingFoodLog._id ? logToUpdate : log));
      setShowEditModal(false);
      setEditingFoodLog(null);
      setFormData({
        foodName: '',
        dishName: '',
        calories: '',
        servingSize: '',
        notes: '',
        inputMethod: 'manual',
      });
    } catch (err: any) {
      console.error('Error updating food log:', err);
      setError(err.message || 'Failed to update food log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingFoodLog(null);
    setFormData({
      foodName: '',
      dishName: '',
      calories: '',
      servingSize: '',
      notes: '',
      inputMethod: 'manual',
    });
  };

  const filteredFoodLogs = foodLogs.filter(log =>
    log.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.dishName && log.dishName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <AdminSidebar activeNav="foodlogs" onSidebarToggle={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Food Logs</h1>
                <p className="text-gray-600">Track and manage your food intake</p>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                 className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Log Food
              </Button>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by food name or dish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <Button
              onClick={fetchFoodLogs}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredFoodLogs.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                {searchTerm ? 'No food logs match your search' : 'No food logs yet'}
              </p>
            </div>
          )}

          {/* Food Logs Grid */}
          {!loading && filteredFoodLogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoodLogs.map((foodLog) => (
                <Card key={foodLog._id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  {foodLog.imageUrl && (
                    <div className="w-full h-40 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img src={foodLog.imageUrl} alt={foodLog.foodName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-bold text-gray-800 mb-2">{foodLog.foodName}</CardTitle>
                    {foodLog.dishName && (
                      <p className="text-gray-600 text-sm mb-2">{foodLog.dishName}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(foodLog.analyzedAt)}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 font-semibold">Calories:</span>
                        <span className="text-sm font-bold text-green-600">{foodLog.calories} kcal</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 font-semibold">Serving Size:</span>
                        <span className="text-sm text-gray-600">{foodLog.servingSize}</span>
                      </div>
                      {foodLog.notes && (
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-600"><span className="font-semibold">Notes:</span> {foodLog.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditFoodLog(foodLog)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteFoodLog(foodLog._id, foodLog.foodName)}
                        disabled={deleting === foodLog._id}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                        {deleting === foodLog._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Food Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-800">Log Food</CardTitle>
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
                {/* Food Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    name="foodName"
                    value={formData.foodName}
                    onChange={handleInputChange}
                    placeholder="e.g., Apple, Rice, Chicken"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* Dish Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dish Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="dishName"
                    value={formData.dishName}
                    onChange={handleInputChange}
                    placeholder="e.g., Caesar Salad, Spaghetti Bolognese"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* Calories */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calories *
                  </label>
                  <input
                    type="number"
                    name="calories"
                    value={formData.calories}
                    onChange={handleInputChange}
                    placeholder="e.g., 150"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* Serving Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serving Size *
                  </label>
                  <input
                    type="text"
                    name="servingSize"
                    value={formData.servingSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 1 cup, 100g, 1 piece"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* Input Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Input Method
                  </label>
                  <select
                    name="inputMethod"
                    value={formData.inputMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="image">Image Recognition</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Logging...' : 'Log Food'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Food Log Modal */}
      {showEditModal && editingFoodLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white shadow-2xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-800">Edit Food Log</CardTitle>
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

              <form onSubmit={handleUpdateFoodLog} className="space-y-4">
                {/* Food Name - Now Editable */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Food Name
                  </label>
                  <input
                    type="text"
                    name="foodName"
                    value={formData.foodName}
                    onChange={handleInputChange}
                    placeholder="e.g., Apple, Rice, Chicken"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Dish Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    name="dishName"
                    value={formData.dishName}
                    onChange={handleInputChange}
                    placeholder="e.g., Caesar Salad"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Serving Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serving Size
                  </label>
                  <input
                    type="text"
                    name="servingSize"
                    value={formData.servingSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 1 cup"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Food Log'}
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
