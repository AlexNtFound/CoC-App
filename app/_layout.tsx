// CoC-App/app/_layout.tsx - Fixed with role synchronization and debugging
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import InitialSetupScreen, { checkSetupComplete } from '../components/InitialSetupScreen';
import { FirebaseEventProvider } from '../contexts/FirebaseEventContext';
import { InviteCodeProvider } from '../contexts/InviteCodeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';
import { UserProvider } from '../contexts/UserContext';
import { UserRoleProvider } from '../contexts/UserRoleContext';
import { useRoleSync } from '../hooks/useRoleSync';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Component that handles role sync - must be inside all providers
function RoleSyncHandler() {
  const syncStatus = useRoleSync();
  
  // Log sync status in development
  useEffect(() => {
    if (__DEV__) {
      console.log('🔄 Role Sync Status:', syncStatus);
    }
  }, [syncStatus]);

  return null; // This component doesn't render anything
}

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
      {/* 🔥 CRITICAL: Role sync handler must be inside all providers */}
      <RoleSyncHandler />
      
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="profile-edit" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="create-event" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="user-management" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="invite-code-management" 
            options={{ 
              headerShown: false,
              presentation: 'modal'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>

      {/* 保持原有的初始设置界面 */}
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
          <InviteCodeProvider>
            <UserRoleProvider>
              <FirebaseEventProvider>
                <RootLayoutNav />
              </FirebaseEventProvider>
            </UserRoleProvider>
          </InviteCodeProvider>
        </UserProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}