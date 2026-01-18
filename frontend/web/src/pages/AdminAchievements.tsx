import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Award, Search, Trash2, ChevronLeft, ChevronRight,
  Filter, TrendingUp, RefreshCw, Trophy, Medal, Plus, Edit, Download
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, Achievement, AchievementStats } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';
import AchievementModal from '@/components/AchievementModal';
import { exportAchievementsReport } from '@/utils/pdfExport';

export default function AdminAchievements() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Load achievements whenever dependencies change
  useEffect(() => {
    fetchAchievements();
  }, [currentPage, sortBy, sortOrder]);

  // Load stats on initial mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      if (searchQuery) filters.searchQuery = searchQuery;
      if (categoryFilter) filters.category = categoryFilter;
      if (tierFilter) filters.tier = tierFilter;
      if (activeFilter) filters.isActive = activeFilter === 'true';

      console.log('[AdminAchievements] Fetching achievements with filters:', filters);
      const data = await adminApi.getAllAchievements(currentPage, 20, filters);
      
      console.log('[AdminAchievements] Received achievements:', data.achievements.length, 'Total items:', data.pagination.totalItems);
      setAchievements(data.achievements);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminAchievements] Failed to fetch achievements:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load achievements' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getAchievementStats();
      setStats(data);
    } catch (error: any) {
      console.error('[AdminAchievements] Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('[AdminAchievements] Searching achievements with query:', searchQuery);
    setCurrentPage(1);
    fetchAchievements();
  };

  const handleDelete = async (achievementId: string) => {
    if (!confirm('Are you sure you want to delete this achievement? This will also remove it from all users who earned it.')) return;

    try {
      console.log('[AdminAchievements] Deleting achievement:', achievementId);
      await adminApi.deleteAchievement(achievementId);
      showToast({ type: 'success', text1: 'Achievement deleted successfully' });
      
      // Refresh both achievements and stats after deletion
      fetchAchievements();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminAchievements] Failed to delete achievement:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete achievement' });
    }
  };

  const handleClearFilters = () => {
    console.log('[AdminAchievements] Clearing all filters');
    setSearchQuery('');
    setCategoryFilter('');
    setTierFilter('');
    setActiveFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    console.log('[AdminAchievements] Refreshing achievements');
    setRefreshing(true);
    await Promise.all([fetchAchievements(), fetchStats()]);
    setRefreshing(false);
  };

  const handleCreateClick = () => {
    setSelectedAchievement(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveAchievement = async (data: Partial<Achievement>) => {
    try {
      if (modalMode === 'create') {
        console.log('[AdminAchievements] Creating achievement:', data);
        await adminApi.createAchievement(data);
        showToast({ type: 'success', text1: 'Achievement created successfully' });
      } else if (selectedAchievement) {
        console.log('[AdminAchievements] Updating achievement:', selectedAchievement._id);
        await adminApi.updateAchievement(selectedAchievement._id, data);
        showToast({ type: 'success', text1: 'Achievement updated successfully' });
      }
      
      // Refresh achievements and stats after save
      fetchAchievements();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminAchievements] Failed to save achievement:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to save achievement' });
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

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      showToast({ type: 'info', text1: 'Generating PDF report...' });
      
      // Fetch all achievements for export (up to 500)
      const allData = await adminApi.getAllAchievements(1, 500, {});
      
      exportAchievementsReport(
        allData.achievements.map(achievement => ({
          _id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          icon: achievement.icon,
          criteria: achievement.criteria,
          points: achievement.points,
          tier: achievement.tier,
          is_active: achievement.is_active,
          earnedCount: achievement.earnedCount,
          created_at: achievement.created_at,
        })),
        stats ? {
          totalAchievements: stats.totalAchievements,
          activeAchievements: stats.activeAchievements,
          totalUserAchievements: stats.totalUserAchievements,
          completionRate: stats.completionRate,
        } : undefined
      );
      
      showToast({ type: 'success', text1: 'PDF report generated successfully!' });
    } catch (error: any) {
      console.error('[AdminAchievements] Export PDF error:', error);
      showToast({ type: 'error', text1: 'Failed to generate PDF report' });
    } finally {
      setExporting(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return colors[tier] || '#808080';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      workout: '#EF4444',
      nutrition: '#10B981',
      health: '#3B82F6',
      program: '#8B5CF6',
      streak: '#F59E0B',
      milestone: '#EC4899',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="achievements" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <Award className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Achievements Management
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                View and manage all achievements
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
                Create Achievement
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={exporting || achievements.length === 0}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export PDF'}
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
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Achievements</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalAchievements}
                        </p>
                      </div>
                      <Award className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Active</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.activeAchievements}
                        </p>
                      </div>
                      <Trophy className="w-8 h-8 text-green-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Times Earned</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.completedAchievements}
                        </p>
                      </div>
                      <Medal className="w-8 h-8 text-blue-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Completion Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.completionRate}
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Search Achievements
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
                        <option value="workout">Workout</option>
                        <option value="nutrition">Nutrition</option>
                        <option value="health">Health</option>
                        <option value="program">Program</option>
                        <option value="streak">Streak</option>
                        <option value="milestone">Milestone</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Tier
                      </label>
                      <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="">All Tiers</option>
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                        <option value="diamond">Diamond</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        Status
                      </label>
                      <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={handleSearch}
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#fff',
                      }}
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
                        <option value="category">Category</option>
                        <option value="tier">Tier</option>
                        <option value="points">Points</option>
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

            {/* Achievements Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                  </div>
                ) : achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary, opacity: 0.3 }} />
                    <p style={{ color: theme.colors.textSecondary }}>No achievements found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="border-b" style={{ borderColor: theme.colors.border }}>
                        <tr>
                          <th className="text-left p-4 font-semibold w-64" style={{ color: theme.colors.text }}>Achievement</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Category</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Tier</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Points</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Times Earned</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Status</th>
                          <th className="text-left p-4 font-semibold w-32" style={{ color: theme.colors.text }}>Created</th>
                          <th className="text-left p-4 font-semibold w-24" style={{ color: theme.colors.text }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {achievements.map((achievement) => (
                          <tr 
                            key={achievement._id} 
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: theme.colors.border,
                            }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate" style={{ color: theme.colors.text }} title={achievement.name}>
                                    {achievement.name}
                                  </p>
                                  <p className="text-sm line-clamp-2 break-words" style={{ color: theme.colors.textSecondary }} title={achievement.description}>
                                    {achievement.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block capitalize"
                                style={{ backgroundColor: getCategoryColor(achievement.category) }}
                              >
                                {achievement.category}
                              </span>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block capitalize"
                                style={{ backgroundColor: getTierColor(achievement.tier) }}
                              >
                                {achievement.tier}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm font-semibold whitespace-nowrap" style={{ color: theme.colors.text }}>
                                {achievement.points}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm whitespace-nowrap" style={{ color: theme.colors.text }}>
                                {achievement.earnedCount || 0} users
                              </p>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap inline-block"
                                style={{ backgroundColor: achievement.is_active ? '#10B981' : '#EF4444' }}
                              >
                                {achievement.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                                {formatDate(achievement.created_at)}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(achievement)}
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
                                  onClick={() => handleDelete(achievement._id)}
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
                {!loading && achievements.length > 0 && (
                  <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Showing {achievements.length} of {totalItems} achievements
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

      {/* Achievement Modal */}
      <AchievementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAchievement}
        achievement={selectedAchievement}
        mode={modalMode}
      />
    </div>
  );
}
