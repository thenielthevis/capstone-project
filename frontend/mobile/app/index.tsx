import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import GuestScreen from './screens/auth/guest';
import { tokenStorage } from '../utils/tokenStorage';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (token) {
          setIsAuthenticated(true);
          router.replace('../(tabs)/Home');
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (isAuthenticated === null) return null;

  return !isAuthenticated ? <GuestScreen /> : null;
}