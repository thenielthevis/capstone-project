import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { profileApi } from '@/api/profileApi';
import { X, Trophy, AlertCircle, Loader2 } from 'lucide-react';

interface Achievement {
  _id: string;
  achievement_id: {
    name: string;
    description: string;
    icon: string;
    category: string;
  };
  completed_at: string;
  progress: number;
}

interface UserAchievementsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserAchievementsModal({ userId, isOpen, onClose }: UserAchievementsModalProps) {
  const { theme } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchAchievements();
    }
  }, [isOpen, userId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getUserAchievements(userId);
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
          >
            Achievements
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: theme.colors.primary }} />
              <p style={{ color: theme.colors.textSecondary }}>Loading...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
              <p style={{ color: theme.colors.textSecondary }}>{error}</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Trophy className="w-12 h-12 mb-3" style={{ color: theme.colors.textTertiary }} />
              <p style={{ color: theme.colors.textSecondary }}>No achievements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-4 p-3 rounded-xl border transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full text-2xl"
                    style={{ backgroundColor: theme.colors.primary + '20' }}
                  >
                    {item.achievement_id.icon || '🏆'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: theme.colors.text }}>
                      {item.achievement_id.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>
                      {item.achievement_id.description}
                    </p>
                    <p className="text-[10px] mt-1 opacity-70" style={{ color: theme.colors.textTertiary }}>
                      Earned on {new Date(item.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
