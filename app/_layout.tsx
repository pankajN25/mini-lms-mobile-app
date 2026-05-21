import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useNotifications } from '@/hooks/useNotifications';

function RootLayoutInner() {
  useNotifications();
  const scheme = useColorScheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="course/webview"
          options={{
            headerShown: true,
            title: 'Course Content',
            headerTintColor: '#6366f1',
            headerTitleStyle: { fontWeight: '700' },
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
