import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getGroupProgramProgress, GroupProgramProgress, MemberProgress } from "../../api/programApi";

interface GroupProgramProgressModalProps {
  visible: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
}

const GroupProgramProgressModal: React.FC<GroupProgramProgressModalProps> = ({
  visible,
  onClose,
  programId,
  programName,
}) => {
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
      console.error("Error loading program progress:", err);
      setError(err.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'in_progress':
        return '#F59E0B'; // amber
      case 'partial':
        return '#EF4444'; // red
      default:
        return theme.colors.text + '60';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'partial':
        return 'Partial';
      default:
        return 'Not Started';
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
      <View
        key={member.user._id}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          marginBottom: 12,
          overflow: 'hidden',
        }}
      >
        {/* Member Header */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
          }}
          onPress={() => setExpandedMember(isExpanded ? null : member.user._id)}
        >
          {/* Avatar */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            {member.user.profilePicture ? (
              <Image
                source={{ uri: member.user.profilePicture }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <Ionicons name="person" size={22} color={theme.colors.primary} />
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.base,
                color: theme.colors.text,
              }}
            >
              {member.user.username}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.text + '80',
                }}
              >
                {member.stats.totalSessions} sessions
              </Text>
              {member.latestSession && (
                <>
                  <Text style={{ color: theme.colors.text + '40', marginHorizontal: 6 }}>•</Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(member.latestSession.progress.status) + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: getStatusColor(member.latestSession.progress.status),
                      }}
                    >
                      {member.latestSession.progress.overall_percentage}%
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Expand Icon */}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.text + '60'}
          />
        </TouchableOpacity>

        {/* Expanded Stats */}
        {isExpanded && (
          <View
            style={{
              paddingHorizontal: 12,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: theme.colors.background,
            }}
          >
            {/* Stats Grid */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: 12,
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: theme.colors.primary + '10',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <MaterialCommunityIcons name="fire" size={20} color={theme.colors.primary} />
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    marginTop: 4,
                  }}
                >
                  {member.stats.totalCalories}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.text + '60',
                  }}
                >
                  Calories Burned
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: theme.colors.secondary + '10',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.secondary} />
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    marginTop: 4,
                  }}
                >
                  {formatDuration(member.stats.totalDuration)}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.text + '60',
                  }}
                >
                  Total Duration
                </Text>
              </View>

              {member.stats.totalDistance > 0 && (
                <View
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#10B981' + '10',
                    padding: 12,
                    borderRadius: 10,
                  }}
                >
                  <MaterialCommunityIcons name="map-marker-distance" size={20} color="#10B981" />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.lg,
                      color: theme.colors.text,
                      marginTop: 4,
                    }}
                  >
                    {member.stats.totalDistance} km
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '60',
                    }}
                  >
                    Distance
                  </Text>
                </View>
              )}
            </View>

            {/* Recent Sessions */}
            {member.sessions.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text,
                    marginBottom: 8,
                  }}
                >
                  Recent Sessions
                </Text>
                {member.sessions.slice(0, 3).map((session: any, idx: number) => (
                  <View
                    key={session._id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: idx < 2 ? 1 : 0,
                      borderBottomColor: theme.colors.background,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: getStatusColor(session.progress?.status || 'not_started') + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      <Ionicons
                        name={
                          session.progress?.status === 'completed'
                            ? 'checkmark'
                            : session.progress?.status === 'in_progress'
                            ? 'time'
                            : 'fitness'
                        }
                        size={16}
                        color={getStatusColor(session.progress?.status || 'not_started')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.text,
                        }}
                      >
                        {new Date(session.performed_at).toLocaleDateString()}
                      </Text>
                      <Text
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.text + '60',
                        }}
                      >
                        {session.total_calories_burned} kcal • {formatDuration(session.total_duration_minutes)}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: getStatusColor(session.progress?.status || 'not_started') + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: getStatusColor(session.progress?.status || 'not_started'),
                        }}
                      >
                        {session.progress?.overall_percentage || 0}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.background,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginRight: 8 }}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.xl,
                color: theme.colors.text,
              }}
            >
              Program Progress
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text + '80',
              }}
            >
              {programName}
            </Text>
          </View>
          <TouchableOpacity onPress={loadProgress} style={{ padding: 8 }}>
            <Ionicons name="refresh" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.base,
                color: theme.colors.text + '60',
                marginTop: 12,
              }}
            >
              Loading progress...
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.base,
                color: theme.colors.error,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={loadProgress}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: theme.fontSizes.base,
                  color: '#fff',
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : progressData ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {/* Group Stats Summary */}
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.text,
                  marginBottom: 12,
                }}
              >
                Group Summary
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {/* Members Stats */}
                <View
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: theme.colors.primary + '10',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="people" size={24} color={theme.colors.primary} />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xl,
                      color: theme.colors.text,
                      marginTop: 4,
                    }}
                  >
                    {progressData.groupStats.acceptedMembers}/{progressData.groupStats.totalMembers}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '60',
                    }}
                  >
                    Accepted
                  </Text>
                </View>

                {/* Total Sessions */}
                <View
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: theme.colors.secondary + '10',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.secondary} />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xl,
                      color: theme.colors.text,
                      marginTop: 4,
                    }}
                  >
                    {progressData.groupStats.totalGroupSessions}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '60',
                    }}
                  >
                    Total Sessions
                  </Text>
                </View>

                {/* Total Calories */}
                <View
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#EF4444' + '10',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="fire" size={24} color="#EF4444" />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xl,
                      color: theme.colors.text,
                      marginTop: 4,
                    }}
                  >
                    {progressData.groupStats.totalGroupCalories}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '60',
                    }}
                  >
                    Group Calories
                  </Text>
                </View>

                {/* Total Duration */}
                <View
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#10B981' + '10',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="clock-outline" size={24} color="#10B981" />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xl,
                      color: theme.colors.text,
                      marginTop: 4,
                    }}
                  >
                    {formatDuration(progressData.groupStats.totalGroupDuration)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '60',
                    }}
                  >
                    Total Time
                  </Text>
                </View>
              </View>
            </View>

            {/* Member Progress Section */}
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.base,
                color: theme.colors.text,
                marginBottom: 12,
              }}
            >
              Member Progress ({progressData.memberProgress.length})
            </Text>

            {progressData.memberProgress.length === 0 ? (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="account-clock-outline"
                  size={48}
                  color={theme.colors.text + '40'}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.base,
                    color: theme.colors.text + '60',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  No members have accepted this program yet
                </Text>
              </View>
            ) : (
              progressData.memberProgress.map(renderMemberCard)
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
};

export default GroupProgramProgressModal;
