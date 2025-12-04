import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dumbbell, Search, Trash2, ChevronLeft, ChevronRight,
  Filter, TrendingUp, RefreshCw, Image, Tag, Plus, Edit, X
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, Workout, WorkoutStats } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';

export default function AdminWorkouts() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    category: 'bodyweight' as 'bodyweight' | 'equipment',
    type: 'chest' as 'chest' | 'arms' | 'legs' | 'core' | 'back' | 'shoulders' | 'full_body' | 'stretching',
    name: '',
    description: '',
    equipment_needed: '',
  });
  const [animationFile, setAnimationFile] = useState<File | null>(null);
  const [animationPreview, setAnimationPreview] = useState<string>('');

  // Load workouts whenever dependencies change
  useEffect(() => {
    fetchWorkouts();
  }, [currentPage, sortBy, sortOrder]);

  // Load stats on initial mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      if (searchQuery) filters.searchQuery = searchQuery;
      if (categoryFilter) filters.category = categoryFilter;
      if (typeFilter) filters.type = typeFilter;

      console.log('[AdminWorkouts] Fetching workouts with filters:', filters);
      const data = await adminApi.getAllWorkouts(currentPage, 20, filters);
      
      console.log('[AdminWorkouts] Received workouts:', data.workouts.length, 'Total items:', data.pagination.totalItems);
      setWorkouts(data.workouts);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminWorkouts] Failed to fetch workouts:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load workouts' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getWorkoutStats();
      setStats(data);
    } catch (error: any) {
      console.error('[AdminWorkouts] Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('[AdminWorkouts] Searching workouts with query:', searchQuery);
    setCurrentPage(1);
    fetchWorkouts();
  };

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      console.log('[AdminWorkouts] Deleting workout:', workoutId);
      await adminApi.deleteWorkout(workoutId);
      showToast({ type: 'success', text1: 'Workout deleted successfully' });
      
      // Refresh both workouts and stats after deletion
      fetchWorkouts();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminWorkouts] Failed to delete workout:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete workout' });
    }
  };

  const handleClearFilters = () => {
    console.log('[AdminWorkouts] Clearing all filters');
    setSearchQuery('');
    setCategoryFilter('');
    setTypeFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    console.log('[AdminWorkouts] Refreshing workouts');
    setRefreshing(true);
    await Promise.all([fetchWorkouts(), fetchStats()]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'bodyweight':
        return '#10B981';
      case 'equipment':
        return '#3B82F6';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      chest: '#EF4444',
      arms: '#F59E0B',
      legs: '#8B5CF6',
      core: '#EC4899',
      back: '#14B8A6',
      shoulders: '#6366F1',
      full_body: '#10B981',
      stretching: '#06B6D4',
    };
    return colors[type] || theme.colors.textSecondary;
  };

  const resetForm = () => {
    setFormData({
      category: 'bodyweight',
      type: 'chest',
      name: '',
      description: '',
      equipment_needed: '',
    });
    setAnimationFile(null);
    setAnimationPreview('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleOpenEditModal = (workout: Workout) => {
    setEditingWorkout(workout);
    setFormData({
      category: workout.category,
      type: workout.type,
      name: workout.name,
      description: workout.description || '',
      equipment_needed: workout.equipment_needed || '',
    });
    setAnimationPreview(workout.animation_url || '');
    setAnimationFile(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingWorkout(null);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnimationFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnimationPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast({ type: 'error', text1: 'Workout name is required' });
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createWorkout({
        ...formData,
        animation: animationFile || undefined,
      });
      showToast({ type: 'success', text1: 'Workout created successfully' });
      handleCloseCreateModal();
      fetchWorkouts();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminWorkouts] Failed to create workout:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to create workout' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout || !formData.name.trim()) {
      showToast({ type: 'error', text1: 'Workout name is required' });
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateWorkout(editingWorkout._id, {
        ...formData,
        animation: animationFile || undefined,
      });
      showToast({ type: 'success', text1: 'Workout updated successfully' });
      handleCloseEditModal();
      fetchWorkouts();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminWorkouts] Failed to update workout:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to update workout' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="workouts" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <Dumbbell className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Workouts Management
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                View and manage all workout exercises
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleOpenCreateModal}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Statistics Cards */}
            {!statsLoading && stats && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Workouts</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalWorkouts}
                        </p>
                      </div>
                      <Dumbbell className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Bodyweight</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.bodyweightWorkouts}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Equipment</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.equipmentWorkouts}
                        </p>
                      </div>
                      <Tag className="w-8 h-8 text-blue-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Categories</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.workoutsByType.length}
                        </p>
                      </div>
                      <Filter className="w-8 h-8 text-purple-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Search Workouts
                      </label>
                      <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="">All Categories</option>
                        <option value="bodyweight">Bodyweight</option>
                        <option value="equipment">Equipment</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="">All Types</option>
                        <option value="chest">Chest</option>
                        <option value="arms">Arms</option>
                        <option value="legs">Legs</option>
                        <option value="core">Core</option>
                        <option value="back">Back</option>
                        <option value="shoulders">Shoulders</option>
                        <option value="full_body">Full Body</option>
                        <option value="stretching">Stretching</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <Button
                        onClick={handleSearch}
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#fff',
                        }}
                        className="flex-1"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium" style={{ color: theme.colors.text }}>
                        Sort By:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="name">Name</option>
                        <option value="category">Category</option>
                        <option value="type">Type</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workouts Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                  </div>
                ) : workouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.3 }} />
                    <p style={{ color: theme.colors.textSecondary }}>No workouts found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="border-b" style={{ borderColor: theme.colors.border }}>
                        <tr>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Animation</th>
                          <th className="text-left p-4 font-semibold w-64" style={{ color: theme.colors.text }}>Name</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Category</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Type</th>
                          <th className="text-left p-4 font-semibold w-40" style={{ color: theme.colors.text }}>Equipment</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Created</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workouts.map((workout) => (
                          <tr 
                            key={workout._id} 
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: theme.colors.border,
                            }}
                          >
                            <td className="p-4">
                              {workout.animation_url ? (
                                <img 
                                  src={workout.animation_url} 
                                  alt={workout.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div 
                                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: theme.colors.background }}
                                >
                                  <Image className="w-6 h-6" style={{ color: theme.colors.textSecondary }} />
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="max-w-full">
                                <p className="font-medium truncate" style={{ color: theme.colors.text }} title={workout.name}>
                                  {workout.name}
                                </p>
                                {workout.description && (
                                  <p className="text-sm mt-1 line-clamp-2 break-words" style={{ color: theme.colors.textSecondary }} title={workout.description}>
                                    {workout.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                                style={{ backgroundColor: getCategoryBadgeColor(workout.category) }}
                              >
                                {workout.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                                style={{ backgroundColor: getTypeBadgeColor(workout.type) }}
                              >
                                {workout.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm break-words" style={{ color: theme.colors.text }} title={workout.equipment_needed || 'None'}>
                                {workout.equipment_needed || 'None'}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                                {formatDate(workout.createdAt)}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(workout)}
                                  style={{
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                  }}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(workout._id)}
                                  style={{
                                    borderColor: theme.colors.error,
                                    color: theme.colors.error,
                                  }}
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!loading && workouts.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Showing {workouts.length} of {totalItems} workouts
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm px-4" style={{ color: theme.colors.text }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Create Workout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseCreateModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            style={{ backgroundColor: theme.colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>Create New Workout</h2>
              <button onClick={handleCloseCreateModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" style={{ color: theme.colors.text }} />
              </button>
            </div>
            
            <form onSubmit={handleCreateWorkout} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    required
                  >
                    <option value="bodyweight">Bodyweight</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    required
                  >
                    <option value="chest">Chest</option>
                    <option value="arms">Arms</option>
                    <option value="legs">Legs</option>
                    <option value="core">Core</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="full_body">Full Body</option>
                    <option value="stretching">Stretching</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Workout Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Push-ups"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the workout..."
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Equipment Needed
                </label>
                <Input
                  value={formData.equipment_needed}
                  onChange={(e) => setFormData({ ...formData, equipment_needed: e.target.value })}
                  placeholder="e.g., Dumbbells, Barbell, None"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Animation/Image
                </label>
                <input
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                />
                {animationPreview && (
                  <img src={animationPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                <Button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
                  className="flex-1"
                >
                  {submitting ? 'Creating...' : 'Create Workout'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseCreateModal}
                  disabled={submitting}
                  style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workout Modal */}
      {showEditModal && editingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseEditModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
            style={{ backgroundColor: theme.colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>Edit Workout</h2>
              <button onClick={handleCloseEditModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" style={{ color: theme.colors.text }} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateWorkout} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    required
                  >
                    <option value="bodyweight">Bodyweight</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                    required
                  >
                    <option value="chest">Chest</option>
                    <option value="arms">Arms</option>
                    <option value="legs">Legs</option>
                    <option value="core">Core</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="full_body">Full Body</option>
                    <option value="stretching">Stretching</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Workout Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Push-ups"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the workout..."
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Equipment Needed
                </label>
                <Input
                  value={formData.equipment_needed}
                  onChange={(e) => setFormData({ ...formData, equipment_needed: e.target.value })}
                  placeholder="e.g., Dumbbells, Barbell, None"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Animation/Image
                </label>
                <input
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }}
                />
                {animationPreview && (
                  <div className="mt-2">
                    <p className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                      {animationFile ? 'New image:' : 'Current image:'}
                    </p>
                    <img src={animationPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                <Button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
                  className="flex-1"
                >
                  {submitting ? 'Updating...' : 'Update Workout'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditModal}
                  disabled={submitting}
                  style={{ borderColor: theme.colors.border, color: theme.colors.text }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
