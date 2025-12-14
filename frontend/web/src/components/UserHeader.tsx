import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LogOut, Settings, Sun, Moon, Waves, User as UserIcon,
  ChevronDown, Bell
} from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function UserHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'ocean') => {
    setThemeMode(theme);
    setThemeOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Lifora
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Settings Menu */}
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user?.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (user?.username || 'U').substring(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.username}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Theme Section */}
                  <div className="px-4 py-4 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Appearance</p>
                    
                    <div className="relative">
                      <button
                        onClick={() => setThemeOpen(!themeOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <span className="flex items-center gap-2">
                          {themeMode === 'light' && <Sun className="w-4 h-4 text-yellow-500" />}
                          {themeMode === 'dark' && <Moon className="w-4 h-4 text-indigo-600" />}
                          {themeMode === 'ocean' && <Waves className="w-4 h-4 text-cyan-500" />}
                          <span className="text-sm font-medium capitalize text-gray-700">{themeMode}</span>
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${themeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Theme Options */}
                      {themeOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                          {[
                            { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, color: 'text-yellow-500' },
                            { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-600' },
                            { id: 'ocean', label: 'Ocean', icon: <Waves className="w-4 h-4" />, color: 'text-cyan-500' },
                          ].map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleThemeChange(option.id as 'light' | 'dark' | 'ocean')}
                              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors border-l-4 ${
                                themeMode === option.id 
                                  ? 'bg-blue-50 border-l-blue-500' 
                                  : 'border-l-transparent'
                              }`}
                            >
                              <span className={option.color}>{option.icon}</span>
                              <span className="text-sm font-medium text-gray-700">{option.label}</span>
                              {themeMode === option.id && (
                                <span className="ml-auto text-xs font-bold text-blue-600">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200" />

                  {/* Action Buttons */}
                  <div className="px-4 py-3 space-y-2">
                    <button
                      onClick={() => navigate('/health-assessment')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
