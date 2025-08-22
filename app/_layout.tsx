// CoC-App/app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import InitialSetupScreen, { checkSetupComplete } from '../components/InitialSetupScreen';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';
import { UserProvider } from '../contexts/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark } = useTheme();
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check if initial setup is complete
  useEffect(() => {
    const checkInitialSetup = async () => {
      try {
        const setupComplete = await checkSetupComplete();
        setShowInitialSetup(!setupComplete);
      } catch (error) {
        console.error('Error checking initial setup:', error);
        // If there's an error, assume setup is not complete
        setShowInitialSetup(true);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkInitialSetup();
  }, []);

  const handleSetupComplete = () => {
    setShowInitialSetup(false);
  };

  // Don't render anything while checking setup status
  if (isCheckingSetup) {
    return null;
  }

  return (
    <>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: false,
              presentation: 'modal' // 可选：使Profile以模态方式显示
            }} 
          />
          <Stack.Screen 
            name="profile-edit" 
            options={{ 
              headerShown: false,
              presentation: 'modal' // Profile Edit也以模态方式显示
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>

      {/* Initial Setup Modal */}
      <InitialSetupScreen 
        visible={showInitialSetup}
        onComplete={handleSetupComplete}
      />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <RootLayoutNav />
        </UserProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}