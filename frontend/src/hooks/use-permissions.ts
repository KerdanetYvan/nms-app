import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  getLocationPermissionState,
  requestLocationPermission,
  openUsageAccessSettings,
} from "@/src/utils/permissions";

type PermState = { granted: boolean; canAskAgain: boolean };

export function usePermissions() {
  const [location, setLocation] = useState<PermState>({ granted: false, canAskAgain: true });

  const refreshLocation = useCallback(async () => {
    if (Platform.OS === "web") return;
    const state = await getLocationPermissionState();
    setLocation(state);
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const askLocation = useCallback(async (): Promise<boolean> => {
    const granted = await requestLocationPermission();
    await refreshLocation();
    return granted;
  }, [refreshLocation]);

  return {
    location,
    askLocation,
    openUsageAccessSettings,
    refreshLocation,
  };
}
