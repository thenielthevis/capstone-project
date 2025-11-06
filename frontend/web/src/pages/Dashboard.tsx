import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogOut, User as UserIcon, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoImg from '../assets/logo.png';

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
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Track Activity</h3>
                  <p className="text-sm text-gray-600">Monitor your daily activities and progress</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <UserIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Profile</h3>
                  <p className="text-sm text-gray-600">View and edit your profile information</p>
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
                  <p className="text-sm text-gray-600">View your wellness insights and trends</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="shadow-md bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <span className="text-lg font-bold">i</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-blue-900">Dashboard Coming Soon</h3>
                  <p className="text-blue-800 text-sm">
                    This is a placeholder dashboard. The full wellness tracking features, AI insights, 
                    and community features are currently in development. Stay tuned for updates!
                  </p>
                  <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium text-sm mt-2">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
