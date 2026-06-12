import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { generateProgram } from "@/src/algorithms/generateProgram";
import { DooLogo } from "@/src/components/doo-logo";
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
    hint: "Sélectionne la durée et la période qui te semblent atteignables.",
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

const OPTION_COLORS = [
  colors.primary,
  colors.secondary,
  colors.rose,
  colors.yellow,
  colors.beige,
  colors.offWhite,
];

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = { day: 'jour', week: 'semaine', month: 'mois' };
const PERIODS: Period[] = ['day', 'week', 'month'];

const HOUR_OPTIONS: Record<Period, number[]> = {
  day:   Array.from({ length: 16 },  (_, i) => i + 1),
  week:  Array.from({ length: 80 },  (_, i) => i + 1),
  month: Array.from({ length: 300 }, (_, i) => i + 1),
};

const ITEM_H = 44;
const PICKER_H = 90;
const PICKER_PAD = (PICKER_H - ITEM_H) / 2;

function to_minutes_per_day(hours: number, period: Period): number {
  if (period === 'week') return Math.round((hours / 7) * 60);
  if (period === 'month') return Math.round((hours / 30) * 60);
  return Math.round(hours * 60);
}

function format_hours(h: number): string {
  const int = Math.floor(h);
  return h - int >= 0.5 ? `${int}h30` : `${int}h`;
}

function contrasting_text(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? colors.textDark : colors.white;
}

type PillPickerProps = {
  value: number;
  period: Period;
  onValueChange: (v: number) => void;
  onPeriodChange: (p: Period) => void;
};

