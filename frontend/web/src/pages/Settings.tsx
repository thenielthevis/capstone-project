import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Droplets, Check, FileText, Shield, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';

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
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { themeMode, theme, setThemeMode } = useTheme();
  const navigate = useNavigate();

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
                    Rules and guidelines for using Lifora
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
