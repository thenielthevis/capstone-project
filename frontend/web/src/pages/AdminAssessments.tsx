import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, RefreshCw } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/Toast/Toast';
import { AssessmentResultsCard, AssessmentAnalysisChart, OverallAnalysisSummary } from '@/components/AdminAssessments';
import { adminApi } from '@/api/adminApi';
import axiosInstance from '@/api/axiosInstance';

interface Assessment {
  _id: string;
  userId: string | User;
  question: string;
  choices: Array<{
    id: string;
    text: string;
    value: number;
  }>;
  sentimentResult?: {
    selectedChoice?: {
      id: string;
      text: string;
      value: number;
    };
    userTextInput?: string;
    timestamp: Date;
  };
  sentimentAnalysis?: {
    sentiment?: {
      primary: string;
      positive: number;
      negative: number;
      neutral: number;
    };
    emotion?: {
      primary: string;
      confidence: number;
      breakdown: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        neutral: number;
      };
    };
    stress?: {
      level: string;
      score: number;
      anxiety?: {
        level: string;
        score: number;
      };
    };
  };
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  age?: number;
}

export default function AdminAssessments() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // Fetch all assessments
      const assessmentRes = await axiosInstance.get('/assessment/all');
      const assessmentData = assessmentRes.data?.data || assessmentRes.data || [];
      
      const validAssessments = Array.isArray(assessmentData) ? assessmentData : [];
      
      // Filter assessments to only include those with answers/responses
      const filteredAssessments = validAssessments.filter((assessment: Assessment) => {
        return assessment.sentimentResult && 
               (assessment.sentimentResult.selectedChoice || assessment.sentimentResult.userTextInput);
      });
      
      setAssessments(filteredAssessments);

      // Extract user data from assessments (already populated from backend)
      const userMap = new Map<string, User>();

      filteredAssessments.forEach((assessment: Assessment) => {
        const userId = typeof assessment.userId === 'string' ? assessment.userId : assessment.userId._id;
        const user = typeof assessment.userId === 'string' ? null : assessment.userId;
        
        if (user && !userMap.has(userId)) {
          userMap.set(userId, {
            _id: user._id,
            username: user.username,
            email: user.email,
            age: user.age,
          });
        }
      });

      // If no populated data, fetch users separately
      if (userMap.size === 0) {
        const userIds = [...new Set(filteredAssessments.map((a: Assessment) => 
          typeof a.userId === 'string' ? a.userId : a.userId._id
        ))];

        for (const userId of userIds) {
          try {
            const userRes = await adminApi.getUserById(userId);
            userMap.set(userId, {
              _id: userRes._id,
              username: userRes.username,
              email: userRes.email,
              age: userRes.age,
            });
          } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err);
          }
        }
      }

      setUsers(userMap);
      showToast({ type: 'success', text1: `Loaded ${filteredAssessments.length} assessments with responses` });
    } catch (err: any) {
      console.error('Error fetching assessments:', err);
      showToast({
        type: 'error',
        text1: 'Failed to load assessments',
        text2: err.response?.data?.message || err.message,
      });
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssessments();
    setRefreshing(false);
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const userId = typeof assessment.userId === 'string' ? assessment.userId : assessment.userId._id;
    const user = users.get(userId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      assessment.question.toLowerCase().includes(searchLower) ||
      user?.username.toLowerCase().includes(searchLower) ||
      user?.email.toLowerCase().includes(searchLower)
    );
  });

  const groupedByUser = Array.from(users.values()).map((user) => ({
    user,
    assessments: filteredAssessments.filter((a) => {
      const assessmentUserId = typeof a.userId === 'string' ? a.userId : a.userId._id;
      return assessmentUserId === user._id;
    }),
  })).filter((group) => group.assessments.length > 0);

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: theme.colors.background }}
    >
      <AdminSidebar
        activeNav="assessments"
        onSidebarToggle={setSidebarOpen}
      />

      <div
        className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300 p-8`}
      >
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.text }}
          >
            Daily Assessments
          </h1>
          <p
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            View user assessment results, questions, answers, and analysis data
          </p>
        </div>

        {/* Search & Filter Bar */}
        <Card
          className="mb-6"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <label
                  className="text-sm font-medium mb-2 block"
                  style={{ color: theme.colors.text }}
                >
                  Search
                </label>
                <div
                  className="flex items-center px-4 rounded-lg border"
                  style={{ borderColor: theme.colors.border }}
                >
                  <Search className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                  <input
                    type="text"
                    placeholder="Search by username, email, or question..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent py-2 px-3 outline-none text-sm"
                    style={{ color: theme.colors.text }}
                  />
                </div>
              </div>

              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              >
                <RefreshCw className="w-4 h-4" />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: theme.colors.primary }}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && assessments.length === 0 && (
          <Card
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <CardContent className="py-12 text-center">
              <p style={{ color: theme.colors.textSecondary }}>
                No assessments found
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assessment Results */}
        {!loading && groupedByUser.map((group) => (
          <div key={group.user._id} className="mb-8">
            {/* User Header */}
            <div
              className="p-4 rounded-lg mb-4"
              style={{ backgroundColor: theme.colors.cardHover }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: theme.colors.text }}
              >
                {group.user.username}
              </h2>
              <p
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {group.user.email} • {group.assessments.length} assessment{group.assessments.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Assessment Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.assessments.map((assessment) => (
                <div key={assessment._id}>
                  <AssessmentResultsCard
                    assessment={assessment}
                    theme={theme}
                  />
                </div>
              ))}
            </div>

            {/* Analysis Summary */}
            {group.assessments.some((a) => a.sentimentAnalysis) && (
              <div className="mt-6">
                <h3
                  className="text-sm font-semibold mb-4"
                  style={{ color: theme.colors.text }}
                >
                  Analysis Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AssessmentAnalysisChart
                    assessments={group.assessments}
                    theme={theme}
                    type="emotion"
                  />
                  <AssessmentAnalysisChart
                    assessments={group.assessments}
                    theme={theme}
                    type="sentiment"
                  />
                  <AssessmentAnalysisChart
                    assessments={group.assessments}
                    theme={theme}
                    type="stress"
                  />
                  <AssessmentAnalysisChart
                    assessments={group.assessments}
                    theme={theme}
                    type="anxiety"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Overall Analysis Summary */}
        {!loading && assessments.some((a) => a.sentimentAnalysis) && (
          <OverallAnalysisSummary
            assessments={assessments}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
     