import { useState, useEffect } from 'react';
import { X, RefreshCw, Users, Dumbbell, Flame, Clock, MapPin, ChevronDown, ChevronUp, CheckCircle, Timer, Activity } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getGroupProgramProgress, GroupProgramProgress, MemberProgress } from '@/api/programApi';

interface GroupProgramProgressModalProps {
  visible: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
}

export default function GroupProgramProgressModal({
  visible,
  onClose,
  programId,
  programName,
}: GroupProgramProgressModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<GroupProgramProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    if (visible && programId) {
      loadProgress();
    }
  }, [visible, programId]);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupProgramProgress(programId);
      setProgressData(data);
    } catch (err: any) {
      console.error('Error loading program progress:', err);
      setError(err.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'in_progress':
        return '#F59E0B';
      case 'partial':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderMemberCard = (member: MemberProgress) => {
    const isExpanded = expandedMember === member.user._id;

    return (
      <div
        key={member.user._id}
        className="rounded-xl overflow-hidden mb-3"
        style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
      >
        {/* Member Header */}
        <button
          className="w-full flex items-center gap-3 p-4 hover:opacity-90 transition"
          onClick={() => setExpandedMember(isExpanded ? null : member.user._id)}
        >
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            {member.user.profilePicture ? (
              <img
                src={member.user.profilePicture}
                alt={member.user.username}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-left">
            <p className="font-semibold" style={{ color: theme.colors.text }}>
              {member.user.username}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                {member.stats.totalSessions} sessions
              </span>
              {member.latestSession && (
                <>
                  <span style={{ color: theme.colors.textTertiary }}>•</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: getStatusColor(member.latestSession.progress.status) + '20',
                      color: getStatusColor(member.latestSession.progress.status),
                    }}
                  >
                    {member.latestSession.progress.overall_percentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
          ) : (
            <ChevronDown className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
          )}
        </button>

        {/* Expanded Stats */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: theme.colors.border }}>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: theme.colors.primary + '10' }}
              >
                <Flame className="w-5 h-5 mb-1" style={{ color: theme.colors.primary }} />
                <p className="text-lg font-bold" style={{ color: theme.colors.text }}>
                  {member.stats.totalCalories}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Calories Burned
                </p>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: theme.colors.secondary + '10' }}
              >
                <Clock className="w-5 h-5 mb-1" style={{ color: theme.colors.secondary }} />
                <p className="text-lg font-bold" style={{ color: theme.colors.text }}>
                  {formatDuration(member.stats.totalDuration)}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  Total Duration
                </p>
              </div>

              {member.stats.totalDistance > 0 && (
                <div
                  className="p-3 rounded-lg col-span-2"
                  style={{ backgroundColor: '#10B981' + '10' }}
                >
                  <MapPin className="w-5 h-5 mb-1" style={{ color: '#10B981' }} />
                  <p className="text-lg font-bold" style={{ color: theme.colors.text }}>
                    {member.stats.totalDistance} km
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Distance
                  </p>
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            {member.sessions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2" style={{ color: theme.colors.text }}>
                  Recent Sessions
                </p>
                <div className="space-y-2">
                  {member.sessions.slice(0, 3).map((session: any, idx: number) => (
                    <div
                      key={session._id || idx}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: getStatusColor(session.progress?.status || 'not_started') + '20',
                        }}
                      >
                        {session.progress?.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" style={{ color: getStatusColor('completed') }} />
                        ) : session.progress?.status === 'in_progress' ? (
                          <Timer className="w-4 h-4" style={{ color: getStatusColor('in_progress') }} />
                        ) : (
                          <Activity className="w-4 h-4" style={{ color: getStatusColor(session.progress?.status || 'not_started') }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: theme.colors.text }}>
                          {new Date(session.performed_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {session.total_calories_burned} kcal • {formatDuration(session.total_duration_minutes)}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: getStatusColor(session.progress?.status || 'not_started') + '20',
                          color: getStatusColor(session.progress?.status || 'not_started'),
                        }}
                      >
                        {session.progress?.overall_percentage || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-y-4 right-4 w-[450px] z-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 border-b flex-shrink-0"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        >
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: theme.colors.background }}
          >
            <X className="w-5 h-5" style={{ color: theme.colors.text }} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
              Program Progress
            </h2>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {programName}
            </p>
          </div>
          <button
            onClick={loadProgress}
            className="p-2 rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            <RefreshCw className="w-5 h-5" style={{ color: theme.colors.primary }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div
                className="w-10 h-10 border-4 rounded-full animate-spin mb-4"
                style={{ borderColor: theme.colors.border, borderTopColor: theme.colors.primary }}
              />
              <p style={{ color: theme.colors.textSecondary }}>Loading progress...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: theme.colors.error + '20' }}
              >
                <X className="w-8 h-8" style={{ color: theme.colors.error }} />
              </div>
              <p className="mb-4" style={{ color: theme.colors.error }}>
                {error}
              </p>
              <button
                onClick={loadProgress}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: theme.colors.primary, color: '#fff' }}
              >
                Retry
              </button>
            </div>
          ) : progressData ? (
            <>
              {/* Group Stats Summary */}
              <div
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
              >
                <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
                  Group Summary
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Members Stats */}
                  <div
                    className="p-3 rounded-lg flex flex-col items-center"
                    style={{ backgroundColor: theme.colors.primary + '10' }}
                  >
                    <Users className="w-6 h-6 mb-1" style={{ color: theme.colors.primary }} />
                    <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {progressData.groupStats.acceptedMembers}/{progressData.groupStats.totalMembers}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      Accepted
                    </p>
                  </div>

                  {/* Total Sessions */}
                  <div
                    className="p-3 rounded-lg flex flex-col items-center"
                    style={{ backgroundColor: theme.colors.secondary + '10' }}
                  >
                    <Dumbbell className="w-6 h-6 mb-1" style={{ color: theme.colors.secondary }} />
                    <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {progressData.groupStats.totalGroupSessions}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      Total Sessions
                    </p>
                  </div>

                  {/* Total Calories */}
                  <div
                    className="p-3 rounded-lg flex flex-col items-center"
                    style={{ backgroundColor: '#EF4444' + '10' }}
                  >
                    <Flame className="w-6 h-6 mb-1" style={{ color: '#EF4444' }} />
                    <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {progressData.groupStats.totalGroupCalories}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      Group Calories
                    </p>
                  </div>

                  {/* Total Duration */}
                  <div
                    className="p-3 rounded-lg flex flex-col items-center"
                    style={{ backgroundColor: '#10B981' + '10' }}
                  >
                    <Clock className="w-6 h-6 mb-1" style={{ color: '#10B981' }} />
                    <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {formatDuration(progressData.groupStats.totalGroupDuration)}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      Total Time
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Progress Section */}
              <h3 className="font-semibold mb-3" style={{ color: theme.colors.text }}>
                Member Progress ({progressData.memberProgress.length})
              </h3>

              {progressData.memberProgress.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  <Users className="w-12 h-12 mx-auto mb-3" style={{ color: theme.colors.textTertiary }} />
                  <p style={{ color: theme.colors.textSecondary }}>
                    No members have accepted this program yet
                  </p>
                </div>
              ) : (
                progressData.memberProgress.map(renderMemberCard)
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
