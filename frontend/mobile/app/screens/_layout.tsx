import { Stack } from "expo-router";
import { ActivityMetricsProvider } from "../context/ActivityMetricsContext";

export default function ScreensLayout() {
    return (
        <ActivityMetricsProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </ActivityMetricsProvider>
    );
}
