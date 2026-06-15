import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

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
