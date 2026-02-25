import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { profileApi, FollowUser } from '@/api/profileApi';
import { X, User, Loader2 } from 'lucide-react';

interface FollowListModalProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowListModal({ userId, type, isOpen, onClose }: FollowListModalProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchList();
    }
  }, [isOpen, type, userId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = type === 'followers'
        ? await profileApi.getFollowers(userId)
        : await profileApi.getFollowing(userId);
      setUsers(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (clickedUserId: string) => {
    onClose();
    navigate(`/profile/${clickedUserId}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden max-h-[70vh] flex flex-col"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h3
            className="text-lg font-semibold capitalize"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
          >
            {type}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70 transition"
          >
            <X className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: theme.colors.primary }}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 mx-auto mb-2" style={{ color: theme.colors.textTertiary }} />
              <p style={{ color: theme.colors.textSecondary }}>
                No {type} yet
              </p>
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u._id}
                onClick={() => handleUserClick(u._id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:opacity-80 transition text-left"
                style={{ borderBottom: `1px solid ${theme.colors.border}` }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: theme.colors.primary + '20' }}
                >
                  {u.profilePicture ? (
                    <img
                      src={u.profilePicture}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
                  >
                    {u.username}
                  </p>
                  {u.bio && (
                    <p
                      className="text-xs truncate"
                      style={{ color: theme.colors.textTertiary }}
                    >
                      {u.bio}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
