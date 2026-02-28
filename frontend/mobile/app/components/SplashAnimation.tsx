import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
    runOnJS,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface SplashAnimationProps {
    onFinish?: () => void;
}

const LETTERS = ['L', 'I', 'F', 'O', 'R', 'A'];

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
    const { theme } = useTheme();
    const isDark = theme.mode === 'dark';

    // ── Master progress (0 → 1 over ~3.6s) ──
    const progress = useSharedValue(0);

    // ── Logo ──
    const logoScale = useSharedValue(0.4);
    const logoOpacity = useSharedValue(0);
    const logoRotate = useSharedValue(-15);

    // ── Glow rings ──
    const ring1Scale = useSharedValue(0.3);
    const ring1Opacity = useSharedValue(0);
    const ring2Scale = useSharedValue(0.3);
    const ring2Opacity = useSharedValue(0);
    const ring3Scale = useSharedValue(0.3);
    const ring3Opacity = useSharedValue(0);

    // ── Individual letter values ──
    const letterOpacities = LETTERS.map(() => useSharedValue(0));
    const letterTranslateYs = LETTERS.map(() => useSharedValue(24));
    const letterScales = LETTERS.map(() => useSharedValue(0.6));

    // ── Tagline ──
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(12);

    // ── Exit ──
    const exitOpacity = useSharedValue(1);
    const exitScale = useSharedValue(1);

    const soundRef = useRef<Audio.Sound | null>(null);

    // Gradually fade out the sound volume
    const fadeOutSound = async () => {
        try {
            const sound = soundRef.current;
            if (!sound) return;
            // Step volume down smoothly: 1.0 → 0.6 → 0.3 → 0.0
            await sound.setVolumeAsync(0.6);
            await new Promise(r => setTimeout(r, 200));
            await sound.setVolumeAsync(0.3);
            await new Promise(r => setTimeout(r, 200));
            await sound.setVolumeAsync(0.0);
            await new Promise(r => setTimeout(r, 200));
            await sound.stopAsync();
            await sound.unloadAsync();
            soundRef.current = null;
        } catch (error) {
            // Sound may already be unloaded
        }
    };

    useEffect(() => {
        // Play splash sound
        const playSound = async () => {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/success-sound.mp3')
                );
                soundRef.current = sound;
                await sound.playAsync();
            } catch (error) {
                console.error('Splash sound error:', error);
            }
        };
        playSound();

        // Cleanup sound on unmount (safety net)
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    useEffect(() => {
        // ── Phase 1: Logo entrance (0ms) ──
        logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        logoScale.value = withSequence(
            withTiming(1.08, { duration: 800, easing: Easing.out(Easing.exp) }),
            withSpring(1, { damping: 10, stiffness: 100 })
        );
        logoRotate.value = withSpring(0, { damping: 12, stiffness: 80 });

        // ── Phase 2: Expanding glow rings, staggered (300ms) ──
        ring1Opacity.value = withDelay(300, withTiming(0.25, { duration: 700 }));
        ring1Scale.value = withDelay(300, withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));

        ring2Opacity.value = withDelay(500, withTiming(0.15, { duration: 700 }));
        ring2Scale.value = withDelay(500, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));

        ring3Opacity.value = withDelay(700, withTiming(0.08, { duration: 700 }));
        ring3Scale.value = withDelay(700, withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }));

        // ── Phase 3: Letters cascade in one by one (900ms start) ──
        LETTERS.forEach((_, i) => {
            const delay = 900 + i * 100;
            letterOpacities[i].value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
            letterTranslateYs[i].value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
            letterScales[i].value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
        });

        // ── Phase 4: Tagline fades in (1800ms) ──
        taglineOpacity.value = withDelay(1800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
        taglineTranslateY.value = withDelay(1800, withSpring(0, { damping: 12, stiffness: 100 }));

        // ── Phase 5: Hold, then elegant exit with sound fade (3200ms) ──
        const EXIT_DELAY = 5200;
        const FADE_DURATION = 800;

        // Start fading audio at same time as visual exit
        setTimeout(() => {
            fadeOutSound();
        }, EXIT_DELAY);

        exitOpacity.value = withDelay(EXIT_DELAY, withTiming(0, { duration: FADE_DURATION, easing: Easing.in(Easing.cubic) }, (finished) => {
            if (finished && onFinish) runOnJS(onFinish)();
        }));
        exitScale.value = withDelay(EXIT_DELAY, withTiming(1.05, { duration: FADE_DURATION, easing: Easing.in(Easing.cubic) }));
    }, []);

    // ── Animated styles ──
    const containerStyle = useAnimatedStyle(() => ({
        opacity: exitOpacity.value,
        transform: [{ scale: exitScale.value }],
    }));

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    const makeRingStyle = (scale: Animated.SharedValue<number>, opacity: Animated.SharedValue<number>, size: number) =>
        useAnimatedStyle(() => ({
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
            width: size,
            height: size,
            borderRadius: size / 2,
        }));

    const ring1Style = makeRingStyle(ring1Scale, ring1Opacity, 200);
    const ring2Style = makeRingStyle(ring2Scale, ring2Opacity, 280);
    const ring3Style = makeRingStyle(ring3Scale, ring3Opacity, 360);

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineTranslateY.value }],
    }));

    const bgPrimary = theme.colors.primary;
    const bgSecondary = theme.colors.secondary;
    const bgColor = isDark ? '#0B0F1A' : '#FAFCFF';
    const textColor = isDark ? '#E8EDF5' : theme.colors.secondary;
    const taglineColor = isDark ? '#8899BB' : theme.colors.textSecondary;

    return (
        <Animated.View style={[styles.container, { backgroundColor: bgColor }, containerStyle]}>
            {/* ── Center content ── */}
            <View style={styles.centerContent}>
                {/* Rings + Logo share the same center */}
                <View style={styles.ringLogoContainer}>
                    {/* Expanding glow rings */}
                    <Animated.View style={[styles.ring, { borderColor: bgPrimary }, ring3Style]} />
                    <Animated.View style={[styles.ring, { borderColor: bgPrimary }, ring2Style]} />
                    <Animated.View style={[styles.ring, { borderColor: bgPrimary }, ring1Style]} />

                    {/* Logo centered inside rings */}
                    <Animated.View style={[styles.logoShadowWrap, logoStyle]}>
                        <View style={[styles.logoGlow, { backgroundColor: bgPrimary + '20' }]} />
                        <Animated.Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                {/* Letter-by-letter title */}
                <View style={styles.titleRow}>
                    {LETTERS.map((letter, i) => {
                        const aStyle = useAnimatedStyle(() => ({
                            opacity: letterOpacities[i].value,
                            transform: [
                                { translateY: letterTranslateYs[i].value },
                                { scale: letterScales[i].value },
                            ],
                        }));
                        return (
                            <Animated.Text
                                key={i}
                                style={[
                                    styles.titleLetter,
                                    { color: textColor, fontFamily: theme.fonts.heading || 'System' },
                                    aStyle,
                                ]}
                            >
                                {letter}
                            </Animated.Text>
                        );
                    })}
                </View>

                {/* Tagline */}
                <Animated.Text style={[
                    styles.tagline,
                    { color: taglineColor, fontFamily: theme.fonts.body || 'System' },
                    taglineStyle,
                ]}>
                    Your Health, Your Future
                </Animated.Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        elevation: 99999,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ── Rings + Logo wrapper ──
    ringLogoContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    // ── Rings ──
    ring: {
        position: 'absolute',
        borderWidth: 1.5,
    },
    // ── Logo ──
    logoShadowWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    logo: {
        width: 120,
        height: 120,
    },
    // ── Title ──
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    titleLetter: {
        fontSize: 40,
        fontWeight: '800',
        marginHorizontal: 3,
    },
    // ── Tagline ──
    tagline: {
        fontSize: 14,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
});
