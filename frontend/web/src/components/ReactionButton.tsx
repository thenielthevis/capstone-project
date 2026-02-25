import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Heart, Fire, Lightning, Trophy, ArrowFatUp, Barbell, PersonSimpleRun, PersonSimpleWalk, Smiley, Leaf, Wind, Drop, Brain, ChartBar, Plus } from 'phosphor-react';

type ReactionType = 'Love' | 'Fire' | 'Zap' | 'Trophy' | 'Apple' | 'Dumbbell' | 'Run' | 'Smile' | 'Leaf' | 'Wind' | 'Water' | 'Brain' | 'Progress' | 'Steps';

interface ReactionButtonProps {
  userReaction?: string;
  reactionCount: number;
  onReact: (type: string) => void;
}

export const REACTIONS: { type: ReactionType; icon: React.ReactNode }[] = [
  { type: 'Love', icon: <Heart size={24} weight="fill" /> },
  { type: 'Fire', icon: <Fire size={24} weight="fill" /> },
  { type: 'Zap', icon: <Lightning size={24} weight="fill" /> },
  { type: 'Trophy', icon: <Trophy size={24} weight="fill" /> },
  { type: 'Apple', icon: <ArrowFatUp size={24} weight="fill" /> },
  { type: 'Dumbbell', icon: <Barbell size={24} weight="fill" /> },
  { type: 'Run', icon: <PersonSimpleRun size={24} weight="fill" /> },
  { type: 'Smile', icon: <Smiley size={24} weight="fill" /> },
  { type: 'Leaf', icon: <Leaf size={24} weight="fill" /> },
  { type: 'Wind', icon: <Wind size={24} weight="fill" /> },
  { type: 'Water', icon: <Drop size={24} weight="fill" /> },
  { type: 'Brain', icon: <Brain size={24} weight="fill" /> },
  { type: 'Progress', icon: <ChartBar size={24} weight="fill" /> },
  { type: 'Steps', icon: <PersonSimpleWalk size={24} weight="fill" /> },
];

const QUICK_REACTIONS = [
  { type: 'Love', icon: <Heart size={24} weight="fill" /> },
  { type: 'Fire', icon: <Fire size={24} weight="fill" /> },
  { type: 'Zap', icon: <Lightning size={24} weight="fill" /> },
  { type: 'Trophy', icon: <Trophy size={24} weight="fill" /> },
  { type: 'Apple', icon: <ArrowFatUp size={24} weight="fill" /> },
];

export default function ReactionButton({ userReaction, reactionCount, onReact }: ReactionButtonProps) {
  const { theme } = useTheme();
  const [quickVisible, setQuickVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const filteredReactions = useMemo(() => {
    if (!searchText.trim()) return REACTIONS;
    return REACTIONS.filter(r => 
      r.type.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

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
      setQuickVisible(true);
    }
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setQuickVisible(false);
    }, 1500);
    setHideTimeout(timeout);
  };

  const handleReactionSelect = (type: string) => {
    onReact(type);
    setQuickVisible(false);
    setPickerVisible(false);
    setSearchText('');
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const reactionData = userReaction ? REACTIONS.find((r) => r.type === userReaction) : null;

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={userReaction ? handlePress : handleMouseEnter}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1"
        style={{ color: userReaction ? theme.colors.primary : theme.colors.textTertiary }}
      >
        {reactionData ? (
          <span style={{ color: userReaction ? theme.colors.primary : theme.colors.text }}>
            {reactionData.icon}
          </span>
        ) : (
          <Plus size={20} weight="fill" />
        )}
      </button>

      {/* Quick Reactions (on hover) */}
      {quickVisible && !userReaction && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="rounded-lg shadow-xl border p-2 flex gap-1"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
          >
            {QUICK_REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionSelect(reaction.type)}
                className="flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: theme.colors.border,
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  border: `2px solid ${theme.colors.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                  e.currentTarget.style.borderColor = theme.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
                title={reaction.type}
              >
                <div style={{ color: theme.colors.text }}>
                  {reaction.icon}
                </div>
              </button>
            ))}
            {/* Plus button for full picker */}
            <button
              onClick={() => {
                setQuickVisible(false);
                setPickerVisible(true);
              }}
              className="flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.colors.border,
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                border: `2px solid ${theme.colors.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                e.currentTarget.style.borderColor = theme.colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
              title="More reactions"
            >
              <div style={{ color: theme.colors.text }}>
                <Plus size={24} weight="fill" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Full Reaction Picker (on + click) */}
      {pickerVisible && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 pt-20"
          onMouseEnter={() => {
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              setHideTimeout(null);
            }
          }}
          onMouseLeave={() => {
            const timeout = setTimeout(() => {
              setPickerVisible(false);
            }, 1500);
            setHideTimeout(timeout);
          }}
        >
          <div
            className="rounded-lg shadow-2xl border p-6 w-full max-w-2xl mx-4"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }}
          >
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search reactions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 rounded border mb-3 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
                if (hideTimeout) {
                  clearTimeout(hideTimeout);
                  setHideTimeout(null);
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
              onMouseEnter={() => {
                if (hideTimeout) {
                  clearTimeout(hideTimeout);
                  setHideTimeout(null);
                }
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setPickerVisible(false);
                }, 1500);
                setHideTimeout(timeout);
              }}
            />

            {/* Reactions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {filteredReactions.length > 0 ? (
                filteredReactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReactionSelect(reaction.type)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:scale-110"
                    style={{
                      backgroundColor: theme.colors.background,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                      if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        setHideTimeout(null);
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.background;
                    }}
                    title={reaction.type}
                  >
                    <div style={{ color: theme.colors.text }}>
                      {reaction.icon}
                    </div>
                    <span className="text-xs mt-1" style={{ color: theme.colors.textTertiary }}>
                      {reaction.type}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-5 text-center py-4 text-sm" style={{ color: theme.colors.textTertiary }}>
                  No reactions found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
