import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Droplets, Check, FileText, Shield, ChevronRight, Globe, Users, EyeOff, Loader2, Pencil, Eye, Scan, Focus } from 'lucide-react';
import Header from '@/components/Header';
import { profileApi } from '@/api/profileApi';

const themeOptions = [
  {
    key: 'light' as const,
    label: 'Light',
    icon: Sun,
    description: 'Bright and clean interface',
  },
  {
    key: 'dark' as const,
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes in low light',
  },
  {
    key: 'ocean' as const,
    label: 'Ocean',
    icon: Droplets,
    description: 'Calm and refreshing blue theme',
  },
  {
    key: 'protanopia' as const,
    label: 'Protanopia',
    icon: Eye,
    description: 'Optimized for red-blind vision',
  },
  {
    key: 'deuteranopia' as const,
    label: 'Deuteranopia',
    icon: Scan,
    description: 'Optimized for green-blind vision',
  },
  {
    key: 'tritanopia' as const,
    label: 'Tritanopia',
    icon: Focus,
    description: 'Optimized for blue-blind vision',
  },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { themeMode, theme, setThemeMode } = useTheme();
  const navigate = useNavigate();

  const [profileVisibility, setProfileVisibility] = useState<'public' | 'mutuals' | 'hidden'>('public');
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const visibilityOptions = [
    {
      key: 'public' as const,
      label: 'Public',
      icon: Globe,
      description: 'Anyone can view your profile and posts',
    },
    {
      key: 'mutuals' as const,
      label: 'Mutuals Only',
      icon: Users,
      description: 'Only mutual followers can see your posts',
    },
    {
      key: 'hidden' as const,
      label: 'Hidden',
      icon: EyeOff,
      description: 'Your profile is hidden from other users',
    },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = user?._id || user?.id;
        if (!userId) return;
        const profile = await profileApi.getPublicProfile(userId);
        // The API returns the profile with isOwnProfile=true
        // We need to get the visibility from backend
        // Use a separate fetch or infer from the own profile endpoint
        setProfileLoading(false);
      } catch {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  // Fetch own visibility from user profile endpoint
  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const userId = user?._id || user?.id;
        if (!userId) return;
        const profile = await profileApi.getPublicProfile(userId);
        setBio(profile.bio || '');
        setProfileLoading(false);
      } catch {
        setProfileLoading(false);
      }
    };
    fetchVisibility();
  }, [user]);

  const handleVisibilityChange = async (visibility: 'public' | 'mutuals' | 'hidden') => {
    setVisibilityLoading(true);
    try {
      await profileApi.updateProfileVisibility(visibility);
      setProfileVisibility(visibility);
    } catch (error) {
      console.error('Error updating visibility:', error);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleBioSave = async () => {
    setBioLoading(true);
    try {
      await profileApi.updateBio(bio);
      setEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
    } finally {
      setBioLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigatetoTerms = () => {
    navigate('/terms');
  };

  const navigatetoPrivacy = () => {
    navigate('/privacy');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text
      }}
    >
      {/* Header */}
      <Header
        title="Settings"
        showBackButton
        showHomeButton
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Section */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Account
          </h2>
          <div className="space-y-3">
            <div>
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Username
              </p>
              <p
                className="font-medium"
                style={{ color: theme.colors.text }}
              >
                {user?.username}
              </p>
            </div>
            <div>
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Email
              </p>
              <p
                className="font-medium"
                style={{ color: theme.colors.text }}
              >
                {user?.email}
              </p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Appearance
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: theme.colors.textSecondary }}
          >
            Choose your preferred theme
          </p>

          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.key;

              return (
                <button
                  key={option.key}
                  onClick={() => setThemeMode(option.key)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: isSelected ? theme.colors.surface : theme.colors.background,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <Icon
                        size={24}
                        style={{ color: theme.colors.primary }}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className="font-semibold text-base"
                        style={{ color: theme.colors.text }}
                      >
                        {option.label}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      size={24}
                      style={{ color: theme.colors.primary }}
                      className="flex-shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Profile Privacy Section */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Profile Privacy
          </h2>

          {/* Bio */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-sm font-medium"
                style={{ color: theme.colors.textSecondary }}
              >
                Bio
              </p>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="p-1.5 rounded-lg hover:opacity-70 transition"
                >
                  <Pencil className="w-4 h-4" style={{ color: theme.colors.primary }} />
                </button>
              )}
            </div>
            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  placeholder="Write a short bio..."
                  className="w-full p-3 rounded-lg text-sm resize-none border"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  }}
                  rows={3}
                  maxLength={150}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: theme.colors.textTertiary }}>
                    {bio.length}/150
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBio(false)}
                      className="px-3 py-1.5 rounded-lg text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBioSave}
                      disabled={bioLoading}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      {bioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p
                className="text-sm p-3 rounded-lg"
                style={{
                  color: bio ? theme.colors.text : theme.colors.textTertiary,
                  backgroundColor: theme.colors.background,
                }}
              >
                {bio || 'No bio set. Tap the pencil to add one.'}
              </p>
            )}
          </div>

          {/* Visibility */}
          <p
            className="text-sm mb-2 font-medium"
            style={{ color: theme.colors.textSecondary }}
          >
            Who can see your profile
          </p>
          <div className="space-y-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = profileVisibility === option.key;

              return (
                <button
                  key={option.key}
                  onClick={() => handleVisibilityChange(option.key)}
                  disabled={visibilityLoading}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02] disabled:opacity-70"
                  style={{
                    backgroundColor: isSelected ? theme.colors.surface : theme.colors.background,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.surface }}
                    >
                      <Icon
                        size={24}
                        style={{ color: theme.colors.primary }}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className="font-semibold text-base"
                        style={{ color: theme.colors.text }}
                      >
                        {option.label}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    visibilityLoading ? (
                      <Loader2
                        size={24}
                        className="animate-spin flex-shrink-0"
                        style={{ color: theme.colors.primary }}
                      />
                    ) : (
                      <Check
                        size={24}
                        style={{ color: theme.colors.primary }}
                        className="flex-shrink-0"
                      />
                    )
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Terms & Conditions, Privacy Policy Section*/}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Legals
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: theme.colors.textSecondary }}
          >
            Review our terms and privacy commitments
          </p>

          <div className="space-y-3">
            <button
              onClick={navigatetoTerms}
              className="w-full cursor-pointer flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <FileText
                    size={24}
                    style={{ color: theme.colors.primary }}
                  />
                </div>
                <div className="text-left">
                  <p
                    className="font-semibold text-base"
                    style={{ color: theme.colors.text }}
                  >
                    Terms & Conditions
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Rules and guidelines for using Lyniva
                  </p>
                </div>
              </div>
              <ChevronRight
                size={20}
                style={{ color: theme.colors.textSecondary }}
              />
            </button>

            <button
              onClick={navigatetoPrivacy}
              className="w-full cursor-pointer flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <Shield
                    size={24}
                    style={{ color: theme.colors.primary }}
                  />
                </div>
                <div className="text-left">
                  <p
                    className="font-semibold text-base"
                    style={{ color: theme.colors.text }}
                  >
                    Privacy Policy
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    How we handle and protect your data
                  </p>
                </div>
              </div>
              <ChevronRight
                size={20}
                style={{ color: theme.colors.textSecondary }}
              />
            </button>
          </div>
        </section>

        {/* Navigation Section */}
        <section
          className="rounded-xl p-6 mb-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading
            }}
          >
            Quick Links
          </h2>
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className="block p-3 rounded-lg transition-colors"
              style={{
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Dashboard
            </Link>
            <Link
              to="/health-assessment"
              className="block p-3 rounded-lg transition-colors"
              style={{
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Health Assessment
            </Link>
            <Link
              to="/predictions"
              className="block p-3 rounded-lg transition-colors"
              style={{
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Predictions
            </Link>
            <Link
              to="/food-tracking"
              className="block p-3 rounded-lg transition-colors"
              style={{
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Food Tracking
            </Link>
          </div>
        </section>

        {/* Danger Zone */}
        <section
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.error + '40'
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              color: theme.colors.error,
              fontFamily: theme.fonts.heading
            }}
          >
            Danger Zone
          </h2>
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: theme.colors.error,
              color: '#FFFFFF',
            }}
          >
            Logout
          </button>
        </section>
      </main>
    </div>
  );
}
