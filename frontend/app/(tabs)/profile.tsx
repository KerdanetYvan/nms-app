import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { api } from "@/src/api/client";
import { BottomNav } from "@/src/components/bottom-nav";
import { DooLogo } from "@/src/components/doo-logo";
import { WeekRecapCard } from "@/src/components/week-recap-card";
import { DailyProgressCard } from "@/src/components/daily-progress-card";
import { ScreenTimeCard } from "@/src/components/screen-time-card";
import { TopAppsCard } from "@/src/components/top-apps-card";
import { useDailyUsage } from "@/src/hooks/use-daily-usage";
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

function LockIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
      stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
    </Svg>
  );
}

// ─── No-permission card ───────────────────────────────────────────────────────

function PermissionPromptCard() {
  const router = useRouter();
  return (
    <View style={styles.permission_card}>
      <LockIcon />
      <Text style={styles.permission_title}>Accès aux données requis</Text>
      <Text style={styles.permission_body}>
        Active l'accès aux données d'utilisation pour voir ton temps d'écran et tes statistiques par app.
      </Text>
      <TouchableOpacity
        style={styles.permission_btn}
        onPress={() => router.push("/app-surveillance-settings")}
        activeOpacity={0.8}
      >
        <Text style={styles.permission_btn_text}>Configurer l'accès</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState<number | null>(null);
  const dailyUsage = useDailyUsage();

  useEffect(() => {
    api.getAnswers()
      .then((answers) => setPoints(answers.length))
      .catch(() => {});
  }, []);

  const hasData = dailyUsage.hasPermission && !dailyUsage.isLoading;

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

        {!dailyUsage.hasPermission ? (
          <PermissionPromptCard />
        ) : (
          <>
            <DailyProgressCard
              savedMinutes={hasData ? dailyUsage.savedMinutes : 0}
              currentMinutes={hasData ? dailyUsage.totalMinutes : 0}
              targetMinutes={hasData ? dailyUsage.targetMinutes : 0}
            />

            <View style={styles.section_header}>
              <BarChartIcon />
              <Text style={styles.section_title}>Statistiques</Text>
            </View>

            <ScreenTimeCard deltaFromYesterday={0} />

            {(hasData && dailyUsage.perApp.length > 0) && (
              <TopAppsCard apps={dailyUsage.perApp} />
            )}

            {(hasData && dailyUsage.perApp.length === 0) && (
              <View style={styles.empty_apps}>
                <Text style={styles.empty_apps_text}>
                  Aucune utilisation enregistrée aujourd'hui.
                </Text>
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

  // Permission prompt
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
  permission_btn_text: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },

  // Empty apps
  empty_apps: {
    paddingVertical: spacing.sm,
  },
  empty_apps_text: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
});
