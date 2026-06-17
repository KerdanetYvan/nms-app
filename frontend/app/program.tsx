import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect as SvgRect,
  Circle as SvgCircle,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";

import { api } from "@/src/api/client";
import { BottomNav } from "@/src/components/bottom-nav";
import { generateProgram, type Phase, type WeekMilestone } from "@/src/algorithms/generateProgram";
import { colors, radius, spacing } from "@/src/theme/colors";
import type { Motivation, UserProfile } from "@/src/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHours(decimal_hours: number): string {
  const total_minutes = Math.round(decimal_hours * 60);
  const h = Math.floor(total_minutes / 60);
  const m = total_minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Config phases ────────────────────────────────────────────────────────────

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

const PHASE_DESC: Record<Phase, string> = {
  intro:          "Une première semaine volontairement légère — la résistance au changement est à son maximum.",
  reduction_main: "La réduction s'accélère progressivement, semaine après semaine.",
  consolidation:  "L'objectif est atteint. Ces semaines ancrent le nouveau comportement durablement.",
};

type PhaseSummary = {
  phase: Phase;
  weeks: number;
  start_date: Date;
  end_date: Date;
  from_hours: number;
  to_hours: number;
};

function build_phase_summaries(
  milestones: WeekMilestone[],
  current_hours: number
): PhaseSummary[] {
  const summaries: PhaseSummary[] = [];
  let i = 0;
  while (i < milestones.length) {
    const phase = milestones[i].phase;
    const group_start = i;
    while (i < milestones.length && milestones[i].phase === phase) i++;
    const group_end = i - 1;
    const end_date = new Date(milestones[group_end].startDate);
    end_date.setDate(end_date.getDate() + 6);
    summaries.push({
      phase,
      weeks: group_end - group_start + 1,
      start_date: milestones[group_start].startDate,
      end_date,
      from_hours: group_start === 0 ? current_hours : milestones[group_start - 1].targetDailyHours,
      to_hours: milestones[group_end].targetDailyHours,
    });
  }
  return summaries;
}

// ─── Overview chart ───────────────────────────────────────────────────────────

const CHART_H = 220;
const PAD = { top: 14, right: 16, bottom: 36, left: 44 };
const CR_ALPHA = 1 / 6;

