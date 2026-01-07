import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, User as UserIcon, TrendingUp, FileText, Heart, Utensils, Settings as SettingsIcon, Dumbbell, MessageSquare, Users, Rocket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserProfile } from '@/api/userApi';
import Header from '@/components/Header';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { theme } = useTheme();

  // Fetch and update user profile picture on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.profile && user) {
          // Update user in context with profile picture
          setUser({ 
            ...user, 
            profilePicture: response.profile.profilePicture 
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user && !user.profilePicture) {
      fetchUserProfile();
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickActions = [
    {
      title: 'Community Feed',
      description: 'Share activities and connect with others',
      icon: Users,
      color: '#6366f1',
      bgColor: '#6366f120',
      gradient: theme.gradients?.activity || ['#E8F5E9', '#C8E6C9', '#81C784'],
      onClick: () => navigate('/feed'),
    },
    {
      title: 'Messages',
      description: 'Chat with friends and groups',
      icon: MessageSquare,
      color: '#8b5cf6',
      bgColor: '#8b5cf620',
      gradient: theme.gradients?.sleep || ['#F3E5F5', '#E1BEE7', '#CE93D8'],
      onClick: () => navigate('/chat'),
    },
    {
      title: 'Health Analysis',
      description: 'View your comprehensive health metrics',
      icon: TrendingUp,
      color: '#0ea5e9',
      bgColor: '#0ea5e920',
      gradient: theme.gradients?.water || ['#E0F7FA', '#B2EBF2', '#80DEEA'],
      onClick: () => navigate('/analysis'),
    },
    {
      title: 'Health Assessment',
      description: 'Complete your comprehensive health profile',
      icon: FileText,
      color: theme.colors.primary,
      bgColor: theme.colors.primary + '20',
      gradient: theme.gradients?.bmi || ['#E3F2FD', '#BBDEFB', '#90CAF9'],
      onClick: () => navigate('/health-assessment'),
    },
    {
      title: 'Risk Predictions',
      description: 'View your health risk analysis',
      icon: Heart,
      color: theme.colors.error,
      bgColor: theme.colors.error + '20',
      gradient: theme.gradients?.health || ['#FFEBEE', '#FFCDD2', '#EF9A9A'],
      onClick: () => navigate('/predictions'),
    },
    {
      title: 'Food Tracking',
      description: 'Track calories with AI-powered analysis',
      icon: Utensils,
      color: theme.colors.accent,
      bgColor: theme.colors.accent + '20',
      gradient: theme.gradients?.dietary || ['#F1F8E9', '#DCEDC8', '#A5D6A7'],
      onClick: () => navigate('/food-tracking'),
    },
    {
      title: 'Workout Programs',
      description: 'Create and manage workout routines',
      icon: Dumbbell,
      color: '#10b981',
      bgColor: '#10b98120',
      gradient: theme.gradients?.activity || ['#E8F5E9', '#C8E6C9', '#81C784'],
      onClick: () => navigate('/programs'),
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
          {/* Welcome Card with Gradient */}
          {user && (
            <Card 
              className="shadow-lg border overflow-hidden relative"
              style={{ 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
              }}
            >
              <div 
                className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2"
                style={{ backgroundColor: theme.colors.primary + '15' }}
              />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden"
                    style={{ 
                      background: user.profilePicture ? 'transparent' : `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
                    }}
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-16 h-16 object-cover"
                        onError={(e) => {
                          console.error('Failed to load profile picture:', user.profilePicture);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log('Profile picture loaded successfully:', user.profilePicture)}
                      />
                    ) : (
                      <UserIcon className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle 
                        className="text-2xl"
                        style={{ 
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading
                        }}
                      >
                        Welcome back, {user.username}!
                      </CardTitle>
                      <Rocket className="w-6 h-6" style={{ color: theme.colors.primary }} />
                    </div>
                    <p 
                      className="text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {user.email}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/profile')}
                      className="mt-3 flex items-center gap-2"
                      style={{ 
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary
                      }}
                    >
                      <UserIcon className="w-4 h-4" />
                      View Profile
                    </Button>
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

          {/* Quick Actions with Gradient Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.title}
                  className="shadow-md hover:shadow-xl transition-all cursor-pointer border hover:scale-105 overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${action.gradient[0]} 0%, ${action.gradient[1]} 50%, ${action.gradient[2]} 100%)`,
                    borderColor: 'transparent'
                  }}
                  onClick={action.onClick}
                >
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                      >
                        <Icon 
                          className="w-7 h-7" 
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
                  }}
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
                  <div className="flex flex-wrap gap-3 mt-4">
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
                    <Button 
                      onClick={() => navigate('/feed')}
                      variant="outline"
                      style={{
                        borderColor: theme.colors.border,
                        color: theme.colors.text
                      }}
                    >
                      Explore Community
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

