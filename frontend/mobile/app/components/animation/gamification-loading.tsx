import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useTheme } from "../../context/ThemeContext";

interface GamificationLoadingProps {
    visible: boolean;
    message?: string;
}

export default function GamificationLoading({ visible, message = "Calculating Points..." }: GamificationLoadingProps) {
    const { theme } = useTheme();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={styles.container}>
                <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.text, { color: theme.colors.text, fontFamily: theme.fonts.heading }]}>
                        {message}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 200,
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    }
});
