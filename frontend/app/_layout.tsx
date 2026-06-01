import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Platform } from "react-native";
import { useEffect, useRef } from "react";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { requestLocationPermission } from "@/src/utils/permissions";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      if (Platform.OS !== "web") requestLocationPermission();
    }
  }, [loaded, error]);

  // Tapping the "20 min" reminder opens the app on the Home screen.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const goHome = () => router.replace("/");

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !handled.current) {
        handled.current = true;
        goHome();
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      goHome();
    });
    return () => sub.remove();
  }, [router]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  return (
    <KeyboardProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </KeyboardProvider>
  );
}
