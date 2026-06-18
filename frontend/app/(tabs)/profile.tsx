import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { api } from "@/src/api/client";
import { BottomNav } from "@/src/components/bottom-nav";
import { DooLogo } from "@/src/components/doo-logo";
import { WeekRecapCard } from "@/src/components/week-recap-card";
import { DailyProgressCard } from "@/src/components/daily-progress-card";
import { ScreenTimeCard } from "@/src/components/screen-time-card";
import { TopAppsCard, type AppUsage } from "@/src/components/top-apps-card";
import { colors, radius, spacing } from "@/src/theme/colors";

// ─── Date helper ──────────────────────────────────────────────────────────────

const DAYS   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function formatDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function FlameIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.textDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 20V10" />
      <Path d="M12 20V4" />
      <Path d="M6 20v-6" />
    </Svg>
  );
}

// ─── Placeholder data — remplacer par de vraies données API quand prêt ───────

const PLACEHOLDER_SAVED_MIN   = 27;
const PLACEHOLDER_CURRENT_MIN = 102;   // 1h42
const PLACEHOLDER_TARGET_MIN  = 120;   // 2H
const PLACEHOLDER_DELTA       = -18;
const PLACEHOLDER_APPS: AppUsage[] = [
  { name: "Instagram", minutes: 42 },
  { name: "Tiktok",    minutes: 31 },
  { name: "Youtube",   minutes: 18 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    api.getAnswers()
      .then((answers) => setPoints(answers.length))
      .catch(() => {});
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Badges row */}
      <View style={styles.badges_row}>
        <View style={styles.badge}>
          <Text style={styles.badge_text}>{formatDate()}</Text>
        </View>
        {points !== null && (
          <View style={[styles.badge, styles.badge_row]}>
            <Text style={styles.badge_text}>{points}</Text>
            <FlameIcon />
          </View>
        )}
      </View>

      {/* Logo descendu sous les badges */}
      <View style={styles.logo_wrap}>
        <DooLogo width={180} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll_content, { paddingBottom: insets.bottom + 94 }]}
      >
        <WeekRecapCard />

        <DailyProgressCard
          savedMinutes={PLACEHOLDER_SAVED_MIN}
          currentMinutes={PLACEHOLDER_CURRENT_MIN}
          targetMinutes={PLACEHOLDER_TARGET_MIN}
        />

        <View style={styles.section_header}>
          <BarChartIcon />
          <Text style={styles.section_title}>Statistiques</Text>
        </View>

        <ScreenTimeCard deltaFromYesterday={PLACEHOLDER_DELTA} />

        <TopAppsCard apps={PLACEHOLDER_APPS} />
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

  // Header
  badges_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badge_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badge_text: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  logo_wrap: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // Scroll content
  scroll_content: {
    gap: spacing.sm,
  },

  // Statistiques header
  section_header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  section_title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },
});
