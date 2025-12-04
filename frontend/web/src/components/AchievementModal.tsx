import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Achievement } from '@/api/adminApi';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Achievement>) => Promise<void>;
  achievement?: Achievement | null;
  mode: 'create' | 'edit';
}

export default function AchievementModal({
  isOpen,
  onClose,
  onSave,
  achievement,
  mode,
}: AchievementModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'workout' as Achievement['category'],
    icon: '🏆',
    badge_image: '',
    criteria: {
      type: 'count' as 'count' | 'threshold' | 'streak' | 'completion',
      target: 1,
      metric: '',
    },
    points: 0,
    tier: 'bronze' as Achievement['tier'],
    is_active: true,
  });

  useEffect(() => {
    if (achievement && mode === 'edit') {
      setFormData({
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        badge_image: achievement.badge_image || '',
        criteria: achievement.criteria,
        points: achievement.points,
        tier: achievement.tier,
        is_active: achievement.is_active,
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        category: 'workout',
        icon: '🏆',
        badge_image: '',
        criteria: {
          type: 'count',
          target: 1,
          metric: '',
        },
        points: 0,
        tier: 'bronze',
        is_active: true,
      });
    }
  }, [achievement, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving achievement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ backgroundColor: theme.colors.card }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
        >
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            {mode === 'create' ? 'Create New Achievement' : 'Edit Achievement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: theme.colors.background }}
          >
            <X className="w-5 h-5" style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., First Workout"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                placeholder="Describe the achievement..."
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Icon *
                </label>
                <Input
                  type="text"
                  value={formData.icon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  required
                  placeholder="🏆"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Badge Image URL
                </label>
                <Input
                  type="text"
                  value={formData.badge_image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, badge_image: e.target.value })
                  }
                  placeholder="https://..."
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Achievement['category'] })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                >
                  <option value="workout">Workout</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="health">Health</option>
                  <option value="program">Program</option>
                  <option value="streak">Streak</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Tier *
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData({ ...formData, tier: e.target.value as Achievement['tier'] })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Achievement Criteria
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Criteria Type *
              </label>
              <select
                value={formData.criteria.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria: {
                      ...formData.criteria,
                      type: e.target.value as 'count' | 'threshold' | 'streak' | 'completion',
                    },
                  })
                }
                required
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <option value="count">Count</option>
                <option value="threshold">Threshold</option>
                <option value="streak">Streak</option>
                <option value="completion">Completion</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Target *
                </label>
                <Input
                  type="number"
                  value={formData.criteria.target}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, target: parseInt(e.target.value) || 0 },
                    })
                  }
                  required
                  min="1"
                  placeholder="e.g., 10"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  Metric *
                </label>
                <Input
                  type="text"
                  value={formData.criteria.metric}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, metric: e.target.value },
                    })
                  }
                  required
                  placeholder="e.g., workouts_completed"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rewards & Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Rewards & Status
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                Points
              </label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
                }
                min="0"
                placeholder="e.g., 100"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
                style={{ accentColor: theme.colors.primary }}
              />
              <label htmlFor="is_active" className="text-sm font-medium" style={{ color: theme.colors.text }}>
                Active (users can earn this achievement)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#fff',
              }}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Achievement' : 'Update Achievement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
