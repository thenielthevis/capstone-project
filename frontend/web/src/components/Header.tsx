import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import logoImg from '@/assets/logo.png';
import { Button } from './ui/button';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  showHomeButton?: boolean;
  rightContent?: React.ReactNode;
}

export default function Header({ 
  title, 
  showBackButton = false, 
  backTo = '/dashboard',
  showHomeButton = false,
  rightContent 
}: HeaderProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <header 
      className="shadow-sm sticky top-0 z-50 border-b"
      style={{ 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border
      }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-opacity-10"
                style={{ 
                  color: theme.colors.textSecondary,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading
                }}
              >
                {title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showHomeButton && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
                style={{ 
                  color: theme.colors.textSecondary
                }}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}
            {rightContent}
          </div>
        </div>
      </div>
    </header>
  );
}
