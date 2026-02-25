import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { REACTIONS } from './ReactionButton';

interface Reaction {
  user: string | { _id: string };
  type: string;
}

interface ReactionCounterSimpleProps {
  reactions?: Reaction[];
  onReactionPress?: (reactionType: string) => void;
}

export default function ReactionCounterSimple({ reactions = [], onReactionPress }: ReactionCounterSimpleProps) {
  const { theme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  // Group reactions by type
  const reactionCounts = React.useMemo(() => {
    const counts: { [key: string]: { type: string; count: number; users: string[] } } = {};

    reactions?.forEach((reaction) => {
      const reactionType = reaction.type;
      const userId = typeof reaction.user === 'string' ? reaction.user : reaction.user._id;

      if (!counts[reactionType]) {
        counts[reactionType] = { type: reactionType, count: 0, users: [] };
      }
      counts[reactionType].count++;
      counts[reactionType].users.push(userId);
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [reactions]);

  if (reactionCounts.length === 0) {
    return null;
  }

  const getReactionEmoji = (reactionType: string) => {
    const reaction = REACTIONS.find(r => r.type === reactionType);
    if (!reaction) return '👍';

    // Map reaction types to emoji
    const emojiMap: { [key: string]: string } = {
      'Love': '❤️',
      'Fire': '🔥',
      'Zap': '⚡',
      'Trophy': '🏆',
      'Apple': '🍎',
      'Dumbbell': '💪',
      'Run': '🏃',
      'Smile': '😊',
      'Leaf': '🍃',
      'Wind': '💨',
      'Water': '💧',
      'Brain': '🧠',
      'Progress': '📊',
      'Steps': '👣',
    };

    return emojiMap[reactionType] || '👍';
  };

  const topThree = reactionCounts.slice(0, 3);
  const hasMore = reactionCounts.length > 3;
  const totalReactions = reactions.length;

  return (
    <div className="relative">
      {/* Reactions Display - Shows top 3 emojis + total count (Simple style) */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center px-2 py-1 rounded-full border transition-all hover:opacity-80"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          color: theme.colors.text,
          gap: '4px',
        }}
      >
        {/* Top 3 Reaction Emojis */}
        <div className="flex items-center">
          {topThree.map((reaction) => (
            <span key={reaction.type} className="text-sm">
              {getReactionEmoji(reaction.type)}
            </span>
          ))}
        </div>

        {/* Total Count */}
        <span className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>
          {totalReactions}
        </span>
      </button>

      {/* Dropdown Menu - Shows all reactions with individual counts */}
      {showDropdown && (
        <div
          className="fixed rounded-lg border shadow-lg z-50 p-3 min-w-64"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="text-xs font-semibold mb-3 px-1" style={{ color: theme.colors.textSecondary }}>
            All Reactions
          </div>
          <div className="space-y-2">
            {reactionCounts.map((reaction) => (
              <div
                key={reaction.type}
                className="flex items-center justify-between px-2 py-2 rounded-md"
                style={{
                  backgroundColor: theme.colors.background,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{getReactionEmoji(reaction.type)}</span>
                  <span style={{ color: theme.colors.text }} className="text-sm">
                    {reaction.type}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold px-2 py-1 rounded border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                >
                  {reaction.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
