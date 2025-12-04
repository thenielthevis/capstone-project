import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Calendar, Search, Trash2, ChevronLeft, ChevronRight,
  Filter, TrendingUp, RefreshCw, User, Activity, Plus, Edit
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, Program, ProgramStats } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';
import ProgramModal from '@/components/ProgramModal';

export default function AdminPrograms() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState<ProgramStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [availableGeoActivities, setAvailableGeoActivities] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Load programs whenever dependencies change
  useEffect(() => {
    fetchPrograms();
  }, [currentPage, sortBy, sortOrder]);

  // Load stats on initial mount
  useEffect(() => {
    fetchStats();
    fetchAvailableResources();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      if (searchQuery) filters.searchQuery = searchQuery;

      console.log('[AdminPrograms] Fetching programs with filters:', filters);
      const data = await adminApi.getAllPrograms(currentPage, 20, filters);
      
      console.log('[AdminPrograms] Received programs:', data.programs.length, 'Total items:', data.pagination.totalItems);
      setPrograms(data.programs);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminPrograms] Failed to fetch programs:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load programs' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getProgramStats();
      setStats(data);
    } catch (error: any) {
      console.error('[AdminPrograms] Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('[AdminPrograms] Searching programs with query:', searchQuery);
    setCurrentPage(1);
    fetchPrograms();
  };

  const handleDelete = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      console.log('[AdminPrograms] Deleting program:', programId);
      await adminApi.deleteProgram(programId);
      showToast({ type: 'success', text1: 'Program deleted successfully' });
      
      // Refresh both programs and stats after deletion
      fetchPrograms();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminPrograms] Failed to delete program:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete program' });
    }
  };

  const handleClearFilters = () => {
    console.log('[AdminPrograms] Clearing all filters');
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    console.log('[AdminPrograms] Refreshing programs');
    setRefreshing(true);
    await Promise.all([fetchPrograms(), fetchStats()]);
    setRefreshing(false);
  };

  const fetchAvailableResources = async () => {
    try {
      // Fetch workouts
      const workoutsData = await adminApi.getAllWorkouts(1, 1000);
      setAvailableWorkouts(workoutsData.workouts);

      // Fetch geo activities
      const geoData = await adminApi.getAllGeoActivities(1, 1000);
      setAvailableGeoActivities(geoData.activities);

      // Fetch users
      const usersData = await adminApi.getUsers(1, 1000);
      setAvailableUsers(usersData.users);
    } catch (error) {
      console.error('[AdminPrograms] Failed to fetch resources:', error);
    }
  };

  const handleCreateClick = () => {
    setSelectedProgram(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditClick = (program: Program) => {
    setSelectedProgram(program);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveProgram = async (data: any) => {
    try {
      if (modalMode === 'create') {
        console.log('[AdminPrograms] Creating program:', data);
        await adminApi.createProgram(data);
        showToast({ type: 'success', text1: 'Program created successfully' });
      } else if (selectedProgram) {
        console.log('[AdminPrograms] Updating program:', selectedProgram._id);
        await adminApi.updateProgram(selectedProgram._id, data);
        showToast({ type: 'success', text1: 'Program updated successfully' });
      }
      
      // Refresh programs and stats after save
      fetchPrograms();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminPrograms] Failed to save program:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to save program' });
      throw error; // Re-throw to let modal handle it
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="programs" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <Calendar className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Programs Management
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                View and manage all user programs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateClick}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Program
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
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Programs</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalPrograms}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Program Creators</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.totalCreators}
                        </p>
                      </div>
                      <User className="w-8 h-8 text-blue-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Avg Workouts</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.avgWorkoutsPerProgram}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-green-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Recent (7d)</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.recentPrograms}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Search Programs
                      </label>
                      <Input
                        placeholder="Search by name or description..."
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
                        <option value="created_at">Date Created</option>
                        <option value="name">Name</option>
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

            {/* Programs Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.3 }} />
                    <p style={{ color: theme.colors.textSecondary }}>No programs found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="border-b" style={{ borderColor: theme.colors.border }}>
                        <tr>
                          <th className="text-left p-4 font-semibold w-64" style={{ color: theme.colors.text }}>Program Name</th>
                          <th className="text-left p-4 font-semibold w-56" style={{ color: theme.colors.text }}>Creator</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Workouts</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Geo Activities</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Created</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programs.map((program) => (
                          <tr 
                            key={program._id} 
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: theme.colors.border,
                            }}
                          >
                            <td className="p-4">
                              <div className="max-w-full">
                                <p className="font-medium truncate" style={{ color: theme.colors.text }} title={program.name}>
                                  {program.name}
                                </p>
                                {program.description && (
                                  <p className="text-sm mt-1 line-clamp-2 break-words" style={{ color: theme.colors.textSecondary }} title={program.description}>
                                    {program.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 min-w-0">
                                {program.user_id.profilePicture ? (
                                  <img 
                                    src={program.user_id.profilePicture} 
                                    alt={program.user_id.username}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: theme.colors.primary }}
                                  >
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }} title={program.user_id.username}>
                                    {program.user_id.username}
                                  </p>
                                  <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }} title={program.user_id.email}>
                                    {program.user_id.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                                style={{ backgroundColor: '#3B82F6' }}
                              >
                                {program.workouts.length} workout{program.workouts.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                                style={{ backgroundColor: '#10B981' }}
                              >
                                {program.geo_activities.length} activit{program.geo_activities.length !== 1 ? 'ies' : 'y'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                                {formatDate(program.created_at)}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(program)}
                                  style={{
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                  }}
                                  className="hover:bg-opacity-80"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(program._id)}
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
                {!loading && programs.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Showing {programs.length} of {totalItems} programs
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

      {/* Program Modal */}
      <ProgramModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProgram}
        program={selectedProgram}
        mode={modalMode}
        availableWorkouts={availableWorkouts}
        availableGeoActivities={availableGeoActivities}
        availableUsers={availableUsers}
      />
    </div>
  );
}
