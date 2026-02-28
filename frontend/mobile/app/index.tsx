import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import GuestScreen from './screens/auth/guest';
import { tokenStorage } from '../utils/tokenStorage';
import SplashAnimation from './components/SplashAnimation';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

  // Store navigation intent so we can navigate after splash finishes
  const [navTarget, setNavTarget] = useState<string | null>(null);

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (token) {
          setIsAuthenticated(true);
          const storedUser = await tokenStorage.getUser();
          if (storedUser && storedUser.hasCompletedAssessment === false) {
            setNavTarget('assessment');
          } else {
            setNavTarget('home');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    // Navigate after splash animation completes
    if (navTarget === 'assessment') {
      router.replace('/screens/analysis_input/prediction_input' as any);
    } else if (navTarget === 'home') {
      router.replace('../(tabs)/Home');
    }
  };

  // Show nothing until auth check and fonts are ready
  if (!authReady) return null;

  // Show custom splash animation overlay
  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        {/* Render the underlying screen behind the splash */}
        {isAuthenticated === false && <GuestScreen />}
        <SplashAnimation onFinish={handleSplashFinish} />
      </View>
    );
  }

  return !isAuthenticated ? <GuestScreen /> : null;
}
