import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

// ── Localisation ──────────────────────────────────────────────────────────────

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function getLocationPermissionState(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === "web") return { granted: false, canAskAgain: false };
  const { granted, canAskAgain } = await Location.getForegroundPermissionsAsync();
  return { granted, canAskAgain };
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  if (Platform.OS === "web") return null;
  const { granted } = await Location.getForegroundPermissionsAsync();
  if (!granted) return null;
  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
}

// ── Usage Access (temps d'écran / TikTok) ────────────────────────────────────
// PACKAGE_USAGE_STATS est une permission "spéciale" Android : impossible de
// l'accorder via popup. L'utilisateur doit l'activer manuellement dans les
// paramètres système. Cette fonction ouvre directement la bonne page.

export function openUsageAccessSettings(): void {
  if (Platform.OS !== "android") return;
  IntentLauncher.startActivityAsync("android.settings.USAGE_ACCESS_SETTINGS").catch(() => {
    // Fallback : ouvre les paramètres généraux si l'intent échoue
    IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS);
  });
}
