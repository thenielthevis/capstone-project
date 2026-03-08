import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
    visible: boolean;
    onAccept: () => void;
};

export default function PermissionModal({ visible, onAccept }: Props) {
    const { theme } = useTheme();
    const [agreed, setAgreed] = useState(false);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["92%"], []);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.expand();
        } else {
            bottomSheetRef.current?.close();
        }
    }, [visible]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior="none"
                opacity={0.5}
            />
        ),
        []
    );

    if (!visible) return null;

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            enableHandlePanningGesture={false}
            handleIndicatorStyle={{ backgroundColor: theme.colors.text + "30", width: 40 }}
            backgroundStyle={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}
            backdropComponent={renderBackdrop}
        >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 16, paddingHorizontal: 20 }}>
                <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: theme.colors.primary + "18",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                    }}
                >
                    <Ionicons name="shield-checkmark" size={28} color={theme.colors.primary} />
                </View>
                <Text
                    style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: theme.fontSizes.lg,
                        color: theme.colors.text,
                        fontWeight: "bold",
                        textAlign: "center",
                    }}
                >
                    Terms &amp; Privacy
                </Text>
                <Text
                    style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.m - 1,
                        color: theme.colors.text + "88",
                        textAlign: "center",
                        marginTop: 4,
                    }}
                >
                    Please review before proceeding
                </Text>
            </View>

            {/* Scrollable Content */}
            <BottomSheetScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 16 }}
            >
                {/* Terms & Conditions Summary */}
                <SectionCard
                    theme={theme}
                    icon="document-text"
                    iconColor="#3b82f6"
                    title="Terms and Conditions"
                >
                    <BulletPoint theme={theme} bold="Health Disclaimer:">
                        Lyniva is designed for wellness tracking only. It is not intended to diagnose, treat, cure, or prevent any disease. AI-powered insights are for informational purposes only — always consult a qualified health professional.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Your Account:">
                        You are responsible for maintaining accurate account information and safeguarding your credentials. We may terminate accounts that violate our terms.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Your Content:">
                        You retain ownership of content you submit (photos, logs, comments). By posting, you grant Lyniva a non-exclusive license to use it in connection with the service.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Acceptable Use:">
                        You agree not to use the service for unlawful purposes, upload malicious code, or attempt unauthorized access.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Liability:">
                        Lyniva is provided "as is." We are not liable for indirect or consequential damages arising from your use of the service.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Changes:">
                        We may update these terms with 30 days notice. Continued use constitutes acceptance.
                    </BulletPoint>
                </SectionCard>

                {/* Privacy Policy Summary */}
                <SectionCard
                    theme={theme}
                    icon="lock-closed"
                    iconColor="#10b981"
                    title="Privacy Policy"
                >
                    <BulletPoint theme={theme} bold="Data We Collect:">
                        Personal info (name, email), physical metrics (age, height, weight, BMI, waist), lifestyle data (activity, sleep, diet, allergies), and health profile (conditions, family history, medications, blood type).
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="How We Use It:">
                        To generate personalized health predictions, calculate calorie goals, track fitness progress, power the gamified wellness system, and improve our ML models.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Data Security:">
                        We implement administrative, technical, and physical safeguards to protect your health data. No system is 100% secure — we encourage strong passwords.
                    </BulletPoint>
                    <BulletPoint theme={theme} bold="Your Rights:">
                        You may delete your account and data through the app settings at any time.
                    </BulletPoint>
                </SectionCard>

                <View style={{ height: 8 }} />
            </BottomSheetScrollView>

            {/* Fixed Footer: Checkbox + Button */}
            <View style={{
                paddingHorizontal: 20,
                paddingBottom: insets.bottom + 16,
                paddingTop: 8,
                backgroundColor: theme.colors.surface,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.text + "15",
            }}>
                {/* Checkbox */}
                <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.7}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 16,
                        paddingVertical: 4,
                    }}
                >
                    <View
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            borderWidth: 2,
                            borderColor: agreed ? theme.colors.primary : theme.colors.text + "44",
                            backgroundColor: agreed ? theme.colors.primary : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        {agreed && <Ionicons name="checkmark" size={16} color={theme.colors.background} />}
                    </View>
                    <Text
                        style={{
                            flex: 1,
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.m - 1,
                            color: theme.colors.text,
                            lineHeight: 20,
                        }}
                    >
                        I have read and agree to the{" "}
                        <Text style={{ fontWeight: "bold", color: theme.colors.primary }}>
                            Terms and Conditions
                        </Text>{" "}
                        and{" "}
                        <Text style={{ fontWeight: "bold", color: theme.colors.primary }}>
                            Privacy Policy
                        </Text>
                    </Text>
                </TouchableOpacity>

                {/* Accept Button */}
                <TouchableOpacity
                    onPress={onAccept}
                    disabled={!agreed}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: agreed ? theme.colors.primary : theme.colors.text + "22",
                        borderRadius: 14,
                        paddingVertical: 16,
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            fontFamily: theme.fonts.heading,
                            fontSize: theme.fontSizes.m,
                            color: agreed ? "#FFFFFF" : theme.colors.text + "55",
                            fontWeight: "600",
                        }}
                    >
                        Accept &amp; Continue
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
}

/* ── Helper Components ── */

function SectionCard({
    theme,
    icon,
    iconColor,
    title,
    children,
}: {
    theme: any;
    icon: string;
    iconColor: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View
            style={{
                backgroundColor: theme.colors.background,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: iconColor + "18",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                    }}
                >
                    <Ionicons name={icon as any} size={18} color={iconColor} />
                </View>
                <Text
                    style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: theme.fontSizes.m,
                        color: theme.colors.text,
                        fontWeight: "bold",
                    }}
                >
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
}

function BulletPoint({
    theme,
    bold,
    children,
}: {
    theme: any;
    bold: string;
    children: React.ReactNode;
}) {
    return (
        <View style={{ flexDirection: "row", marginBottom: 10, paddingRight: 4 }}>
            <Text
                style={{
                    color: theme.colors.primary,
                    fontSize: 8,
                    lineHeight: 20,
                    marginRight: 8,
                }}
            >
                ●
            </Text>
            <Text
                style={{
                    flex: 1,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m - 1,
                    color: theme.colors.text + "CC",
                    lineHeight: 20,
                }}
            >
                <Text style={{ fontWeight: "bold", color: theme.colors.text }}>{bold} </Text>
                {children}
            </Text>
        </View>
    );
}
