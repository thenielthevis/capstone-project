import * as React from "react";
import { Stack, useRouter } from "expo-router";
import { Provider as PaperProvider } from "react-native-paper";
import { ThemeProvider } from "./context/ThemeContext"; // if you use a custom theme provider
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from './context/UserContext';
import { ProgramProvider } from './context/ProgramContext';
import { DailyLogProvider } from './context/DailyLogContext';
import { HealthCheckupProvider } from './context/HealthCheckupContext';
import { MoodCheckinProvider } from './context/MoodCheckinContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from './components/Toast/Toast';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initializeFeedbackNotifications } from './services/feedbackNotifications';
import { initializeNotificationRouter } from './services/notificationRouter';
import './globals.css';

// Keep the splash screen visible while fonts and app initialize
SplashScreen.preventAutoHideAsync();

// Inner component that initializes notification router (needs access to router context)
function NotificationRouterInitializer() {
  const router = useRouter();

  useEffect(() => {
    // Initialize notification router with the router instance
    const cleanup = initializeNotificationRouter(router);
    console.log('[App] Notification router initialized');
    
    return cleanup;
  }, [router]);

  return null;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_18pt-Bold.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  // Initialize feedback notifications on app startup
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initializeFeedbackNotifications();
        console.log('[App] Feedback notifications initialized');
      } catch (error) {
        console.error('[App] Failed to initialize notifications:', error);
      }
    };
    initNotifications();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <ThemeProvider>
              <UserProvider>
                <ProgramProvider>
                  <DailyLogProvider>
                    <HealthCheckupProvider>
                      <MoodCheckinProvider>
                        <FeedbackProvider>
                          <LeaderboardProvider>
                            <Stack
                              screenOptions={{
                                headerShown: false,
                              }}
                            />
                            <NotificationRouterInitializer />
                            <ToastProvider />
                          </LeaderboardProvider>
                        </FeedbackProvider>
                      </MoodCheckinProvider>
                    </HealthCheckupProvider>
                  </DailyLogProvider>
                </ProgramProvider>
              </UserProvider>
            </ThemeProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
