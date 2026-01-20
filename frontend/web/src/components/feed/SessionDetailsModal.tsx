import { useTheme } from '@/context/ThemeContext';
import { X, MapPin, Clock, TrendingUp, Dumbbell, Scale, AlertTriangle, Lightbulb, ChefHat, ExternalLink } from 'lucide-react';
import CloudinaryLottie from '@/components/CloudinaryLottie';
import CloudinarySVG from '@/components/CloudinarySVG';

import RouteMap from './RouteMap';

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: 'GeoSession' | 'ProgramSession' | 'FoodLog';
  session: any;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  theme,
  suffix = '',
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  theme: any;
  suffix?: string;
}) => (
  <div
    className="flex-1 rounded-2xl p-3 text-center"
    style={{
      backgroundColor: theme.colors.surface,
      border: `1px solid ${color}20`,
    }}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
      style={{ backgroundColor: color + '20' }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <p className="font-semibold text-lg" style={{ color: theme.colors.text }}>
      {value}{suffix}
    </p>
    <p className="text-xs" style={{ color: theme.colors.text + '77' }}>
      {label}
    </p>
  </div>
);

const NutrientBar = ({
  label,
  value,
  unit,
  max,
  color,
  icon: Icon,
  theme,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  icon: any;
  theme: any;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-sm" style={{ color: theme.colors.text }}>{label}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: theme.colors.text }}>
          {value}{unit} <span className="text-xs" style={{ color: theme.colors.text + '55' }}>/ {max}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: color + '20' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default function SessionDetailsModal({ isOpen, onClose, sessionType, session }: SessionDetailsModalProps) {
  const { theme } = useTheme();

  if (!isOpen || !session) return null;

  const renderGeoSessionContent = () => {
    const coordinates = session.route_coordinates?.map((c: any) => [c.longitude, c.latitude]) || [];
    const staticMap = session.preview_image || session.static_map_url;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {session.activity_type?.name || 'Activity'}
            </h2>
            <p className="text-sm" style={{ color: theme.colors.text + '99' }}>
              {new Date(session.started_at).toLocaleDateString()}
            </p>
          </div>
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            <MapPin size={24} style={{ color: theme.colors.primary }} />
          </div>
        </div>

        {/* Map Preview */}
        {(staticMap || coordinates.length > 0) && (
          <div className="rounded-xl overflow-hidden h-64 border shadow-sm" style={{ borderColor: theme.colors.border }}>
            {staticMap ? (
              <img
                src={staticMap}
                alt="Route map"
                className="w-full h-full object-cover"
              />
            ) : (
              <RouteMap coordinates={coordinates} interactive={true} />
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
            <p className="text-sm" style={{ color: theme.colors.text + '99' }}>Distance</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {session.distance_km?.toFixed(2)} <span className="text-sm font-normal">km</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
            <p className="text-sm" style={{ color: theme.colors.text + '99' }}>Duration</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {Math.floor((session.moving_time_sec || 0) / 60)} <span className="text-sm font-normal">min</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
            <p className="text-sm" style={{ color: theme.colors.text + '99' }}>Avg Pace</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {session.avg_pace?.toFixed(2)} <span className="text-sm font-normal">/km</span>
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.background }}>
            <p className="text-sm" style={{ color: theme.colors.text + '99' }}>Calories</p>
            <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              {session.calories_burned} <span className="text-sm font-normal">kcal</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderFoodLogContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          {session.foodName}
        </h2>
        {session.servingSize && (
          <div className="flex items-center gap-2 mt-2">
            <Scale size={16} style={{ color: theme.colors.text + '77' }} />
            <span className="text-sm" style={{ color: theme.colors.text + '77' }}>
              Serving: {session.servingSize}
            </span>
          </div>
        )}
      </div>

      {/* Food Image */}
      {session.imageUrl && (
        <div className="rounded-xl overflow-hidden h-48">
          <img
            src={session.imageUrl}
            alt={session.foodName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Calorie Display */}
      <div
        className="p-6 rounded-3xl text-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div
          className="w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center"
          style={{
            backgroundColor: theme.colors.primary + '15',
            border: `6px solid ${theme.colors.primary}`,
          }}
        >
          <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {session.calories}
          </span>
          <span className="text-xs" style={{ color: theme.colors.text + '77' }}>kcal</span>
        </div>
      </div>

      {/* Macros Stats */}
      {session.nutrients && (
        <div className="flex gap-2">
          {session.nutrients.protein > 0 && (
            <StatCard
              icon={TrendingUp}
              label="Protein"
              value={session.nutrients.protein}
              suffix="g"
              color="#3b82f6"
              theme={theme}
            />
          )}
          {session.nutrients.carbs > 0 && (
            <StatCard
              icon={TrendingUp}
              label="Carbs"
              value={session.nutrients.carbs}
              suffix="g"
              color="#8b5cf6"
              theme={theme}
            />
          )}
          {session.nutrients.fat > 0 && (
            <StatCard
              icon={TrendingUp}
              label="Fat"
              value={session.nutrients.fat}
              suffix="g"
              color="#ec4899"
              theme={theme}
            />
          )}
        </div>
      )}

      {/* Nutrition Breakdown */}
      {session.nutrients && (
        <div className="p-5 rounded-3xl" style={{ backgroundColor: theme.colors.background }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
            Nutrition Facts
          </h3>
          <NutrientBar
            label="Protein"
            value={session.nutrients.protein}
            unit="g"
            max={50}
            color="#3b82f6"
            icon={TrendingUp}
            theme={theme}
          />
          <NutrientBar
            label="Carbohydrates"
            value={session.nutrients.carbs}
            unit="g"
            max={300}
            color="#8b5cf6"
            icon={TrendingUp}
            theme={theme}
          />
          <NutrientBar
            label="Total Fat"
            value={session.nutrients.fat}
            unit="g"
            max={78}
            color="#ec4899"
            icon={TrendingUp}
            theme={theme}
          />
        </div>
      )}

      {/* Healthy Alternatives */}
      {session.healthyAlternatives?.length > 0 && (
        <div className="p-5 rounded-3xl" style={{ backgroundColor: theme.colors.background }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={20} className="text-green-500" />
            <h3 className="text-lg font-semibold text-green-500">
              Healthier Alternatives
            </h3>
          </div>
          {session.healthyAlternatives.map((alt: any, index: number) => (
            <div
              key={index}
              className="p-3 rounded-xl mb-2"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div className="flex justify-between mb-1">
                <span className="font-semibold" style={{ color: theme.colors.text }}>
                  {alt.name}
                </span>
                <span className="text-sm text-green-500">
                  -{alt.caloriesSaved} kcal
                </span>
              </div>
              <p className="text-xs" style={{ color: theme.colors.text + '99' }}>
                {alt.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Ideas */}
      {session.recipeLinks?.length > 0 && (
        <div className="p-5 rounded-3xl" style={{ backgroundColor: theme.colors.background }}>
          <div className="flex items-center gap-2 mb-3">
            <ChefHat size={20} style={{ color: theme.colors.primary }} />
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.primary }}>
              Recipe Ideas
            </h3>
          </div>
          {session.recipeLinks.map((recipe: any, index: number) => (
            <a
              key={index}
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl mb-2 hover:opacity-80 transition"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div>
                <p style={{ color: theme.colors.text }}>{recipe.title}</p>
                <p className="text-xs" style={{ color: theme.colors.text + '77' }}>
                  {recipe.source}
                </p>
              </div>
              <ExternalLink size={18} style={{ color: theme.colors.primary }} />
            </a>
          ))}
        </div>
      )}

      {/* Allergy Warning */}
      {session.allergyWarnings?.detected?.length > 0 && (
        <div className="p-4 rounded-3xl bg-red-50 flex gap-3">
          <AlertTriangle size={24} className="text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 mb-1">Allergy Warning</h3>
            <p className="text-red-700">
              Contains: {session.allergyWarnings.detected.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );


  const renderProgramSessionContent = () => {
    const workouts = session.workouts || [];
    const geoActivities = session.geo_activities || [];
    console.log('[SessionDetailsModal] Program Session:', session);
    console.log('[SessionDetailsModal] Geo Activities:', geoActivities);

    // Combine both arrays for display
    const allActivities = [
      ...workouts.map((w: any) => ({ ...w, _type: 'workout' })),
      ...geoActivities.map((g: any) => ({ ...g, _type: 'geo' }))
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
            {session.program_name || session.title || 'Workout Session'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={16} style={{ color: theme.colors.text + '77' }} />
            <span className="text-sm" style={{ color: theme.colors.text + '77' }}>
              {new Date(session.performed_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className="flex justify-between p-4 rounded-2xl"
          style={{ backgroundColor: theme.colors.background }}
        >
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
              {session.total_duration_minutes}
            </p>
            <p className="text-xs" style={{ color: theme.colors.text + '77' }}>Minutes</p>
          </div>
          <div className="w-px" style={{ backgroundColor: theme.colors.text + '20' }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: theme.colors.text }}>
              {workouts.length + geoActivities.length}
            </p>
            <p className="text-xs" style={{ color: theme.colors.text + '77' }}>Exercises</p>
          </div>
          <div className="w-px" style={{ backgroundColor: theme.colors.text + '20' }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: theme.colors.primary }}>
              {session.total_calories_burned}
            </p>
            <p className="text-xs" style={{ color: theme.colors.text + '77' }}>Calories</p>
          </div>
        </div>

        {/* Exercises List (Workouts + Geo Activities) */}
        {allActivities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
              Exercises Performed
            </h3>
            <div className="space-y-3">
              {allActivities.map((item: any, index: number) => {
                const isWorkout = item._type === 'workout';

                // Determine display properties based on type
                let name, type, icon, animationUrl;

                if (isWorkout) {
                  name = item.name || item.workout_id?.name || 'Workout';
                  type = item.exercise_type || item.type || item.workout_id?.type || 'Strength';
                  animationUrl = item.animation_url || item.workout_id?.animation_url;
                } else {
                  name = item.name || item.activity_id?.name || 'Outdoor Activity';
                  type = 'Outdoor';
                  icon = item.icon || item.activity_id?.icon;
                }

                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl"
                    style={{
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${theme.colors.text}20`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      {/* Icon / Animation */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        {isWorkout && animationUrl ? (
                          <CloudinaryLottie
                            src={animationUrl}
                            width={56}
                            height={56}
                            className="w-full h-full"
                          />
                        ) : !isWorkout && icon ? (
                          <CloudinarySVG
                            src={icon}
                            width={32}
                            height={32}
                            fallbackColor={theme.colors.primary}
                          />
                        ) : (
                          isWorkout ? (
                            <Dumbbell size={24} style={{ color: theme.colors.primary }} />
                          ) : (
                            <MapPin size={24} style={{ color: theme.colors.primary }} />
                          )
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: theme.colors.text }}>
                          {name}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.text + '99' }}>
                          {type}
                        </p>
                      </div>
                    </div>

                    {/* Sets (For Workouts) */}
                    {isWorkout && item.sets && item.sets.length > 0 && (
                      <div
                        className="p-3 rounded-lg space-y-1"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        {item.sets.map((set: any, setIdx: number) => (
                          <div key={setIdx} className="flex items-center gap-3 text-sm">
                            <span
                              className="w-5"
                              style={{ color: theme.colors.text + '55' }}
                            >
                              {setIdx + 1}
                            </span>
                            {set.reps && (
                              <span style={{ color: theme.colors.text }}>
                                <strong>{set.reps}</strong> reps
                              </span>
                            )}
                            {set.weight_kg && (
                              <span style={{ color: theme.colors.text }}>
                                <strong>{set.weight_kg}</strong> kg
                              </span>
                            )}
                            {set.time_seconds && (
                              <span style={{ color: theme.colors.text }}>
                                <strong>{set.time_seconds}</strong> sec
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preferences (For Geo Activities) */}
                    {!isWorkout && item.preferences && (
                      <div
                        className="p-3 rounded-lg flex flex-wrap gap-4 text-sm"
                        style={{ backgroundColor: theme.colors.surface }}
                      >
                        {item.preferences.distance_km && (
                          <span style={{ color: theme.colors.text }}>
                            Distance: <strong>{item.preferences.distance_km}km</strong>
                          </span>
                        )}
                        {item.preferences.avg_pace && (
                          <span style={{ color: theme.colors.text }}>
                            Pace: <strong>{item.preferences.avg_pace}</strong>
                          </span>
                        )}
                        {item.preferences.countdown_seconds && (
                          <span style={{ color: theme.colors.text }}>
                            Time: <strong>{Math.floor(item.preferences.countdown_seconds / 60)}m</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
            {sessionType === 'GeoSession' && 'Activity Details'}
            {sessionType === 'FoodLog' && 'Food Details'}
            {sessionType === 'ProgramSession' && 'Workout Details'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition"
          >
            <X size={20} style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sessionType === 'GeoSession' && renderGeoSessionContent()}
          {sessionType === 'FoodLog' && renderFoodLogContent()}
          {sessionType === 'ProgramSession' && renderProgramSessionContent()}
        </div>
      </div>
    </div>
  );
}
