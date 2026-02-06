import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getProgramSessionById } from '../api/programSessionApi';
import { geoSessionApi } from '../api/geoSessionApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    X, MapPin, Clock, TrendingUp, Dumbbell, Scale,
    AlertTriangle, Lightbulb, ChefHat, ExternalLink,
    ArrowLeft, Share2, CheckCircle, Timer
} from 'lucide-react';
import CloudinaryLottie from '@/components/CloudinaryLottie';
import CloudinarySVG from '@/components/CloudinarySVG';
import RouteMap from '../components/feed/RouteMap';

export default function ProgramSessionDetails() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const sessionType = searchParams.get('type') as 'GeoSession' | 'ProgramSession';
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            if (!id) return;
            try {
                setLoading(true);
                let data;
                if (sessionType === 'ProgramSession') {
                    data = await getProgramSessionById(id);
                } else {
                    data = await geoSessionApi.getGeoSessionById(id);
                }
                setSession(data);
            } catch (err) {
                console.error('Failed to fetch session:', err);
                setError('Failed to load session details');
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [id, sessionType]);

    const handlePostSession = () => {
        const title = sessionType === 'ProgramSession'
            ? session.program_name || 'Workout'
            : session.activity_type?.name || 'Activity';

        const subtitle = sessionType === 'ProgramSession'
            ? `${session.workouts?.length || 0} Exercises`
            : `${session.distance_km?.toFixed(2)} km`;

        navigate(`/feed?post=true&type=${sessionType}&id=${id}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
                <Header showBackButton backTo="/programs/history" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background }}>
                <Header showBackButton backTo="/programs/history" />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <AlertTriangle size={48} style={{ color: theme.colors.text + '40' }} className="mb-4" />
                    <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>{error || 'Session not found'}</h2>
                    <button
                        onClick={() => navigate('/programs/history')}
                        className="px-6 py-2 rounded-xl text-white font-bold"
                        style={{ backgroundColor: theme.colors.primary }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const renderGeoSessionContent = () => {
        const coordinates = session.route_coordinates?.map((c: any) => [c.longitude, c.latitude]) || [];
        const staticMap = session.preview_image || session.static_map_url;

        return (
            <div className="space-y-6">
                {/* Map Preview */}
                {(staticMap || coordinates.length > 0) && (
                    <div className="rounded-[32px] overflow-hidden h-72 border shadow-lg relative" style={{ borderColor: theme.colors.border }}>
                        {staticMap ? (
                            <img src={staticMap} alt="Route map" className="w-full h-full object-cover" />
                        ) : (
                            <RouteMap coordinates={coordinates} interactive={true} />
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={MapPin} label="Distance" value={session.distance_km?.toFixed(2)} suffix=" km" color={theme.colors.primary} theme={theme} />
                    <StatCard icon={Clock} label="Duration" value={Math.floor((session.moving_time_sec || 0) / 60)} suffix=" min" color="#8b5cf6" theme={theme} />
                    <StatCard icon={TrendingUp} label="Avg Pace" value={session.avg_pace?.toFixed(2)} suffix=" /km" color="#3b82f6" theme={theme} />
                    <StatCard icon={Timer} label="Calories" value={session.calories_burned} suffix=" kcal" color="#f59e0b" theme={theme} />
                </div>
            </div>
        );
    };

    const renderProgramSessionContent = () => {
        const workouts = session.workouts || [];
        const geoActivities = session.geo_activities || [];
        const allActivities = [
            ...workouts.map((w: any) => ({ ...w, _type: 'workout' })),
            ...geoActivities.map((g: any) => ({ ...g, _type: 'geo' }))
        ];

        return (
            <div className="space-y-6">
                {/* Stats Row */}
                <div className="flex gap-4">
                    <StatCard icon={Clock} label="Duration" value={session.total_duration_minutes} suffix=" min" color="#8b5cf6" theme={theme} />
                    <StatCard icon={Dumbbell} label="Exercises" value={allActivities.length} color={theme.colors.primary} theme={theme} />
                    <StatCard icon={TrendingUp} label="Calories" value={session.total_calories_burned} suffix=" kcal" color="#f59e0b" theme={theme} />
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black px-1" style={{ color: theme.colors.text }}>Exercises Performed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allActivities.map((item, index) => {
                            const isWorkout = item._type === 'workout';
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
                                <div key={index} className="p-4 rounded-[28px] border transition-all" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.colors.background }}>
                                            {isWorkout && animationUrl ? (
                                                <CloudinaryLottie src={animationUrl} width={64} height={64} className="w-full h-full" />
                                            ) : !isWorkout && icon ? (
                                                <CloudinarySVG src={icon} width={32} height={32} fallbackColor={theme.colors.primary} />
                                            ) : (
                                                isWorkout ? <Dumbbell size={28} style={{ color: theme.colors.primary }} /> : <MapPin size={28} style={{ color: theme.colors.primary }} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-lg truncate" style={{ color: theme.colors.text }}>{name}</p>
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: theme.colors.text }}>{type}</span>
                                        </div>
                                    </div>

                                    {isWorkout && item.sets?.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {item.sets.map((set: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl text-xs" style={{ backgroundColor: theme.colors.background }}>
                                                    <span className="font-black opacity-30" style={{ color: theme.colors.text }}>{idx + 1}</span>
                                                    <span style={{ color: theme.colors.text }}>
                                                        {set.reps && <strong>{set.reps} reps </strong>}
                                                        {set.weight_kg && <strong>{set.weight_kg}kg </strong>}
                                                        {set.time_seconds && <strong>{set.time_seconds}s</strong>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!isWorkout && (
                                        <div className="flex gap-4 mt-2 p-2 rounded-xl items-center justify-around" style={{ backgroundColor: theme.colors.background }}>
                                            <div className="text-center">
                                                <p className="font-bold" style={{ color: theme.colors.text }}>{item.distance_km || 0} <span className="text-[10px] font-normal opacity-60">km</span></p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold" style={{ color: theme.colors.text }}>{Math.floor((item.moving_time_sec || 0) / 60)} <span className="text-[10px] font-normal opacity-60">min</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col pb-24" style={{ backgroundColor: theme.colors.background }}>
            <Header
                title={sessionType === 'ProgramSession' ? 'Workout Details' : 'Activity Details'}
                showBackButton
                backTo="/programs/history"
            />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: sessionType === 'ProgramSession' ? `${theme.colors.primary}15` : '#8b5cf615', color: sessionType === 'ProgramSession' ? theme.colors.primary : '#8b5cf6' }}
                            >
                                {sessionType === 'ProgramSession' ? 'Program' : 'Outdoor'}
                            </span>
                            <span className="text-sm font-medium opacity-50" style={{ color: theme.colors.text }}>
                                {new Date(session.performed_at || session.started_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black" style={{ color: theme.colors.text }}>
                            {session.program_name || session.activity_type?.name || 'Workout Session'}
                        </h1>
                    </div>

                    {!session.isPosted && (
                        <button
                            onClick={handlePostSession}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition shadow-lg hover:scale-105"
                            style={{ backgroundColor: theme.colors.primary, color: '#FFF' }}
                        >
                            <Share2 size={20} />
                            Post to Feed
                        </button>
                    )}
                    {session.isPosted && (
                        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold opacity-60" style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}>
                            <CheckCircle size={20} />
                            Shared to Feed
                        </div>
                    )}
                </div>

                {sessionType === 'GeoSession' ? renderGeoSessionContent() : renderProgramSessionContent()}
            </main>

            <Footer />
        </div>
    );
}

const StatCard = ({ icon: Icon, label, value, color, theme, suffix = '' }: any) => (
    <div className="flex-1 p-4 rounded-[28px] text-center flex flex-col items-center justify-center transition-transform hover:scale-102"
        style={{ backgroundColor: theme.colors.surface, border: `1px solid ${color}15` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: color + '15' }}>
            <Icon size={20} style={{ color }} />
        </div>
        <span className="text-2xl font-black" style={{ color: theme.colors.text }}>{value}<span className="text-sm font-normal opacity-60">{suffix}</span></span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1" style={{ color: theme.colors.text }}>{label}</span>
    </div>
);
