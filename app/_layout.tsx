/**
 * Root layout — fonts, providers, global toast host and the root Stack.
 */
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import '../global.css';
import { hydrateApp } from '@/src/store';
import { ToastHost } from '@/src/components/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [stateHydrated, setStateHydrated] = useState(false);

  useEffect(() => {
    hydrateApp()
      .catch(() => {})
      .finally(() => setStateHydrated(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && stateHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, stateHydrated]);

  if (!fontsLoaded || !stateHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F1F5F9' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="upload/index"
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
          <Stack.Screen
            name="processing"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="analysis/[id]"
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="wallet/transactions" />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
