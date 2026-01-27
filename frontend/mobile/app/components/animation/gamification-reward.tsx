import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TextInput } from 'react-native';
import { SimpleLineIcons, MaterialCommunityIcons, Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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
const BATTERY_FILL_DURATION = 2500;
const COUNTER_DURATION = 2500;
const COUNTER_STEPS = 30;
const FADE_IN_DURATION = 400;
const CELEBRATION_START_DELAY = 2200;
const TOTAL_ANIMATION_DURATION = 6000;
const FADE_OUT_DURATION = 1000;
const PARTICLE_COUNT = 16;
const PARTICLE_DURATION = 2500;
const GLOW_PULSE_DURATION = 600;
const RAYS_ROTATION_DURATION = 3000;

// ============================================

const getBatteryColor = (value: number) => {
    'worklet';
    if (value <= 25) return '#ef4444';
    if (value <= 50) return '#f97316';
    if (value <= 75) return '#eab308';
    return '#22c55e';
};

const getBatteryGradient = (value: number): [string, string] => {
    'worklet';
    if (value <= 25) return ['#ef4444', '#dc2626'];
    if (value <= 50) return ['#f97316', '#ea580c'];
    if (value <= 75) return ['#eab308', '#ca8a04'];
    return ['#22c55e', '#16a34a'];
};

const COIN_COLOR = '#FFD700';
const COIN_GRADIENT: [string, string] = ['#FFD700', '#FFA500'];

interface GamificationRewardProps {
    visible: boolean;
    previousBattery: number;
    newBattery: number;
    coinsAwarded: number;
    totalCoins: number;
    label: string;
    onComplete?: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    delay: number;
    size: number;
    targetX: number;
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

const GamificationReward: React.FC<GamificationRewardProps> = ({
    visible,
    previousBattery,
    newBattery,
    coinsAwarded,
    totalCoins,
    label,
    onComplete,
}) => {
    const { theme } = useTheme();
    const [showCelebration, setShowCelebration] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);
    const [rays, setRays] = useState<Ray[]>([]);
    const [displayBattery, setDisplayBattery] = useState(previousBattery);
    const [displayCoins, setDisplayCoins] = useState(0);

    // Animation values
    const batteryProgress = useSharedValue(previousBattery);
    const containerScale = useSharedValue(1);
    const containerOpacity = useSharedValue(0);
    const glowIntensity = useSharedValue(0);
    const celebrationScale = useSharedValue(0);
    const raysRotation = useSharedValue(0);
    const coinScale = useSharedValue(0);
    const coinBounce = useSharedValue(1);

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

    const generateParticles = () => {
        const newParticles: Particle[] = [];
        const batteryTargetX = SCREEN_WIDTH / 2 - 80;
        const coinTargetX = SCREEN_WIDTH / 2 + 80;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const isCoinParticle = i >= PARTICLE_COUNT / 2;
            newParticles.push({
                id: i,
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT * 0.3,
                delay: Math.random() * 600,
                size: 4 + Math.random() * 5,
                targetX: isCoinParticle ? coinTargetX : batteryTargetX,
            });
        }
        setParticles(newParticles);
    };

    const generateSparkles = () => {
        const newSparkles: Sparkle[] = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 120 + Math.random() * 40;
            newSparkles.push({
                id: i,
                x: SCREEN_WIDTH / 2 + Math.cos(angle) * radius,
                y: SCREEN_HEIGHT / 2 + Math.sin(angle) * radius,
                delay: i * 40,
                size: 5 + Math.random() * 6,
            });
        }
        setSparkles(newSparkles);
    };

    const generateRays = () => {
        const newRays: Ray[] = [];
        for (let i = 0; i < 8; i++) {
            newRays.push({
                id: i,
                angle: (i / 8) * 360,
                delay: i * 25,
            });
        }
        setRays(newRays);
    };

    const animateBatteryCounter = () => {
        const increment = (newBattery - previousBattery) / COUNTER_STEPS;
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const value = previousBattery + (increment * currentStep);
            setDisplayBattery(Math.round(value));
            if (currentStep >= COUNTER_STEPS) {
                clearInterval(interval);
                setDisplayBattery(newBattery);
            }
        }, COUNTER_DURATION / COUNTER_STEPS);
    };

    const animateCoinCounter = () => {
        const increment = coinsAwarded / COUNTER_STEPS;
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const value = increment * currentStep;
            setDisplayCoins(Math.round(value));
            if (currentStep >= COUNTER_STEPS) {
                clearInterval(interval);
                setDisplayCoins(coinsAwarded);
            }
        }, COUNTER_DURATION / COUNTER_STEPS);
    };

    useEffect(() => {
        if (visible) {
            // Reset
            containerOpacity.value = 0;
            batteryProgress.value = previousBattery;
            containerScale.value = 1;
            glowIntensity.value = 0;
            celebrationScale.value = 0;
            raysRotation.value = 0;
            coinScale.value = 0;
            coinBounce.value = 1;
            setDisplayBattery(previousBattery);
            setDisplayCoins(0);
            setShowCelebration(false);

            generateParticles();
            generateRays();

            // Fade in
            containerOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });

            // Play charging sound
            playSound(require('@/assets/sounds/battery/scifi-charging.mp3'));

            // Glow pulse
            setTimeout(() => {
                glowIntensity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: GLOW_PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0.5, { duration: GLOW_PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
            }, 200);

            // Animate battery fill and coin counter
            setTimeout(() => {
                batteryProgress.value = withTiming(newBattery, {
                    duration: BATTERY_FILL_DURATION,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                });
                animateBatteryCounter();

                // Coin pop-in
                coinScale.value = withSpring(1, { damping: 8, stiffness: 150 });
                animateCoinCounter();

                // Coin bounce
                coinBounce.value = withRepeat(
                    withSequence(
                        withTiming(1.1, { duration: 300 }),
                        withTiming(1, { duration: 300 })
                    ),
                    3,
                    true
                );
            }, 400);

            // Scale pulse
            containerScale.value = withSequence(
                withDelay(1500, withSpring(1.05, { damping: 8 })),
                withSpring(1, { damping: 10 })
            );

            // Celebration phase
            setTimeout(() => {
                runOnJS(setShowCelebration)(true);
                runOnJS(generateSparkles)();
                runOnJS(playSound)(require('@/assets/sounds/success-sound.mp3'));

                celebrationScale.value = withSpring(1, { damping: 10, stiffness: 150 });

                raysRotation.value = withRepeat(
                    withTiming(360, {
                        duration: RAYS_ROTATION_DURATION,
                        easing: Easing.linear,
                    }),
                    -1,
                    false
                );
            }, CELEBRATION_START_DELAY);

            // Fade out
            setTimeout(() => {
                glowIntensity.value = withTiming(0, { duration: 400 });
                celebrationScale.value = withTiming(0, { duration: 400 });
                containerOpacity.value = withTiming(0, { duration: FADE_OUT_DURATION });
                if (onComplete) {
                    setTimeout(() => runOnJS(onComplete)(), FADE_OUT_DURATION);
                }
            }, TOTAL_ANIMATION_DURATION);
        }
    }, [visible, previousBattery, newBattery, coinsAwarded]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        transform: [{ scale: containerScale.value }],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: glowIntensity.value * 0.5,
        transform: [{ scale: 1 + glowIntensity.value * 0.08 }],
    }));

    const fillAnimatedStyle = useAnimatedStyle(() => {
        const height = Math.max(5, Math.min(batteryProgress.value, 100));
        return { height: `${height}%` };
    });

    const celebrationAnimatedStyle = useAnimatedStyle(() => ({
        opacity: celebrationScale.value,
        transform: [{ scale: celebrationScale.value }],
    }));

    const raysAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${raysRotation.value}deg` }],
    }));

    const coinAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: coinScale.value * coinBounce.value }],
    }));

    const backgroundAnimatedStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const currentColor = getBatteryColor(displayBattery);
    const [gradientStart, gradientEnd] = getBatteryGradient(displayBattery);

    const getLabelIcon = () => {
        const iconProps = { size: 36, color: 'rgba(255, 255, 255, 0.9)' };
        switch (label.toLowerCase()) {
            case 'sleep': return <MaterialCommunityIcons name="sleep" {...iconProps} />;
            case 'nutrition': return <Ionicons name="nutrition-outline" {...iconProps} />;
            case 'activity': return <Feather name="activity" {...iconProps} />;
            case 'health': return <MaterialIcons name="health-and-safety" {...iconProps} />;
            default: return <SimpleLineIcons name="energy" {...iconProps} />;
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 0 }, backgroundAnimatedStyle]} />

                {/* Rays */}
                {showCelebration && (
                    <Animated.View style={[styles.raysContainer, raysAnimatedStyle, { zIndex: 1 }]}>
                        {rays.map((ray) => (
                            <Ray key={ray.id} angle={ray.angle} delay={ray.delay} color={COIN_COLOR} />
                        ))}
                    </Animated.View>
                )}

                {/* Particles */}
                {particles.map((particle) => (
                    <EnergyParticle
                        key={particle.id}
                        x={particle.x}
                        y={particle.y}
                        delay={particle.delay}
                        size={particle.size}
                        color={particle.id < PARTICLE_COUNT / 2 ? currentColor : COIN_COLOR}
                        targetX={particle.targetX}
                    />
                ))}

                {/* Main Content */}
                <Animated.View style={[styles.mainContainer, containerAnimatedStyle, { zIndex: 10 }]}>
                    {/* Glow */}
                    <Animated.View style={[styles.glowEffect, glowAnimatedStyle, { backgroundColor: currentColor + '60' }]} />

                    {/* Header Label */}
                    <View style={styles.headerLabel}>
                        {getLabelIcon()}
                        <Text style={[styles.headerText, { fontFamily: theme.fonts.heading }]}>{label.toUpperCase()}</Text>
                    </View>

                    {/* Two-Column Layout */}
                    <View style={styles.columnsContainer}>
                        {/* Battery Column */}
                        <View style={styles.column}>
                            <View style={[styles.batteryNub, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
                            <View style={[styles.batteryBody, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                                <Animated.View style={[styles.batteryFillContainer, fillAnimatedStyle]}>
                                    <LinearGradient colors={[gradientStart, gradientEnd]} style={styles.batteryFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                                    <View style={styles.energyIconContainer}>
                                        <SimpleLineIcons name="energy" size={20} color="rgba(255,255,255,0.4)" />
                                    </View>
                                </Animated.View>
                                <View style={styles.shineEffect} />
                            </View>
                            <Text style={[styles.batteryValue, { color: currentColor, fontFamily: theme.fonts.heading }]}>{displayBattery}%</Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Coins Column */}
                        <Animated.View style={[styles.column, coinAnimatedStyle]}>
                            <View style={styles.coinIconWrapper}>
                                <LinearGradient colors={COIN_GRADIENT} style={styles.coinIcon}>
                                    <FontAwesome5 name="coins" size={32} color="#FFFFFF" />
                                </LinearGradient>
                            </View>
                            <Text style={[styles.coinAwardedText, { fontFamily: theme.fonts.heading }]}>+{displayCoins}</Text>
                            <Text style={[styles.coinTotalLabel, { fontFamily: theme.fonts.body }]}>Total Coins</Text>
                            <Text style={[styles.coinTotalValue, { fontFamily: theme.fonts.heading }]}>{totalCoins.toLocaleString()}</Text>
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Sparkles */}
                {showCelebration && (
                    <Animated.View style={[{ position: 'absolute', width: 400, height: 400, justifyContent: 'center', alignItems: 'center', zIndex: 20 }, celebrationAnimatedStyle]}>
                        {sparkles.map((sparkle) => (
                            <Sparkle key={sparkle.id} x={sparkle.x} y={sparkle.y} delay={sparkle.delay} size={sparkle.size} color={COIN_COLOR} />
                        ))}
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
};

// Energy Particle Component
const EnergyParticle: React.FC<{ x: number; y: number; delay: number; size: number; color: string; targetX: number }> = ({ x, y, delay, size, color, targetX }) => {
    const translateY = useSharedValue(y);
    const translateX = useSharedValue(x);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
        scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
        const targetY = SCREEN_HEIGHT / 2;
        translateX.value = withDelay(delay, withTiming(targetX, { duration: PARTICLE_DURATION, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
        translateY.value = withDelay(delay, withTiming(targetY, { duration: PARTICLE_DURATION, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
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
        zIndex: 5,
    }));

    return <Animated.View style={[particleStyle, { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 }]} />;
};

// Sparkle Component
const Sparkle: React.FC<{ x: number; y: number; delay: number; size: number; color: string }> = ({ x, y, delay, size, color }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 200 }));
        opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
        rotate.value = withDelay(delay, withTiming(180, { duration: 1000, easing: Easing.out(Easing.ease) }));
        opacity.value = withDelay(delay + 800, withTiming(0, { duration: 300 }));
    }, []);

    const sparkleStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    }));

    return (
        <Animated.View style={sparkleStyle}>
            <View style={[styles.sparkle, { backgroundColor: color }]} />
            <View style={[styles.sparkle, { backgroundColor: color, transform: [{ rotate: '90deg' }] }]} />
        </Animated.View>
    );
};

// Ray Component
const Ray: React.FC<{ angle: number; delay: number; color: string }> = ({ angle, delay, color }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
        opacity.value = withDelay(delay, withTiming(0.5, { duration: 300 }));
        opacity.value = withDelay(delay + 1200, withTiming(0, { duration: 400 }));
    }, []);

    const rayStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: 3,
        height: 120,
        backgroundColor: color,
        opacity: opacity.value,
        transform: [{ translateY: -60 }, { rotate: `${angle}deg` }, { scaleY: scale.value }],
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
        zIndex: 9999,
    },
    mainContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        borderRadius: 24,
        backgroundColor: 'rgba(30, 30, 40, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glowEffect: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_HEIGHT * 0.5,
        borderRadius: 100,
        zIndex: -1,
    },
    headerLabel: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
        gap: 6,
    },
    headerText: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 2,
    },
    columnsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    column: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    divider: {
        width: 1,
        height: 180,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    batteryNub: {
        width: 30,
        height: 10,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        marginBottom: 2,
    },
    batteryBody: {
        width: 80,
        height: 150,
        borderWidth: 3,
        borderRadius: 12,
        padding: 5,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    batteryFillContainer: {
        width: '100%',
        borderRadius: 8,
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
        left: 5,
        top: 5,
        width: '25%',
        height: '70%',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 8,
    },
    batteryValue: {
        fontSize: 24,
        marginTop: 10,
    },
    coinIconWrapper: {
        marginBottom: 10,
    },
    coinIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COIN_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
    },
    coinAwardedText: {
        fontSize: 32,
        color: COIN_COLOR,
        marginTop: 5,
    },
    coinTotalLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 10,
    },
    coinTotalValue: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
    },
    footerMessage: {
        marginTop: 24,
    },
    footerText: {
        fontSize: 18,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    raysContainer: {
        position: 'absolute',
        width: 280,
        height: 280,
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

export default GamificationReward;
