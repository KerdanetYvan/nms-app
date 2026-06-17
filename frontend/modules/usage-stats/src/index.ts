import { requireOptionalNativeModule } from "expo-modules-core";

const UsageStats = requireOptionalNativeModule("UsageStats");

export type AppUsageEntry = {
  packageName: string;
  totalTime: number;
};

export function checkPermission(): boolean {
  if (!UsageStats) return false;
  return UsageStats.checkPermission();
}

export function openPermissionSettings(): void {
  if (!UsageStats) return;
  UsageStats.openPermissionSettings();
}

export async function getAppUsage(
  packageName: string,
  startTime: number,
  endTime: number
): Promise<number> {
  if (!UsageStats) return 0;
  return UsageStats.getAppUsage(packageName, startTime, endTime);
}

export async function getAppsUsage(
  packageNames: string[],
  startTime: number,
  endTime: number
): Promise<Record<string, number>> {
  if (!UsageStats) return {};
  return UsageStats.getAppsUsage(packageNames, startTime, endTime);
}

export async function getAllAppsUsage(
  startTime: number,
  endTime: number
): Promise<AppUsageEntry[]> {
  if (!UsageStats) return [];
  return UsageStats.getAllAppsUsage(startTime, endTime);
}
