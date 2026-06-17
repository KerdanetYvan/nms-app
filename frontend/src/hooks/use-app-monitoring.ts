import { useEffect } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { startMonitoring, stopMonitoring } from "usage-stats";
import { api } from "@/src/api/client";
import { APP_PACKAGE_MAP, resolvePackageNames } from "@/src/utils/app-packages";

export function useAppMonitoring(isGranted: boolean, session: Session | null): void {
  useEffect(() => {
    if (Platform.OS !== "android" || !isGranted || !session) return;

    let active = true;

    api.getUserProfile().then((profile) => {
      if (!active) return;

      const monitoredLabels = profile?.apps ?? [];
      if (monitoredLabels.length === 0) return;

      const packageNames = resolvePackageNames(monitoredLabels);
      const labelNames = packageNames.map(
        (pkg) => Object.keys(APP_PACKAGE_MAP).find((k) => APP_PACKAGE_MAP[k] === pkg) ?? pkg
      );

      startMonitoring(packageNames, labelNames, 5);
    });

    return () => {
      active = false;
      stopMonitoring();
    };
  }, [isGranted, session]);
}
