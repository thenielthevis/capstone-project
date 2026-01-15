import React from "react";
import { View, ViewStyle } from "react-native";
import { SvgProps } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

// Import local SVG icons
import RunIcon from "@/assets/icons/run.svg";
import WalkIcon from "@/assets/icons/walk.svg";
import HikeIcon from "@/assets/icons/hike.svg";
import CyclingIcon from "@/assets/icons/cycling.svg";
import SwimmingIcon from "@/assets/icons/swimming.svg";
import KayakingIcon from "@/assets/icons/kayaking.svg";
import TennisIcon from "@/assets/icons/tennis.svg";
import BadmintonIcon from "@/assets/icons/badminton.svg";
import WeightliftingIcon from "@/assets/icons/weightlifting.svg";

// Map activity names to local SVG components
const ACTIVITY_ICONS: Record<string, React.FC<SvgProps>> = {
    'Run': RunIcon,
    'Walk': WalkIcon,
    'Hike': HikeIcon,
    'Trail Run': RunIcon, // Reuse run icon
    'Cycling': CyclingIcon,
    'Mountain Biking': CyclingIcon, // Reuse cycling icon
    'Gravel Ride': CyclingIcon,
    'Swimming': SwimmingIcon,
    'Kayaking': KayakingIcon,
    'Rowing': KayakingIcon, // Reuse kayaking icon
    'Tennis': TennisIcon,
    'Badminton': BadmintonIcon,
    'Weightlifting': WeightliftingIcon,
    'Pilates': WeightliftingIcon, // Reuse
    'Golf': TennisIcon, // Reuse tennis icon for now
};

// Fallback icons by activity type (using Ionicons)
const ACTIVITY_TYPE_FALLBACK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Foot Sports': 'footsteps',
    'Cycle Sports': 'bicycle',
    'Water Sports': 'water',
    'Other Sports': 'fitness',
};

interface ActivityIconProps {
    activityName: string;
    activityType?: string;
    size?: number;
    color?: string;
    style?: ViewStyle;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({
    activityName,
    activityType = 'Other Sports',
    size = 24,
    color = '#000',
    style
}) => {
    const LocalIcon = ACTIVITY_ICONS[activityName];

    if (LocalIcon) {
        return (
            <View style={style}>
                <LocalIcon width={size} height={size} fill={color} />
            </View>
        );
    }

    const fallbackIconName = ACTIVITY_TYPE_FALLBACK_ICONS[activityType] || 'fitness';

    return (
        <View style={style}>
            <Ionicons name={fallbackIconName} size={size} color={color} />
        </View>
    );
};
