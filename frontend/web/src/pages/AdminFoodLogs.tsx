import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  UtensilsCrossed, Search, Calendar, Trash2, ChevronLeft, ChevronRight,
  Filter, TrendingUp, Users, Apple, RefreshCw
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { adminApi, FoodLog, FoodLogStats } from '@/api/adminApi';
import { showToast } from '@/components/Toast/Toast';

export default function AdminFoodLogs() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [stats, setStats] = useState<FoodLogStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('analyzedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load food logs whenever dependencies change
  useEffect(() => {
    fetchFoodLogs();
  }, [currentPage, sortBy, sortOrder]);

  // Load stats on initial mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchFoodLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {
        sortBy,
        sortOrder,
      };

      if (searchQuery) filters.searchQuery = searchQuery;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      console.log('[AdminFoodLogs] Fetching food logs from all users with filters:', filters);
      const data = await adminApi.getAllFoodLogs(currentPage, 20, filters);
      
      console.log('[AdminFoodLogs] Received food logs:', data.foodLogs.length, 'Total items:', data.pagination.totalItems);
      setFoodLogs(data.foodLogs);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error: any) {
      console.error('[AdminFoodLogs] Failed to fetch food logs:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to load food logs' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getFoodLogStats();
      setStats(data);
    } catch (error: any) {
      console.error('[AdminFoodLogs] Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('[AdminFoodLogs] Searching food logs with query:', searchQuery);
    setCurrentPage(1);
    fetchFoodLogs();
  };

  const handleDelete = async (foodLogId: string) => {
    if (!confirm('Are you sure you want to delete this food log?')) return;

    try {
      console.log('[AdminFoodLogs] Deleting food log:', foodLogId);
      await adminApi.deleteFoodLog(foodLogId);
      showToast({ type: 'success', text1: 'Food log deleted successfully' });
      
      // Refresh both food logs and stats after deletion
      fetchFoodLogs();
      fetchStats();
    } catch (error: any) {
      console.error('[AdminFoodLogs] Failed to delete food log:', error);
      showToast({ type: 'error', text1: error.response?.data?.message || 'Failed to delete food log' });
    }
  };

  const handleClearFilters = () => {
    console.log('[AdminFoodLogs] Clearing all filters');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSortBy('analyzedAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    console.log('[AdminFoodLogs] Refreshing food logs');
    setRefreshing(true);
    await Promise.all([fetchFoodLogs(), fetchStats()]);
    setRefreshing(false);
  };

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
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="foodlogs" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
                <UtensilsCrossed className="w-7 h-7" style={{ color: theme.colors.primary }} />
                Food Logs Management
              </h1>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                View and manage all user food logs
              </p>
            </div>
            <div className="flex gap-2">
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
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Total Food Logs</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalFoodLogs}
                        </p>
                      </div>
                      <Apple className="w-8 h-8" style={{ color: `${theme.colors.primary}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Active Users</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.totalUsers}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Last 7 Days</p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                          {stats.recentLogs}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8" style={{ color: `${theme.colors.success}50` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>Avg per User</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {stats.averageLogsPerUser}
                        </p>
                      </div>
                      <UtensilsCrossed className="w-8 h-8 text-orange-300" />
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
                        Search Food
                      </label>
                      <Input
                        placeholder="Search by food name..."
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
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.text }}>
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
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
                        <option value="analyzedAt">Date Analyzed</option>
                        <option value="foodName">Food Name</option>
                        <option value="calories">Calories</option>
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

            {/* Food Logs Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  All Food Logs ({totalItems} total from all users)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                    Loading food logs...
                  </div>
                ) : foodLogs.length === 0 ? (
                  <div className="text-center py-8" style={{ color: theme.colors.textSecondary }}>
                    No food logs found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {foodLogs.map((log) => (
                      <div
                        key={log._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        style={{ borderColor: theme.colors.border }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {/* Food Image */}
                            {log.imageUrl && (
                              <img
                                src={log.imageUrl}
                                alt={log.foodName}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            )}

                            {/* Food Details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg" style={{ color: theme.colors.text }}>
                                  {log.foodName}
                                </h3>
                                {log.dishName && (
                                  <span 
                                    className="text-sm px-2 py-1 rounded"
                                    style={{ 
                                      backgroundColor: `${theme.colors.primary}20`,
                                      color: theme.colors.primary
                                    }}
                                  >
                                    {log.dishName}
                                  </span>
                                )}
                              </div>

                              <div className="grid md:grid-cols-2 gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    {log.userId.username} ({log.userId.email})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(log.analyzedAt)}</span>
                                </div>
                              </div>

                              <div className="mt-2 flex gap-4 text-sm">
                                <span style={{ color: theme.colors.text }}>
                                  <strong>Calories:</strong> {log.calories} kcal
                                </span>
                                <span style={{ color: theme.colors.text }}>
                                  <strong>Serving:</strong> {log.servingSize}
                                </span>
                                {log.nutrients?.protein && (
                                  <span style={{ color: theme.colors.text }}>
                                    <strong>Protein:</strong> {log.nutrients.protein}g
                                  </span>
                                )}
                                {log.nutrients?.carbs && (
                                  <span style={{ color: theme.colors.text }}>
                                    <strong>Carbs:</strong> {log.nutrients.carbs}g
                                  </span>
                                )}
                                {log.nutrients?.fat && (
                                  <span style={{ color: theme.colors.text }}>
                                    <strong>Fat:</strong> {log.nutrients.fat}g
                                  </span>
                                )}
                              </div>

                              {log.notes && (
                                <p className="mt-2 text-sm italic" style={{ color: theme.colors.textSecondary }}>
                                  Note: {log.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log._id)}
                            style={{ color: theme.colors.error }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      Page {currentPage} of {totalPages} ({totalItems} total items)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Foods */}
            {stats && stats.topFoods.length > 0 && (
              <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardHeader>
                  <CardTitle style={{ color: theme.colors.text }}>Most Logged Foods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topFoods.map((food) => (
                      <div 
                        key={food.foodName}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <span style={{ color: theme.colors.text }}>{food.foodName}</span>
                        <span 
                          className="px-2 py-1 rounded text-sm font-medium"
                          style={{ 
                            backgroundColor: `${theme.colors.primary}20`,
                            color: theme.colors.primary
                          }}
                        >
                          {food.count} logs
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
