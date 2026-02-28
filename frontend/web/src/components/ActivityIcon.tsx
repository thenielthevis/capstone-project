import React from 'react';
import SVG from 'react-inlinesvg';
import { MapPin, Bike, Waves, Footprints, Dumbbell } from 'lucide-react';

// Import local SVG assets
import RunIcon from '../assets/icons/run.svg';
import WalkIcon from '../assets/icons/walk.svg';
import HikeIcon from '../assets/icons/hike.svg';
import CyclingIcon from '../assets/icons/cycling.svg';
import SwimmingIcon from '../assets/icons/swimming.svg';
import KayakingIcon from '../assets/icons/kayaking.svg';
import TennisIcon from '../assets/icons/tennis.svg';
import BadmintonIcon from '../assets/icons/badminton.svg';
import WeightliftingIcon from '../assets/icons/weightlifting.svg';
import ArnisIcon from '../assets/icons/arnis.svg';
import BasketballIcon from '../assets/icons/basketball.svg';
import BoxingIcon from '../assets/icons/boxing.svg';
import FootballIcon from '../assets/icons/football.svg';
import SoftballIcon from '../assets/icons/softball.svg';
import TableTennisIcon from '../assets/icons/table-tennis.svg';
import TaekwondoIcon from '../assets/icons/taekwondo.svg';
import VolleyballIcon from '../assets/icons/volleyball.svg';

// Map activity names to local SVG paths
const ACTIVITY_ICONS: Record<string, string> = {
    'Run': RunIcon,
    'Walk': WalkIcon,
    'Hike': HikeIcon,
    'Trail Run': RunIcon,
    'Cycling': CyclingIcon,
    'Mountain Biking': CyclingIcon,
    'Gravel Ride': CyclingIcon,
    'Swimming': SwimmingIcon,
    'Kayaking': KayakingIcon,
    'Rowing': KayakingIcon,
    'Tennis': TennisIcon,
    'Badminton': BadmintonIcon,
    'Weightlifting': WeightliftingIcon,
    'Pilates': WeightliftingIcon,
    'Golf': TennisIcon,
    'Arnis': ArnisIcon,
    'Basketball': BasketballIcon,
    'Boxing': BoxingIcon,
    'Football': FootballIcon,
    'Softball': SoftballIcon,
    'Table Tennis': TableTennisIcon,
    'Taekwondo': TaekwondoIcon,
    'Volleyball': VolleyballIcon,
};

// Fallback icons by activity type (using Lucide)
const ACTIVITY_TYPE_FALLBACKS: Record<string, any> = {
    'Foot Sports': Footprints,
    'Cycle Sports': Bike,
    'Water Sports': Waves,
    'Other Sports': Dumbbell,
};

interface ActivityIconProps {
    activityName?: string;
    activityType?: string;
    iconUrl?: string;
    size?: number | string;
    color?: string;
    className?: string;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({
    activityName = '',
    activityType = 'Other Sports',
    iconUrl = '',
    size = 24,
    color = 'currentColor',
    className = '',
}) => {
    // Helper to ensure SVGs use the provided color
    const preProcess = (svg: string) => {
        // Replace hardcoded fills/strokes with currentColor to allow CSS/prop color control
        return svg.replace(/fill="([^"none]+)"/g, 'fill="currentColor"')
            .replace(/stroke="([^"none]+)"/g, 'stroke="currentColor"');
    };

    // 1. Try local icon mapping by name
    const localIcon = ACTIVITY_ICONS[activityName];

    if (localIcon) {
        return (
            <SVG
                src={localIcon}
                width={size}
                height={size}
                className={className}
                style={{ color }}
                preProcessor={preProcess}
            />
        );
    }

    // 2. Fallback to Cloudinary iconUrl if provided and not a placeholder
    if (iconUrl && !iconUrl.includes('placeholder')) {
        // Ensure URL is valid and uses https
        let url = iconUrl;
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        } else if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }

        return (
            <SVG
                src={url}
                width={size}
                height={size}
                className={className}
                style={{ color }}
                preProcessor={preProcess}
                onError={(e) => {
                    console.warn(`[ActivityIcon] Failed to load remote icon: ${url}`, e);
                }}
            />
        );
    }

    // 3. Fallback by activity type
    const FallbackIcon = ACTIVITY_TYPE_FALLBACKS[activityType] || MapPin;
    return (
        <FallbackIcon
            size={size}
            className={className}
            style={{ color }}
        />
    );
};

export default ActivityIcon;
