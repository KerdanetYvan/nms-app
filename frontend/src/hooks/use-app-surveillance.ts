import { useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkPermission, openPermissionSettings } from "usage-stats";

const PROMPTED_KEY = "doo-usage-perm-prompted";

export type AppSurveillanceHook = {
  isGranted: boolean;
  hasBeenPrompted: boolean | null;
  refresh: () => void;
  markPrompted: () => Promise<void>;
  openSettings: () => void;
};

export function useAppSurveillance(): AppSurveillanceHook {
  const [isGranted, setIsGranted] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") {
      setHasBeenPrompted(true);
      return;
    }
    setIsGranted(checkPermission());
    AsyncStorage.getItem(PROMPTED_KEY).then((v) => {
      setHasBeenPrompted(v === "true");
    });
  }, []);

  const refresh = () => {
    if (Platform.OS !== "android") return;
    setIsGranted(checkPermission());
  };

  const markPrompted = async () => {
    await AsyncStorage.setItem(PROMPTED_KEY, "true");
    setHasBeenPrompted(true);
  };

  const openSettings = () => {
    if (Platform.OS !== "android") return;
    openPermissionSettings();
  };

  return { isGranted, hasBeenPrompted, refresh, markPrompted, openSettings };
}