function PillPicker({ value, period, onValueChange, onPeriodChange }: PillPickerProps) {
  const hours_ref = useRef<ScrollView>(null);
  const period_ref = useRef<ScrollView>(null);
  const value_ref = useRef(value);
  value_ref.current = value;
  // Timers pour gérer le cas où l'utilisateur scroll lentement (pas de phase momentum)
  const h_timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const p_timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snap_hours = (y: number) => {
    const opts = HOUR_OPTIONS[period];
    const i = Math.max(0, Math.min(Math.round(y / ITEM_H), opts.length - 1));
    onValueChange(opts[i]);
  };

  const snap_period = (y: number) => {
    const i = Math.max(0, Math.min(Math.round(y / ITEM_H), PERIODS.length - 1));
    const p = PERIODS[i];
    if (p === period) return;
    const opts = HOUR_OPTIONS[p];
    const nearest = opts.reduce((a, b) => Math.abs(b - value) < Math.abs(a - value) ? b : a);
    onValueChange(nearest);
    onPeriodChange(p);
  };

  // Repositionne les deux colonnes quand la période change (et au montage).
  // value lu via value_ref pour ne pas déclencher l'effet à chaque scroll.
  useEffect(() => {
    const h_i = Math.max(0, HOUR_OPTIONS[period].indexOf(value_ref.current));
    hours_ref.current?.scrollTo({ y: h_i * ITEM_H, animated: false });
    period_ref.current?.scrollTo({ y: PERIODS.indexOf(period) * ITEM_H, animated: false });
  }, [period]);

  return (
    <View style={ppStyles.card}>
      {/* Colonne heures */}
      <View style={ppStyles.col}>
        <ScrollView
          ref={hours_ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          nestedScrollEnabled
          contentContainerStyle={{ paddingVertical: PICKER_PAD }}
          onScrollEndDrag={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            h_timer.current = setTimeout(() => { h_timer.current = null; snap_hours(y); }, 60);
          }}
          onMomentumScrollBegin={() => {
            if (h_timer.current) { clearTimeout(h_timer.current); h_timer.current = null; }
          }}
          onMomentumScrollEnd={(e) => snap_hours(e.nativeEvent.contentOffset.y)}
        >
          {HOUR_OPTIONS[period].map((h) => (
            <View key={h} style={ppStyles.item}>
              <Text style={[ppStyles.itemText, value === h && ppStyles.itemTextActive]}>
                {format_hours(h)}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={[ppStyles.selLine, { top: PICKER_PAD }]} pointerEvents="none" />
        <View style={[ppStyles.selLine, { top: PICKER_PAD + ITEM_H }]} pointerEvents="none" />
      </View>

      <View style={ppStyles.separator} />

      {/* Colonne période */}
      <View style={ppStyles.col}>
        <ScrollView
          ref={period_ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          nestedScrollEnabled
          contentContainerStyle={{ paddingVertical: PICKER_PAD }}
          onScrollEndDrag={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            p_timer.current = setTimeout(() => { p_timer.current = null; snap_period(y); }, 60);
          }}
          onMomentumScrollBegin={() => {
            if (p_timer.current) { clearTimeout(p_timer.current); p_timer.current = null; }
          }}
          onMomentumScrollEnd={(e) => snap_period(e.nativeEvent.contentOffset.y)}
        >
          {PERIODS.map((p) => (
            <View key={p} style={ppStyles.item}>
              <Text style={[ppStyles.itemText, period === p && ppStyles.itemTextActive]}>
                {PERIOD_LABELS[p]}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={[ppStyles.selLine, { top: PICKER_PAD }]} pointerEvents="none" />
        <View style={[ppStyles.selLine, { top: PICKER_PAD + ITEM_H }]} pointerEvents="none" />
      </View>
    </View>
  );
}

const ppStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    height: PICKER_H,
    overflow: 'hidden',
  },
  col: {
    flex: 1,
    position: 'relative',
  },
  selLine: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.35,
  },
  separator: {
    width: 1,
    backgroundColor: colors.primary,
    opacity: 0.2,
    marginVertical: spacing.sm,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#C2BAC0',
  },
  itemTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPlum,
  },
});

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [reason, setReason] = useState<string | null>(null);
  const [screenTimeValue, setScreenTimeValue] = useState(3);
  const [screenTimePeriod, setScreenTimePeriod] = useState<Period>('day');
  const [targetTimeValue, setTargetTimeValue] = useState(1);
  const [targetTimePeriod, setTargetTimePeriod] = useState<Period>('day');
  const [apps, setApps] = useState<string[]>([]);
  const [scroll_moments, setScrollMoments] = useState<string[]>([]);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (step === 0) {
      if (!reason) { setError("Choisis une raison."); return false; }
    } else if (step === 1) {
      if (screenTimeValue <= 0) { setError("Choisis un temps d'écran supérieur à 0."); return false; }
    } else if (step === 2) {
      if (targetTimeValue <= 0) { setError("Choisis un objectif supérieur à 0."); return false; }
      const current_min = to_minutes_per_day(screenTimeValue, screenTimePeriod);
      const target_min = to_minutes_per_day(targetTimeValue, targetTimePeriod);
      if (target_min >= current_min) { setError("L'objectif doit être inférieur à ton temps actuel."); return false; }
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
      const screen_time_min = to_minutes_per_day(screenTimeValue, screenTimePeriod);
      const target_time_min = to_minutes_per_day(targetTimeValue, targetTimePeriod);
      const started_at = new Date().toISOString().split('T')[0];

      await api.saveUserProfile({
        user_id: user!.id,
        screen_time_min,
        target_time_min,
        motivation: motivation!,
        reason: reason!,
        apps,
        scroll_moments,
        started_at,
      });

      const program = generateProgram(screen_time_min / 60, target_time_min / 60, motivation!, new Date());
      const checkins = program.milestones.map((m) => ({
        user_id: user!.id,
        week_number: m.week,
        week_start_date: m.startDate.toISOString().split('T')[0],
        target_daily_minutes: Math.round(m.targetDailyHours * 60),
        phase: m.phase,
        reduction_from_previous_min: Math.round(m.reductionFromPrevious * 60),
      }));
      const { error: checkinsError } = await supabase.from('weekly_checkins').insert(checkins);
      if (checkinsError) throw checkinsError;

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
        <DooLogo width={160} />
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
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  const selected = reason === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.option, { borderColor: color, backgroundColor: selected ? color : colors.white }]}
                      onPress={() => { Haptics.selectionAsync(); setReason(opt); setError(null); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.optionLabel, { color: selected ? contrasting_text(color) : color }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Step 1 — Temps actuel */}
            {step === 1 && (
              <PillPicker
                value={screenTimeValue}
                period={screenTimePeriod}
                onValueChange={setScreenTimeValue}
                onPeriodChange={setScreenTimePeriod}
              />
            )}

            {/* Step 2 — Objectif */}
            {step === 2 && (
              <PillPicker
                value={targetTimeValue}
                period={targetTimePeriod}
                onValueChange={setTargetTimeValue}
                onPeriodChange={setTargetTimePeriod}
              />
            )}

            {/* Step 3 — Apps (multi-choice) */}
            {step === 3 && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.optionScroll}>
                <View style={styles.optionGroup}>
                  {APP_OPTIONS.map((opt, i) => {
                    const color = OPTION_COLORS[i % OPTION_COLORS.length];
                    const selected = apps.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.option, { borderColor: color, backgroundColor: selected ? color : colors.white }]}
                        onPress={() => { Haptics.selectionAsync(); setApps(toggle(apps, opt)); setError(null); }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionLabel, { color: selected ? contrasting_text(color) : color }]}>{opt}</Text>
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
                    const color = OPTION_COLORS[i % OPTION_COLORS.length];
                    const selected = scroll_moments.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.option, { borderColor: color, backgroundColor: selected ? color : colors.white }]}
                        onPress={() => { Haptics.selectionAsync(); setScrollMoments(toggle(scroll_moments, opt)); setError(null); }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionLabel, { color: selected ? contrasting_text(color) : color }]}>{opt}</Text>
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
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  const selected = motivation === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.option, { borderColor: color, backgroundColor: selected ? color : colors.white }]}
                      onPress={() => { Haptics.selectionAsync(); setMotivation(opt.value); setError(null); }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.optionLabel, { color: selected ? contrasting_text(color) : color }]}>{opt.label}</Text>
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
    alignItems: "center",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
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
