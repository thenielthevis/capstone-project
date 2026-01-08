import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Home, 
  MessageSquare, 
  User,
  Settings,
  LogOut,
  TrendingUp,
  Heart,
  Utensils,
  Dumbbell,
  FileText,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/assets/logo.png';
import { Button } from './ui/button';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  showHomeButton?: boolean;
  rightContent?: React.ReactNode;
  showNav?: boolean;
}

export default function Header({ 
  title = 'Lifora', 
  showBackButton = false, 
  backTo = '/dashboard',
  showHomeButton = false,
  rightContent,
  showNav = true
}: HeaderProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickNavItems = [
    { label: 'Analysis', icon: TrendingUp, path: '/analysis' },
    { label: 'Predictions', icon: Heart, path: '/predictions' },
    { label: 'Food', icon: Utensils, path: '/food-tracking' },
    { label: 'Programs', icon: Dumbbell, path: '/programs' },
  ];

  const userMenuItems = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Health Assessment', icon: FileText, path: '/health-assessment' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <header 
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ 
        backgroundColor: theme.colors.background + 'ee',
        borderColor: theme.colors.border
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ color: theme.colors.text }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
            )}
            
            {/* Logo */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={logoImg} alt="Lifora" className="w-9 h-9" />
              <span 
                className="text-xl font-bold hidden sm:inline"
                style={{ color: theme.colors.text }}
              >
                {title}
              </span>
            </button>

            {/* Quick Nav - Desktop */}
            {showNav && (
              <nav className="hidden lg:flex items-center gap-1 ml-4">
                {quickNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {showHomeButton && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
                style={{ color: theme.colors.textSecondary }}
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}

            {/* Messages */}
            <button
              onClick={() => navigate('/chat')}
              className="relative p-2 rounded-full transition-colors"
              style={{ color: theme.colors.text }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full transition-colors"
                style={{ color: theme.colors.text }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div 
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary + '20' }}
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: theme.colors.textSecondary }} />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border overflow-hidden"
                  style={{ 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border
                  }}
                >
                  {/* User Info */}
                  <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary + '20' }}
                      >
                        {user?.profilePicture ? (
                          <img src={user.profilePicture} alt={user?.username} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: theme.colors.text }}>
                          {user?.username || 'User'}
                        </p>
                        <p className="text-sm truncate" style={{ color: theme.colors.textSecondary }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.path);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: theme.colors.text }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Icon className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Logout */}
                  <div className="border-t py-2" style={{ borderColor: theme.colors.border }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef444410'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {rightContent}
          </div>
        </div>
      </div>
    </header>
  );
}
