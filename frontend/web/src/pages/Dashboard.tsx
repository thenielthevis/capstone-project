import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, User as UserIcon, Activity, TrendingUp, FileText, Heart, Utensils, Settings as SettingsIcon, Dumbbell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Header from '@/components/Header';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickActions = [
    {
      title: 'Health Assessment',
      description: 'Complete your comprehensive health profile',
      icon: FileText,
      color: theme.colors.primary,
      bgColor: theme.colors.primary + '20',
      onClick: () => navigate('/health-assessment'),
    },
    {
      title: 'Risk Predictions',
      description: 'View your health risk analysis',
      icon: Heart,
      color: theme.colors.error,
      bgColor: theme.colors.error + '20',
      onClick: () => navigate('/predictions'),
    },
    {
      title: 'Food Tracking',
      description: 'Track calories with AI-powered analysis',
      icon: Utensils,
      color: theme.colors.accent,
      bgColor: theme.colors.accent + '20',
      onClick: () => navigate('/food-tracking'),
    },
    {
      title: 'Workout Programs',
      description: 'Create and manage workout routines',
      icon: Dumbbell,
      color: '#10b981',
      bgColor: '#10b98120',
      onClick: () => navigate('/programs'),
    },
    {
      title: 'Track Activity',
      description: 'Monitor daily activities and progress',
      icon: Activity,
      color: theme.colors.success,
      bgColor: theme.colors.success + '20',
      onClick: () => {},
    },
    {
      title: 'Analytics',
      description: 'View wellness insights and trends',
      icon: TrendingUp,
      color: theme.colors.secondary,
      bgColor: theme.colors.secondary + '20',
      onClick: () => {},
    },
  ];

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`,
      }}
    >
      {/* Header */}
      <Header 
        title="Lifora"
        rightContent={
          <>
            <Button
              variant="ghost"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
              style={{ color: theme.colors.textSecondary }}
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2"
              style={{ color: theme.colors.textSecondary }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Card */}
          {user && (
            <Card 
              className="shadow-lg border"
              style={{ 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <CardTitle 
                      className="text-2xl"
                      style={{ 
                        color: theme.colors.text,
                        fontFamily: theme.fonts.heading
                      }}
                    >
                      Welcome back, {user.username}!
                    </CardTitle>
                    <p 
                      className="text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p style={{ color: theme.colors.textSecondary }}>
                  You're successfully logged in to your Lifora dashboard. Start tracking your wellness journey today!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.title}
                  className="shadow-md hover:shadow-lg transition-all cursor-pointer border hover:scale-105"
                  style={{ 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border
                  }}
                  onClick={action.onClick}
                >
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                        style={{ backgroundColor: action.bgColor }}
                      >
                        <Icon 
                          className="w-6 h-6" 
                          style={{ color: action.color }}
                        />
                      </div>
                      <h3 
                        className="font-semibold text-lg"
                        style={{ 
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading
                        }}
                      >
                        {action.title}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          <Card 
            className="shadow-md border"
            style={{ 
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.primary + '40'
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <span className="text-lg font-bold">✓</span>
                </div>
                <div className="space-y-2">
                  <h3 
                    className="font-semibold text-lg"
                    style={{ 
                      color: theme.colors.text,
                      fontFamily: theme.fonts.heading
                    }}
                  >
                    Get Started with Your Health Journey
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Complete your health assessment to receive personalized risk predictions and insights.
                    Our AI-powered system will analyze your health data and provide tailored recommendations.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button 
                      onClick={() => navigate('/health-assessment')}
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#FFFFFF'
                      }}
                      className="hover:opacity-90"
                    >
                      Start Assessment
                    </Button>
                    <Button 
                      onClick={() => navigate('/predictions')}
                      variant="outline"
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                    >
                      View Predictions
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

