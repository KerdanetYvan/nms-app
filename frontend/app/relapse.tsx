import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { handleRelapse } from "@/src/algorithms/handleRelapse";
import { generateProgram } from "@/src/algorithms/generateProgram";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { Motivation, RelapseDecision } from "@/src/types";

type Step = "usage" | "difficulty" | "downgrade" | "pause" | "feedback" | "done";

const DIFFICULTY_OPTIONS: { value: RelapseDecision["difficulty"]; label: string; desc: string }[] = [
  { value: "lack_motivation",     label: "Manque de motivation",    desc: "J'ai du mal à rester motivé·e" },
  { value: "too_difficult",       label: "Trop difficile",          desc: "Les objectifs sont trop ambitieux" },
  { value: "something_difficult", label: "Quelque chose de difficile", desc: "Une situation particulière" },
  { value: "busy_period",         label: "Période chargée",         desc: "Travail, stress, vie perso" },
  { value: "dont_know",           label: "Je ne sais pas trop",     desc: "Pas d'explication claire" },
];

export default function RelapseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("usage");
  const [week1, setWeek1] = useState("");
  const [week2, setWeek2] = useState("");
  const [difficulty, setDifficulty] = useState<RelapseDecision["difficulty"] | null>(null);
  const [downgradeAccepted, setDowngradeAccepted] = useState<boolean | null>(null);
  const [pauseWeeks, setPauseWeeks] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string>("");

  const STEPS: Step[] = ["usage", "difficulty", "downgrade", "pause", "feedback", "done"];
  const visibleSteps = ["usage", "difficulty",
    difficulty === "lack_motivation" ? "downgrade" : null,
    difficulty === "something_difficult" ? "pause" : null,
    "feedback", "done",
  ].filter(Boolean) as Step[];
  const currentIndex = visibleSteps.indexOf(step);
  const totalVisible = visibleSteps.length - 1;

  const goNext = (next: Step) => {
    Haptics.selectionAsync();
    setError(null);
    setStep(next);
  };

  const handleUsageNext = () => {
    const h1 = parseFloat(week1.replace(",", "."));
    const h2 = parseFloat(week2.replace(",", "."));
    if (isNaN(h1) || isNaN(h2) || h1 <= 0 || h2 <= 0) {
      setError("Saisis deux valeurs valides (ex: 3.5).");
      return;
    }
    goNext("difficulty");
  };

  const handleDifficultyNext = () => {
    if (!difficulty) { setError("Choisis une option."); return; }
    if (difficulty === "lack_motivation") { goNext("downgrade"); return; }
    if (difficulty === "something_difficult") { goNext("pause"); return; }
    goNext("feedback");
  };

  const handleDowngradeNext = () => {
    if (downgradeAccepted === null) { setError("Choisis une option."); return; }
    goNext("feedback");
  };

  const handlePauseNext = () => {
    goNext("feedback");
  };

  const buildDecision = (): RelapseDecision => {
    if (difficulty === "lack_motivation") {
      return { difficulty: "lack_motivation", profileDowngradeAccepted: downgradeAccepted ?? false };
    }
    if (difficulty === "something_difficult") {
      if (pauseWeeks > 0) {
        return { difficulty: "something_difficult", pauseDesired: true, pauseWeeks: pauseWeeks as 1 | 2 };
      }
      return { difficulty: "something_difficult", pauseDesired: false };
    }
    return { difficulty: difficulty! };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const profile = await api.getUserProfile();
      if (!profile) throw new Error("Profil introuvable.");

      const h1 = parseFloat(week1.replace(",", "."));
      const h2 = parseFloat(week2.replace(",", "."));

      const result = handleRelapse({
        trigger: "consecutive_misses",
        lastTwoWeeksUsage: [h1, h2],
        currentMotivation: profile.motivation,
        decision: buildDecision(),
        optionalFeedback: feedback.trim() || undefined,
      });

      const startDate = new Date();
      if (result.pauseWeeks > 0) {
        startDate.setDate(startDate.getDate() + result.pauseWeeks * 7);
      }
      const newProgram = generateProgram(
        result.newBaseline,
        profile.target_time_min / 60,
        result.newMotivation,
        startDate,
      );

      const checkins = newProgram.milestones.map((m) => ({
        user_id: user!.id,
        week_number: m.week,
        week_start_date: m.startDate.toISOString().split("T")[0],
        target_daily_minutes: Math.round(m.targetDailyHours * 60),
        phase: m.phase,
        reduction_from_previous_min: Math.round(m.reductionFromPrevious * 60),
      }));

      await api.applyAdjustment({
        newMotivation: result.newMotivation,
        newScreenTimeMin: Math.round(result.newBaseline * 60),
        program: JSON.parse(JSON.stringify(newProgram)),
        checkins,
      });

      const motivLabel: Record<Motivation, string> = {
        aggressive: "Ambitieux", moderate: "Équilibré", gentle: "Tout doux",
      };
      setResultSummary(
        `Nouvelle baseline : ${result.newBaseline.toFixed(1)}h/j · ${motivLabel[result.newMotivation]} · ${newProgram.totalWeeks} semaines`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuster le programme</Text>
        <View style={{ width: 32 }} />
      </View>

      {step !== "done" && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex) / totalVisible) * 100}%` }]} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step: usage ───────────────────────────────────────────── */}
        {step === "usage" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Ton usage ces 2 dernières semaines</Text>
            <Text style={styles.stepHint}>Entre ta moyenne de temps d'écran quotidien (en heures).</Text>

            <Text style={styles.inputLabel}>Semaine 1 (h/jour)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex : 3.5"
              placeholderTextColor={colors.muted}
              value={week1}
              onChangeText={setWeek1}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputLabel}>Semaine 2 (h/jour)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex : 4"
              placeholderTextColor={colors.muted}
              value={week2}
              onChangeText={setWeek2}
              keyboardType="decimal-pad"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.btn} onPress={handleUsageNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: difficulty ──────────────────────────────────────── */}
        {step === "difficulty" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quelle a été la difficulté ces deux dernières semaines ?</Text>
            <View style={styles.optionGroup}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const selected = difficulty === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => { Haptics.selectionAsync(); setDifficulty(opt.value); setError(null); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{opt.label}</Text>
                    <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.btn} onPress={handleDifficultyNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: downgrade (lack_motivation) ─────────────────────── */}
        {step === "downgrade" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Baisser le niveau de motivation ?</Text>
            <Text style={styles.stepHint}>
              On passerait à un rythme plus doux. Le programme serait rallongé mais plus accessible.
            </Text>
            <View style={styles.twoButtons}>
              <TouchableOpacity
                style={[styles.choiceBtn, downgradeAccepted === true && styles.choiceBtnSelected]}
                onPress={() => { Haptics.selectionAsync(); setDowngradeAccepted(true); setError(null); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.choiceBtnText, downgradeAccepted === true && styles.choiceBtnTextSelected]}>Oui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceBtn, downgradeAccepted === false && styles.choiceBtnSelected]}
                onPress={() => { Haptics.selectionAsync(); setDowngradeAccepted(false); setError(null); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.choiceBtnText, downgradeAccepted === false && styles.choiceBtnTextSelected]}>Non, juste étirer</Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.btn} onPress={handleDowngradeNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: pause (something_difficult) ─────────────────────── */}
        {step === "pause" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Souhaites-tu une pause ?</Text>
            <Text style={styles.stepHint}>La pause suspend le programme quelques semaines. Sinon, on rallonge juste la durée.</Text>
            <View style={styles.optionGroup}>
              {[
                { label: "Non, juste étirer la durée", value: 0 },
                { label: "Pause 1 semaine", value: 1 },
                { label: "Pause 2 semaines", value: 2 },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionCard, pauseWeeks === opt.value && styles.optionCardSelected]}
                  onPress={() => { Haptics.selectionAsync(); setPauseWeeks(opt.value as 0 | 1 | 2); }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionLabel, pauseWeeks === opt.value && styles.optionLabelSelected]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={handlePauseNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: feedback ────────────────────────────────────────── */}
        {step === "feedback" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Un mot sur ces dernières semaines ?</Text>
            <Text style={styles.stepHint}>Optionnel — ça reste chez toi.</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ce qui s'est passé, comment tu te sens..."
              placeholderTextColor={colors.muted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              textAlignVertical="top"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={styles.btn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Recalculer le programme</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSubmit}
              disabled={loading}
              hitSlop={8}
            >
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: done ────────────────────────────────────────────── */}
        {step === "done" && (
          <View style={styles.doneContent}>
            <Text style={styles.doneEmoji}>✓</Text>
            <Text style={styles.doneTitle}>Programme ajusté !</Text>
            <Text style={styles.doneSubtitle}>On repart de là.</Text>
            {!!resultSummary && (
              <View style={styles.resultCard}>
                <Text style={styles.resultText}>{resultSummary}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace("/program" as never)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Voir mon nouveau programme</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backText: {
    fontSize: 22,
    color: colors.textPlum,
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPlum,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.beige,
    marginHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  stepContent: {
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPlum,
    lineHeight: 30,
  },
  stepHint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginTop: -spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: -spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.beige,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  optionDescSelected: {
    color: colors.muted,
  },
  twoButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  choiceBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  choiceBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  choiceBtnTextSelected: {
    color: colors.primary,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    color: "#C0504D",
    fontWeight: "500",
    textAlign: "center",
  },
  doneContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
  },
  doneEmoji: {
    fontSize: 56,
    color: colors.primary,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPlum,
  },
  doneSubtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: -spacing.xs,
  },
  resultCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: "stretch",
    marginTop: spacing.xs,
  },
  resultText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: "600",
    textAlign: "center",
  },
});
