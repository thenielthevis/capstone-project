import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, Dumbbell, Utensils } from 'lucide-react';
import SessionDetailsModal from './SessionDetailsModal';

type SessionPreviewProps = {
  reference: {
    item_id: any;
    item_type: 'GeoSession' | 'ProgramSession' | 'FoodLog' | 'Post';
  };
  fullWidth?: boolean;
};

export default function SessionPreview({ reference, fullWidth = false }: SessionPreviewProps) {
  const { theme } = useTheme();
  const { item_id: session, item_type } = reference;
  const [showDetails, setShowDetails] = useState(false);

  if (!session) return null;

  const handleClick = () => {
    if (item_type !== 'Post') {
      setShowDetails(true);
    }
  };

  const containerStyle = {
    width: fullWidth ? '100%' : 300,
    height: 256,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
  };

  // --- GeoSession Render ---
  if (item_type === 'GeoSession') {
    return (
      <>
        <div
          onClick={handleClick}
          className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition relative"
          style={containerStyle}
      >
        {/* Map Placeholder / Static Map */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: theme.colors.background }}
        >
          {session.static_map_url ? (
            <img
              src={session.static_map_url}
              alt="Route map"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <MapPin size={48} style={{ color: theme.colors.text + '33' }} />
              <span className="mt-2" style={{ color: theme.colors.text + '77' }}>
                Map Preview
              </span>
            </div>
          )}
        </div>

        {/* Overlay Info */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3"
          style={{ backgroundColor: theme.colors.surface + 'EE' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                {session.activity_type?.name || 'Activity'}
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}
              >
                {new Date(session.started_at).toLocaleDateString()} •{' '}
                {new Date(session.started_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <p
                className="font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                {session.distance_km?.toFixed(2)} km
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}
              >
                {Math.floor((session.moving_time_sec || 0) / 60)} min
              </p>
            </div>
          </div>
        </div>
      </div>
      <SessionDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        sessionType={item_type}
        session={session}
      />
      </>
    );
  }

  // --- FoodLog Render ---
  if (item_type === 'FoodLog') {
    return (
      <>
      <div
        onClick={handleClick}
        className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition relative"
        style={containerStyle}
      >
        {/* Food Image */}
        {session.imageUrl ? (
          <img
            src={session.imageUrl}
            alt={session.foodName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.background }}
          >
            <Utensils size={48} style={{ color: theme.colors.text + '33' }} />
          </div>
        )}

        {/* Kcal Overlay */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full"
          style={{ backgroundColor: theme.colors.background + 'EE' }}
        >
          <span
            className="font-semibold text-sm"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}
          >
            {session.calories} kcal
          </span>
        </div>

        {/* Bottom Info */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3"
          style={{ backgroundColor: theme.colors.surface + 'EE' }}
        >
          <p
            className="font-semibold text-base"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
          >
            {session.foodName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}
            >
              Protein: {session.nutrients?.protein}g
            </span>
            <span
              className="text-xs"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}
            >
              Carbs: {session.nutrients?.carbs}g
            </span>
            <span
              className="text-xs"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '99' }}
            >
              Fat: {session.nutrients?.fat}g
            </span>
          </div>
        </div>
      </div>
      <SessionDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        sessionType={item_type}
        session={session}
      />
      </>
    );
  }

  // --- ProgramSession Render ---
  if (item_type === 'ProgramSession') {
    const workouts = session.workouts || [];
    const geoActivities = session.geo_activities || [];

    // Get unique exercise types
    const exerciseTypes = [
      ...workouts
        .map((w: any) => w.exercise_type || w.type || w.workout_id?.type)
        .filter(Boolean),
      ...geoActivities
        .map((g: any) => g.exercise_type || g.type || g.activity_id?.type)
        .filter(Boolean),
    ];
    const uniqueTypes = [...new Set(exerciseTypes)].slice(0, 3);

    return (
      <>
      <div
        onClick={handleClick}
        className="rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition p-4 flex flex-col justify-between"
        style={containerStyle}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              <Dumbbell size={24} style={{ color: theme.colors.primary }} />
            </div>
            <span
              className="text-sm"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.text + '77' }}
            >
              {new Date(session.performed_at).toLocaleDateString()}
            </span>
          </div>

          <p
            className="text-xl font-semibold mb-2"
            style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
          >
            {session.program_name || session.title || 'Workout Session'}
          </p>

          {/* Exercise Type Badges */}
          {uniqueTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {uniqueTypes.map((type, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: theme.colors.primary + '15',
                    fontFamily: theme.fonts.body,
                    color: theme.colors.primary,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <div
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: theme.colors.border }}
          >
            <span style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>
              Duration
            </span>
            <span style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
              {session.total_duration_minutes} min
            </span>
          </div>
          <div
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: theme.colors.border }}
          >
            <span style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>
              Volume
            </span>
            <span style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
              {workouts.length + geoActivities.length} Exercises
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span style={{ fontFamily: theme.fonts.body, color: theme.colors.text }}>
              Calories
            </span>
            <span style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
              {session.total_calories_burned} kcal
            </span>
          </div>
        </div>
      </div>
      <SessionDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        sessionType={item_type}
        session={session}
      />
      </>
    );
  }

  return null;
}
