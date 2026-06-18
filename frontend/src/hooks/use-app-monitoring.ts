import { useEffect } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { startMonitoring, stopMonitoring } from "usage-stats";
import { api } from "@/src/api/client";
import { APP_PACKAGE_MAP, resolvePackageNames } from "@/src/utils/app-packages";
import type { WeekCheckin } from "@/src/api/client";

function resolveTarget(checkins: WeekCheckin[]): number {
  if (checkins.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = checkins.find((c) => {
    const ws = new Date(c.week_start_date);
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);
    return today >= ws && today < we;
  });
  return current
    ? current.target_daily_minutes
    : checkins[checkins.length - 1].target_daily_minutes;
}

export function useAppMonitoring(isGranted: boolean, session: Session | null): void {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    if (!isGranted) {
      stopMonitoring();
      return;
    }

    if (!session) return;

    let active = true;

    Promise.all([api.getUserProfile(), api.getWeeklyCheckins()]).then(
      ([profile, checkins]) => {
        if (!active) return;

        const monitoredLabels = profile?.apps ?? [];
        if (monitoredLabels.length === 0) return;

        const packageNames = resolvePackageNames(monitoredLabels);
        const labelNames = packageNames.map(
          (pkg) => Object.keys(APP_PACKAGE_MAP).find((k) => APP_PACKAGE_MAP[k] === pkg) ?? pkg
        );
        const targetDailyMinutes = resolveTarget(checkins);

        startMonitoring(packageNames, labelNames, 5, __DEV__, targetDailyMinutes);
      }
    );

    return () => {
      active = false;
      // Le service reste actif en arrière-plan — stopMonitoring() n'est appelé que si la permission est révoquée
    };
  }, [isGranted, session]);
}
