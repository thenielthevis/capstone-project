import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BatteryAnimate from '../../components/animation/battery';
import { useTheme } from '../../context/ThemeContext';

export default function BatteryTestScreen() {
    const { theme } = useTheme();
    const [showAnimation, setShowAnimation] = useState(false);
    const [previousValue, setPreviousValue] = useState(20);
    const [newValue, setNewValue] = useState(75);
    const [label, setLabel] = useState('Activity');

    const triggerAnimation = () => {
        setShowAnimation(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Battery Animation Test
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

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                        Previous Value: {previousValue}%
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            borderColor: theme.colors.primary
                        }]}
                        value={previousValue.toString()}
                        onChangeText={(text) => setPreviousValue(Number(text) || 0)}
                        keyboardType="numeric"
                        placeholder="0-100"
                        placeholderTextColor={theme.colors.text + '77'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                        New Value: {newValue}%
                    </Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            borderColor: theme.colors.primary
                        }]}
                        value={newValue.toString()}
                        onChangeText={(text) => setNewValue(Number(text) || 0)}
                        keyboardType="numeric"
                        placeholder="0-100"
                        placeholderTextColor={theme.colors.text + '77'}
                    />
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
                            setPreviousValue(15);
                            setNewValue(45);
                            setLabel('Activity');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Activity: 15% → 45%</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousValue(30);
                            setNewValue(80);
                            setLabel('Nutrition');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Nutrition: 30% → 80%</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousValue(10);
                            setNewValue(95);
                            setLabel('Health');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Health: 10% → 95%</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => {
                            setPreviousValue(60);
                            setNewValue(25);
                            setLabel('Sleep');
                        }}
                    >
                        <Text style={{ color: theme.colors.text }}>Sleep: 60% → 25% (Down)</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <BatteryAnimate
                visible={showAnimation}
                previousValue={previousValue}
                newValue={newValue}
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
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    presets: {
        marginTop: 20,
    },
    presetsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    presetButton: {
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
});
