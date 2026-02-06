import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPrograms, deleteProgram } from '../api/programApi';
import { showToast } from '../components/Toast/Toast';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import Header from '@/components/Header';

interface Program {
  _id: string;
  name: string;
  description?: string;
  workouts: any[];
  geo_activities: any[];
  created_at: string;
}

export default function Programs() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await getUserPrograms();
      setPrograms(Array.isArray(response) ? response : []);
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load programs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId: string) => {
    if (!window.confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      setDeleting(programId);
      await deleteProgram(programId);
      setPrograms(programs.filter(p => p._id !== programId));
      showToast({
        type: 'success',
        text1: 'Success',
        text2: 'Program deleted successfully'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete program'
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <Header
        title="My Programs"
        showBackButton
        showHomeButton
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>My Programs</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/programs/history')}
              className="px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
            >
              History
            </button>
            <button
              onClick={() => navigate('/programs/create')}
              className="px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              Create Program
            </button>
            <button
              onClick={() => navigate('/programs/automated')}
              className="px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.success, color: '#FFFFFF' }}
            >
              AI Generated
            </button>
            <button
              onClick={() => navigate('/programs/group')}
              className="px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.secondary, color: '#FFFFFF' }}
            >
              Group Programs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4" style={{ color: theme.colors.textTertiary }}>
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>No programs yet</p>
            <button
              onClick={() => navigate('/programs/create')}
              className="px-6 py-3 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              Create Your First Program
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program._id}
                className="rounded-lg shadow-md p-6 hover:shadow-lg transition"
                style={{ backgroundColor: theme.colors.card }}
              >
                <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
                  {program.name}
                </h3>
                <p className="mb-4 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                  {program.description}
                </p>
                <div className="flex gap-2 text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                  <span>{program.workouts?.length || 0} workouts</span>
                  {program.geo_activities && program.geo_activities.length > 0 && (
                    <span>• {program.geo_activities.length} activities</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/programs/overview/${program._id}`)}
                    className="flex-1 px-4 py-2 rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(program._id)}
                    disabled={deleting === program._id}
                    className="px-4 py-2 rounded-lg transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: theme.colors.error, color: '#FFFFFF' }}
                  >
                    {deleting === program._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
