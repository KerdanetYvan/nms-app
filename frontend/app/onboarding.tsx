import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { Motivation } from "@/src/types";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEPS = [
  {
    title: "Pourquoi télécharges-tu Doo ?",
    hint: "Pas de bonne réponse — juste ce qui te correspond.",
  },
  {
    title: "Ton temps d'écran actuel",
    hint: "Tu peux vérifier dans tes paramètres de temps d'écran.",
  },
  {
    title: "Ton objectif",
    hint: "Combien d'heures par jour aimerais-tu atteindre ?",
  },
  {
    title: "Sur quelles apps tu perds le plus de temps ?",
    hint: "Tu peux en sélectionner plusieurs.",
  },
  {
    title: "Quand as-tu tendance à scroller ?",
    hint: "Tu peux en sélectionner plusieurs.",
  },
  {
    title: "Ton niveau de motivation",
    hint: "Ça nous aide à construire un programme adapté.",
  },
];

const REASON_OPTIONS = [
  "Je passe trop de temps sur mon téléphone",
  "Je veux être plus présent dans ma vie",
  "Je me sens dépendant du scroll",
  "Je veux améliorer ma concentration",
];

const APP_OPTIONS = [
  "TikTok",
  "Instagram",
  "YouTube",
  "X / Twitter",
  "Snapchat",
  "Reddit",
  "Facebook",
  "LinkedIn",
  "Autre",
];

const MOMENT_OPTIONS = [
  "Le matin au réveil",
  "Dans les transports",
  "Pendant les repas",
  "Le soir dans mon lit",
  "Quand je m'ennuie",
  "Quand je suis stressé·e",
  "Au travail / en cours",
];

const MOTIVATION_OPTIONS: { value: Motivation; label: string }[] = [
  { value: "aggressive", label: "Beaucoup" },
  { value: "moderate", label: "J'en ai besoin" },
  { value: "gentle", label: "Tout doux" },
];

