import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CheckInProvider } from "@/contexts/CheckInContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { initDatabase } from "@/utils/database";
import { isOnboardingComplete } from "@/utils/onboardingStorage";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setOnboardingComplete(complete);
    });
  }, [pathname]);

  useEffect(() => {
    if (fontsLoaded) {
      initDatabase().catch(err => console.error('[DB] Init error:', err));
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (onboardingComplete === null || !fontsLoaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: '#4A90D9',
      background: '#F0F6FF',
      card: '#FFFFFF',
      text: '#1A2B4A',
      border: 'rgba(74, 144, 217, 0.10)',
      notification: '#E05C5C',
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: '#5BA3E8',
      background: '#0D1520',
      card: '#162030',
      text: '#E8F0FA',
      border: 'rgba(91, 163, 232, 0.12)',
      notification: '#E05C5C',
    },
  };

  return (
    <SubscriptionProvider>
      <DevErrorBoundary>
        <StatusBar style="auto" animated />
        <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}>
          <SafeAreaProvider>
            <CheckInProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                {onboardingComplete === false && pathname !== "/auth" && pathname !== "/paywall" && pathname !== "/auth-popup" && pathname !== "/auth-callback" && <Redirect href="/onboarding" />}

                <Stack>
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="paywall" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="checkin" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="report" options={{ headerShown: false }} />
                  <Stack.Screen name="insights" options={{ headerShown: false }} />
                </Stack>
                <SystemBars style="auto" />
              </GestureHandlerRootView>
            </CheckInProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </DevErrorBoundary>
    </SubscriptionProvider>
  );
}
