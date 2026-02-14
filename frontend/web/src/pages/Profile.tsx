import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import GamificationStats from '@/components/GamificationStats';
import { getUserProfile, updateProfilePicture, UserProfile } from '@/api/userApi';
import {
  User,
  Camera,
  Activity,
  Heart,
  TrendingUp,
  Apple,
  AlertCircle,
  Target,
  Ruler,
  Scale,
  Gauge,
  RefreshCw,
} from 'lucide-react';

// Profile Section Component
const ProfileSection = ({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  
  return (
    <div
      className="rounded-2xl p-6 mb-4"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <div className="flex items-center mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
          style={{ backgroundColor: iconColor + '15' }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

// Info Row Component
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  const { theme } = useTheme();
  
  return (
    <div
      className="flex justify-between items-center py-3 border-b"
      style={{ borderColor: theme.colors.background }}
    >
      <span
        className="text-sm"
        style={{ color: theme.colors.text + '88' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: value ? theme.colors.text : theme.colors.text + '44' }}
      >
        {value || 'Not set'}
      </span>
    </div>
  );
};

// Tag Component
const Tag = ({ text, color }: { text: string; color: string }) => {
  return (
    <span
      className="px-3 py-1.5 rounded-full text-xs font-medium mr-2 mb-2 inline-block"
      style={{ backgroundColor: color + '15', color }}
    >
      {text}
    </span>
  );
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: any;
  label: string;
  value: string | number | null;
  unit?: string;
  color: string;
}) => {
  const { theme } = useTheme();
  
  return (
    <div
      className="flex-1 rounded-2xl p-4 mx-2 text-center"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
      <div
        className="text-2xl font-bold"
        style={{ color: theme.colors.text }}
      >
        {value ?? '--'}
        {unit && (
          <span className="text-xs ml-1" style={{ color: theme.colors.text + '77' }}>
            {unit}
          </span>
        )}
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: theme.colors.text + '77' }}
      >
        {label}
      </div>
    </div>
  );
};