function build_smooth_path(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * CR_ALPHA;
    const cp1y = p1.y + (p2.y - p0.y) * CR_ALPHA;
    const cp2x = p2.x - (p3.x - p1.x) * CR_ALPHA;
    const cp2y = p2.y - (p3.y - p1.y) * CR_ALPHA;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

type OverviewChartProps = {
  milestones: WeekMilestone[];
  current_hours: number;
  target_hours: number;
  chart_width: number;
  selected_week: number | null;
  on_milestone_press: (m: WeekMilestone) => void;
};

function OverviewChart({
  milestones,
  current_hours,
  target_hours,
  chart_width,
  selected_week,
  on_milestone_press,
}: OverviewChartProps) {
  const inner_w = chart_width - PAD.left - PAD.right;
  const inner_h = CHART_H - PAD.top - PAD.bottom;
  const max_week = milestones[milestones.length - 1].week;

  // All Y values in weekly hours (× 7) for display
  const w_current = current_hours * 7;
  const w_target = target_hours * 7;

  const range = w_current - w_target;
  const margin = Math.max(range * 0.15, 0.15 * 7);
  const y_min = Math.max(0, w_target - margin);
  const y_max = w_current + margin;
  const y_range = y_max - y_min;

  const to_x = (week: number) => PAD.left + (week / max_week) * inner_w;
  const to_y = (h: number) => PAD.top + inner_h * (1 - (h - y_min) / y_range);

  const data_pts = [
    { x: to_x(0), y: to_y(w_current) },
    ...milestones.map((m) => ({ x: to_x(m.week), y: to_y(m.targetDailyHours * 7) })),
  ];

  const line_path = build_smooth_path(data_pts);
  const bottom_y = PAD.top + inner_h;
  const area_path = `${line_path} L ${data_pts[data_pts.length - 1].x} ${bottom_y} L ${data_pts[0].x} ${bottom_y} Z`;

  const y_ticks = [3, 2, 1, 0].map((i) => y_min + (i / 3) * y_range);

  const x_step = max_week <= 8 ? 1 : max_week <= 16 ? 2 : 4;
  const x_ticks: number[] = [];
  for (let w = x_step; w <= max_week; w += x_step) x_ticks.push(w);
  if (x_ticks[x_ticks.length - 1] !== max_week) x_ticks.push(max_week);

  return (
    <Svg width={chart_width} height={CHART_H}>
      <Defs>
        <LinearGradient id="area_grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.01} />
        </LinearGradient>
      </Defs>

      {y_ticks.map((tick, i) => (
        <SvgLine key={i} x1={PAD.left} y1={to_y(tick)} x2={PAD.left + inner_w} y2={to_y(tick)}
          stroke={colors.beige} strokeWidth={1} />
      ))}

      <SvgLine x1={PAD.left} y1={to_y(w_target)} x2={PAD.left + inner_w} y2={to_y(w_target)}
        stroke={colors.muted} strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.55} />

      <Path d={area_path} fill="url(#area_grad)" />

      <Path d={line_path} fill="none" stroke={colors.primary} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />

      {milestones.flatMap((m) => {
        const cx = to_x(m.week);
        const cy = to_y(m.targetDailyHours * 7);
        const is_selected = selected_week === m.week;
        return [
          <SvgCircle key={`hit-${m.week}`} cx={cx} cy={cy} r={18} fill="transparent"
            onPress={() => on_milestone_press(m)} />,
          <SvgCircle key={`dot-${m.week}`} cx={cx} cy={cy}
            r={is_selected ? 7 : 4.5}
            fill={PHASE_CONFIG[m.phase].bg}
            stroke={colors.primary}
            strokeWidth={is_selected ? 2.5 : 1.5}
          />,
        ];
      })}

      {y_ticks.map((tick, i) => (
        <SvgText key={i} x={PAD.left - 7} y={to_y(tick) + 4} fontSize={10}
          fill={colors.muted} textAnchor="end">
          {formatHours(tick)}
        </SvgText>
      ))}

      {/* Y-axis unit label */}
      <SvgText x={PAD.left - 7} y={PAD.top - 3} fontSize={8}
        fill={colors.muted} textAnchor="end">
        h/sem
      </SvgText>

      {x_ticks.map((w) => (
        <SvgText key={w} x={to_x(w)} y={CHART_H - 6} fontSize={10}
          fill={colors.muted} textAnchor="middle">
          {`S${w}`}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Daily chart ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["L", "Ma", "Me", "J", "V", "S", "D"];

type DailyChartProps = {
  milestone: WeekMilestone;
  current_hours: number;
  chart_width: number;
};

function DailyChart({ milestone, current_hours, chart_width }: DailyChartProps) {
  const inner_w = chart_width - PAD.left - PAD.right;
  const inner_h = CHART_H - PAD.top - PAD.bottom;

  const y_max = current_hours;
  const y_min = 0;
  const y_range = y_max - y_min;

  const to_y = (h: number) => PAD.top + inner_h * (1 - h / y_range);
  const bottom_y = PAD.top + inner_h;
  const target_y = to_y(milestone.targetDailyHours);

  const today = new Date();
  const week_start = new Date(milestone.startDate);
  const days_since = Math.floor((today.getTime() - week_start.getTime()) / (1000 * 60 * 60 * 24));
  const today_idx = days_since >= 0 && days_since < 7 ? days_since : -1;

  const bar_slot_w = inner_w / 7;
  const bar_w = bar_slot_w * 0.58;
  const bar_h = bottom_y - target_y;

  const y_ticks = [0, 0.33, 0.67, 1.0].map((t) => t * y_max);

  return (
    <Svg width={chart_width} height={CHART_H}>
      {y_ticks.map((tick, i) => (
        <SvgLine key={i} x1={PAD.left} y1={to_y(tick)} x2={PAD.left + inner_w} y2={to_y(tick)}
          stroke={colors.beige} strokeWidth={1} />
      ))}

      {/* Quota limit line */}
      <SvgLine x1={PAD.left} y1={target_y} x2={PAD.left + inner_w} y2={target_y}
        stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.75} />

      {DAY_LABELS.flatMap((label, i) => {
        const bar_x = PAD.left + i * bar_slot_w + (bar_slot_w - bar_w) / 2;
        const is_today = i === today_idx;
        return [
          <SvgRect key={`bar-${i}`}
            x={bar_x} y={target_y} width={bar_w} height={bar_h > 0 ? bar_h : 2}
            fill={is_today ? colors.primary : colors.secondary}
            rx={4} opacity={is_today ? 0.85 : 0.45}
          />,
          <SvgText key={`day-${i}`}
            x={bar_x + bar_w / 2} y={bottom_y + 14}
            fontSize={10} textAnchor="middle"
            fill={is_today ? colors.textPlum : colors.muted}
            fontWeight={is_today ? "700" : "500"}>
            {label}
          </SvgText>,
        ];
      })}

      {y_ticks.map((tick, i) => (
        <SvgText key={i} x={PAD.left - 7} y={to_y(tick) + 4} fontSize={10}
          fill={colors.muted} textAnchor="end">
          {formatHours(tick)}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Phase card ───────────────────────────────────────────────────────────────

function PhaseCard({ summary }: { summary: PhaseSummary }) {
  const cfg = PHASE_CONFIG[summary.phase];
  const weeks_label = summary.weeks === 1 ? "1 sem." : `${summary.weeks} sem.`;
  const same_hours = Math.abs(summary.from_hours - summary.to_hours) < 0.01;

  return (
    <View style={styles.phase_card}>
      <View style={[styles.phase_accent, { backgroundColor: cfg.bg }]} />
      <View style={styles.phase_body}>
        <View style={styles.phase_header}>
          <Text style={styles.phase_label}>{cfg.label}</Text>
          <Text style={styles.phase_weeks}>{weeks_label}</Text>
        </View>
        <Text style={styles.phase_dates}>
          {formatDate(summary.start_date)} — {formatDate(summary.end_date)}
        </Text>
        <Text style={styles.phase_hours}>
          {same_hours
            ? `Maintenu à ${formatHours(summary.to_hours * 7)}/sem`
            : `${formatHours(summary.from_hours * 7)} → ${formatHours(summary.to_hours * 7)}/sem`}
        </Text>
        <Text style={styles.phase_desc}>{PHASE_DESC[summary.phase]}</Text>
      </View>
    </View>
  );
}

// ─── Phase legend ─────────────────────────────────────────────────────────────

function PhaseLegend() {
  return (
    <View style={styles.legend}>
      {(Object.entries(PHASE_CONFIG) as [Phase, { label: string; bg: string }][]).map(
        ([phase, cfg]) => (
          <View key={phase} style={styles.legend_item}>
            <View style={[styles.legend_dot, { backgroundColor: cfg.bg }]} />
            <Text style={styles.legend_label}>{cfg.label}</Text>
          </View>
        )
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgramScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screen_width } = useWindowDimensions();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [milestones, setMilestones] = useState<WeekMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected_milestone, setSelectedMilestone] = useState<WeekMilestone | null>(null);
  const [chart_tab, setChartTab] = useState<"overview" | "detail">("overview");

  useEffect(() => {
    Promise.all([api.getUserProfile(), api.getWeeklyCheckins()])
      .then(([p, checkins]) => {
        setProfile(p);
        if (checkins.length > 0) {
          setMilestones(
            checkins.map((c) => ({
              week: c.week_number,
              startDate: new Date(c.week_start_date),
              targetDailyHours: c.target_daily_minutes / 60,
              phase: c.phase,
              reductionFromPrevious: c.reduction_from_previous_min / 60,
            }))
          );
        } else if (p) {
          const startDate = p.started_at ? new Date(p.started_at) : new Date();
          const generated = generateProgram(p.screen_time_min / 60, p.target_time_min / 60, p.motivation, startDate);
          setMilestones(generated.milestones);
        }
      })
      .catch(() => setError("Impossible de charger le programme."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !profile || milestones.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error_text}>{error ?? "Programme introuvable."}</Text>
      </View>
    );
  }

  const current_hours = profile.screen_time_min / 60;
  const target_hours = profile.target_time_min / 60;
  const phase_summaries = build_phase_summaries(milestones, current_hours);
  const weeks_label =
    milestones.length === 1 ? "1 semaine" : `${milestones.length} semaines`;

  const chart_width = screen_width - spacing.lg * 2 - spacing.md * 2;

  const active_milestone = selected_milestone ?? milestones[0];

  const handle_milestone_press = (m: WeekMilestone) => {
    setSelectedMilestone(m);
    setChartTab("detail");
  };

  const switch_to_detail = () => {
    if (!selected_milestone) setSelectedMilestone(milestones[0]);
    setChartTab("detail");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.back_btn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon programme</Text>
        <View style={styles.back_btn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 94 },
        ]}
      >
        <Animated.View
          entering={Platform.OS === "web" ? undefined : FadeInDown.springify()}
          style={styles.summary_card}
        >
          <Text style={styles.summary_range}>
            {formatHours(current_hours * 7)} → {formatHours(target_hours * 7)}
          </Text>
          <Text style={styles.summary_meta}>
            par semaine · {weeks_label} · {MOTIVATION_LABEL[profile.motivation]}
          </Text>
        </Animated.View>

        <Animated.View
          entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          style={styles.chart_card}
        >
          {/* Tab toggle */}
          <View style={styles.chart_tabs}>
            <TouchableOpacity
              style={[styles.chart_tab_btn, chart_tab === "overview" && styles.chart_tab_btn_active]}
              onPress={() => setChartTab("overview")}
              activeOpacity={0.8}
            >
              <Text style={[styles.chart_tab_label, chart_tab === "overview" && styles.chart_tab_label_active]}>
                Semaines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chart_tab_btn, chart_tab === "detail" && styles.chart_tab_btn_active]}
              onPress={switch_to_detail}
              activeOpacity={0.8}
            >
              <Text style={[styles.chart_tab_label, chart_tab === "detail" && styles.chart_tab_label_active]}>
                Par jour
              </Text>
            </TouchableOpacity>
          </View>

          {chart_tab === "overview" ? (
            <>
              <View style={styles.chart_hint}>
                <Text style={styles.chart_hint_text}>Appuie sur un point pour voir l'objectif journalier</Text>
              </View>
              <OverviewChart
                milestones={milestones}
                current_hours={current_hours}
                target_hours={target_hours}
                chart_width={chart_width}
                selected_week={selected_milestone?.week ?? null}
                on_milestone_press={handle_milestone_press}
              />
              <PhaseLegend />
            </>
          ) : (
            <>
              {/* Week selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.week_selector}
              >
                {milestones.map((m) => {
                  const is_active = active_milestone.week === m.week;
                  return (
                    <TouchableOpacity
                      key={m.week}
                      style={[styles.week_pill, is_active && styles.week_pill_active]}
                      onPress={() => setSelectedMilestone(m)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.week_pill_label, is_active && styles.week_pill_label_active]}>
                        S{m.week}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <DailyChart
                milestone={active_milestone}
                current_hours={current_hours}
                chart_width={chart_width}
              />

              {/* Quota summary */}
              <View style={styles.quota_row}>
                <View style={[styles.quota_dot, { backgroundColor: PHASE_CONFIG[active_milestone.phase].bg }]} />
                <Text style={styles.quota_text}>
                  Quota S{active_milestone.week} :{" "}
                  <Text style={styles.quota_value}>{formatHours(active_milestone.targetDailyHours)}</Text>
                  <Text style={styles.quota_unit}>/jour</Text>
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {phase_summaries.map((summary, i) => (
          <Animated.View
            key={summary.phase}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(160 + i * 60).springify()}
          >
            <PhaseCard summary={summary} />
          </Animated.View>
        ))}

        <Animated.View
          entering={Platform.OS === "web" ? undefined : FadeInDown.delay(160 + phase_summaries.length * 60).springify()}
          style={styles.action_row}
        >
          <TouchableOpacity
            style={[styles.action_btn, styles.action_btn_outline]}
            onPress={() => router.push("/relapse" as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.action_btn_outline_text}>Ajuster</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action_btn, styles.action_btn_primary]}
            onPress={() => router.push("/acceleration" as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.action_btn_primary_text}>Accélérer</Text>
          </TouchableOpacity>
        </Animated.View>
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  summary_card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
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
  chart_card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    paddingBottom: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },

  // Tab toggle
  chart_tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  chart_tab_btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.beige,
  },
  chart_tab_btn_active: {
    backgroundColor: colors.primary,
  },
  chart_tab_label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  chart_tab_label_active: {
    color: colors.white,
  },

  // Overview hint
  chart_hint: {
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  chart_hint_text: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: "italic",
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  legend_item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legend_dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  legend_label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },

  // Week selector (detail tab)
  week_selector: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  week_pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.beige,
  },
  week_pill_active: {
    backgroundColor: colors.primary,
  },
  week_pill_label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  week_pill_label_active: {
    color: colors.white,
  },

  // Quota row (detail tab)
  quota_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: spacing.xs,
  },
  quota_dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  quota_text: {
    fontSize: 13,
    color: colors.muted,
  },
  quota_value: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPlum,
  },
  quota_unit: {
    fontSize: 12,
    color: colors.muted,
  },

  // Phase detail cards
  phase_card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  phase_accent: {
    width: 4,
  },
  phase_body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  phase_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phase_label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPlum,
  },
  phase_weeks: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  phase_dates: {
    fontSize: 12,
    color: colors.muted,
  },
  phase_hours: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  phase_desc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 2,
  },
  action_row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action_btn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  action_btn_outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  action_btn_primary: {
    backgroundColor: colors.primary,
  },
  action_btn_outline_text: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  action_btn_primary_text: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
