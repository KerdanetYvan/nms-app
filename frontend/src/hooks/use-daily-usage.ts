import { useCallback, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { checkPermission, getAppsUsage } from "usage-stats";
import { api } from "@/src/api/client";
import { APP_PACKAGE_MAP, resolvePackageNames } from "@/src/utils/app-packages";
import type { AppUsage } from "@/src/components/top-apps-card";

type DailyUsageReady = {
  hasPermission: true;
  isLoading: boolean;
  totalMinutes: number;
  savedMinutes: number;
  targetMinutes: number;
  perApp: AppUsage[];
};

export type DailyUsageResult = { hasPermission: false } | DailyUsageReady;

function todayMidnightMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function resolveTarget(checkins: Awaited<ReturnType<typeof api.getWeeklyCheckins>>): number {
  if (checkins.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = checkins.find((c) => {
    const weekStart = new Date(c.week_start_date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return today >= weekStart && today < weekEnd;
  });

  if (current) return current.target_daily_minutes;

  // Programme terminé : on conserve l'objectif de la dernière semaine
  return checkins[checkins.length - 1].target_daily_minutes;
}

export function useDailyUsage(): DailyUsageResult {
  const [hasPermission, setHasPermission] = useState(
    Platform.OS === "android" ? checkPermission() : false
  );
  const [isLoading, setIsLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [savedMinutes, setSavedMinutes] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(0);
  const [perApp, setPerApp] = useState<AppUsage[]>([]);

  const refresh = useCallback(async () => {
    if (Platform.OS !== "android") return;

    const granted = checkPermission();
    setHasPermission(granted);
    if (!granted) return;

    setIsLoading(true);
    try {
      const [profile, checkins] = await Promise.all([
        api.getUserProfile(),
        api.getWeeklyCheckins(),
      ]);

      if (!profile?.apps?.length) {
        setIsLoading(false);
        return;
      }

      const target = resolveTarget(checkins);
      const packageNames = resolvePackageNames(profile.apps);
      const usageMs = await getAppsUsage(packageNames, todayMidnightMs(), Date.now());

      const pkgToLabel = Object.fromEntries(
        Object.entries(APP_PACKAGE_MAP).map(([label, pkg]) => [pkg, label])
      );

      const apps: AppUsage[] = packageNames
        .map((pkg) => ({
          name: pkgToLabel[pkg] ?? pkg,
          minutes: Math.round((usageMs[pkg] ?? 0) / 60_000),
        }))
        .filter((a) => a.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes);

      const total = apps.reduce((sum, a) => sum + a.minutes, 0);
      const saved = Math.max(0, (profile.screen_time_min ?? 0) - total);

      setTotalMinutes(total);
      setSavedMinutes(saved);
      setTargetMinutes(target);
      setPerApp(apps);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  if (!hasPermission) return { hasPermission: false };

  return { hasPermission: true, isLoading, totalMinutes, savedMinutes, targetMinutes, perApp };
}
