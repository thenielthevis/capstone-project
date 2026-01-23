import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Waves, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ThemeSwitcher() {
  const { themeMode, setThemeMode, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { id: 'ocean', label: 'Ocean', icon: <Waves className="w-4 h-4" /> },
  ];

  const handleThemeChange = (theme: 'light' | 'dark' | 'ocean') => {
    setThemeMode(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
        title="Change theme"
      >
        <span className="flex items-center gap-2" style={{ color: theme.colors.text }}>
          {themeMode === 'light' && <Sun className="w-4 h-4" />}
          {themeMode === 'dark' && <Moon className="w-4 h-4" />}
          {themeMode === 'ocean' && <Waves className="w-4 h-4" />}
          <span className="capitalize">Theme</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white text-gray-900 rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
          {themeOptions.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleThemeChange(option.id as 'light' | 'dark' | 'ocean')}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-100 transition-colors ${themeMode === option.id ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                } ${index < themeOptions.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className={themeMode === option.id ? 'text-blue-600' : 'text-gray-600'}>
                {option.icon}
              </span>
              <span className="text-sm font-medium">{option.label}</span>
              {themeMode === option.id && (
                <span className="ml-auto text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
