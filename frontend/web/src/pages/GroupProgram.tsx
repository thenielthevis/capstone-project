import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import logoImg from '@/assets/logo.png';

export default function GroupProgram() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: theme.colors.card, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/programs')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
                <h1 className="text-2xl font-bold text-gray-900">Group Programs</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Group Programs</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collaborate with your team through shared workout programs. Access group schedules,
            compete on leaderboards, and stay accountable together.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                We're currently building the group program feature. Soon you'll be able to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Join group workouts with your friends and teammates</li>
                <li>Follow programs created by group admins</li>
                <li>Track progress on shared leaderboards</li>
                <li>Stay motivated through team accountability</li>
                <li>Share achievements and milestones</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-blue-900 text-sm">
                  <strong>💡 Note:</strong> Group programs will be available once your group admin
                  publishes workout plans. In the meantime, explore other program options or create
                  your own custom programs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What You Can Do Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/programs/create')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Create Program</h4>
                <p className="text-sm text-gray-600">
                  Build your own custom workout program
                </p>
              </button>
              <button
                onClick={() => navigate('/programs/automated')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <h4 className="font-semibold text-gray-900 mb-2">AI Generator</h4>
                <p className="text-sm text-gray-600">
                  Let AI create a personalized workout plan
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button onClick={() => navigate('/programs')} variant="outline">
            View All Programs
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
