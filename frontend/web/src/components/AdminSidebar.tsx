import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Users,
  Home, Utensils, MapPin, Dumbbell, BookOpen, Award,
  ChevronLeft, Sun, Moon, Waves, Flag,
  Shield, FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';
import logoImg from '../assets/logo.png';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  color: string;
  bgColor: string;
}

interface AdminSidebarProps {
  activeNav?: string;
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function AdminSidebar({ activeNav = 'home', onSidebarToggle }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentActive, setCurrentActive] = useState(activeNav);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    onSidebarToggle?.(newState);
  };

  // Navigation items based on MongoDB collections
  const navigationItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/admin/dashboard', color: '#3b82f6', bgColor: '#3b82f620' },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, path: '/admin/users', color: '#10b981', bgColor: '#10b98120' },
    { id: 'health-reports', label: 'Health Reports', icon: <FileText className="w-5 h-5" />, path: '/admin/health-reports', color: '#14b8a6', bgColor: '#14b8a620' },
    { id: 'reports', label: 'Reports', icon: <Flag className="w-5 h-5" />, path: '/admin/reports', color: '#ef4444', bgColor: '#ef444420' },
    { id: 'geo-activities', label: 'Geo Activities', icon: <MapPin className="w-5 h-5" />, path: '/admin/geo-activities', color: '#f97316', bgColor: '#f9731620' },
    { id: 'workouts', label: 'Workouts', icon: <Dumbbell className="w-5 h-5" />, path: '/admin/workouts', color: '#ec4899', bgColor: '#ec489920' },
    { id: 'programs', label: 'Programs', icon: <BookOpen className="w-5 h-5" />, path: '/admin/programs', color: '#8b5cf6', bgColor: '#8b5cf620' },
    { id: 'foodlogs', label: 'Food Logs', icon: <Utensils className="w-5 h-5" />, path: '/admin/foodlogs', color: '#eab308', bgColor: '#eab30820' },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" />, path: '/admin/achievements', color: '#6366f1', bgColor: '#6366f120' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (item: NavItem) => {
    setCurrentActive(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } transition-all duration-300 flex flex-col fixed h-screen left-0 top-0 z-50 border-r`}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      {/* Logo Section */}
      <div 
        className="p-4 flex items-center gap-3 border-b"
        style={{ borderColor: theme.colors.border }}
      >
        <button
          onClick={handleToggleSidebar}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          }}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <img src={logoImg} alt="Lifora" className="w-7 h-7" />
        </button>
        {sidebarOpen && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base" style={{ color: theme.colors.text }}>Lifora</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" style={{ color: theme.colors.primary }} />
              <p className="text-xs font-medium" style={{ color: theme.colors.primary }}>Admin Panel</p>
            </div>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={handleToggleSidebar}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ 
              backgroundColor: theme.colors.cardHover,
              color: theme.colors.textSecondary 
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sidebarOpen && (
          <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: theme.colors.textSecondary }}>
            Navigation
          </p>
        )}
        {navigationItems.map((item) => {
          const isActive = currentActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                sidebarOpen ? '' : 'justify-center'
              }`}
              style={{
                backgroundColor: isActive ? item.bgColor : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={!sidebarOpen ? item.label : ''}
            >
              <div 
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isActive ? '' : 'group-hover:scale-105'
                }`}
                style={{ 
                  backgroundColor: isActive ? `${item.color}30` : 'transparent',
                }}
              >
                <span style={{ color: isActive ? item.color : theme.colors.textSecondary }}>
                  {item.icon}
                </span>
              </div>
              {sidebarOpen && (
                <>
                  <span 
                    className="flex-1 text-left text-sm font-medium truncate"
                    style={{ color: isActive ? item.color : theme.colors.text }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </>
              )}
              {/* Active indicator line */}
              {isActive && (
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div 
        className="p-3 space-y-3 border-t"
        style={{ borderColor: theme.colors.border }}
      >
        {sidebarOpen ? (
          <>
            <ThemeSwitcher />
            {/* User Card */}
            <div 
              className="rounded-xl p-3 transition-colors"
              style={{ backgroundColor: theme.colors.cardHover }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` 
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.colors.text }}>
                    {user?.username}
                  </p>
                  <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-2 h-10"
              style={{ color: theme.colors.error }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.error}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            {/* Theme icon button when collapsed */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="w-10 h-10 rounded-xl transition-colors flex items-center justify-center"
                style={{ 
                  backgroundColor: theme.colors.cardHover,
                  color: theme.colors.textSecondary 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                }}
                title="Change theme"
              >
                {themeMode === 'light' && <Sun className="w-5 h-5" />}
                {themeMode === 'dark' && <Moon className="w-5 h-5" />}
                {themeMode === 'ocean' && <Waves className="w-5 h-5" />}
              </button>
              
              {themeMenuOpen && (
                <div 
                  className="absolute left-14 bottom-0 rounded-xl shadow-xl z-50 border overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  {[
                    { id: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
                    { id: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
                    { id: 'ocean', icon: <Waves className="w-4 h-4" />, label: 'Ocean' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setThemeMode(option.id as 'light' | 'dark' | 'ocean');
                        setThemeMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 transition-colors text-sm"
                      style={{
                        backgroundColor: themeMode === option.id ? theme.colors.cardHover : 'transparent',
                        color: theme.colors.text
                      }}
                      onMouseEnter={(e) => {
                        if (themeMode !== option.id) {
                          e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (themeMode !== option.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* User avatar when collapsed */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` 
              }}
              title={user?.username}
            >
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-10 h-10 p-0 rounded-xl"
              style={{ color: theme.colors.error }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.error}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
