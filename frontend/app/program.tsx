import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/api/client";
import {
  generateProgram,
  type Phase,
  type WeekMilestone,
} from "@/src/algorithms/generateProgram";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { Motivation, UserProfile } from "@/src/types";

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

// 2.75 → "2h45" ; 3 → "3h"
function formatHours(decimal_hours: number): string {
  const total_minutes = Math.round(decimal_hours * 60);
  const h = Math.floor(total_minutes / 60);
  const m = total_minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// Date courte en français : "3 juin", "14 juil."
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Config des phases ────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<Phase, { label: string; bg: string }> = {
  intro:          { label: "Introduction", bg: colors.yellow },
  reduction_main: { label: "Réduction",    bg: colors.secondary },
  consolidation:  { label: "Palier",       bg: colors.rose },
};

const MOTIVATION_LABEL: Record<Motivation, string> = {
  aggressive: "Ambitieux",
  moderate:   "Équilibré",
  gentle:     "Tout doux",
};

// ─── Composant : carte d'une semaine ─────────────────────────────────────────

type MilestoneCardProps = { milestone: WeekMilestone; animation_index: number };

function MilestoneCard({ milestone, animation_index }: MilestoneCardProps) {
  const phase = PHASE_CONFIG[milestone.phase];
  // Seuil pour éviter d'afficher "0h00 de moins" sur les semaines de palier
  const shows_reduction = milestone.reductionFromPrevious > 0.01;

  return (
    <Animated.View
      entering={
        Platform.OS === "web"
          ? undefined
          : FadeInDown.delay(animation_index * 55).springify()
      }
      style={styles.card}
    >
      <View style={styles.card_header}>
        <Text style={styles.week_label}>Semaine {milestone.week}</Text>
        <View style={[styles.phase_badge, { backgroundColor: phase.bg }]}>
          <Text style={styles.phase_text}>{phase.label}</Text>
        </View>
      </View>

      <Text style={styles.date_text}>
        À partir du {formatDate(milestone.startDate)}
      </Text>

      <View style={styles.card_row}>
        <Text style={styles.target_label}>Objectif quotidien</Text>
        <Text style={styles.target_value}>
          {formatHours(milestone.targetDailyHours)}
        </Text>
      </View>

      {shows_reduction && (
        <View style={styles.reduction_row}>
          <Ionicons name="arrow-down" size={12} color={colors.muted} />
          <Text style={styles.reduction_text}>
            {formatHours(milestone.reductionFromPrevious)} de moins
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export default function ProgramScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getUserProfile()
      .then(setProfile)
      .catch(() => setError("Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error_text}>{error ?? "Profil introuvable."}</Text>
      </View>
    );
  }

  // Les données en base sont en minutes — generateProgram attend des heures
  const current_hours = profile.screen_time_min / 60;
  const target_hours  = profile.target_time_min  / 60;
  const program = generateProgram(current_hours, target_hours, profile.motivation);

  const weeks_label =
    program.totalWeeks === 1 ? "1 semaine" : `${program.totalWeeks} semaines`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── En-tête ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.back_btn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon programme</Text>
        {/* Spacer pour centrer le titre */}
        <View style={styles.back_btn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* ── Carte de synthèse ── */}
        <Animated.View
          entering={
            Platform.OS === "web" ? undefined : FadeInDown.springify()
          }
          style={styles.summary_card}
        >
          <Text style={styles.summary_range}>
            {formatHours(current_hours)} → {formatHours(target_hours)}
          </Text>
          <Text style={styles.summary_meta}>
            {weeks_label} · {MOTIVATION_LABEL[profile.motivation]}
          </Text>
        </Animated.View>

        {/* ── Milestones ── */}
        {program.milestones.map((milestone, i) => (
          <MilestoneCard
            key={milestone.week}
            milestone={milestone}
            // +1 pour laisser la summary_card animer en premier (index 0)
            animation_index={i + 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  error_text: {
    fontSize: 15,
    color: "#C0504D",
    textAlign: "center",
    fontWeight: "500",
  },

  // En-tête
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  back_btn: {
    width: 32,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPlum,
  },

  // ScrollView
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },

  // Carte synthèse
  summary_card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  summary_range: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
  summary_meta: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    marginTop: spacing.xs,
  },

  // Carte semaine
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  card_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  week_label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPlum,
  },
  phase_badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  phase_text: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  date_text: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  card_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  target_label: {
    fontSize: 14,
    color: colors.textDark,
  },
  target_value: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPlum,
  },
  reduction_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  reduction_text: {
    fontSize: 12,
    color: colors.muted,
  },
});
