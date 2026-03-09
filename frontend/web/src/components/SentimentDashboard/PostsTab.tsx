import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SentimentPost } from '@/api/sentimentDashboardApi';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22C55E',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#8B5CF6',
  surprise: '#EC4899',
  neutral: '#6B7280',
  disgust: '#84CC16',
};

interface Props {
  posts: SentimentPost[];
  pagination: { page: number; limit: number; total: number; pages: number };
  loading: boolean;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  theme: any;
}

export default function PostsTab({ posts, pagination, loading, onPageChange, onFilterChange, theme }: Props) {
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [stressFilter, setStressFilter] = useState('');

  const handleFilterApply = () => {
    const filters: Record<string, string> = {};
    if (sentimentFilter) filters.sentiment = sentimentFilter;
    if (emotionFilter) filters.emotion = emotionFilter;
    if (stressFilter) filters.stressLevel = stressFilter;
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSentimentFilter('');
    setEmotionFilter('');
    setStressFilter('');
    onFilterChange({});
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: theme.colors.textSecondary }}>Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: theme.colors.textSecondary }}>Sentiment</label>
              <select
                value={sentimentFilter}
                onChange={e => setSentimentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: theme.colors.border, color: theme.colors.text, background: theme.colors.surface }}
              >
                <option value="">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: theme.colors.textSecondary }}>Emotion</label>
              <select
                value={emotionFilter}
                onChange={e => setEmotionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: theme.colors.border, color: theme.colors.text, background: theme.colors.surface }}
              >
                <option value="">All</option>
                <option value="joy">Joy</option>
                <option value="sadness">Sadness</option>
                <option value="anger">Anger</option>
                <option value="fear">Fear</option>
                <option value="surprise">Surprise</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: theme.colors.textSecondary }}>Stress Level</label>
              <select
                value={stressFilter}
                onChange={e => setStressFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: theme.colors.border, color: theme.colors.text, background: theme.colors.surface }}
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button size="sm" onClick={handleFilterApply} style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>Apply</Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters} style={{ borderColor: theme.colors.border, color: theme.colors.text }}>Clear</Button>
            <div className="ml-auto text-xs" style={{ color: theme.colors.textSecondary }}>
              {pagination.total} total posts
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>No posts match the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const user = typeof post.userId === 'string' ? null : post.userId;
            const sentimentPrimary = post.sentimentAnalysis?.sentiment?.primary || 'unknown';
            const emotionPrimary = post.sentimentAnalysis?.emotion?.primary || 'unknown';
            const stressLevel = post.sentimentAnalysis?.stress?.level || 'unknown';
            const stressScore = post.sentimentAnalysis?.stress?.score || 0;

            return (
              <Card key={post._id} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                        {user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>{user?.username || 'Unknown'}</p>
                        <p className="text-[10px]" style={{ color: theme.colors.textSecondary }}>
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{ backgroundColor: `${SENTIMENT_COLORS[sentimentPrimary] || '#6B7280'}20`, color: SENTIMENT_COLORS[sentimentPrimary] || '#6B7280' }}>
                        {sentimentPrimary}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{ backgroundColor: `${EMOTION_COLORS[emotionPrimary] || '#6B7280'}20`, color: EMOTION_COLORS[emotionPrimary] || '#6B7280' }}>
                        {emotionPrimary}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{ backgroundColor: `${stressScore > 0.6 ? '#EF4444' : stressScore > 0.3 ? '#F59E0B' : '#22C55E'}20`, color: stressScore > 0.6 ? '#EF4444' : stressScore > 0.3 ? '#F59E0B' : '#22C55E' }}>
                        Stress: {stressLevel}
                      </span>
                    </div>
                  </div>

                  {/* Question */}
                  <p className="text-sm mb-2" style={{ color: theme.colors.text }}>
                    <span className="font-medium">Q: </span>{post.question}
                  </p>

                  {/* Answer */}
                  {post.sentimentResult?.selectedChoice && (
                    <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                      <span className="font-medium">A: </span>{post.sentimentResult.selectedChoice.text}
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${theme.colors.border}`, color: theme.colors.textSecondary }}>
                        Score: {post.sentimentResult.selectedChoice.value}
                      </span>
                    </p>
                  )}

                  {post.sentimentResult?.userTextInput && (
                    <p className="text-sm italic" style={{ color: theme.colors.textSecondary }}>
                      "{post.sentimentResult.userTextInput}"
                    </p>
                  )}

                  {/* Sentiment Bars */}
                  {post.sentimentAnalysis?.sentiment && (
                    <div className="mt-3 flex gap-4 text-[10px]">
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span style={{ color: '#22C55E' }}>Pos</span>
                          <span style={{ color: theme.colors.textSecondary }}>{((post.sentimentAnalysis.sentiment.positive || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: `${theme.colors.border}` }}>
                          <div className="h-full rounded-full" style={{ width: `${(post.sentimentAnalysis.sentiment.positive || 0) * 100}%`, backgroundColor: '#22C55E' }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span style={{ color: '#F59E0B' }}>Neu</span>
                          <span style={{ color: theme.colors.textSecondary }}>{((post.sentimentAnalysis.sentiment.neutral || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: `${theme.colors.border}` }}>
                          <div className="h-full rounded-full" style={{ width: `${(post.sentimentAnalysis.sentiment.neutral || 0) * 100}%`, backgroundColor: '#F59E0B' }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span style={{ color: '#EF4444' }}>Neg</span>
                          <span style={{ color: theme.colors.textSecondary }}>{((post.sentimentAnalysis.sentiment.negative || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: `${theme.colors.border}` }}>
                          <div className="h-full rounded-full" style={{ width: `${(post.sentimentAnalysis.sentiment.negative || 0) * 100}%`, backgroundColor: '#EF4444' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            style={{ borderColor: theme.colors.border, color: theme.colors.text }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
            style={{ borderColor: theme.colors.border, color: theme.colors.text }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