const OPTION_COLORS: { bg: string; text: string }[] = [
  { bg: colors.primary,   text: colors.white },
  { bg: colors.secondary, text: colors.textDark },
  { bg: colors.rose,      text: colors.textDark },
  { bg: colors.yellow,    text: colors.textDark },
  { bg: colors.beige,     text: colors.textDark },
  { bg: colors.offWhite,  text: colors.textDark },
];

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [reason, setReason] = useState<string | null>(null);
  const [screenTimeHours, setScreenTimeHours] = useState("");
  const [targetTimeHours, setTargetTimeHours] = useState("");
  const [apps, setApps] = useState<string[]>([]);
  const [scroll_moments, setScrollMoments] = useState<string[]>([]);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseHours = (val: string) => parseFloat(val.replace(",", "."));

  const validate = (): boolean => {
    if (step === 0) {
      if (!reason) { setError("Choisis une raison."); return false; }
    } else if (step === 1) {
      const val = parseHours(screenTimeHours);
      if (isNaN(val) || val <= 0) { setError("Entre un nombre d'heures valide."); return false; }
    } else if (step === 2) {
      const current = parseHours(screenTimeHours);
      const target = parseHours(targetTimeHours);
      if (isNaN(target) || target <= 0) { setError("Entre un nombre d'heures valide."); return false; }
      if (target >= current) { setError("L'objectif doit être inférieur à ton temps actuel."); return false; }
    } else if (step === 3) {
      if (apps.length === 0) { setError("Sélectionne au moins une application."); return false; }
    } else if (step === 4) {
      if (scroll_moments.length === 0) { setError("Sélectionne au moins un moment."); return false; }
    } else if (step === 5) {
      if (!motivation) { setError("Choisis un niveau de motivation."); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    setError(null);
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < 5) {
      Keyboard.dismiss();
      setStep((s) => (s + 1) as Step);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await api.saveUserProfile({
        user_id: user!.id,
        screen_time_min: Math.round(parseHours(screenTimeHours) * 60),
        target_time_min: Math.round(parseHours(targetTimeHours) * 60),
        motivation: motivation!,
        reason: reason!,
        apps,
        scroll_moments,
      });
      router.replace("/program" as never);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const { title, hint } = STEPS[step];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.logoZone}>
        <Image source={require("@/assets/images/logo_doo.png")} />
      </View>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={16}
      >
        <View style={styles.flex}>
          <Animated.View
            key={step}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          >
            <Text style={styles.question}>{title}</Text>
            <Text style={styles.hint}>{hint}</Text>

            {/* Step 0 — Raison (single choice) */}
            {step === 0 && (
              <View style={styles.optionGroup}>
                {REASON_OPTIONS.map((opt, i) => {
                  const { bg, text } = OPTION_COLORS[i % OPTION_COLORS.length];
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.option, { backgroundColor: bg }, reason === opt && styles.optionSelected]}
                      onPress={() => { Haptics.selectionAsync(); setReason(opt); setError(null); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.optionLabel, { color: text }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Step 1 — Temps actuel */}
            {step === 1 && (
              <>
                <Text style={styles.label}>Heures par jour</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 3.5 pour 3h30"
                  placeholderTextColor={colors.muted}
                  value={screenTimeHours}
                  onChangeText={setScreenTimeHours}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </>
            )}

            {/* Step 2 — Objectif */}
            {step === 2 && (
              <>
                <Text style={styles.label}>Heures par jour</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Moins de ${screenTimeHours}h`}
                  placeholderTextColor={colors.muted}
                  value={targetTimeHours}
                  onChangeText={setTargetTimeHours}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </>
            )}

            {/* Step 3 — Apps (multi-choice) */}
            {step === 3 && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.optionScroll}>
                <View style={styles.optionGroup}>
                  {APP_OPTIONS.map((opt, i) => {
                    const { bg, text } = OPTION_COLORS[i % OPTION_COLORS.length];
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.option, { backgroundColor: bg }, apps.includes(opt) && styles.optionSelected]}
                        onPress={() => { Haptics.selectionAsync(); setApps(toggle(apps, opt)); setError(null); }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionLabel, { color: text }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Step 4 — Moments (multi-choice) */}
            {step === 4 && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.optionScroll}>
                <View style={styles.optionGroup}>
                  {MOMENT_OPTIONS.map((opt, i) => {
                    const { bg, text } = OPTION_COLORS[i % OPTION_COLORS.length];
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.option, { backgroundColor: bg }, scroll_moments.includes(opt) && styles.optionSelected]}
                        onPress={() => { Haptics.selectionAsync(); setScrollMoments(toggle(scroll_moments, opt)); setError(null); }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionLabel, { color: text }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Step 5 — Motivation (single choice) */}
            {step === 5 && (
              <View style={styles.optionGroup}>
                {MOTIVATION_OPTIONS.map((opt, i) => {
                  const { bg, text } = OPTION_COLORS[i % OPTION_COLORS.length];
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.option, { backgroundColor: bg }, motivation === opt.value && styles.optionSelected]}
                      onPress={() => { Haptics.selectionAsync(); setMotivation(opt.value); setError(null); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.optionLabel, { color: text }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </View>

        {error && (
          <Animated.Text
            entering={Platform.OS === "web" ? undefined : FadeInDown.duration(200)}
            style={styles.errorText}
          >
            {error}
          </Animated.Text>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled, { marginBottom: insets.bottom + spacing.lg }]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>{step < 5 ? "Continuer" : "Commencer"}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  logoZone: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.beige,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  kav: {
    flex: 1,
  },
  flex: {
    flex: 1,
    justifyContent: "center",
  },
  question: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPlum,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: "transparent",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#7A6678",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
  },
  optionScroll: {
    maxHeight: 320,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  option: {
    borderRadius: radius.md,
    paddingVertical: 20,
    paddingHorizontal: spacing.lg,
    borderWidth: 2.5,
    borderColor: "transparent",
    alignItems: "center",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  optionSelected: {
    borderColor: colors.textPlum,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#C0504D",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
