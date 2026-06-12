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

// ─── Chart ────────────────────────────────────────────────────────────────────

const CHART_H = 220;
const PAD = { top: 14, right: 16, bottom: 36, left: 44 };
// Catmull-Rom → Bezier cubique : alpha = 1/6 donne des tangentes alignées sur les voisins
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

type ChartProps = {
  milestones: WeekMilestone[];
  current_hours: number;
  target_hours: number;
  chart_width: number;
};

function ProgramChart({ milestones, current_hours, target_hours, chart_width }: ChartProps) {
  const inner_w = chart_width - PAD.left - PAD.right;
  const inner_h = CHART_H - PAD.top - PAD.bottom;
  const max_week = milestones[milestones.length - 1].week;

  const range = current_hours - target_hours;
  const margin = Math.max(range * 0.15, 0.15);
  const y_min = Math.max(0, target_hours - margin);
  const y_max = current_hours + margin;
  const y_range = y_max - y_min;

  const to_x = (week: number) => PAD.left + (week / max_week) * inner_w;
  const to_y = (h: number) => PAD.top + inner_h * (1 - (h - y_min) / y_range);

  const data_pts = [
    { x: to_x(0), y: to_y(current_hours) },
    ...milestones.map((m) => ({ x: to_x(m.week), y: to_y(m.targetDailyHours) })),
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

      {/* Horizontal grid */}
      {y_ticks.map((tick, i) => (
        <SvgLine
          key={i}
          x1={PAD.left}
          y1={to_y(tick)}
          x2={PAD.left + inner_w}
          y2={to_y(tick)}
          stroke={colors.beige}
          strokeWidth={1}
        />
      ))}

      {/* Target dashed line */}
      <SvgLine
        x1={PAD.left}
        y1={to_y(target_hours)}
        x2={PAD.left + inner_w}
        y2={to_y(target_hours)}
        stroke={colors.muted}
        strokeWidth={1.5}
        strokeDasharray="5,4"
        strokeOpacity={0.55}
      />

      {/* Area fill */}
      <Path d={area_path} fill="url(#area_grad)" />

      {/* Progression curve */}
      <Path
        d={line_path}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Milestone dots colored by phase */}
      {milestones.map((m) => (
        <SvgCircle
          key={m.week}
          cx={to_x(m.week)}
          cy={to_y(m.targetDailyHours)}
          r={4.5}
          fill={PHASE_CONFIG[m.phase].bg}
          stroke={colors.primary}
          strokeWidth={1.5}
        />
      ))}

      {/* Y-axis labels */}
      {y_ticks.map((tick, i) => (
        <SvgText
          key={i}
          x={PAD.left - 7}
          y={to_y(tick) + 4}
          fontSize={10}
          fill={colors.muted}
          textAnchor="end"
        >
          {formatHours(tick)}
        </SvgText>
      ))}

      {/* X-axis labels */}
      {x_ticks.map((w) => (
        <SvgText
          key={w}
          x={to_x(w)}
          y={CHART_H - 6}
          fontSize={10}
          fill={colors.muted}
          textAnchor="middle"
        >
          {`S${w}`}
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
            ? `Maintenu à ${formatHours(summary.to_hours)}`
            : `${formatHours(summary.from_hours)} → ${formatHours(summary.to_hours)}`}
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
          // Fallback pour les comptes existants sans weekly_checkins
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

  // card padding (spacing.md on each side) + scroll padding (spacing.lg on each side)
  const chart_width = screen_width - spacing.lg * 2 - spacing.md * 2;

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
            {formatHours(current_hours)} → {formatHours(target_hours)}
          </Text>
          <Text style={styles.summary_meta}>
            {weeks_label} · {MOTIVATION_LABEL[profile.motivation]}
          </Text>
        </Animated.View>

        <Animated.View
          entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          style={styles.chart_card}
        >
          <ProgramChart
            milestones={milestones}
            current_hours={current_hours}
            target_hours={target_hours}
            chart_width={chart_width}
          />
          <PhaseLegend />
        </Animated.View>

        {phase_summaries.map((summary, i) => (
          <Animated.View
            key={summary.phase}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(160 + i * 60).springify()}
          >
            <PhaseCard summary={summary} />
          </Animated.View>
        ))}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
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
});
