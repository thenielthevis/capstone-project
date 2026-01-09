import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { PlusCircle } from 'lucide-react';

type ReactionType = 'Like' | 'Love' | 'Haha' | 'Wow' | 'Sad' | 'Angry';

interface ReactionButtonProps {
  userReaction?: string;
  reactionCount: number;
  onReact: (type: string) => void;
}

export const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'Like', emoji: '👍' },
  { type: 'Love', emoji: '❤️' },
  { type: 'Haha', emoji: '😆' },
  { type: 'Wow', emoji: '😮' },
  { type: 'Sad', emoji: '😢' },
  { type: 'Angry', emoji: '😡' },
];

export default function ReactionButton({ userReaction, reactionCount, onReact }: ReactionButtonProps) {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [hideTimeout]);

  const handlePress = () => {
    if (userReaction) {
      // If already reacted, tapping toggles (removes) it
      onReact(userReaction);
    } else {
      // If empty, simple tap OPENS the picker
      setPickerVisible(!pickerVisible);
    }
  };

  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    if (!userReaction) {
      setPickerVisible(true);
    }
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setPickerVisible(false);
    }, 300);
    setHideTimeout(timeout);
  };

  const handleReactionSelect = (type: string) => {
    onReact(type);
    setPickerVisible(false);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const reactionEmoji = userReaction ? REACTIONS.find((r) => r.type === userReaction)?.emoji : null;

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={handlePress}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1"
        style={{ color: userReaction ? theme.colors.primary : theme.colors.textTertiary }}
      >
        {reactionEmoji ? (
          <span className="text-lg">{reactionEmoji}</span>
        ) : (
          <PlusCircle className="w-5 h-5" />
        )}
        {reactionCount > 0 && (
          <span className="text-sm" style={{ color: theme.colors.text }}>
            {reactionCount}
          </span>
        )}
      </button>

      {/* Reaction Picker */}
      {pickerVisible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="flex gap-1 p-3 rounded-full shadow-2xl border-2"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionSelect(reaction.type)}
                className="text-2xl hover:scale-125 transition-transform p-2 rounded-full hover:bg-opacity-10"
                style={{ 
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={reaction.type}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
