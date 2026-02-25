import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { ProfilePost } from '@/api/profileApi';
import { MessageSquare, Heart, Image } from 'lucide-react';

interface PostGridProps {
  posts: ProfilePost[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Image className="w-16 h-16 mb-4" style={{ color: theme.colors.textTertiary }} />
        <p
          className="text-lg font-semibold mb-1"
          style={{ fontFamily: theme.fonts.heading, color: theme.colors.textSecondary }}
        >
          No Posts Yet
        </p>
        <p
          className="text-sm"
          style={{ color: theme.colors.textTertiary }}
        >
          Posts will appear here when shared.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <button
          key={post._id}
          onClick={() => navigate(`/post/${post._id}`)}
          className="relative aspect-square overflow-hidden group cursor-pointer"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {/* Thumbnail or text preview */}
          {post.thumbnail || (post.images && post.images.length > 0) ? (
            <img
              src={post.thumbnail || post.images[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center p-3"
              style={{ backgroundColor: theme.colors.primary + '10' }}
            >
              <p
                className="text-xs leading-snug line-clamp-4 text-left"
                style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}
              >
                {post.content}
              </p>
            </div>
          )}

          {/* Multi-image indicator */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2">
              <Image className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          )}

          {/* Hover overlay with stats */}
          <div
            className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <div className="flex items-center gap-1 text-white text-sm font-semibold">
              <Heart className="w-4 h-4 fill-white" />
              <span>{post.reactionCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-white text-sm font-semibold">
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{post.commentCount || 0}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
