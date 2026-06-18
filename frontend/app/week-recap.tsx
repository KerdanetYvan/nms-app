import { ComponentProps, useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DooLogo } from "@/src/components/doo-logo";
import { BottomNav } from "@/src/components/bottom-nav";
import { api } from "@/src/api/client";
import { checkPermission, getAppsUsage, getDailyUsage } from "usage-stats";
import { APP_PACKAGE_MAP, resolvePackageNames } from "@/src/utils/app-packages";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { AppUsage } from "@/src/components/top-apps-card";
import type { WeekCheckin } from "@/src/api/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_FULL = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEK_DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const CHART_HEIGHT = 140;
const Y_AXIS_WIDTH = 28;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysElapsed(weekStart: Date): number {
  const days = Math.floor((Date.now() - weekStart.getTime()) / 86_400_000) + 1;
  return Math.min(days, 7);
}

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

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

type Achievement = { text: string; icon: ComponentProps<typeof Ionicons>["name"] };

function getAchievement(avg: number, target: number): Achievement | null {
  if (target === 0) return null;
  if (avg < target) return { text: "Objectif respecté", icon: "happy-outline" };
  if (avg === target) return { text: "Objectif atteint", icon: "thumbs-up-outline" };
  return { text: "Objectif dépassé", icon: "sad-outline" };
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

type DayBar = { label: string; minutes: number; hasData: boolean; isToday: boolean };

function BarChart({ bars }: { bars: DayBar[] }) {
  const maxMinutes = Math.max(...bars.map((b) => b.minutes), 60);
  const maxHours = Math.ceil(maxMinutes / 60);
  const ticks = Array.from({ length: maxHours }, (_, i) => i + 1);

  return (
    <View>
      <View style={{ flexDirection: "row", height: CHART_HEIGHT }}>
        {/* Y-axis labels */}
        <View style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}>
          {[...ticks].reverse().map((h) => (
            <Text
              key={h}
              style={[
                styles.chart_y_label,
                {
                  position: "absolute",
                  top: ((maxHours - h) / maxHours) * CHART_HEIGHT - 6,
                },
              ]}
            >
              {h}H
            </Text>
          ))}
        </View>

        {/* Bars + grid lines */}
        <View style={{ flex: 1, height: CHART_HEIGHT }}>
          {/* Grid lines */}
          {ticks.map((h) => (
            <View
              key={h}
              style={[
                styles.chart_grid_line,
                { top: ((maxHours - h) / maxHours) * CHART_HEIGHT },
              ]}
            />
          ))}

          {/* Bars */}
          <View style={styles.chart_bars_row}>
            {bars.map((bar, i) => {
              const barHeight = bar.hasData
                ? Math.max((bar.minutes / (maxHours * 60)) * CHART_HEIGHT, 3)
                : 4;
              return (
                <View key={i} style={styles.chart_bar_col}>
                  <View
                    style={[
                      styles.chart_bar,
                      {
                        height: barHeight,
                        backgroundColor: bar.isToday
                          ? colors.secondary
                          : bar.hasData
                          ? colors.primary
                          : "rgba(118,102,117,0.18)",
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.chart_x_row}>
        <View style={{ width: Y_AXIS_WIDTH }} />
        {bars.map((bar, i) => (
          <View key={i} style={styles.chart_x_item}>
            <Text
              style={[
                styles.chart_x_label,
                bar.isToday && styles.chart_x_label_today,
              ]}
            >
              {bar.isToday ? "Auj." : bar.label}
            </Text>
            {bar.isToday && <View style={styles.chart_today_dot} />}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type WeekData = {
  avgMinutes: number;
  targetMinutes: number;
  bars: DayBar[];
  deltaMinutes: number | null;
  apps: AppUsage[];
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WeekRecapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [hasPermission, setHasPermission] = useState(
    Platform.OS === "android" ? checkPermission() : false
  );

  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const load = useCallback(async () => {
    if (Platform.OS !== "android") return;
    const granted = checkPermission();
    setHasPermission(granted);
    if (!granted) return;

    try {
      const [profile, checkins] = await Promise.all([
        api.getUserProfile(),
        api.getWeeklyCheckins(),
      ]);

      if (!profile?.apps?.length) return;

      const packageNames = resolvePackageNames(profile.apps);
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // INTERVAL_DAILY ne retourne pas le jour en cours — on le fetch séparément
      // weekAppsUsageMs : totaux par app sur toute la semaine (pour le classement)
      const [dailyData, todayUsageMs, weekAppsUsageMs] = await Promise.all([
        getDailyUsage(packageNames, lastWeekStart.getTime(), Date.now()),
        getAppsUsage(packageNames, todayStart.getTime(), Date.now()),
        getAppsUsage(packageNames, weekStart.getTime(), Date.now()),
      ]);
      const todayMinutes = Math.round(
        Object.values(todayUsageMs).reduce((s, v) => s + v, 0) / 60_000
      );

      // Build 7 day bars for current week
      const now = Date.now();
      const bars: DayBar[] = WEEK_DAY_LABELS.map((label, i) => {
        const dayStart = weekStart.getTime() + i * 86_400_000;
        const isToday = dayStart === todayStart.getTime();
        const isFuture = dayStart > now;

        if (isToday) {
          return { label, minutes: todayMinutes, hasData: true, isToday: true };
        }

        const entry = dailyData.find((d) => d.dateMs === dayStart);
        return {
          label,
          minutes: entry ? Math.round(entry.totalMs / 60_000) : 0,
          hasData: !!entry && !isFuture,
          isToday: false,
        };
      });

      const daysElapsed = getDaysElapsed(weekStart);
      const thisWeekTotalMinutes = bars
        .slice(0, daysElapsed)
        .reduce((s, b) => s + b.minutes, 0);
      const avgMinutes = Math.round(thisWeekTotalMinutes / daysElapsed);

      // Last week average (all 7 days)
      const lastWeekEntries = dailyData.filter(
        (d) => d.dateMs >= lastWeekStart.getTime() && d.dateMs < weekStart.getTime()
      );
      const lastWeekAvgMinutes =
        lastWeekEntries.length > 0
          ? Math.round(
              lastWeekEntries.reduce((s, d) => s + d.totalMs, 0) / 60_000 / 7
            )
          : null;

      const deltaMinutes =
        lastWeekAvgMinutes !== null ? avgMinutes - lastWeekAvgMinutes : null;

      const targetMinutes = resolveTarget(checkins);

      const pkgToLabel = Object.fromEntries(
        Object.entries(APP_PACKAGE_MAP).map(([label, pkg]) => [pkg, label])
      );
      const apps: AppUsage[] = packageNames
        .map((pkg) => ({
          name: pkgToLabel[pkg] ?? pkg,
          minutes: Math.round((weekAppsUsageMs[pkg] ?? 0) / 60_000),
        }))
        .sort((a, b) => b.minutes - a.minutes);

      setWeekData({ avgMinutes, targetMinutes, bars, deltaMinutes, apps });
    } catch {
      // silencieux — on laisse weekData à null
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const progress =
    weekData && weekData.targetMinutes > 0
      ? Math.min(weekData.avgMinutes / weekData.targetMinutes, 1)
      : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <DooLogo width={100} />
        <View style={styles.header_spacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 94 }]}
      >
        {/* Date card */}
        <View style={styles.date_card}>
          <Text style={styles.date_range}>
            {weekStart.getDate()} → {weekEnd.getDate()}
          </Text>
          <Text style={styles.date_month}>
            {MONTHS_FULL[weekStart.getMonth()]}
          </Text>
          <Text style={styles.date_year}>
            {weekStart.getFullYear()}
          </Text>
        </View>

        {/* Permission manquante */}
        {!hasPermission && (
          <View style={styles.permission_card}>
            <Text style={styles.permission_title}>Accès aux données requis</Text>
            <Text style={styles.permission_body}>
              Active l'accès aux données d'utilisation pour voir ton récapitulatif hebdomadaire.
            </Text>
            <TouchableOpacity
              style={styles.permission_btn}
              onPress={() => router.push("/app-surveillance-settings")}
              activeOpacity={0.8}
            >
              <Text style={styles.permission_btn_text}>Configurer l'accès</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission && weekData && (
          <>
            {/* Progress card */}
            <View style={styles.progress_card}>
              <Text style={styles.card_title}>Temps d'écran moyen</Text>

              <View style={styles.avg_bar_row}>
                <View style={styles.avg_bar_track}>
                  <View style={[styles.avg_bar_fill, { flex: progress }]} />
                  <View style={{ flex: Math.max(1 - progress, 0) }} />
                </View>
                <Text style={styles.avg_bar_label}>
                  {formatHours(weekData.avgMinutes)} / jour
                </Text>
              </View>

              <Text style={styles.card_detail}>
                {"- Objectif : "}
                <Text style={styles.card_detail_bold}>
                  {formatHours(weekData.targetMinutes)}
                </Text>
              </Text>

              {(() => {
                const achievement = getAchievement(weekData.avgMinutes, weekData.targetMinutes);
                if (!achievement) return null;
                return (
                  <View style={styles.achievement_row}>
                    <Ionicons name={achievement.icon} size={16} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.card_detail}>{achievement.text}</Text>
                  </View>
                );
              })()}
            </View>

            {/* Bar chart card */}
            <View style={styles.chart_card}>
              <Text style={styles.chart_title}>Évolution de la semaine</Text>
              <BarChart bars={weekData.bars} />
              {weekData.deltaMinutes !== null && (
                <Text style={styles.chart_delta}>
                  {weekData.deltaMinutes <= 0
                    ? `${Math.abs(weekData.deltaMinutes)} min de moins que la semaine dernière`
                    : `+${weekData.deltaMinutes} min par rapport à la semaine dernière`}
                </Text>
              )}
            </View>

            {/* Apps ranking card */}
            {weekData.apps.length > 0 && (
              <View style={styles.apps_card}>
                <Text style={styles.chart_title}>Temps par application</Text>
                {weekData.apps.map((app) => (
                  <View key={app.name} style={styles.app_row}>
                    <Text style={styles.app_name} numberOfLines={1}>{app.name}</Text>
                    <View style={styles.app_bar_track}>
                      <View
                        style={[
                          styles.app_bar_fill,
                          { flex: app.minutes },
                        ]}
                      />
                      <View style={{ flex: weekData.apps[0].minutes - app.minutes }} />
                    </View>
                    <Text style={styles.app_time}>
                      {app.minutes === 0 ? "-" : formatHours(app.minutes)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header_spacer: { width: 24 },
  scroll: { gap: spacing.sm },

  // Date card
  date_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.offWhite,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  date_range: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  date_month: { fontSize: 15, fontWeight: "600", color: colors.textDark },
  date_year: { fontSize: 15, fontWeight: "600", color: colors.textDark },

  // Progress card
  progress_card: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card_title: { fontSize: 15, fontWeight: "700", color: colors.white },
  avg_bar_row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avg_bar_track: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: radius.pill,
    flexDirection: "row",
    overflow: "hidden",
  },
  avg_bar_fill: { backgroundColor: colors.white, borderRadius: radius.pill },
  avg_bar_label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
    minWidth: 80,
    textAlign: "right",
  },
  card_detail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  card_detail_bold: { fontWeight: "700", color: colors.white },
  achievement_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // Bar chart card
  chart_card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chart_title: { fontSize: 15, fontWeight: "700", color: colors.textDark },
  chart_delta: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },

  // Chart internals
  chart_y_label: {
    fontSize: 10,
    color: colors.muted,
    width: Y_AXIS_WIDTH,
    textAlign: "right",
    paddingRight: 4,
  },
  chart_grid_line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(118,102,117,0.18)",
  },
  chart_bars_row: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    gap: 4,
    paddingHorizontal: 2,
  },
  chart_bar_col: {
    flex: 1,
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
  },
  chart_bar: {
    borderRadius: 4,
  },
  chart_x_row: {
    flexDirection: "row",
    marginTop: 6,
  },
  chart_x_item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  chart_x_label: {
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
  },
  chart_x_label_today: {
    fontWeight: "700",
    color: colors.secondary,
  },
  chart_today_dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },

  // Apps ranking card
  apps_card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  app_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  app_name: {
    width: 90,
    fontSize: 13,
    fontWeight: "500",
    color: colors.textDark,
  },
  app_bar_track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(118,102,117,0.12)",
    flexDirection: "row",
    overflow: "hidden",
  },
  app_bar_fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  app_time: {
    width: 44,
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "right",
  },

  // Permission card
  permission_card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  permission_title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
  },
  permission_body: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21,
  },
  permission_btn: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  permission_btn_text: { fontSize: 14, fontWeight: "600", color: colors.white },
});
