import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GamificationReward from '../../components/animation/gamification-reward';
import { useTheme } from '../../context/ThemeContext';

export default function BatteryTestScreen() {
    const { theme } = useTheme();
    const [showAnimation, setShowAnimation] = useState(false);
    const [previousBattery, setPreviousBattery] = useState(20);
    const [newBattery, setNewBattery] = useState(75);
    const [coinsAwarded, setCoinsAwarded] = useState(50);
    const [totalCoins, setTotalCoins] = useState(1250);
    const [label, setLabel] = useState('Activity');

    const triggerAnimation = () => {
        setShowAnimation(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Gamification Animation Test
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Label:</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            borderColor: theme.colors.primary
                        }]}
                        value={label}
                        onChangeText={setLabel}
                        placeholder="e.g., Activity, Nutrition"
                        placeholderTextColor={theme.colors.text + '77'}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Prev Battery:</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.primary }]}
                            value={previousBattery.toString()}
                            onChangeText={(text) => setPreviousBattery(Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="0-100"
                            placeholderTextColor={theme.colors.text + '77'}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>New Battery:</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.primary }]}
                            value={newBattery.toString()}
                            onChangeText={(text) => setNewBattery(Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="0-100"
                            placeholderTextColor={theme.colors.text + '77'}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Coins Awarded:</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.primary }]}
                            value={coinsAwarded.toString()}
                            onChangeText={(text) => setCoinsAwarded(Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="e.g., 50"
                            placeholderTextColor={theme.colors.text + '77'}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Total Coins:</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.primary }]}
                            value={totalCoins.toString()}
                            onChangeText={(text) => setTotalCoins(Number(text) || 0)}
                            keyboardType="numeric"
                            placeholder="e.g., 1250"
                            placeholderTextColor={theme.colors.text + '77'}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={triggerAnimation}
                >
                    <Text style={styles.buttonText}>Test Animation</Text>
                </TouchableOpacity>

                <View style={styles.presets}>
                    <Text style={[styles.presetsTitle, { color: theme.colors.text }]}>
                        Quick Presets:
                    </Text>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousBattery(15);
                            setNewBattery(45);
                            setCoinsAwarded(50);
                            setTotalCoins(500);
                            setLabel('Activity');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Activity: 15% → 45% | +50 Coins</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousBattery(30);
                            setNewBattery(80);
                            setCoinsAwarded(45);
                            setTotalCoins(1000);
                            setLabel('Nutrition');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Nutrition: 30% → 80% | +45 Coins</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousBattery(10);
                            setNewBattery(95);
                            setCoinsAwarded(100);
                            setTotalCoins(2500);
                            setLabel('Health');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Health: 10% → 95% | +100 Coins</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousBattery(50);
                            setNewBattery(75);
                            setCoinsAwarded(20);
                            setTotalCoins(650);
                            setLabel('Sleep');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Sleep: 50% → 75% | +20 Coins</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <GamificationReward
                visible={showAnimation}
                previousBattery={previousBattery}
                newBattery={newBattery}
                coinsAwarded={coinsAwarded}
                totalCoins={totalCoins}
                label={label}
                onComplete={() => setShowAnimation(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 2,
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 24,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    presets: {
        marginTop: 10,
    },
    presetsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    presetButton: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        alignItems: 'center',
    },
});
