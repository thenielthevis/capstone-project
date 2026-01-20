import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { historyApi, HistoryItem } from '../api/historyApi';
import { showToast } from '../components/Toast/Toast';
import Header from '@/components/Header';
import Footer from '../components/Footer';
import { Clock, Dumbbell, MapPin, Share2, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';

export default function ProgramHistory() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = useCallback(async (pageNum: number, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const newData = await historyApi.getHistory(pageNum, 20);

      if (shouldRefresh) {
        setHistory(newData);
      } else {
        setHistory(prev => [...prev, ...newData]);
      }

      setHasMore(newData.length === 20);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      showToast({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load history'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1, true);
  }, [fetchHistory]);

  const handleRefresh = () => {
    setPage(1);
    fetchHistory(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePostSession = (item: HistoryItem) => {
    // Navigate to post creation page
    const title = item.type === 'ProgramSession' 
      ? item.program_name || 'Workout'
      : item.activity_type?.name || 'Activity';
    
    const subtitle = item.type === 'ProgramSession'
      ? `${item.workouts?.length || 0} Exercises`
      : `${item.distance_km?.toFixed(2)} km`;

    navigate(`/feed?post=true&type=${item.type}&id=${item._id}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`);
  };

  const renderHistoryItem = (item: HistoryItem) => {
    const isProgram = item.type === 'ProgramSession';

    let dateVal = item.started_at;
    if (isProgram) dateVal = item.performed_at;
    const date = new Date(dateVal || new Date());

    let title = 'Activity';
    if (isProgram) title = item.program_name || 'Untitled Program';
    else title = item.activity_type?.name || 'Outdoor Activity';

    let subtitle = '';
    if (isProgram) subtitle = `${item.workouts?.length || 0} Exercises`;
    else subtitle = `${item.distance_km?.toFixed(2) || '0.00'} km • ${Math.floor((item.moving_time_sec || 0) / 60)} min`;

    let calories = 0;
    if (isProgram) calories = item.total_calories_burned || 0;
    else calories = item.calories_burned || 0;

    return (
      <div
        key={item._id}
        className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex"
        style={{ 
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`
        }}
        onClick={() => {
          // Navigate to session details
          navigate(`/programs/session/${item._id}?type=${item.type}`);
        }}
      >
        {/* Left Icon Area */}
        <div 
          className="w-16 flex items-center justify-center"
          style={{ backgroundColor: theme.colors.primary + '15' }}
        >
          {isProgram ? (
            <Dumbbell className="w-6 h-6" style={{ color: theme.colors.primary }} />
          ) : (
            <MapPin className="w-6 h-6" style={{ color: theme.colors.primary }} />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 py-4 px-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-2">
              {/* Activity Type Badge */}
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-xs font-bold uppercase"
                  style={{ color: theme.colors.primary }}
                >
                  {isProgram ? 'Program' : 'Outdoor'}
                </span>
                <span 
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {formatDate(date)} • {formatTime(date)}
                </span>
              </div>

              {/* Title */}
              <h3 
                className="font-semibold text-base truncate"
                style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
              >
                {title}
              </h3>

              {/* Subtitle */}
              <p 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {Math.round(calories)} kcal • {subtitle}
              </p>
            </div>

            {/* Post Button */}
            {!item.isPosted ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostSession(item);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-semibold text-white">Post</span>
              </button>
            ) : (
              <div className="p-1">
                <CheckCircle className="w-5 h-5" style={{ color: theme.colors.textSecondary + '55' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header 
        title="History"
        showBackButton
        backTo="/programs"
        showHomeButton
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-90"
            style={{ 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: theme.colors.primary }}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Clock className="w-16 h-16 mb-4" style={{ color: theme.colors.textSecondary + '40' }} />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.heading }}
            >
              No history yet
            </h2>
            <p 
              className="text-center max-w-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Complete your first workout or activity to see it here.
            </p>
          </div>
        )}

        {/* History List */}
        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map(renderHistoryItem)}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg transition hover:opacity-90"
                  style={{ 
                    backgroundColor: theme.colors.primary,
                    color: '#FFFFFF'
                  }}
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span>Load More</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
