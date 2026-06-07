import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
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

type Step = 0 | 1 | 2;

const MOTIVATION_OPTIONS: { value: Motivation; label: string }[] = [
  { value: "aggressive", label: "Beaucoup" },
  { value: "moderate", label: "J'en ai besoin" },
  { value: "gentle", label: "Tout doux" },
];

const STEPS = [
  {
    title: "Ton temps d'écran actuel",
    hint: "Tu peux vérifier dans tes paramètres de temps d'écran.",
  },
  {
    title: "Ton objectif",
    hint: "Combien d'heures par jour aimerais-tu atteindre ?",
  },
  {
    title: "Ton niveau de motivation",
    hint: "Ça nous aide à construire un programme adapté.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [screenTimeHours, setScreenTimeHours] = useState("");
  const [targetTimeHours, setTargetTimeHours] = useState("");
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseHours = (val: string) => parseFloat(val.replace(",", "."));

  const validate = (): boolean => {
    if (step === 0) {
      const val = parseHours(screenTimeHours);
      if (isNaN(val) || val <= 0) {
        setError("Entre un nombre d'heures valide.");
        return false;
      }
    } else if (step === 1) {
      const current = parseHours(screenTimeHours);
      const target = parseHours(targetTimeHours);
      if (isNaN(target) || target <= 0) {
        setError("Entre un nombre d'heures valide.");
        return false;
      }
      if (target >= current) {
        setError("L'objectif doit être inférieur à ton temps actuel.");
        return false;
      }
    } else if (!motivation) {
      setError("Choisis un niveau de motivation.");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError(null);
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < 2) {
      Keyboard.dismiss();
      setStep((s) => (s + 1) as Step);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await api.saveUserProfile({
        user_id: user!.id,
        screen_time_min: Math.round(parseHours(screenTimeHours) * 60),
        target_time_min: Math.round(parseHours(targetTimeHours) * 60),
        motivation: motivation!,
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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <Text style={styles.brand}>Doo</Text>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.flex}>
        <Animated.View
          key={step}
          entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          style={styles.card}
        >
          <Text style={styles.question}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>

          {step === 0 && (
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

          {step === 1 && (
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

          {step === 2 && (
            <View style={styles.motivationGroup}>
              {MOTIVATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.motivationOption,
                    motivation === opt.value && styles.motivationOptionSelected,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMotivation(opt.value);
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.motivationLabel,
                      motivation === opt.value && styles.motivationLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleNext}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>{step < 2 ? "Continuer" : "Commencer"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.textPlum,
    letterSpacing: 1,
    textAlign: "center",
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
  flex: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
  },
  motivationGroup: {
    gap: spacing.sm,
  },
  motivationOption: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
  },
  motivationOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  motivationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  motivationLabelSelected: {
    color: colors.white,
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
