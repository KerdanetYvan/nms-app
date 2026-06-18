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

export function startMonitoring(
  packageNames: string[],
  labelNames: string[],
  intervalSeconds: number = 5,
  isDev: boolean = false,
  targetDailyMinutes: number = 0
): void {
  if (!UsageStats) return;
  UsageStats.startMonitoring(packageNames, labelNames, intervalSeconds, isDev, targetDailyMinutes);
}

export function stopMonitoring(): void {
  if (!UsageStats) return;
  UsageStats.stopMonitoring();
}

export async function getForegroundApps(
  startTime: number,
  endTime: number
): Promise<string[]> {
  if (!UsageStats) return [];
  return UsageStats.getForegroundApps(startTime, endTime);
}

export type DailyUsageEntry = { dateMs: number; totalMs: number };

export async function getDailyUsage(
  packageNames: string[],
  startTime: number,
  endTime: number
): Promise<DailyUsageEntry[]> {
  if (!UsageStats) return [];
  return UsageStats.getDailyUsage(packageNames, startTime, endTime);
}

export function isBatteryOptimizationIgnored(): boolean {
  if (!UsageStats) return true;
  return UsageStats.isBatteryOptimizationIgnored();
}

export function requestIgnoreBatteryOptimization(): void {
  if (!UsageStats) return;
  UsageStats.requestIgnoreBatteryOptimization();
}
