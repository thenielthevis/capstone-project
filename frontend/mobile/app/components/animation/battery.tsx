import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TextInput } from 'react-native';
import { SimpleLineIcons, MaterialCommunityIcons, Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    withSpring,
    Easing,
    runOnJS,
    interpolate,
    Extrapolate,
    useAnimatedProps,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ============================================
// ANIMATION TIMING CONFIGURATION
// ============================================
// Modify these values to change animation speeds and durations

// Battery fill animation timing
const BATTERY_FILL_DURATION = 3000; // How long the battery takes to fill (in milliseconds)

// Number counter animation timing
const COUNTER_DURATION = 3000; // How long the number counts from old to new value (in milliseconds)
const COUNTER_STEPS = 30; // How many steps/frames in the counter animation (higher = smoother but more CPU)

// Overall animation phases timing
const FADE_IN_DURATION = 400; // Initial fade in
const CELEBRATION_START_DELAY = 2000; // When celebration (sparkles/rays) starts
const TOTAL_ANIMATION_DURATION = 7000; // Total time before fade out begins
const FADE_OUT_DURATION = 600; // Final fade out

// Particle and effect timing
const PARTICLE_COUNT = 20; // Number of energy particles
const PARTICLE_DURATION = 3000; // How long particles take to reach battery
const GLOW_PULSE_DURATION = 600; // Speed of glow pulsing effect
const RAYS_ROTATION_DURATION = 3000; // Speed of rays rotation

// ============================================

// Helper to get color based on value - must be a worklet for Reanimated
const getBatteryColor = (value: number) => {
    'worklet';
    if (value <= 25) return '#ef4444'; // Red
    if (value <= 50) return '#f97316'; // Orange
    if (value <= 75) return '#eab308'; // Yellow
    return '#22c55e'; // Green
};

// Get gradient colors for battery fill
const getBatteryGradient = (value: number): [string, string] => {
    'worklet';
    if (value <= 25) return ['#ef4444', '#dc2626']; // Red gradient
    if (value <= 50) return ['#f97316', '#ea580c']; // Orange gradient
    if (value <= 75) return ['#eab308', '#ca8a04']; // Yellow gradient
    return ['#22c55e', '#16a34a']; // Green gradient
};

interface BatteryAnimateProps {
    visible: boolean;
    previousValue: number;
    newValue: number;
    label: string;
    onComplete?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    delay: number;
    size: number;
}

interface Sparkle {
    id: number;
    x: number;
    y: number;
    delay: number;
    size: number;
}

interface Ray {
    id: number;
    angle: number;
    delay: number;
}

const BatteryAnimate: React.FC<BatteryAnimateProps> = ({
    visible,
    previousValue,
    newValue,
    label,
    onComplete,
}) => {
    const { theme } = useTheme();
    const [showCelebration, setShowCelebration] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);
    const [rays, setRays] = useState<Ray[]>([]);
    const [displayValue, setDisplayValue] = useState(previousValue);

    // Animation values
    const batteryProgress = useSharedValue(previousValue);
    const batteryScale = useSharedValue(1);
    const batteryOpacity = useSharedValue(0);
    const glowIntensity = useSharedValue(0);
    const celebrationScale = useSharedValue(0);
    const raysRotation = useSharedValue(0);

    // Play sound effect
    const playSound = async (soundFile: any) => {
        try {
            const { sound } = await Audio.Sound.createAsync(soundFile);
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    };

    // Generate energy particles flowing into battery
    const generateParticles = () => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT * 0.3,
                delay: Math.random() * 800,
                size: 4 + Math.random() * 6,
            });
        }
        setParticles(newParticles);
    };

    // Generate sparkles for celebration
    const generateSparkles = () => {
        const newSparkles: Sparkle[] = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 80 + Math.random() * 40;
            newSparkles.push({
                id: i,
                x: SCREEN_WIDTH / 2 + Math.cos(angle) * radius,
                y: SCREEN_HEIGHT / 2 + Math.sin(angle) * radius,
                delay: i * 50,
                size: 6 + Math.random() * 8,
            });
        }
        setSparkles(newSparkles);
    };

    // Generate rays for level-up effect
    const generateRays = () => {
        const newRays: Ray[] = [];
        for (let i = 0; i < 8; i++) {
            newRays.push({
                id: i,
                angle: (i / 8) * 360,
                delay: i * 30,
            });
        }
        setRays(newRays);
    };

    // Animate number counter
    const animateCounter = () => {
        const increment = (newValue - previousValue) / COUNTER_STEPS;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const value = previousValue + (increment * currentStep);
            setDisplayValue(Math.round(value));

            if (currentStep >= COUNTER_STEPS) {
                clearInterval(interval);
                setDisplayValue(newValue);
            }
        }, COUNTER_DURATION / COUNTER_STEPS);
    };

    useEffect(() => {
        if (visible) {
            // Reset
            batteryOpacity.value = 0;
            batteryProgress.value = previousValue;
            batteryScale.value = 1;
            glowIntensity.value = 0;
            celebrationScale.value = 0;
            raysRotation.value = 0;
            setDisplayValue(previousValue);

            // Generate effects
            generateParticles();
            generateRays();

            // Fade in
            batteryOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });

            // Play charging sound
            playSound(require('@/assets/sounds/battery/scifi-charging.mp3'));

            // Start particle flow and glow - loop continuously
            setTimeout(() => {
                glowIntensity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: GLOW_PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0.5, { duration: GLOW_PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1, // Infinite loop
                    true
                );
            }, 200);

            // Animate battery fill with spring
            setTimeout(() => {
                batteryProgress.value = withTiming(newValue, {
                    duration: BATTERY_FILL_DURATION,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                });
                animateCounter();
            }, 400);

            // Scale pulse
            batteryScale.value = withSequence(
                withDelay(1200, withSpring(1.08, { damping: 8 })),
                withSpring(1, { damping: 10 })
            );

            // Celebration phase - continue until fade out
            setTimeout(() => {
                runOnJS(setShowCelebration)(true);
                runOnJS(generateSparkles)();
                runOnJS(playSound)(require('@/assets/sounds/success-sound.mp3'));

                celebrationScale.value = withSpring(1, { damping: 10, stiffness: 150 });

                // Continuous rotation for rays
                raysRotation.value = withRepeat(
                    withTiming(360, {
                        duration: RAYS_ROTATION_DURATION,
                        easing: Easing.linear,
                    }),
                    -1, // Infinite loop
                    false
                );
            }, CELEBRATION_START_DELAY);

            // Complete and fade out
            setTimeout(() => {
                // Stop animations
                glowIntensity.value = withTiming(0, { duration: 400 });
                celebrationScale.value = withTiming(0, { duration: 400 });
                batteryOpacity.value = withTiming(0, { duration: FADE_OUT_DURATION });
                if (onComplete) {
                    setTimeout(() => runOnJS(onComplete)(), FADE_OUT_DURATION);
                }
            }, TOTAL_ANIMATION_DURATION);
        }
    }, [visible, previousValue, newValue]);

    const batteryAnimatedStyle = useAnimatedStyle(() => ({
        opacity: batteryOpacity.value,
        transform: [{ scale: batteryScale.value }],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: glowIntensity.value * 0.6,
        transform: [{ scale: 1 + glowIntensity.value * 0.1 }],
    }));

    const fillAnimatedStyle = useAnimatedStyle(() => {
        const height = Math.max(5, Math.min(batteryProgress.value, 100));
        return {
            height: `${height}%`,
        };
    });

    const celebrationAnimatedStyle = useAnimatedStyle(() => ({
        opacity: celebrationScale.value,
        transform: [{ scale: celebrationScale.value }],
    }));

    const raysAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${raysRotation.value}deg` }],
    }));

    // New animated style for background dim
    const backgroundAnimatedStyle = useAnimatedStyle(() => ({
        opacity: batteryOpacity.value, // Assuming it fades in with the battery
    }));

    // New animated props for AnimatedTextInput
    const formattedValue = useAnimatedProps(() => {
        return {
            text: `${Math.round(displayValue)}%`,
        } as any;
    });

    const currentColor = getBatteryColor(displayValue);
    const [gradientStart, gradientEnd] = getBatteryGradient(displayValue);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Background Dim - zIndex 0 */}
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 0 },
                    backgroundAnimatedStyle
                ]} />

                {/* Rays - zIndex 1 */}
                {showCelebration && (
                    <Animated.View style={[styles.raysContainer, raysAnimatedStyle, { zIndex: 1 }]}>
                        {rays.map((ray) => (
                            <Ray key={ray.id} angle={ray.angle} delay={ray.delay} color={currentColor} />
                        ))}
                    </Animated.View>
                )}

                {/* Particles - zIndex 5 */}
                {particles.map((particle) => (
                    <EnergyParticle
                        key={particle.id}
                        x={particle.x}
                        y={particle.y}
                        delay={particle.delay}
                        size={particle.size}
                        color={currentColor}
                    />
                ))}

                {/* Battery container - zIndex 10 to be above rays */}
                <Animated.View style={[styles.batteryContainer, batteryAnimatedStyle, { zIndex: 10 }]}>
                    {/* Glow effect */}
                    <Animated.View
                        style={[
                            styles.glowEffect,
                            glowAnimatedStyle,
                            { backgroundColor: currentColor + '90' }
                        ]}
                    />

                    {/* Label */}
                    <View style={styles.labelContainer}>
                        {label.toLowerCase() === 'sleep' && (
                            <MaterialCommunityIcons name="sleep" size={50} color="rgba(255, 255, 255)" />
                        )}
                        {label.toLowerCase() === 'nutrition' && (
                            <Ionicons name="nutrition-outline" size={50} color="rgba(255, 255, 255)" />
                        )}
                        {label.toLowerCase() === 'activity' && (
                            <Feather name="activity" size={50} color="rgba(255, 255, 255)" />
                        )}
                        {label.toLowerCase() === 'health' && (
                            <MaterialIcons name="health-and-safety" size={50} color="rgba(255, 255, 255)" />
                        )}

                        <Text style={[styles.label, { color: "rgba(255, 255, 255)", fontFamily: theme.fonts.heading }]}>
                            {label}
                        </Text>
                    </View>

                    {/* Battery Nub */}
                    <View
                        style={[
                            styles.batteryNub,
                            { backgroundColor: "rgba(255, 255, 255, 0.4)" },
                        ]}
                    />

                    {/* Battery Body */}
                    <View
                        style={[
                            styles.batteryBody,
                            { borderColor: "rgba(255, 255, 255, 0.4)" },
                        ]}
                    >
                        {/* Gradient fill */}
                        <Animated.View style={[styles.batteryFillContainer, fillAnimatedStyle]}>
                            <LinearGradient
                                colors={[gradientStart, gradientEnd]}
                                style={styles.batteryFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            {/* Energy icon overlay */}
                            <View style={styles.energyIconContainer}>
                                <SimpleLineIcons name="energy" size={32} color="rgba(255, 255, 255, 0.4)" />
                            </View>
                        </Animated.View>

                        {/* Shine effect */}
                        <View style={styles.shineEffect} />
                    </View>

                    {/* Value Display with glow */}
                    <View style={styles.valueContainer}>
                        <AnimatedTextInput
                            style={[
                                styles.valueTextGlow,
                                {
                                    fontFamily: theme.fonts.heading, // Apply theme font here
                                    color: currentColor,
                                    textShadowColor: currentColor
                                }
                            ]}
                            animatedProps={formattedValue}
                            editable={false}
                        />
                        <AnimatedTextInput
                            style={[
                                styles.valueText,
                                {
                                    fontFamily: theme.fonts.heading, // Apply theme font here
                                    color: '#FFFFFF'
                                }
                            ]}
                            animatedProps={formattedValue}
                            editable={false}
                        />
                    </View>
                </Animated.View>

                {/* Celebration Sparkles - zIndex 20 (Topmost) */}
                {showCelebration && (
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                width: 400,
                                height: 400,
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 20,
                            },
                            celebrationAnimatedStyle
                        ]}
                    >
                        {sparkles.map((sparkle) => (
                            <Sparkle
                                key={sparkle.id}
                                x={sparkle.x}
                                y={sparkle.y}
                                delay={sparkle.delay}
                                size={sparkle.size}
                                color={currentColor}
                            />
                        ))}
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
};

// Energy Particle Component
const EnergyParticle: React.FC<{
    x: number;
    y: number;
    delay: number;
    size: number;
    color: string;
}> = ({ x, y, delay, size, color }) => {
    const translateY = useSharedValue(y);
    const translateX = useSharedValue(x);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        // Fade in and grow
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
        scale.value = withDelay(delay, withSpring(1, { damping: 10 }));

        // Move toward center battery
        const targetX = SCREEN_WIDTH / 2;
        const targetY = SCREEN_HEIGHT / 2;

        translateX.value = withDelay(
            delay,
            withTiming(targetX, {
                duration: PARTICLE_DURATION,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
        );

        translateY.value = withDelay(
            delay,
            withTiming(targetY, {
                duration: PARTICLE_DURATION,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
        );

        // Fade out at end
        opacity.value = withDelay(delay + (PARTICLE_DURATION - 200), withTiming(0, { duration: 200 }));
    }, []);

    const particleStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: translateX.value - size / 2,
        top: translateY.value - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
        zIndex: 5, // Ensure particles have z-index
    }));

    return (
        <Animated.View
            style={[
                particleStyle,
                {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                    elevation: 4,
                }
            ]}
        />
    );
};

// Sparkle Component
const Sparkle: React.FC<{
    x: number;
    y: number;
    delay: number;
    size: number;
    color: string;
}> = ({ x, y, delay, size, color }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Pop in
        scale.value = withDelay(
            delay,
            withSpring(1, { damping: 8, stiffness: 200 })
        );
        opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));

        // Rotate
        rotate.value = withDelay(
            delay,
            withTiming(180, { duration: 1000, easing: Easing.out(Easing.ease) })
        );

        // Fade out
        opacity.value = withDelay(delay + 800, withTiming(0, { duration: 300 }));
    }, []);

    const sparkleStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    return (
        <Animated.View style={sparkleStyle}>
            <View style={[styles.sparkle, { backgroundColor: color }]} />
            <View style={[styles.sparkle, { backgroundColor: color, transform: [{ rotate: '90deg' }] }]} />
        </Animated.View>
    );
};

// Ray Component
const Ray: React.FC<{
    angle: number;
    delay: number;
    color: string;
}> = ({ angle, delay, color }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withSpring(1, { damping: 12, stiffness: 100 })
        );
        opacity.value = withDelay(delay, withTiming(0.6, { duration: 300 }));
        opacity.value = withDelay(delay + 1200, withTiming(0, { duration: 400 }));
    }, []);

    const rayStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: 4,
        height: 150,
        backgroundColor: color,
        opacity: opacity.value,
        transform: [
            { translateY: -75 },
            { rotate: `${angle}deg` },
            { scaleY: scale.value },
        ],
    }));

    return <Animated.View style={rayStyle} />;
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        zIndex: 9999,
    },
    batteryContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowEffect: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        borderRadius: 90,
        zIndex: -1,
    },
    labelContainer: {
        marginBottom: 20,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 28,
        letterSpacing: 1,
    },
    batteryNub: {
        width: 50,
        height: 14,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginBottom: 2,
    },
    batteryBody: {
        width: 140,
        height: 260,
        borderWidth: 5,
        borderRadius: 20,
        padding: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    batteryFillContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    batteryFill: {
        width: '100%',
        height: '100%',
    },
    energyIconContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shineEffect: {
        position: 'absolute',
        left: 8,
        top: 8,
        width: '30%',
        height: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
    },
    valueContainer: {
        marginTop: 24,
    },
    valueText: {
        fontSize: 42,
        letterSpacing: 2,
    },
    valueTextGlow: {
        position: 'absolute',
        fontSize: 42,
        letterSpacing: 2,
        opacity: 0.4,
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    raysContainer: {
        position: 'absolute',
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkle: {
        position: 'absolute',
        width: '100%',
        height: '20%',
        borderRadius: 2,
    },
});

export default BatteryAnimate;