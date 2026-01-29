import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { fontFamilies, fontSizes } from '@/design/tokens';

export interface QuickUpdateCardProps {
    title: string;
    icon: string;
    iconColor?: string;
    placeholder?: string;
    unit?: string;
    keyboardType?: 'numeric' | 'default';
    currentValue?: string | number;
    onUpdate: (value: string) => Promise<void>;
    successMessage?: string;
}

/**
 * Reusable card for quick metric updates
 */
export const QuickUpdateCard: React.FC<QuickUpdateCardProps> = ({
    title,
    icon,
    iconColor,
    placeholder = 'Enter value',
    unit,
    keyboardType = 'numeric',
    currentValue,
    onUpdate,
    successMessage = 'Updated!'
}) => {
    const { theme } = useTheme();

    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = async () => {
        if (!value.trim()) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await onUpdate(value);
            setSuccess(true);
            setValue('');

            // Reset success state after 2 seconds
            setTimeout(() => setSuccess(false), 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${iconColor || theme.colors.primary}20` }]}>
                    <MaterialCommunityIcons
                        name={icon as any}
                        size={24}
                        color={iconColor || theme.colors.primary}
                    />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
                    {currentValue !== undefined && (
                        <Text style={[styles.currentValue, { color: theme.colors.textSecondary }]}>
                            Current: {currentValue}{unit ? ` ${unit}` : ''}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={value}
                        onChangeText={setValue}
                        keyboardType={keyboardType}
                        editable={!loading}
                    />
                    {unit && (
                        <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}>{unit}</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.updateButton,
                        { backgroundColor: success ? '#4CAF50' : theme.colors.primary },
                        (!value.trim() || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleUpdate}
                    disabled={!value.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : success ? (
                        <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    ) : (
                        <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                </Text>
            )}

            {success && (
                <Text style={[styles.successText, { color: '#4CAF50' }]}>
                    {successMessage}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsBold,
    },
    currentValue: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: fontSizes.m,
        fontFamily: fontFamilies.poppinsRegular,
    },
    unitText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
    },
    updateButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    errorText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 8,
    },
    successText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.poppinsRegular,
        marginTop: 8,
    },
});

export default QuickUpdateCard;