export default function Profile() {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await getUserProfile();
      setProfile(response.profile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
  };

  const handleChangeProfilePicture = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setUploadingImage(true);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Image = reader.result as string;
            const response = await updateProfilePicture(base64Image);
            
            // Update local profile
            setProfile((prev: UserProfile | null) =>
              prev ? { ...prev, profilePicture: response.profilePicture } : null
            );
            
            // Update user in AuthContext so dashboard shows new picture
            if (user) {
              setUser({ ...user, profilePicture: response.profilePicture });
            }
            
            alert('Profile picture updated!');
          } catch (error: any) {
            console.error('Error updating profile picture:', error);
            alert('Failed to update profile picture.');
          } finally {
            setUploadingImage(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error('Error reading file:', error);
        setUploadingImage(false);
      }
    };
    
    input.click();
  };

  const formatActivityLevel = (level: string | null) => {
    if (!level) return null;
    return level.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6' };
    if (bmi < 25) return { label: 'Normal', color: '#22c55e' };
    if (bmi < 30) return { label: 'Overweight', color: '#f97316' };
    return { label: 'Obese', color: '#ef4444' };
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          />
          <p style={{ color: theme.colors.text }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  const bmiCategory = getBMICategory(profile?.physicalMetrics.bmi || null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header title="Profile" showBackButton showHomeButton />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header Card */}
        <div
          className="rounded-3xl p-8 mb-6 text-center"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {/* Profile Picture */}
          <div className="relative inline-block mb-4">
            <button
              onClick={handleChangeProfilePicture}
              className="relative group"
              disabled={uploadingImage}
            >
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover"
                  style={{ border: `4px solid ${theme.colors.primary}30` }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: theme.colors.primary + '20',
                    border: `4px solid ${theme.colors.primary}30`,
                  }}
                >
                  <User className="w-14 h-14" style={{ color: theme.colors.primary }} />
                </div>
              )}
              {uploadingImage ? (
                <div
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `2px solid ${theme.colors.background}`,
                  }}
                >
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2"
                    style={{ borderColor: theme.colors.primary }}
                  />
                </div>
              ) : (
                <div
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center group-hover:scale-110 transition"
                  style={{
                    backgroundColor: theme.colors.primary,
                    border: `2px solid ${theme.colors.surface}`,
                  }}
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          </div>

          {/* Name & Email */}
          <h2
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
          >
            {profile?.username || 'User'}
          </h2>
          <p
            className="text-sm mb-4"
            style={{ color: theme.colors.text + '77' }}
          >
            {profile?.email}
          </p>

          {/* Profile Completion */}
          <div className="flex items-center justify-center mb-3">
            <div
              className="w-32 h-2 rounded-full mr-3"
              style={{ backgroundColor: theme.colors.text + '15' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${profile?.profileCompletion || 0}%`,
                  backgroundColor:
                    (profile?.profileCompletion || 0) >= 80
                      ? '#22c55e'
                      : (profile?.profileCompletion || 0) >= 50
                      ? '#f97316'
                      : '#ef4444',
                }}
              />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: theme.colors.text }}
            >
              {profile?.profileCompletion || 0}% complete
            </span>
          </div>

          {/* Member Since */}
          <p
            className="text-xs"
            style={{ color: theme.colors.text + '55' }}
          >
            Member for {profile?.daysSinceRegistration || 0} days
          </p>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-90 disabled:opacity-50 mx-auto"
            style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Gamification Stats */}
        {profile?.gamification && (
          <GamificationStats
            points={profile.gamification.points}
            coins={profile.gamification.coins}
            batteries={profile.gamification.batteries}
          />
        )}

        {/* Physical Stats */}
        <ProfileSection title="Physical Stats" icon={Activity} iconColor="#3b82f6">
          <div className="flex mx-[-8px] mb-4">
            <StatCard
              icon={Ruler}
              label="Height"
              value={profile?.physicalMetrics.height ?? null}
              unit="cm"
              color="#3b82f6"
            />
            <StatCard
              icon={Scale}
              label="Weight"
              value={profile?.physicalMetrics.weight ?? null}
              unit="kg"
              color="#8b5cf6"
            />
            <StatCard
              icon={Target}
              label="Target"
              value={profile?.physicalMetrics.targetWeight ?? null}
              unit="kg"
              color="#22c55e"
            />
          </div>

          {/* BMI Display */}
          {profile?.physicalMetrics.bmi && (
            <div
              className="flex items-center justify-between rounded-xl p-4"
              style={{ backgroundColor: theme.colors.background }}
            >
              <div className="flex items-center">
                <Gauge className="w-5 h-5 mr-3" style={{ color: bmiCategory?.color || theme.colors.text }} />
                <span className="text-sm" style={{ color: theme.colors.text }}>
                  BMI
                </span>
              </div>
              <div className="flex items-center">
                <span
                  className="text-xl font-bold mr-2"
                  style={{ color: theme.colors.text }}
                >
                  {profile.physicalMetrics.bmi}
                </span>
                {bmiCategory && (
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style={{
                      backgroundColor: bmiCategory.color + '15',
                      color: bmiCategory.color,
                    }}
                  >
                    {bmiCategory.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </ProfileSection>

        {/* Personal Info */}
        <ProfileSection title="Personal Information" icon={User} iconColor="#8b5cf6">
          <InfoRow
            label="Gender"
            value={
              profile?.gender
                ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                : null
            }
          />
          <InfoRow label="Age" value={profile?.age ? `${profile.age} years` : null} />
          <InfoRow label="Birthday" value={formatDate(profile?.birthdate || null)} />
          <InfoRow label="Blood Type" value={profile?.healthProfile.bloodType} />
        </ProfileSection>

        {/* Lifestyle */}
        <ProfileSection title="Lifestyle" icon={TrendingUp} iconColor="#22c55e">
          <InfoRow
            label="Activity Level"
            value={formatActivityLevel(profile?.lifestyle.activityLevel || null)}
          />
          <InfoRow
            label="Sleep Hours"
            value={profile?.lifestyle.sleepHours ? `${profile.lifestyle.sleepHours} hrs/night` : null}
          />
          <InfoRow
            label="Stress Level"
            value={
              profile?.riskFactors.stressLevel
                ? profile.riskFactors.stressLevel.charAt(0).toUpperCase() +
                  profile.riskFactors.stressLevel.slice(1)
                : null
            }
          />
          <InfoRow
            label="Water Intake"
            value={
              profile?.dietaryProfile.dailyWaterIntake
                ? `${profile.dietaryProfile.dailyWaterIntake} L/day`
                : null
            }
          />
        </ProfileSection>

        {/* Dietary Profile */}
        <ProfileSection title="Dietary Profile" icon={Apple} iconColor="#f97316">
          {(profile?.dietaryProfile.preferences?.length || 0) > 0 && (
            <div className="mb-4">
              <p
                className="text-sm mb-2"
                style={{ color: theme.colors.text + '77' }}
              >
                Preferences
              </p>
              <div>
                {profile?.dietaryProfile.preferences.map((pref: string, idx: number) => (
                  <Tag key={idx} text={pref} color="#22c55e" />
                ))}
              </div>
            </div>
          )}

          {(profile?.dietaryProfile.allergies?.length || 0) > 0 && (
            <div className="mb-4">
              <p
                className="text-sm mb-2"
                style={{ color: theme.colors.text + '77' }}
              >
                Allergies
              </p>
              <div>
                {profile?.dietaryProfile.allergies.map((allergy: string, idx: number) => (
                  <Tag key={idx} text={allergy} color="#ef4444" />
                ))}
              </div>
            </div>
          )}

          <InfoRow
            label="Daily Calorie Target"
            value={
              profile?.dietaryProfile.dailyCalorieTarget
                ? `${profile.dietaryProfile.dailyCalorieTarget} kcal`
                : null
            }
          />
        </ProfileSection>

        {/* Health Conditions */}
        {((profile?.healthProfile.familyHistory?.length || 0) > 0 ||
          (profile?.healthProfile.chronicDiseases?.length || 0) > 0 ||
          (profile?.healthProfile.medications?.length || 0) > 0) && (
          <ProfileSection title="Health Profile" icon={Heart} iconColor="#ef4444">
            {(profile?.healthProfile.chronicDiseases?.length || 0) > 0 && (
              <div className="mb-4">
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.colors.text + '77' }}
                >
                  Chronic Diseases
                </p>
                <div>
                  {profile?.healthProfile.chronicDiseases.map((disease: string, idx: number) => (
                    <Tag key={idx} text={disease} color="#ef4444" />
                  ))}
                </div>
              </div>
            )}

            {(profile?.healthProfile.familyHistory?.length || 0) > 0 && (
              <div className="mb-4">
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.colors.text + '77' }}
                >
                  Family History
                </p>
                <div>
                  {profile?.healthProfile.familyHistory.map((disease: string, idx: number) => (
                    <Tag key={idx} text={disease} color="#f97316" />
                  ))}
                </div>
              </div>
            )}

            {(profile?.healthProfile.medications?.length || 0) > 0 && (
              <div>
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.colors.text + '77' }}
                >
                  Current Medications
                </p>
                <div>
                  {profile?.healthProfile.medications.map((med: string, idx: number) => (
                    <Tag key={idx} text={med} color="#3b82f6" />
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>
        )}

        {/* Risk Factors */}
        {((profile?.riskFactors.smoking || false) ||
          (profile?.riskFactors.alcoholConsumption || false) ||
          (profile?.riskFactors.substanceUse?.length || 0) > 0) && (
          <ProfileSection title="Risk Factors" icon={AlertCircle} iconColor="#f59e0b">
            <InfoRow
              label="Smoking"
              value={profile?.riskFactors.smoking ? 'Yes' : 'No'}
            />
            <InfoRow
              label="Alcohol Consumption"
              value={profile?.riskFactors.alcoholConsumption ? 'Yes' : 'No'}
            />
            {(profile?.riskFactors.substanceUse?.length || 0) > 0 && (
              <div className="mt-3">
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.colors.text + '77' }}
                >
                  Substance Use
                </p>
                <div>
                  {profile?.riskFactors.substanceUse?.map((substance: string, idx: number) => (
                    <Tag key={idx} text={substance} color="#f59e0b" />
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>
        )}
      </main>
    </div>
  );
}
