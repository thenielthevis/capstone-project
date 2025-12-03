import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Users,
  Home, Utensils, MapPin, Dumbbell, BookOpen, Award,
  ChevronRight, Sun, Moon, Waves
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
}

interface AdminSidebarProps {
  activeNav?: string;
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function AdminSidebar({ activeNav = 'home', onSidebarToggle }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
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
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, path: '/admin/dashboard', color: 'text-blue-600' },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, path: '/admin/users', color: 'text-green-600' },
    { id: 'activities', label: 'Geo Activities', icon: <MapPin className="w-5 h-5" />, path: '/admin/geo-activities', color: 'text-orange-600' },
    { id: 'workouts', label: 'Workouts', icon: <Dumbbell className="w-5 h-5" />, path: '/admin/workouts', color: 'text-red-600' },
    { id: 'programs', label: 'Programs', icon: <BookOpen className="w-5 h-5" />, path: '/admin/programs', color: 'text-purple-600' },
    { id: 'foodlogs', label: 'Food Logs', icon: <Utensils className="w-5 h-5" />, path: '/admin/foodlogs', color: 'text-yellow-600' },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" />, color: 'text-indigo-600' },
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
      } bg-gradient-to-b from-blue-700 to-blue-900 shadow-xl transition-all duration-300 flex flex-col fixed h-screen left-0 top-0 z-50`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-blue-600 flex items-center justify-between">
        <button
          onClick={handleToggleSidebar}
          className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition flex-shrink-0"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <img src={logoImg} alt="Lifora" className="w-8 h-8" />
        </button>
        {sidebarOpen && (
          <div className="text-white ml-3">
            <p className="font-bold text-sm">Lifora</p>
            <p className="text-xs text-blue-200">Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentActive === item.id
                ? 'bg-white text-blue-700 shadow-md'
                : 'text-white hover:bg-blue-600'
            }`}
            title={!sidebarOpen ? item.label : ''}
          >
            <span className={`${item.color} ${currentActive === item.id ? 'text-blue-700' : 'text-white'}`}>
              {item.icon}
            </span>
            {sidebarOpen && (
              <>
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                {currentActive === item.id && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-blue-600 space-y-3">
        {sidebarOpen ? (
          <>
            <ThemeSwitcher />
            <div className="flex flex-col gap-3">
              <div className="bg-blue-600 rounded-lg p-3">
                <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
                <p className="text-blue-200 text-xs truncate">{user?.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 h-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            {/* Theme icon button when collapsed */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="w-10 h-10 rounded-lg text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                title="Change theme"
              >
                {themeMode === 'light' && <Sun className="w-5 h-5" />}
                {themeMode === 'dark' && <Moon className="w-5 h-5" />}
                {themeMode === 'ocean' && <Waves className="w-5 h-5" />}
              </button>
              
              {themeMenuOpen && (
                <div className="absolute right-12 bottom-0 bg-white text-gray-900 rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
                  {[
                    { id: 'light', icon: <Sun className="w-4 h-4" /> },
                    { id: 'dark', icon: <Moon className="w-4 h-4" /> },
                    { id: 'ocean', icon: <Waves className="w-4 h-4" /> },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setThemeMode(option.id as 'light' | 'dark' | 'ocean');
                        setThemeMenuOpen(false);
                      }}
                      className={`flex items-center justify-center w-10 h-10 hover:bg-blue-100 transition-colors ${
                        themeMode === option.id ? 'bg-blue-50' : ''
                      }`}
                      title={option.id}
                    >
                      {option.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              onClick={handleLogout}
              className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white p-0"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
