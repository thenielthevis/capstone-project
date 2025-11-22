import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, User as UserIcon, Activity, TrendingUp, FileText, Heart, Utensils } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/assets/logo.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">Lifora</h1>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Card */}
          {user && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
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
                    <CardTitle className="text-2xl">Welcome back, {user.username}!</CardTitle>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  You're successfully logged in to your Lifora dashboard. Start tracking your wellness journey today!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/health-assessment')}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Health Assessment</h3>
                  <p className="text-sm text-gray-600">Complete your comprehensive health profile</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/predictions')}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Risk Predictions</h3>
                  <p className="text-sm text-gray-600">View your health risk analysis</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/food-tracking')}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Utensils className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Food Tracking</h3>
                  <p className="text-sm text-gray-600">Track calories with AI-powered analysis</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Track Activity</h3>
                  <p className="text-sm text-gray-600">Monitor daily activities and progress</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Analytics</h3>
                  <p className="text-sm text-gray-600">View wellness insights and trends</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="shadow-md bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <span className="text-lg font-bold">✓</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-blue-900">Get Started with Your Health Journey</h3>
                  <p className="text-blue-800 text-sm">
                    Complete your health assessment to receive personalized risk predictions and insights.
                    Our AI-powered system will analyze your health data and provide tailored recommendations.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button 
                      onClick={() => navigate('/health-assessment')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Assessment
                    </Button>
                    <Button 
                      onClick={() => navigate('/predictions')}
                      variant="outline"
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
