import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors, radius, spacing } from "@/src/theme/colors";

function EditIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </Svg>
  );
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}H`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

type Props = {
  savedMinutes: number;
  currentMinutes: number;
  targetMinutes: number;
  onEditGoal?: () => void;
};

export function DailyProgressCard({ savedMinutes, currentMinutes, targetMinutes, onEditGoal }: Props) {
  const progress = Math.min(currentMinutes / targetMinutes, 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {"Aujourd'hui, tu as économisé "}
        <Text style={styles.highlight}>{savedMinutes} min de scroll</Text>
      </Text>

      <View style={styles.bar_row}>
        <View style={styles.track}>
          <View style={[styles.fill, { flex: progress }]} />
          <View style={{ flex: Math.max(1 - progress, 0) }} />
        </View>
        <Text style={styles.ratio}>
          {formatTime(currentMinutes)} / {formatTime(targetMinutes)}
        </Text>
      </View>

      <TouchableOpacity style={styles.edit_row} onPress={onEditGoal} activeOpacity={0.7}>
        <Text style={styles.edit_label}>Modifier cet objectif</Text>
        <EditIcon />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: "700",
  },
  bar_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(118,102,117,0.18)",
    borderRadius: radius.pill,
    flexDirection: "row",
    overflow: "hidden",
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  ratio: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    minWidth: 72,
    textAlign: "right",
  },
  edit_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  edit_label: {
    fontSize: 13,
    color: colors.muted,
  },
});
