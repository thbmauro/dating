import { useCallback, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts, Inter_700Bold, Inter_500Medium } from '@expo-google-fonts/inter';
import AnimatedSplash from '@/components/AnimatedSplash';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="saved" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetCornerRadius: 24,
            headerShown: false,
            contentStyle: { backgroundColor: '#ECEAE7' },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ Inter_700Bold, Inter_500Medium });
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen once fonts are loaded,
      // our custom AnimatedSplash will be visible on top
      SplashScreen.hideAsync();
      // Give a tiny delay so the animated splash is visible before we mark ready
      const timer = setTimeout(() => setAppReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Don't render anything until fonts are loaded (native splash is still visible)
  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="dark" />
          <RootLayoutNav colorScheme={colorScheme} />
          {!splashDone && (
            <AnimatedSplash isReady={appReady} onFinish={handleSplashFinish} />
          )}
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
