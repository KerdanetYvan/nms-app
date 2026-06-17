import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { handleAcceleration } from "@/src/algorithms/handleAcceleration";
import { generateProgram } from "@/src/algorithms/generateProgram";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { Motivation, WeekCheckin } from "@/src/types";

type Step = "choice" | "done";

const MOTIVATION_LABEL: Record<Motivation, string> = {
  aggressive: "Ambitieux",
  moderate:   "Équilibré",
  gentle:     "Tout doux",
};

const UPGRADE_LABEL: Record<Motivation, string> = {
  gentle:     "Équilibré (−30 min/sem)",
  moderate:   "Ambitieux (−60 min/sem)",
  aggressive: "Phase finale raccourcie",
};

export default function AccelerationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [currentMotivation, setCurrentMotivation] = useState<Motivation | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useState(() => {
    api.getUserProfile().then((p) => {
      if (p) setCurrentMotivation(p.motivation);
      setProfileLoaded(true);
    });
  });

  const handleChoice = async (accepted: boolean) => {
    if (!currentMotivation) return;
    Haptics.selectionAsync();
    setError(null);

    const result = handleAcceleration({
      currentMotivation,
      accelerationAccepted: accepted,
    });

    if (!result.programChanged) {
      setResultMessage(result.message);
      setResultSummary("");
      setStep("done");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const profile = await api.getUserProfile();
      if (!profile) throw new Error("Profil introuvable.");

      const newProgram = generateProgram(
        profile.screen_time_min / 60,
        profile.target_time_min / 60,
        result.newMotivation,
        new Date(),
      );

      // Aggressive au max : raccourcir la consolidation (3 sem. → 1 sem.)
      const milestones = result.shortenConsolidation
        ? (() => {
            let consolidationCount = 0;
            return newProgram.milestones.filter((m) => {
              if (m.phase !== "consolidation") return true;
              consolidationCount++;
              return consolidationCount <= 1;
            });
          })()
        : newProgram.milestones;

      const checkins = milestones.map((m) => ({
        user_id: user!.id,
        week_number: m.week,
        week_start_date: m.startDate.toISOString().split("T")[0],
        target_daily_minutes: Math.round(m.targetDailyHours * 60),
        phase: m.phase,
        reduction_from_previous_min: Math.round(m.reductionFromPrevious * 60),
      }));

      await api.applyAdjustment({
        newMotivation: result.newMotivation,
        newScreenTimeMin: profile.screen_time_min,
        program: JSON.parse(JSON.stringify({ ...newProgram, milestones })),
        checkins,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultMessage(result.message);
      setResultSummary(
        result.shortenConsolidation
          ? `Phase finale : 3 sem. → 1 sem. · ${milestones.length} semaines au total`
          : `Nouveau rythme : ${MOTIVATION_LABEL[result.newMotivation]} · ${milestones.length} semaines`
      );
      setStep("done");
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof Error ? err.message :
        (err && typeof err === "object" && "message" in err) ? String((err as { message: unknown }).message) :
        "Une erreur est survenue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 32 }} />
      </View>

      {step === "choice" && (
        <View style={styles.body}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2 semaines consécutives !</Text>
          </View>

          <Text style={styles.title}>Tu dépasses tes objectifs depuis 2 semaines</Text>
          <Text style={styles.subtitle}>
            Ton programme actuel est peut-être trop facile. Tu veux accélérer le rythme ?
          </Text>

          {currentMotivation && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Profil actuel</Text>
              <Text style={styles.infoValue}>{MOTIVATION_LABEL[currentMotivation]}</Text>
              {currentMotivation !== "aggressive" && (
                <>
                  <View style={styles.infoDivider} />
                  <Text style={styles.infoLabel}>Si tu accélères</Text>
                  <Text style={styles.infoValueAccent}>{UPGRADE_LABEL[currentMotivation]}</Text>
                </>
              )}
              {currentMotivation === "aggressive" && (
                <>
                  <View style={styles.infoDivider} />
                  <Text style={styles.infoLabel}>Déjà au niveau max — si tu accélères</Text>
                  <Text style={styles.infoValueAccent}>{UPGRADE_LABEL[currentMotivation]}</Text>
                </>
              )}
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.choices}>
            <TouchableOpacity
              style={[styles.choiceBtn, styles.choiceBtnPrimary]}
              onPress={() => handleChoice(true)}
              disabled={loading || !profileLoaded}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.choiceBtnPrimaryText}>Oui, on accélère !</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => handleChoice(false)}
              disabled={loading || !profileLoaded}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceBtnText}>Non, je garde mon rythme</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === "done" && (
        <View style={styles.doneBody}>
          <Text style={styles.doneIcon}>{resultSummary ? "🚀" : "👍"}</Text>
          <Text style={styles.doneTitle}>{resultMessage}</Text>
          {!!resultSummary && (
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>{resultSummary}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.choiceBtn, styles.choiceBtnPrimary, { marginTop: spacing.lg }]}
            onPress={() => router.replace("/program" as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.choiceBtnPrimaryText}>Voir mon programme</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

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
  backText: {
    fontSize: 22,
    color: colors.textPlum,
    width: 32,
  },
  body: {
    flex: 1,
    gap: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPlum,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginTop: -spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
    marginTop: spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 4,
  },
  infoValueAccent: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.beige,
    marginVertical: spacing.xs,
  },
  choices: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  choiceBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  choiceBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceBtnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  choiceBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: "#C0504D",
    fontWeight: "500",
    textAlign: "center",
  },
  doneBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  doneIcon: {
    fontSize: 56,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPlum,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: "stretch",
  },
  resultText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: "600",
    textAlign: "center",
  },
});
